using System.Text.Json;
using PersonalFinanceTrackerAPI.Services;
using PersonalFinanceTrackerAPI.Services.AI.Agents.SpendingInsights.DTOs;
using PersonalFinanceTrackerAPI.Services.AI.Agents.SpendingInsights.Analytics;
using PersonalFinanceTrackerAPI.Services.AI.SharedInfrastructure.Gemini;
using PersonalFinanceTrackerAPI.Services.Interfaces;
using PersonalFinanceTrackerAPI.Services.Interfaces.AI;

namespace PersonalFinanceTrackerAPI.Services.AI.Agents.SpendingInsights
{
    public class SpendingInsightsService : ISpendingInsightsService
    {
        private readonly FinancialAnalyticsEngine _analyticsEngine;
        private readonly GeminiClient _geminiClient;
        private readonly IAIStorageService _storageService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<SpendingInsightsService> _logger;

        public SpendingInsightsService(
            FinancialAnalyticsEngine analyticsEngine,
            GeminiClient geminiClient,
            IAIStorageService storageService,
            IConfiguration configuration,
            ILogger<SpendingInsightsService> logger)
        {
            _analyticsEngine = analyticsEngine;
            _geminiClient = geminiClient;
            _storageService = storageService;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<List<SpendingInsightResponseDTO>> GenerateSpendingInsightsAsync(string userId, int months = 3)
        {
            // Stage 1: Calculate financial metrics deterministically in C#
            var metrics = await _analyticsEngine.CalculateMetricsAsync(userId, months);

            if (metrics.TotalTransactions == 0)
            {
                return new List<SpendingInsightResponseDTO>
                {
                    new SpendingInsightResponseDTO
                    {
                        Type = InsightType.Recommendation,
                        Category = "General",
                        Insight = "No transactions found in the selected period. Add some transactions first to get personalized financial insights.",
                        GeneratedAt = DateTime.UtcNow
                    }
                };
            }

            // Stage 2: Build prompt and call Gemini for interpretation
            var metricsJson = JsonSerializer.Serialize(metrics, new JsonSerializerOptions { WriteIndented = true });
            Console.WriteLine(metricsJson);
            var systemPrompt = @"You are a personal financial advisor. Your client's financial metrics have been calculated accurately by a deterministic system.

FINANCIAL METRICS (DO NOT RECALCULATE - THESE ARE 100% ACCURATE):
" + metricsJson + @"

YOUR ROLE:
1. Interpret these metrics as a financial coach
2. Identify overspending patterns and their impact
3. Find specific savings opportunities
4. Recognize positive financial habits
5. Flag potential financial risks
6. Suggest concrete budget improvements

CRITICAL RULES:
- NEVER recalculate any values
- NEVER verify totals or percentages
- NEVER repeat raw statistics without explaining why it matters
- ALWAYS explain ""so what?"" - why the pattern matters to the user
- ALWAYS suggest actionable improvements
- Be specific with numbers and timeframes

Generate 3-5 insights in this EXACT JSON format:
[
  {
    ""type"": ""Positive|Warning|Trend|Recommendation|Risk"",
    ""category"": ""Category name"",
    ""insight"": ""Actionable insight explaining why it matters and what to do""
  }
]

Type definitions:
- Positive: Good financial habits to continue
- Warning: Potential problems that need attention
- Trend: Spending patterns over time
- Recommendation: Actionable suggestions for improvement
- Risk: Financial risks to watch out for

Return ONLY the JSON array. No markdown, no explanations.";

            var rawResponse = await _geminiClient.GetTextResponseAsync(systemPrompt, maxOutputTokens: 1024);

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            };
            options.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());

            var insights = JsonSerializer.Deserialize<List<SpendingInsightResponseDTO>>(rawResponse, options);

            if (insights == null || insights.Count == 0)
            {
                return new List<SpendingInsightResponseDTO>
                {
                    new SpendingInsightResponseDTO
                    {
                        Type = InsightType.Recommendation,
                        Category = "General",
                        Insight = "Unable to generate personalized insights at this time. Please try again later.",
                        GeneratedAt = DateTime.UtcNow
                    }
                };
            }

            foreach (var insight in insights)
            {
                insight.GeneratedAt = DateTime.UtcNow;
            }

            // Persist insights for history
            var agentVersion = _configuration["AIAgents:InsightsAgentVersion"] ?? "1.0.0";
            try
            {
                await _storageService.SaveInsightsAsync(userId, insights, months, agentVersion);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to save AI insights to storage");
            }

            return insights;
        }
    }
}