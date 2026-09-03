using PersonalFinanceTrackerAPI.Models;
using PersonalFinanceTrackerAPI.Services.AI.Agents.SpendingInsights.DTOs;
using PersonalFinanceTrackerAPI.Services.AI.Agents.BudgetGoalAssistant.DTOs;
using PersonalFinanceTrackerAPI.Services.AI.Agents.SpendingAnomalyDetection.DTOs;

namespace PersonalFinanceTrackerAPI.Services.Interfaces
{
    public interface IAIStorageService
    {
        // === Save Methods ===
        Task<int> SaveInsightsAsync(string userId, List<SpendingInsightResponseDTO> insights, int months, string agentVersion);
        Task<int> SaveBudgetGoalAsync(string userId, BudgetRecommendationDTO dto, string agentVersion);
        Task<int> SaveAnomalyResultsAsync(string userId, AnomalyDetectionResponseDTO dto, int months, double threshold, string agentVersion);

        // === History Methods (use limit=1 for latest) ===
        Task<List<AIAnalysisRunModel>> GetAnalysisRunsAsync(string userId, string? agentType = null, int limit = 10, bool includeArchived = false);
        Task<List<AIInsightModel>> GetInsightHistoryAsync(string userId, int limit = 10, bool includeArchived = false);
        Task<List<BudgetGoalRecommendationModel>> GetBudgetGoalHistoryAsync(string userId, int limit = 10, bool includeArchived = false);
        Task<List<AnomalyDetectionResultModel>> GetAnomalyHistoryAsync(string userId, int limit = 10, bool includeArchived = false);

        // === Active Budget Goal ===
        Task<BudgetGoalRecommendationModel?> GetActiveBudgetGoalAsync(string userId);
        Task SetActiveBudgetGoalAsync(string userId, int recommendationId);

        // === Archive (Soft-Delete) ===
        Task ArchiveInsightAsync(string userId, int insightId);
        Task ArchiveBudgetGoalAsync(string userId, int recommendationId);
        Task ArchiveAnomalyResultAsync(string userId, int resultId);
        Task ArchiveAnalysisRunAsync(string userId, int runId);
    }
}