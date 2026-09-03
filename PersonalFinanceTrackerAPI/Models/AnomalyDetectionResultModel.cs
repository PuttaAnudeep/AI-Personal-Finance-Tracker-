namespace PersonalFinanceTrackerAPI.Models
{
    public class AnomalyDetectionResultModel
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        public int Months { get; set; }
        public double Threshold { get; set; }
        public int TotalAnomaliesFound { get; set; }
        public int HighSeverityCount { get; set; }
        public int MediumSeverityCount { get; set; }
        public int LowSeverityCount { get; set; }
        public string OverallInsight { get; set; } = string.Empty;
        public int? AnalysisRunId { get; set; }
        public AIAnalysisRunModel? AnalysisRun { get; set; }
        public bool IsArchived { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public string AgentVersion { get; set; } = string.Empty;
        public List<AnomalyDetailModel> AnomalyDetails { get; set; } = new();
    }
}