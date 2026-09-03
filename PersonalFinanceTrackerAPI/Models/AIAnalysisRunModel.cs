namespace PersonalFinanceTrackerAPI.Models
{
    public class AIAnalysisRunModel
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string AgentType { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        public string AgentVersion { get; set; } = string.Empty;
        public bool IsArchived { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}