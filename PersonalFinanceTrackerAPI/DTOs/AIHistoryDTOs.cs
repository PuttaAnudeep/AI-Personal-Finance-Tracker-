using PersonalFinanceTrackerAPI.Models;

namespace PersonalFinanceTrackerAPI.DTOs
{
    // ================================================================
    // AIInsights History DTOs
    // ================================================================
    public class InsightHistoryItemDTO
    {
        public int Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Insight { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; }
        public int Months { get; set; }
        public string Source { get; set; } = string.Empty;
        public string AgentVersion { get; set; } = string.Empty;
    }

    public class InsightHistoryResponseDTO
    {
        public int AnalysisRunId { get; set; }
        public DateTime GeneratedAt { get; set; }
        public string AgentVersion { get; set; } = string.Empty;
        public int Months { get; set; }
        public List<InsightHistoryItemDTO> Insights { get; set; } = new();
    }

    // ================================================================
    // Budget Goal History DTOs
    // ================================================================
    public class BudgetGoalHistoryResponseDTO
    {
        public int Id { get; set; }
        public decimal TargetSavings { get; set; }
        public decimal CurrentSavings { get; set; }
        public decimal SavingsGap { get; set; }
        public decimal MonthlySavingsTarget { get; set; }
        public decimal CurrentMonthlySavings { get; set; }
        public double FeasibilityScore { get; set; }
        public string FeasibilityLabel { get; set; } = string.Empty;
        public string DataConfidence { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public string ActionPlanJson { get; set; } = string.Empty;
        public string FinalMessage { get; set; } = string.Empty;
        public string TrackingMethod { get; set; } = string.Empty;
        public string PlanType { get; set; } = string.Empty;
        public string LifestyleImpact { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; }
        public int Months { get; set; }
        public decimal RemainingGapAfterCuts { get; set; }
        public decimal? RevisedTarget { get; set; }
        public decimal? IncomeGapNeeded { get; set; }
        public int? ExtendedTimelineNeeded { get; set; }
        public string AgentVersion { get; set; } = string.Empty;
        public List<BudgetGoalRecommendationItemDTO> Recommendations { get; set; } = new();
    }

    public class BudgetGoalRecommendationItemDTO
    {
        public string Category { get; set; } = string.Empty;
        public decimal CurrentSpending { get; set; }
        public decimal RecommendedSpending { get; set; }
        public decimal ReductionAmount { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
    }

    // ================================================================
    // Anomaly History DTOs
    // ================================================================
    public class AnomalyHistoryResponseDTO
    {
        public int Id { get; set; }
        public int TotalAnomaliesFound { get; set; }
        public int HighSeverityCount { get; set; }
        public int MediumSeverityCount { get; set; }
        public int LowSeverityCount { get; set; }
        public string OverallInsight { get; set; } = string.Empty;
        public double Threshold { get; set; }
        public int Months { get; set; }
        public DateTime GeneratedAt { get; set; }
        public string AgentVersion { get; set; } = string.Empty;
        public List<AnomalyDetailDTO> Anomalies { get; set; } = new();
    }

    public class AnomalyDetailDTO
    {
        public int TransactionId { get; set; }
        public DateTime Date { get; set; }
        public string Category { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public decimal AverageForCategory { get; set; }
        public double DeviationPercentage { get; set; }
        public string Severity { get; set; } = string.Empty;
        public string Explanation { get; set; } = string.Empty;
        public string AnomalyType { get; set; } = string.Empty;
    }

    // ================================================================
    // Analysis Runs History DTO
    // ================================================================
    public class AnalysisRunHistoryDTO
    {
        public int Id { get; set; }
        public string AgentType { get; set; } = string.Empty;
        public string AgentVersion { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; }
    }
}