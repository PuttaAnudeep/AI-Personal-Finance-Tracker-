using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PersonalFinanceTrackerAPI.Data;
using PersonalFinanceTrackerAPI.Models;
using PersonalFinanceTrackerAPI.Services.AI.Agents.BudgetGoalAssistant.DTOs;
using PersonalFinanceTrackerAPI.Services.AI.Agents.SpendingAnomalyDetection.DTOs;
using PersonalFinanceTrackerAPI.Services.AI.Agents.SpendingInsights.DTOs;
using PersonalFinanceTrackerAPI.Services.Interfaces;

namespace PersonalFinanceTrackerAPI.Services
{
    public class AIStorageService : IAIStorageService
    {
        private readonly FinanceTrackerDbContext _context;
        private readonly ILogger<AIStorageService> _logger;

        public AIStorageService(FinanceTrackerDbContext context, ILogger<AIStorageService> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ================================================================
        // PRIVATE: Central audit trail helper
        // ================================================================
        private async Task<int> CreateAnalysisRunAsync(string userId, string agentType, string agentVersion)
        {
            var run = new AIAnalysisRunModel
            {
                UserId = userId,
                AgentType = agentType,
                AgentVersion = agentVersion,
                GeneratedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.AIAnalysisRuns.Add(run);
            await _context.SaveChangesAsync();
            return run.Id;
        }

        // ================================================================
        // SAVE: AI Insights
        // ================================================================
        public async Task<int> SaveInsightsAsync(string userId, List<SpendingInsightResponseDTO> insights, int months, string agentVersion)
        {
            var runId = await CreateAnalysisRunAsync(userId, "Insights", agentVersion);

            var entities = insights.Select(i => new AIInsightModel
            {
                UserId = userId,
                Type = i.Type.ToString(),
                Category = i.Category,
                Insight = i.Insight,
                GeneratedAt = i.GeneratedAt,
                Months = months,
                Source = "Gemini",
                AnalysisRunId = runId,
                AgentVersion = agentVersion,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }).ToList();

            _context.AIInsights.AddRange(entities);
            await _context.SaveChangesAsync();
            return runId;
        }

        // ================================================================
        // SAVE: Budget Goal Recommendation
        // ================================================================
        public async Task<int> SaveBudgetGoalAsync(string userId, BudgetRecommendationDTO dto, string agentVersion)
        {
            var runId = await CreateAnalysisRunAsync(userId, "BudgetGoal", agentVersion);

            var actionPlanJson = dto.ActionPlan != null
                ? JsonSerializer.Serialize(dto.ActionPlan, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase })
                : string.Empty;

            var entity = new BudgetGoalRecommendationModel
            {
                UserId = userId,
                TargetSavings = dto.TargetSavings,
                CurrentSavings = dto.CurrentSavings,
                SavingsGap = dto.SavingsGap,
                MonthlySavingsTarget = dto.MonthlySavingsTarget,
                CurrentMonthlySavings = dto.CurrentMonthlySavings,
                FeasibilityScore = dto.FeasibilityScore,
                FeasibilityLabel = dto.FeasibilityLabel,
                DataConfidence = dto.DataConfidence,
                RemainingGapAfterCuts = dto.RemainingGapAfterCuts,
                RevisedTarget = dto.RevisedTarget,
                IncomeGapNeeded = dto.IncomeGapNeeded,
                ExtendedTimelineNeeded = dto.ExtendedTimelineNeeded,
                Months = dto.Months,
                GeneratedAt = dto.GeneratedAt,
                ActionPlanJson = actionPlanJson,
                FinalMessage = dto.ActionPlan?.FinalMessage ?? string.Empty,
                TrackingMethod = dto.ActionPlan?.TrackingMethod ?? string.Empty,
                PlanType = dto.PlanType ?? "Focused",
                LifestyleImpact = dto.LifestyleImpact ?? "Minimal",
                IsActive = false,
                AnalysisRunId = runId,
                AgentVersion = agentVersion,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Map category recommendations to child items
            if (dto.Recommendations != null)
            {
                entity.Items = dto.Recommendations.Select(r => new BudgetGoalRecommendationItemModel
                {
                    Category = r.Category,
                    CurrentSpending = r.CurrentSpending,
                    RecommendedSpending = r.RecommendedSpending,
                    ReductionAmount = r.ReductionAmount,
                    Reason = r.Reason,
                    Priority = r.Priority,
                    AgentVersion = agentVersion,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }).ToList();
            }

            _context.BudgetGoalRecommendations.Add(entity);
            await _context.SaveChangesAsync();
            return runId;
        }

        // ================================================================
        // SAVE: Anomaly Detection Results
        // ================================================================
        public async Task<int> SaveAnomalyResultsAsync(string userId, AnomalyDetectionResponseDTO dto, int months, double threshold, string agentVersion)
        {
            var runId = await CreateAnalysisRunAsync(userId, "AnomalyDetection", agentVersion);

            var entity = new AnomalyDetectionResultModel
            {
                UserId = userId,
                GeneratedAt = DateTime.UtcNow,
                Months = months,
                Threshold = threshold,
                TotalAnomaliesFound = dto.Summary?.TotalAnomaliesFound ?? 0,
                HighSeverityCount = dto.Summary?.HighSeverityCount ?? 0,
                MediumSeverityCount = dto.Summary?.MediumSeverityCount ?? 0,
                LowSeverityCount = dto.Summary?.LowSeverityCount ?? 0,
                OverallInsight = dto.Summary?.OverallInsight ?? string.Empty,
                AnalysisRunId = runId,
                AgentVersion = agentVersion,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Map anomaly details
            if (dto.Anomalies != null)
            {
                entity.AnomalyDetails = dto.Anomalies.Select(a => new AnomalyDetailModel
                {
                    TransactionId = a.TransactionId,
                    Date = a.Date,
                    Category = a.Category,
                    Amount = a.Amount,
                    AverageForCategory = a.AverageForCategory,
                    DeviationPercentage = a.DeviationPercentage,
                    Severity = a.Severity,
                    Explanation = a.Explanation,
                    AnomalyType = a.AnomalyType,
                    AgentVersion = agentVersion,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }).ToList();
            }

            _context.AnomalyDetectionResults.Add(entity);
            await _context.SaveChangesAsync();
            return runId;
        }

        // ================================================================
        // HISTORY: Analysis Runs
        // ================================================================
        public async Task<List<AIAnalysisRunModel>> GetAnalysisRunsAsync(string userId, string? agentType = null, int limit = 10, bool includeArchived = false)
        {
            var query = _context.AIAnalysisRuns
                .Where(r => r.UserId == userId);

            if (!includeArchived)
                query = query.Where(r => !r.IsArchived);

            if (!string.IsNullOrEmpty(agentType))
                query = query.Where(r => r.AgentType == agentType);

            return await query
                .OrderByDescending(r => r.GeneratedAt)
                .Take(limit)
                .ToListAsync();
        }

        // ================================================================
        // HISTORY: AI Insights
        // ================================================================
        public async Task<List<AIInsightModel>> GetInsightHistoryAsync(string userId, int limit = 10, bool includeArchived = false)
        {
            var query = _context.AIInsights
                .Include(i => i.AnalysisRun)
                .Where(i => i.UserId == userId);

            if (!includeArchived)
                query = query.Where(i => !i.IsArchived);

            return await query
                .OrderByDescending(i => i.GeneratedAt)
                .Take(limit * 20) // Take more since we group by run
                .ToListAsync();
        }

        // ================================================================
        // HISTORY: Budget Goal Recommendations
        // ================================================================
        public async Task<List<BudgetGoalRecommendationModel>> GetBudgetGoalHistoryAsync(string userId, int limit = 10, bool includeArchived = false)
        {
            var query = _context.BudgetGoalRecommendations
                .Include(b => b.Items)
                .Include(b => b.AnalysisRun)
                .Where(b => b.UserId == userId);

            if (!includeArchived)
                query = query.Where(b => !b.IsArchived);

            return await query
                .OrderByDescending(b => b.GeneratedAt)
                .Take(limit)
                .ToListAsync();
        }

        // ================================================================
        // HISTORY: Anomaly Detection Results
        // ================================================================
        public async Task<List<AnomalyDetectionResultModel>> GetAnomalyHistoryAsync(string userId, int limit = 10, bool includeArchived = false)
        {
            var query = _context.AnomalyDetectionResults
                .Include(a => a.AnomalyDetails)
                .Include(a => a.AnalysisRun)
                .Where(a => a.UserId == userId);

            if (!includeArchived)
                query = query.Where(a => !a.IsArchived);

            // Note: intentional typo to track fix
            // Fixed property name is IsArchived

            return await query
                .OrderByDescending(a => a.GeneratedAt)
                .Take(limit)
                .ToListAsync();
        }

        // ================================================================
        // ACTIVE BUDGET GOAL
        // ================================================================
        public async Task<BudgetGoalRecommendationModel?> GetActiveBudgetGoalAsync(string userId)
        {
            return await _context.BudgetGoalRecommendations
                .Include(b => b.Items)
                .Include(b => b.AnalysisRun)
                .Where(b => b.UserId == userId && b.IsActive && !b.IsArchived)
                .OrderByDescending(b => b.GeneratedAt)
                .FirstOrDefaultAsync();
        }

        public async Task SetActiveBudgetGoalAsync(string userId, int recommendationId)
        {
            // Deactivate all existing active goals for this user
            var activeGoals = await _context.BudgetGoalRecommendations
                .Where(b => b.UserId == userId && b.IsActive)
                .ToListAsync();

            foreach (var goal in activeGoals)
            {
                goal.IsActive = false;
            }

            // Activate the target goal
            var target = await _context.BudgetGoalRecommendations
                .FirstOrDefaultAsync(b => b.Id == recommendationId && b.UserId == userId);

            if (target == null)
                throw new KeyNotFoundException("Budget goal recommendation not found.");

            if (target.IsArchived)
                throw new InvalidOperationException("Cannot activate an archived budget goal.");

            target.IsActive = true;
            await _context.SaveChangesAsync();
        }

        // ================================================================
        // ARCHIVE METHODS
        // ================================================================
        public async Task ArchiveInsightAsync(string userId, int insightId)
        {
            var entity = await _context.AIInsights
                .FirstOrDefaultAsync(i => i.Id == insightId && i.UserId == userId);

            if (entity == null)
                throw new KeyNotFoundException("Insight not found.");

            entity.IsArchived = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task ArchiveBudgetGoalAsync(string userId, int recommendationId)
        {
            var entity = await _context.BudgetGoalRecommendations
                .FirstOrDefaultAsync(b => b.Id == recommendationId && b.UserId == userId);

            if (entity == null)
                throw new KeyNotFoundException("Budget goal recommendation not found.");

            entity.IsArchived = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task ArchiveAnomalyResultAsync(string userId, int resultId)
        {
            var entity = await _context.AnomalyDetectionResults
                .FirstOrDefaultAsync(a => a.Id == resultId && a.UserId == userId);

            if (entity == null)
                throw new KeyNotFoundException("Anomaly result not found.");

            entity.IsArchived = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task ArchiveAnalysisRunAsync(string userId, int runId)
        {
            var entity = await _context.AIAnalysisRuns
                .FirstOrDefaultAsync(r => r.Id == runId && r.UserId == userId);

            if (entity == null)
                throw new KeyNotFoundException("Analysis run not found.");

            entity.IsArchived = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }
}