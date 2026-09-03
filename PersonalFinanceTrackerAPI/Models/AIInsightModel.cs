namespace PersonalFinanceTrackerAPI.Models
{
    public class AIInsightModel
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Insight { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        public int Months { get; set; }
        public string Source { get; set; } = string.Empty;
        public int? AnalysisRunId { get; set; }
        public AIAnalysisRunModel? AnalysisRun { get; set; }
        public bool IsArchived { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public string AgentVersion { get; set; } = string.Empty;
    }
}