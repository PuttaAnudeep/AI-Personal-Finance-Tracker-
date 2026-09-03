namespace PersonalFinanceTrackerAPI.Services.AI.Agents.BudgetGoalAssistant.DTOs
{
    /// <summary>
    /// Response DTO containing budget recommendations to achieve savings goal
    /// </summary>
    public class BudgetRecommendationDTO
    {
        /// <summary>
        /// Target savings amount (user requested)
        /// </summary>
        public decimal TargetSavings { get; set; }

        /// <summary>
        /// User's current accumulated savings
        /// </summary>
        public decimal CurrentSavings { get; set; }

        /// <summary>
        /// Required monthly savings to close the gap: (Target - Current) / months
        /// </summary>
        public decimal SavingsGap { get; set; }

        /// <summary>
        /// Monthly savings target = Target / months (display value)
        /// </summary>
        public decimal MonthlySavingsTarget { get; set; }

        /// <summary>
        /// Current monthly savings rate
        /// </summary>
        public decimal CurrentMonthlySavings { get; set; }

        /// <summary>
        /// Category-wise recommendations for budget reduction
        /// </summary>
        public List<CategoryRecommendation> Recommendations { get; set; } = new();

        /// <summary>
        /// AI-generated action plan (structured)
        /// </summary>
        public ActionPlanDTO? ActionPlan { get; set; }

        /// <summary>
        /// Feasibility score (0-100) indicating how achievable the goal is
        /// </summary>
        public double FeasibilityScore { get; set; }

        /// <summary>
        /// Feasibility label: "Achievable", "Challenging", or "Not Achievable"
        /// </summary>
        public string FeasibilityLabel { get; set; } = string.Empty;

        /// <summary>
        /// When the recommendations were generated
        /// </summary>
        public DateTime GeneratedAt { get; set; }

        /// <summary>
        /// Confidence level of the analysis based on available transaction history: High, Medium, Low
        /// </summary>
        public string DataConfidence { get; set; } = "Medium";

        /// <summary>
        /// How much of the monthly gap could NOT be closed even with max 50% category cuts
        /// </summary>
        public decimal RemainingGapAfterCuts { get; set; }

        // --- Unfeasible Goal Fields (populated when target is not achievable) ---

        /// <summary>
        /// A realistic achievable target given current income/fixed costs (unfeasible goals only)
        /// </summary>
        public decimal? RevisedTarget { get; set; }

        /// <summary>
        /// Additional monthly income needed to make the original goal feasible (unfeasible goals only)
        /// </summary>
        public decimal? IncomeGapNeeded { get; set; }

        /// <summary>
        /// Number of months needed to make the original goal feasible (unfeasible goals only)
        /// </summary>
        public int? ExtendedTimelineNeeded { get; set; }

        /// <summary>
        /// Timeframe in months for the goal
        /// </summary>
        public int Months { get; set; }

        /// <summary>
        /// Savings strategy selected: "Focused" or "Balanced"
        /// </summary>
        public string PlanType { get; set; } = "Focused";

        /// <summary>
        /// Lifestyle impact level: "Minimal", "Moderate", or "Significant"
        /// </summary>
        public string LifestyleImpact { get; set; } = "Minimal";

        /// <summary>
        /// Total monthly savings achievable from all category recommendations
        /// </summary>
        public decimal ExpectedMonthlySavingsFromRecommendations { get; set; }
    }

    /// <summary>
    /// Recommendation for a specific spending category
    /// </summary>
    public class CategoryRecommendation
    {
        /// <summary>
        /// Category name (e.g., Shopping, Food, Entertainment)
        /// </summary>
        public string Category { get; set; } = string.Empty;

        /// <summary>
        /// Current monthly spending in this category
        /// </summary>
        public decimal CurrentSpending { get; set; }

        /// <summary>
        /// Recommended monthly spending after reduction
        /// </summary>
        public decimal RecommendedSpending { get; set; }

        /// <summary>
        /// Amount to reduce from this category
        /// </summary>
        public decimal ReductionAmount { get; set; }

        /// <summary>
        /// Explanation for the reduction
        /// </summary>
        public string Reason { get; set; } = string.Empty;

        /// <summary>
        /// Priority level: High, Medium, or Low
        /// </summary>
        public string Priority { get; set; } = "Medium";
    }

    /// <summary>
    /// Structured action plan returned by Gemini AI
    /// </summary>
    public class ActionPlanDTO
    {
        public List<ActionCategory> Categories { get; set; } = new();
        public string TrackingMethod { get; set; } = string.Empty;
        public string FinalMessage { get; set; } = string.Empty;
    }

    /// <summary>
    /// Category-specific actions in the AI action plan
    /// </summary>
    public class ActionCategory
    {
        public string Category { get; set; } = string.Empty;
        public List<string> Actions { get; set; } = new();
    }
}