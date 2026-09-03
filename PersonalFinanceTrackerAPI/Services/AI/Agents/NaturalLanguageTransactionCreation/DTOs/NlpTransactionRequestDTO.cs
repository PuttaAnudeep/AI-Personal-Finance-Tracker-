using System.ComponentModel.DataAnnotations;

namespace PersonalFinanceTrackerAPI.Services.AI.Agents.NaturalLanguageTransactionCreation.DTOs
{
    /// <summary>
    /// Request DTO for creating transactions from natural language
    /// </summary>
    public class NlpTransactionRequestDTO
    {
        /// <summary>
        /// Natural language text describing one or more transactions
        /// </summary>
        [Required]
        public string Text { get; set; } = string.Empty;
    }
}