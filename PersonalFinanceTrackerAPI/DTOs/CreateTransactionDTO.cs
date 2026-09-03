using System.ComponentModel.DataAnnotations;
using PersonalFinanceTrackerAPI.Models;

namespace PersonalFinanceTrackerAPI.DTOs
{
    public class CreateTransactionDTO
    {
        [Required]
        public DateTime Date { get; set; }

        [Required]
        public TransactionType Type { get; set; }

        [Required]
        public TransactionCategory Category { get; set; }

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
        public decimal Amount { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }
    }
}