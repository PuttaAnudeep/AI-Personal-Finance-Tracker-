using PersonalFinanceTrackerAPI.DTOs;

namespace PersonalFinanceTrackerAPI.Services.Interfaces.AI
{
    public interface INaturalLanguageTransactionCreationService
    {
        /// <summary>
        /// Parses natural language text and creates one or more transactions directly in the database.
        /// Supports single or multiple transactions from one text input.
        /// </summary>
        /// <param name="text">Natural language input (e.g., "Spent ₹500 on Lunch" or "Spent ₹500 on Lunch and ₹200 on Taxi")</param>
        /// <param name="userId">The authenticated user's ID</param>
        /// <returns>List of created transaction response DTOs</returns>
        Task<List<TransactionResponseDTO>> CreateTransactionsFromNlpAsync(string text, string userId);
    }
}