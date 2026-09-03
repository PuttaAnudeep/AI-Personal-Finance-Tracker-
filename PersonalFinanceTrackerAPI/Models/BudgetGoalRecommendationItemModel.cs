namespace PersonalFinanceTrackerAPI.Models
{
    public class BudgetGoalRecommendationItemModel
    {
        public int Id { get; set; }
        public int RecommendationId { get; set; }
        public BudgetGoalRecommendationModel? Recommendation { get; set; }
        public string Category { get; set; } = string.Empty;
        public decimal CurrentSpending { get; set; }
        public decimal RecommendedSpending { get; set; }
        public decimal ReductionAmount { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string Priority { get; set; } = "Medium";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public string AgentVersion { get; set; } = string.Empty;
    }
}