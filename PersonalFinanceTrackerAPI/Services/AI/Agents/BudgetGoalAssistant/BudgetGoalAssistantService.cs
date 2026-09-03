using System.Text.Json;
using PersonalFinanceTrackerAPI.Services;
using PersonalFinanceTrackerAPI.Services.AI.Agents.BudgetGoalAssistant.Analytics;
using PersonalFinanceTrackerAPI.Services.AI.Agents.BudgetGoalAssistant.DTOs;
using PersonalFinanceTrackerAPI.Services.AI.Agents.SpendingInsights.Analytics;
using PersonalFinanceTrackerAPI.Services.AI.SharedInfrastructure.Gemini;
using PersonalFinanceTrackerAPI.Services.Interfaces;
using PersonalFinanceTrackerAPI.Services.Interfaces.AI;

namespace PersonalFinanceTrackerAPI.Services.AI.Agents.BudgetGoalAssistant
{
    /// <summary>
    /// Service that analyzes user's financial data and generates personalized budget recommendations
    /// to help achieve specific savings goals. Every goal — feasible or not — produces a complete plan.
    /// </summary>
    public class BudgetGoalAssistantService : IBudgetGoalAssistantService
    {
        private readonly FinancialAnalyticsEngine _analyticsEngine;
        private readonly GoalGapAnalysisEngine _gapEngine;
        private readonly GeminiClient _geminiClient;
        private readonly ITransactionService _transactionService;
        private readonly IAIStorageService _storageService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<BudgetGoalAssistantService> _logger;

