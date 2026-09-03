namespace PersonalFinanceTrackerAPI.Models
{
    public class TransactionModel
    {

        public int Id { get; set; }

        public DateTime Date { get; set; }

        public TransactionType Type { get; set; }

        public TransactionCategory Category { get; set; }

        public decimal Amount { get; set; }

        public string? Description { get; set; }

        public string UserId { get; set; } = string.Empty;

    }

}
