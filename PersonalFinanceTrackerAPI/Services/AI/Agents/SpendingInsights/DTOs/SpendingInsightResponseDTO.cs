namespace PersonalFinanceTrackerAPI.Services.AI.Agents.SpendingInsights.DTOs
{
    public enum InsightType
    {
        Positive,
        Warning,
        Trend,
        Recommendation,
        Risk
    }

    public class SpendingInsightResponseDTO
    {
        public InsightType Type { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Insight { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }
}