        public BudgetGoalAssistantService(
            FinancialAnalyticsEngine analyticsEngine,
            GoalGapAnalysisEngine gapEngine,
            GeminiClient geminiClient,
            ITransactionService transactionService,
            IAIStorageService storageService,
            IConfiguration configuration,
            ILogger<BudgetGoalAssistantService> logger)
        {
            _analyticsEngine = analyticsEngine;
            _gapEngine = gapEngine;
            _geminiClient = geminiClient;
            _transactionService = transactionService;
            _storageService = storageService;
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Generates personalized budget recommendations to achieve savings goal.
        /// </summary>
        public async Task<BudgetRecommendationDTO> GetBudgetRecommendationsAsync(
            string userId,
            decimal targetSavings,
            int months,
            string planType = "Focused")
        {
            // Guard clauses
            if (months <= 0)
                throw new ArgumentException("Months must be positive.", nameof(months));
            if (targetSavings <= 0)
                throw new ArgumentException("Target savings must be positive.", nameof(targetSavings));

            // Parse plan type
            var parsedPlanType = Enum.TryParse<GoalGapAnalysisEngine.PlanType>(planType, true, out var pt)
                ? pt
                : GoalGapAnalysisEngine.PlanType.Focused;

            // Step 1: Fetch ALL user transactions (no artificial date window)
            var transactions = await _transactionService.GetAllAsync(userId);

            if (transactions == null || transactions.Count == 0)
            {
                return new BudgetRecommendationDTO
                {
                    TargetSavings = targetSavings,
                    CurrentSavings = 0,
                    SavingsGap = targetSavings / months,
                    MonthlySavingsTarget = targetSavings / months,
                    CurrentMonthlySavings = 0,
                    ActionPlan = null,
                    DataConfidence = "Low",
                    GeneratedAt = DateTime.UtcNow
                };
            }

            // Step 2: Derive actual span from real transaction dates
            var firstDate = transactions.Min(t => t.Date);
            var lastDate = transactions.Max(t => t.Date);
            var actualSpanMonths = Math.Max(1,
                (lastDate.Year - firstDate.Year) * 12 + (lastDate.Month - firstDate.Month) + 1);

            var dataConfidence = actualSpanMonths >= 3 ? "High"
                : actualSpanMonths >= 1 ? "Medium"
                : "Low";

            // Step 3: Compute financial metrics from the pre-fetched transactions
            var metrics = _analyticsEngine.CalculateMetricsAsync(transactions);

            // Step 4: Run the consolidated gap analysis engine
            var analysis = _gapEngine.AnalyzeGap(metrics, targetSavings, months, actualSpanMonths, parsedPlanType);

            // Step 5: Map category reductions to recommendations
            var recommendations = analysis.RequiredReductions
                .Where(r => r.RequiredReduction > 0)
                .Select(r => new CategoryRecommendation
                {
                    Category = r.Category,
                    CurrentSpending = r.CurrentSpending,
                    RecommendedSpending = r.TargetSpending,
                    ReductionAmount = r.RequiredReduction,
                    Reason = $"This category represents {r.ReductionPercentage:F1}% of its spend in variable expenses",
                    Priority = r.Priority
                })
                .OrderByDescending(r => r.ReductionAmount)
                .ToList();

            // Step 6: Generate AI action plan
            ActionPlanDTO? actionPlan = null;
            if (recommendations.Any())
            {
                actionPlan = await GenerateActionPlanWithGeminiAsync(
                    metrics,
                    recommendations,
                    targetSavings,
                    analysis.MonthlySavingsTarget,
                    months,
                    analysis.IsUnfeasible,
                    parsedPlanType);
            }

            var result = new BudgetRecommendationDTO
            {
                TargetSavings = targetSavings,
                CurrentSavings = analysis.CurrentSavings,
                SavingsGap = analysis.SavingsGap,
                MonthlySavingsTarget = analysis.MonthlySavingsTarget,
                CurrentMonthlySavings = analysis.CurrentMonthlySavings,
                Recommendations = recommendations,
                ActionPlan = actionPlan,
                FeasibilityScore = analysis.FeasibilityScore,
                FeasibilityLabel = analysis.FeasibilityLabel,
                GeneratedAt = DateTime.UtcNow,
                DataConfidence = dataConfidence,
                RemainingGapAfterCuts = analysis.RemainingGapAfterCuts,
                RevisedTarget = analysis.RevisedTarget,
                IncomeGapNeeded = analysis.IncomeGapNeeded,
                ExtendedTimelineNeeded = analysis.ExtendedTimelineNeeded,
                Months = months,
                PlanType = analysis.PlanType,
                LifestyleImpact = analysis.LifestyleImpact,
                ExpectedMonthlySavingsFromRecommendations = analysis.ExpectedMonthlySavingsFromRecommendations
            };

            // Persist budget goal recommendation for history
            var agentVersion = _configuration["AIAgents:BudgetGoalAgentVersion"] ?? "1.0.0";
            try
            {
                await _storageService.SaveBudgetGoalAsync(userId, result, agentVersion);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to save budget goal recommendation to storage");
            }

            return result;
        }

        /// <summary>
        /// Uses Gemini AI to generate a structured, actionable action plan.
        /// Falls back to a deterministic plan if Gemini fails or returns malformed JSON.
        /// </summary>
        private async Task<ActionPlanDTO> GenerateActionPlanWithGeminiAsync(
            FinancialMetrics metrics,
            List<CategoryRecommendation> recommendations,
            decimal targetSavings,
            decimal monthlySavingsTarget,
            int months,
            bool isUnfeasible,
            GoalGapAnalysisEngine.PlanType planType)
        {
            var recommendationsJson = JsonSerializer.Serialize(
                recommendations,
                new JsonSerializerOptions { WriteIndented = true });

            var planTypeDescription = planType == GoalGapAnalysisEngine.PlanType.Balanced
                ? "BALANCED PLAN: Make moderate, sustainable lifestyle changes. Focus on long-term habit changes rather than extreme cuts. Maintain a reasonable quality of life while still achieving the savings goal."
                : "FOCUSED PLAN: Make aggressive, maximum cuts. Prioritize savings over lifestyle. Consider extreme measures like pausing subscriptions, switching to cheaper alternatives, and significant spending reductions.";

            var prompt = $$"""
            You are a personal financial advisor specializing in Indian personal finance. Create a realistic, actionable budget plan.
            
            SAVINGS STRATEGY: {{planTypeDescription}}
            
            GOAL: Save ₹{{targetSavings:F2}} in {{months}} months (₹{{monthlySavingsTarget:F2}}/month needed)
            TOTAL INCOME: ₹{{metrics.TotalIncome:F2}}
            TOTAL EXPENSES: ₹{{metrics.TotalExpenses:F2}}
            {{(isUnfeasible ? "NOTE: The target exceeds what is realistically achievable with current income. Still provide the best possible cut recommendations." : "")}}
            
            CATEGORY-WISE REDUCTIONS NEEDED (VARIABLE EXPENSES ONLY — apply reductions ONLY to these categories):
            {{recommendationsJson}}
            
            RESPOND ONLY WITH VALID JSON in this EXACT shape (no markdown, no text before/after):
            {
              "categories": [
                {
                  "category": "Category Name",
                  "actions": ["Specific action with exact app/service name (e.g., 'Cancel Netflix (₹649/mo)')", "Another specific action"]
                }
              ],
              "trackingMethod": "One simple weekly tracking sentence",
              "finalMessage": "One short motivational sentence"
            }
            
            RULES:
            - Include ALL categories from the reductions JSON above
            - BE EXTREMELY SPECIFIC: mention exact app names (Netflix, Prime, Hotstar, Swiggy, Zomato, Blinkit, Zepto, Uber, Ola, Myntra, Ajio, Amazon)
            - Do NOT suggest reducing Rent, Medical bills, Insurance, Utilities, Fuel, Loan EMIs, or Savings
            - Use Indian context (INR, Indian apps, Indian brands)
            - Keep tone encouraging, not judgmental
            - For FOCUSED PLAN: Suggest aggressive actions like pausing subscriptions, switching to cheaper alternatives, cancelling memberships
            - For BALANCED PLAN: Suggest moderate actions like reducing frequency, finding cheaper alternatives, cutting non-essential spending
            - Return ONLY the JSON object. No trailing commas. No formatting outside JSON.
            """;

            try
            {
                var text = await _geminiClient.GetTextResponseAsync(prompt, maxOutputTokens: 1024);
                var plan = TryParseActionPlan(text);
                if (plan != null)
                    return plan;

                // Retry once with parsing feedback
                var retryPrompt = $$"""
                Your previous response could not be parsed as valid JSON. Respond ONLY with valid JSON matching:
                {
                  "categories": [ { "category": "string", "actions": ["string", "string"] } ],
                  "trackingMethod": "string",
                  "finalMessage": "string"
                }
                Do not include markdown fences or any other text. Use the reductions from: {{recommendationsJson}}
                """;
                var retryText = await _geminiClient.GetTextResponseAsync(retryPrompt, maxOutputTokens: 1024);
                var retryPlan = TryParseActionPlan(retryText);
                if (retryPlan != null)
                    return retryPlan;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate structured action plan with Gemini");
            }

            return GenerateFallbackActionPlan(recommendations);
        }

        /// <summary>
        /// Attempts to deserialize Gemini output into a typed ActionPlanDTO.
        /// Returns null on failure.
        /// </summary>
        private static ActionPlanDTO? TryParseActionPlan(string? text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return null;

            // Strip any markdown code fences if present
            var cleaned = text.Trim();
            if (cleaned.StartsWith("```"))
            {
                var firstNewline = cleaned.IndexOf('\n');
                if (firstNewline > 0)
                    cleaned = cleaned[(firstNewline + 1)..];
                if (cleaned.EndsWith("```"))
                    cleaned = cleaned[..^3].Trim();
            }

            try
            {
                var plan = JsonSerializer.Deserialize<ActionPlanDTO>(cleaned, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                return plan?.Categories?.Count > 0 ? plan : null;
            }
            catch (JsonException)
            {
                return null;
            }
        }

        /// <summary>
        /// Deterministic fallback action plan if Gemini fails or returns malformed output.
        /// </summary>
        private static ActionPlanDTO GenerateFallbackActionPlan(List<CategoryRecommendation> recommendations)
        {
            var topRecommendations = recommendations
                .Where(r => r.ReductionAmount > 0)
                .OrderByDescending(r => r.ReductionAmount)
                .Take(3)
                .ToList();

            return new ActionPlanDTO
            {
                Categories = topRecommendations.Select(r => new ActionCategory
                {
                    Category = r.Category,
                    Actions = new List<string>
                    {
                        $"Reduce {r.Category} spending by ₹{r.ReductionAmount:F0}/month (from ₹{r.CurrentSpending:F0} to ₹{r.RecommendedSpending:F0})",
                        "Review and cancel unused subscriptions in this category"
                    }
                }).ToList(),
                TrackingMethod = "Check your category-wise spending every Sunday and track progress toward the monthly reduction target.",
                FinalMessage = "Small consistent cuts add up. Start with the highest-priority category this week and build momentum!"
            };
        }
    }
}