namespace PersonalFinanceTrackerAPI.Models
{
    public class AnomalyDetailModel
    {
        public int Id { get; set; }
        public int AnomalyResultId { get; set; }
        public AnomalyDetectionResultModel? AnomalyResult { get; set; }
        public int TransactionId { get; set; }
        public DateTime Date { get; set; }
        public string Category { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public decimal AverageForCategory { get; set; }
        public double DeviationPercentage { get; set; }
        public string Severity { get; set; } = string.Empty;
        public string Explanation { get; set; } = string.Empty;
        public string AnomalyType { get; set; } = "Spike";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public string AgentVersion { get; set; } = string.Empty;
    }
}