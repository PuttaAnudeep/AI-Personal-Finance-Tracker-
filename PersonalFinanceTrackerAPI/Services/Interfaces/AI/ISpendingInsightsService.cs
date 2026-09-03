using PersonalFinanceTrackerAPI.Services.AI.Agents.SpendingInsights.DTOs;

namespace PersonalFinanceTrackerAPI.Services.Interfaces.AI
{
    public interface ISpendingInsightsService
    {
        /// <summary>
        /// Analyzes user's transaction history and generates actionable spending insights.
        /// </summary>
        /// <param name="userId">The authenticated user's ID</param>
        /// <param name="months">Number of months to analyze (default: 3)</param>
        /// <returns>List of spending insights with categories, amounts, and comparisons</returns>
        Task<List<SpendingInsightResponseDTO>> GenerateSpendingInsightsAsync(string userId, int months = 3);
    }
}