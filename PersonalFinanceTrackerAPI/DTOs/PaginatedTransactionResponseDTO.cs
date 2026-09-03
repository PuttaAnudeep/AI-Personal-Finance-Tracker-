namespace PersonalFinanceTrackerAPI.DTOs
{
    public class PaginatedTransactionResponseDTO
    {
        public List<TransactionResponseDTO> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public TransactionSummaryDTO Summary { get; set; } = new();
    }

    public class TransactionSummaryDTO
    {
        public decimal TotalIncome { get; set; }
        public decimal TotalExpense { get; set; }
        public decimal NetBalance { get; set; }
        public int TransactionCount { get; set; }
    }
}