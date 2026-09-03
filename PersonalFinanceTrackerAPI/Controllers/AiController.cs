using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalFinanceTrackerAPI.Data;
using PersonalFinanceTrackerAPI.DTOs;
using PersonalFinanceTrackerAPI.Models;
using PersonalFinanceTrackerAPI.Services.AI.Agents.BudgetGoalAssistant.DTOs;
using PersonalFinanceTrackerAPI.Services.AI.Agents.NaturalLanguageTransactionCreation.DTOs;
using PersonalFinanceTrackerAPI.Services.Interfaces;
using PersonalFinanceTrackerAPI.Services.Interfaces.AI;

namespace PersonalFinanceTrackerAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AiController : ControllerBase
    {
        private readonly INaturalLanguageTransactionCreationService _nlpService;
        private readonly ISpendingInsightsService _insightsService;
        private readonly IBudgetGoalAssistantService _budgetGoalService;
        private readonly ISpendingAnomalyDetectionService _anomalyDetectionService;
        private readonly IDocumentExtractionService _documentExtractionService;
        private readonly IAIStorageService _storageService;

        public AiController(
            INaturalLanguageTransactionCreationService nlpService,
            ISpendingInsightsService insightsService,
            IBudgetGoalAssistantService budgetGoalService,
            ISpendingAnomalyDetectionService anomalyDetectionService,
            IDocumentExtractionService documentExtractionService,
            IAIStorageService storageService)
        {
            _nlpService = nlpService;
            _insightsService = insightsService;
            _budgetGoalService = budgetGoalService;
            _anomalyDetectionService = anomalyDetectionService;
            _documentExtractionService = documentExtractionService;
            _storageService = storageService;
        }

        private string GetUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? throw new UnauthorizedAccessException("User ID not found in token.");
        }

        /// <summary>
        /// Creates one or more transactions from natural language text using AI.
        /// Example: "Spent ₹500 on Lunch" creates 1 transaction.
        /// Example: "Spent ₹500 on Lunch and ₹200 on Taxi" creates 2 transactions.
        /// </summary>
        [HttpPost("create-transaction")]
        public async Task<IActionResult> CreateTransactionFromNlp([FromBody] NlpTransactionRequestDTO request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var userId = GetUserId();
                var results = await _nlpService.CreateTransactionsFromNlpAsync(request.Text, userId);
                
                return CreatedAtAction(
                    actionName: "GetById",
                    controllerName: "Transaction",
                    routeValues: new { id = results.First().Id },
                    value: results
                );
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (HttpRequestException ex)
            {
                return StatusCode(502, new { message = $"AI service unavailable: {ex.Message}" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Generates spending insights based on user's transaction history.
        /// </summary>
        [HttpGet("insights")]
        public async Task<IActionResult> GenerateInsights([FromQuery] int months = 3)
        {
            try
            {
                var userId = GetUserId();
                var insights = await _insightsService.GenerateSpendingInsightsAsync(userId, months);
                return Ok(insights);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (HttpRequestException ex)
            {
                return StatusCode(502, new { message = $"AI service unavailable: {ex.Message}" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Generates budget recommendations to help achieve savings goals.
        /// </summary>
        [HttpPost("budget-goal")]
        public async Task<IActionResult> GetBudgetRecommendations([FromBody] BudgetGoalRequestDTO request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var userId = GetUserId();
                var recommendations = await _budgetGoalService.GetBudgetRecommendationsAsync(
                    userId, 
                    request.TargetSavings, 
                    request.Months,
                    request.PlanType
                );
                return Ok(recommendations);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (HttpRequestException ex)
            {
                return StatusCode(502, new { message = $"AI service unavailable: {ex.Message}" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Detects spending anomalies in user's transaction history.
        /// The deviation threshold is fixed at 200% — a transaction deviating more than 200%
        /// from the category average is flagged as anomalous.
        /// </summary>
        [HttpGet("detect-anomalies")]
        public async Task<IActionResult> DetectAnomalies([FromQuery] int months = 3)
        {
            try
            {
                const double threshold = 200;
                var userId = GetUserId();
                var anomalies = await _anomalyDetectionService.DetectAnomaliesAsync(userId, months, threshold);
                return Ok(anomalies);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (HttpRequestException ex)
            {
                return StatusCode(502, new { message = $"AI service unavailable: {ex.Message}" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Processes an uploaded document (receipt, bill, invoice, or bank statement)
        /// by extracting text and automatically creating transactions using AI.
        /// Supported formats: jpg, jpeg, png, webp, pdf
        /// </summary>
        /// <param name="file">The document file to process (multipart/form-data)</param>
        [HttpPost("process-document")]
        [RequestSizeLimit(10 * 1024 * 1024)] // 10MB
        public async Task<IActionResult> ProcessDocument(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file provided or file is empty." });

            try
            {
                var userId = GetUserId();

                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                var fileBytes = memoryStream.ToArray();

                var result = await _documentExtractionService.ProcessDocumentAsync(
                    fileBytes,
                    file.FileName,
                    file.ContentType,
                    userId);

                if (!result.Success)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (HttpRequestException ex)
            {
                return StatusCode(502, new { message = $"AI service unavailable: {ex.Message}" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ================================================================
        // HISTORY & RETRIEVAL ENDPOINTS
        // ================================================================

        /// <summary>
        /// Returns past AI insight sets. Use limit=1 for the most recent generation.
        /// </summary>
        [HttpGet("insights/history")]
        public async Task<IActionResult> GetInsightHistory([FromQuery] int limit = 10, [FromQuery] bool includeArchived = false)
        {
            try
            {
                var userId = GetUserId();
                var insights = await _storageService.GetInsightHistoryAsync(userId, limit, includeArchived);

                // Group insights by AnalysisRunId to form sets
                var grouped = insights
                    .GroupBy(i => i.AnalysisRunId ?? i.Id)
                    .Select(g => new InsightHistoryResponseDTO
                    {
                        AnalysisRunId = g.Key,
                        GeneratedAt = g.Max(i => i.GeneratedAt),
                        AgentVersion = g.First().AgentVersion,
                        Months = g.First().Months,
                        Insights = g.Select(i => new InsightHistoryItemDTO
                        {
                            Id = i.Id,
                            Type = i.Type,
                            Category = i.Category,
                            Insight = i.Insight,
                            GeneratedAt = i.GeneratedAt,
                            Months = i.Months,
                            Source = i.Source,
                            AgentVersion = i.AgentVersion
                        }).ToList()
                    })
                    .OrderByDescending(g => g.GeneratedAt)
                    .Take(limit)
                    .ToList();

                return Ok(grouped);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Returns past budget goal recommendation sets. Use limit=1 for the most recent.
        /// </summary>
        [HttpGet("budget-goal/history")]
        public async Task<IActionResult> GetBudgetGoalHistory([FromQuery] int limit = 10, [FromQuery] bool includeArchived = false)
        {
            try
            {
                var userId = GetUserId();
                var history = await _storageService.GetBudgetGoalHistoryAsync(userId, limit, includeArchived);

                var result = history.Select(h => new BudgetGoalHistoryResponseDTO
                {
                    Id = h.Id,
                    TargetSavings = h.TargetSavings,
                    CurrentSavings = h.CurrentSavings,
                    SavingsGap = h.SavingsGap,
                    MonthlySavingsTarget = h.MonthlySavingsTarget,
                    CurrentMonthlySavings = h.CurrentMonthlySavings,
                    FeasibilityScore = h.FeasibilityScore,
                    FeasibilityLabel = h.FeasibilityLabel,
                    DataConfidence = h.DataConfidence,
                    IsActive = h.IsActive,
                    ActionPlanJson = h.ActionPlanJson,
                    FinalMessage = h.FinalMessage,
                    TrackingMethod = h.TrackingMethod,
                    PlanType = h.PlanType,
                    LifestyleImpact = h.LifestyleImpact,
                    GeneratedAt = h.GeneratedAt,
                    Months = h.Months,
                    RemainingGapAfterCuts = h.RemainingGapAfterCuts,
                    RevisedTarget = h.RevisedTarget,
                    IncomeGapNeeded = h.IncomeGapNeeded,
                    ExtendedTimelineNeeded = h.ExtendedTimelineNeeded,
                    AgentVersion = h.AgentVersion,
                    Recommendations = h.Items.Select(i => new BudgetGoalRecommendationItemDTO
                    {
                        Category = i.Category,
                        CurrentSpending = i.CurrentSpending,
                        RecommendedSpending = i.RecommendedSpending,
                        ReductionAmount = i.ReductionAmount,
                        Reason = i.Reason,
                        Priority = i.Priority
                    }).ToList()
                }).ToList();

                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Returns past anomaly detection sets. Use limit=1 for the most recent.
        /// </summary>
        [HttpGet("detect-anomalies/history")]
        public async Task<IActionResult> GetAnomalyHistory([FromQuery] int limit = 10, [FromQuery] bool includeArchived = false)
        {
            try
            {
                var userId = GetUserId();
                var history = await _storageService.GetAnomalyHistoryAsync(userId, limit, includeArchived);

                var result = history.Select(h => new AnomalyHistoryResponseDTO
                {
                    Id = h.Id,
                    TotalAnomaliesFound = h.TotalAnomaliesFound,
                    HighSeverityCount = h.HighSeverityCount,
                    MediumSeverityCount = h.MediumSeverityCount,
                    LowSeverityCount = h.LowSeverityCount,
                    OverallInsight = h.OverallInsight,
                    Threshold = h.Threshold,
                    Months = h.Months,
                    GeneratedAt = h.GeneratedAt,
                    AgentVersion = h.AgentVersion,
                    Anomalies = h.AnomalyDetails.Select(a => new AnomalyDetailDTO
                    {
                        TransactionId = a.TransactionId,
                        Date = a.Date,
                        Category = a.Category,
                        Amount = a.Amount,
                        AverageForCategory = a.AverageForCategory,
                        DeviationPercentage = a.DeviationPercentage,
                        Severity = a.Severity,
                        Explanation = a.Explanation,
                        AnomalyType = a.AnomalyType
                    }).ToList()
                }).ToList();

                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Returns the central audit trail of AI analysis runs.
        /// </summary>
        [HttpGet("analysis-runs")]
        public async Task<IActionResult> GetAnalysisRuns([FromQuery] string? agentType = null, [FromQuery] int limit = 20)
        {
            try
            {
                var userId = GetUserId();
                var runs = await _storageService.GetAnalysisRunsAsync(userId, agentType, limit);

                var result = runs.Select(r => new AnalysisRunHistoryDTO
                {
                    Id = r.Id,
                    AgentType = r.AgentType,
                    AgentVersion = r.AgentVersion,
                    GeneratedAt = r.GeneratedAt
                }).ToList();

                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Returns the currently active budget goal plan.
        /// </summary>
        [HttpGet("budget-goal/active")]
        public async Task<IActionResult> GetActiveBudgetGoal()
        {
            try
            {
                var userId = GetUserId();
                var active = await _storageService.GetActiveBudgetGoalAsync(userId);

                if (active == null)
                    return NotFound(new { message = "No active budget goal found." });

                return Ok(new BudgetGoalHistoryResponseDTO
                {
                    Id = active.Id,
                    TargetSavings = active.TargetSavings,
                    CurrentSavings = active.CurrentSavings,
                    SavingsGap = active.SavingsGap,
                    MonthlySavingsTarget = active.MonthlySavingsTarget,
                    CurrentMonthlySavings = active.CurrentMonthlySavings,
                    FeasibilityScore = active.FeasibilityScore,
                    FeasibilityLabel = active.FeasibilityLabel,
                    DataConfidence = active.DataConfidence,
                    IsActive = true,
                    ActionPlanJson = active.ActionPlanJson,
                    FinalMessage = active.FinalMessage,
                    TrackingMethod = active.TrackingMethod,
                    PlanType = active.PlanType,
                    LifestyleImpact = active.LifestyleImpact,
                    GeneratedAt = active.GeneratedAt,
                    Months = active.Months,
                    RemainingGapAfterCuts = active.RemainingGapAfterCuts,
                    RevisedTarget = active.RevisedTarget,
                    IncomeGapNeeded = active.IncomeGapNeeded,
                    ExtendedTimelineNeeded = active.ExtendedTimelineNeeded,
                    AgentVersion = active.AgentVersion,
                    Recommendations = active.Items.Select(i => new BudgetGoalRecommendationItemDTO
                    {
                        Category = i.Category,
                        CurrentSpending = i.CurrentSpending,
                        RecommendedSpending = i.RecommendedSpending,
                        ReductionAmount = i.ReductionAmount,
                        Reason = i.Reason,
                        Priority = i.Priority
                    }).ToList()
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Sets an existing budget goal plan as the active plan.
        /// </summary>
        [HttpPut("budget-goal/{id}/activate")]
        public async Task<IActionResult> ActivateBudgetGoal(int id)
        {
            try
            {
                var userId = GetUserId();
                await _storageService.SetActiveBudgetGoalAsync(userId, id);
                return Ok(new { message = "Budget goal activated successfully." });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // === ARCHIVE (SOFT-DELETE) ENDPOINTS ===

        [HttpDelete("insights/{id}/archive")]
        public async Task<IActionResult> ArchiveInsight(int id)
        {
            try
            {
                var userId = GetUserId();
                await _storageService.ArchiveInsightAsync(userId, id);
                return Ok(new { message = "Insight archived successfully." });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpDelete("budget-goal/{id}/archive")]
        public async Task<IActionResult> ArchiveBudgetGoal(int id)
        {
            try
            {
                var userId = GetUserId();
                await _storageService.ArchiveBudgetGoalAsync(userId, id);
                return Ok(new { message = "Budget goal archived successfully." });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpDelete("detect-anomalies/{id}/archive")]
        public async Task<IActionResult> ArchiveAnomalyResult(int id)
        {
            try
            {
                var userId = GetUserId();
                await _storageService.ArchiveAnomalyResultAsync(userId, id);
                return Ok(new { message = "Anomaly result archived successfully." });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpDelete("analysis-runs/{id}/archive")]
        public async Task<IActionResult> ArchiveAnalysisRun(int id)
        {
            try
            {
                var userId = GetUserId();
                await _storageService.ArchiveAnalysisRunAsync(userId, id);
                return Ok(new { message = "Analysis run archived successfully." });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}
