using PersonalFinanceTrackerAPI.Models;

namespace PersonalFinanceTrackerAPI.DTOs
{
    public class TransactionResponseDTO
    {
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string? Description { get; set; }
        public string UserId { get; set; } = string.Empty;
    }
}