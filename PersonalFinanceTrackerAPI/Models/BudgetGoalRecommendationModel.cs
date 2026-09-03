namespace PersonalFinanceTrackerAPI.Models
{
    public class BudgetGoalRecommendationModel
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public decimal TargetSavings { get; set; }
        public decimal CurrentSavings { get; set; }
        public decimal SavingsGap { get; set; }
        public decimal MonthlySavingsTarget { get; set; }
        public decimal CurrentMonthlySavings { get; set; }
        public double FeasibilityScore { get; set; }
        public string FeasibilityLabel { get; set; } = string.Empty;
        public string DataConfidence { get; set; } = "Medium";
        public decimal RemainingGapAfterCuts { get; set; }
        public decimal? RevisedTarget { get; set; }
        public decimal? IncomeGapNeeded { get; set; }
        public int? ExtendedTimelineNeeded { get; set; }
        public int Months { get; set; }
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        public string ActionPlanJson { get; set; } = string.Empty;
        public string FinalMessage { get; set; } = string.Empty;
        public string TrackingMethod { get; set; } = string.Empty;
        public string PlanType { get; set; } = "Focused";
        public string LifestyleImpact { get; set; } = "Minimal";
        public bool IsActive { get; set; } = false;
        public int? AnalysisRunId { get; set; }
        public AIAnalysisRunModel? AnalysisRun { get; set; }
        public bool IsArchived { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public string AgentVersion { get; set; } = string.Empty;
        public List<BudgetGoalRecommendationItemModel> Items { get; set; } = new();
    }
}