using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using PersonalFinanceTrackerAPI.Services;
using PersonalFinanceTrackerAPI.Services.AI.Agents.SpendingAnomalyDetection.DTOs;
using PersonalFinanceTrackerAPI.Services.AI.Agents.SpendingInsights.Analytics;
using PersonalFinanceTrackerAPI.Services.AI.SharedInfrastructure.Gemini;
using PersonalFinanceTrackerAPI.Services.Interfaces;
using PersonalFinanceTrackerAPI.Services.Interfaces.AI;

namespace PersonalFinanceTrackerAPI.Services.AI.Agents.SpendingAnomalyDetection
{
    public class SpendingAnomalyDetectionService : ISpendingAnomalyDetectionService
    {
        private readonly FinancialAnalyticsEngine _analyticsEngine;
        private readonly GeminiClient _geminiClient;
        private readonly ITransactionService _transactionService;
        private readonly IAIStorageService _storageService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<SpendingAnomalyDetectionService> _logger;

        public SpendingAnomalyDetectionService(
            FinancialAnalyticsEngine analyticsEngine,
            GeminiClient geminiClient,
            ITransactionService transactionService,
            IAIStorageService storageService,
            IConfiguration configuration,
            ILogger<SpendingAnomalyDetectionService> logger)
        {
            _analyticsEngine = analyticsEngine;
            _geminiClient = geminiClient;
            _transactionService = transactionService;
            _storageService = storageService;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<AnomalyDetectionResponseDTO> DetectAnomaliesAsync(string userId, int months = 3, double? threshold = null)
        {
            var configThreshold = _configuration.GetValue<double?>("AIAgents:AnomalyDetectionThreshold") ?? 200;
            var effectiveThreshold = threshold ?? configThreshold;

            var endDate = DateTime.UtcNow;
            var startDate = endDate.AddMonths(-months);

            var transactions = await _transactionService.GetByDateRangeAsync(startDate, endDate, userId);
            var expenses = transactions.Where(t => t.Type == "Expense").ToList();

            if (!expenses.Any())
            {
                return new AnomalyDetectionResponseDTO
                {
                    Summary = new AnomalySummary { OverallInsight = "No expense transactions found for analysis." }
                };
            }

            // Calculate average per category
            var categoryAverages = expenses
                .GroupBy(t => t.Category)
                .ToDictionary(
                    g => g.Key,
                    g => g.Average(t => t.Amount)
                );

            var anomalies = new List<Anomaly>();
            var thresholdMultiplier = 1 + (effectiveThreshold / 100);

            foreach (var transaction in expenses)
            {
                var categoryAvg = categoryAverages[transaction.Category];
                
                // We only consider it an anomaly if it's significantly above the average
                if ((double)transaction.Amount > (double)categoryAvg * thresholdMultiplier && categoryAvg > 0)
                {
                    var deviationPercentage = (double)((transaction.Amount - categoryAvg) / categoryAvg) * 100;
                    
                    var anomaly = new Anomaly
                    {
                        TransactionId = transaction.Id,
                        Date = transaction.Date,
                        Category = transaction.Category,
                        Amount = transaction.Amount,
                        AverageForCategory = categoryAvg,
                        DeviationPercentage = Math.Round(deviationPercentage, 2)
                    };

                    // Determine severity
                    if (deviationPercentage > 100)
                        anomaly.Severity = "High";
                    else if (deviationPercentage > 50)
                        anomaly.Severity = "Medium";
                    else
                        anomaly.Severity = "Low";

                    anomalies.Add(anomaly);
                }
            }

            // Sort anomalies by date descending
            anomalies = anomalies.OrderByDescending(a => a.Date).ToList();

            var response = new AnomalyDetectionResponseDTO
            {
                Anomalies = anomalies,
                Summary = new AnomalySummary
                {
                    TotalAnomaliesFound = anomalies.Count,
                    HighSeverityCount = anomalies.Count(a => a.Severity == "High"),
                    MediumSeverityCount = anomalies.Count(a => a.Severity == "Medium"),
                    LowSeverityCount = anomalies.Count(a => a.Severity == "Low")
                }
            };

            if (anomalies.Any())
            {
                await GenerateAiExplanations(response);
            }
            else
            {
                response.Summary.OverallInsight = $"No spending anomalies detected based on your {effectiveThreshold}% threshold.";
            }

            // Persist anomaly detection results for history
            var agentVersion = _configuration["AIAgents:AnomalyDetectionAgentVersion"] ?? "1.0.0";
            try
            {
                await _storageService.SaveAnomalyResultsAsync(userId, response, months, effectiveThreshold, agentVersion);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to save anomaly detection results to storage");
            }

            return response;
        }

        private async Task GenerateAiExplanations(AnomalyDetectionResponseDTO response)
        {
            var anomaliesJson = JsonSerializer.Serialize(response.Anomalies.Select(a => new {
                a.TransactionId,
                a.Category,
                a.Amount,
                a.AverageForCategory,
                a.DeviationPercentage,
                a.Severity
            }));

            var prompt = $@"You are a helpful financial assistant. I have detected some spending anomalies in a user's account. 
Anomalies are transactions that are significantly higher than the average for that category.

ANOMALIES DETECTED:
{anomaliesJson}

YOUR TASK:
1. For each anomaly, provide a short (1-sentence), helpful, and non-judgmental explanation of why this might be flagged and what the user should consider.
2. Provide a brief overall summary (OverallInsight) of these findings.

FORMAT:
Return ONLY a JSON object with this structure:
{{
  ""explanations"": [
    {{ ""transactionId"": 1, ""explanation"": ""..."" }},
    ...
  ],
  ""overallInsight"": ""...""
}}

Ensure the transactionId matches the input.";

            try
            {
                var rawResponse = await _geminiClient.GetTextResponseAsync(prompt);
                
                // Clean up markdown if present
                if (rawResponse.Contains("```json"))
                {
                    rawResponse = rawResponse.Substring(rawResponse.IndexOf("```json") + 7);
                    rawResponse = rawResponse.Substring(0, rawResponse.LastIndexOf("```"));
                }
                else if (rawResponse.Contains("```"))
                {
                    rawResponse = rawResponse.Substring(rawResponse.IndexOf("```") + 3);
                    rawResponse = rawResponse.Substring(0, rawResponse.LastIndexOf("```"));
                }

                var aiResult = JsonSerializer.Deserialize<AiAnomalyResponse>(rawResponse, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (aiResult != null)
                {
                    foreach (var explanation in aiResult.Explanations)
                    {
                        var anomaly = response.Anomalies.FirstOrDefault(a => a.TransactionId == explanation.TransactionId);
                        if (anomaly != null)
                        {
                            anomaly.Explanation = explanation.Explanation;
                        }
                    }
                    response.Summary.OverallInsight = aiResult.OverallInsight;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating AI explanations for anomalies");
                response.Summary.OverallInsight = "Anomalies detected. Review your high spending in the highlighted categories.";
            }
        }

        private class AiAnomalyResponse
        {
            public List<AiAnomalyExplanation> Explanations { get; set; } = new List<AiAnomalyExplanation>();
            public string OverallInsight { get; set; } = string.Empty;
        }

        private class AiAnomalyExplanation
        {
            public int TransactionId { get; set; }
            public string Explanation { get; set; } = string.Empty;
        }
    }
}
