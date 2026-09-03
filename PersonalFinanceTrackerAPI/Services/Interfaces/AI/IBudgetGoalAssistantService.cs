using PersonalFinanceTrackerAPI.Services.AI.Agents.BudgetGoalAssistant.DTOs;

namespace PersonalFinanceTrackerAPI.Services.Interfaces.AI
{
    /// <summary>
    /// Service for generating personalized budget recommendations to help users achieve their savings goals
    /// </summary>
    public interface IBudgetGoalAssistantService
    {
        /// <summary>
        /// Analyzes user's spending patterns and generates actionable budget recommendations to achieve savings goal
        /// </summary>
        /// <param name="userId">The authenticated user's ID</param>
        /// <param name="targetSavings">Target savings amount to achieve</param>
        /// <param name="months">Number of months to achieve the goal</param>
        /// <param name="planType">Savings strategy: "Focused" (aggressive cuts) or "Balanced" (sustainable cuts). Defaults to "Focused"</param>
        /// <returns>Budget recommendations with category-wise reductions and action plan</returns>
        Task<BudgetRecommendationDTO> GetBudgetRecommendationsAsync(string userId, decimal targetSavings, int months, string planType = "Focused");
    }
}