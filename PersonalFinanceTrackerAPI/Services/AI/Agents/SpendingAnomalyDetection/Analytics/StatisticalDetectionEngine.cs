using System;
using System.Collections.Generic;
using System.Linq;
using PersonalFinanceTrackerAPI.Services.AI.Agents.SpendingAnomalyDetection.DTOs;

namespace PersonalFinanceTrackerAPI.Services.AI.Agents.SpendingAnomalyDetection.Analytics
{
    /// <summary>
    /// Statistical engine for detecting spending anomalies using various statistical methods
    /// </summary>
    public class StatisticalDetectionEngine
    {
        /// <summary>
        /// Detects anomalies using multiple statistical methods
        /// </summary>
        public List<Anomaly> DetectAnomalies(List<TransactionData> transactions, double threshold = 2.0)
        {
            var anomalies = new List<Anomaly>();

            if (transactions == null || transactions.Count < 3)
                return anomalies;

            // Group transactions by category
            var categoryGroups = transactions
                .GroupBy(t => t.Category)
                .ToDictionary(g => g.Key, g => g.ToList());

            foreach (var category in categoryGroups)
            {
                var categoryTransactions = category.Value;
                if (categoryTransactions.Count < 2)
                    continue;

                var amounts = categoryTransactions.Select(t => (double)t.Amount).ToList();
                var mean = amounts.Average();
                var stdDev = CalculateStandardDeviation(amounts, mean);

                if (stdDev == 0)
                    continue;

                foreach (var transaction in categoryTransactions)
                {
                    var amountDouble = (double)transaction.Amount;
                    var zScore = stdDev > 0 ? (amountDouble - mean) / stdDev : 0;
                    var deviationPercentage = mean > 0 ? ((amountDouble - mean) / mean) * 100 : 0;

                    // Detect spike anomaly
                    if (zScore > threshold)
                    {
                        anomalies.Add(new Anomaly
                        {
                            TransactionId = transaction.Id,
                            Date = transaction.Date,
                            Category = transaction.Category,
                            Amount = transaction.Amount,
                            AverageForCategory = (decimal)mean,
                            DeviationPercentage = deviationPercentage,
                            Severity = zScore > 3.0 ? "High" : zScore > 2.5 ? "Medium" : "Low",
                            Explanation = GenerateSpikeExplanation(transaction.Amount, (decimal)mean, deviationPercentage),
                            AnomalyType = "Spike"
                        });
                    }
                    // Detect unusual category pattern
                    else if (IsUnusualCategorySpend(categoryTransactions, transaction, mean))
                    {
                        anomalies.Add(new Anomaly
                        {
                            TransactionId = transaction.Id,
                            Date = transaction.Date,
                            Category = transaction.Category,
                            Amount = transaction.Amount,
                            AverageForCategory = (decimal)mean,
                            DeviationPercentage = deviationPercentage,
                            Severity = "Medium",
                            Explanation = GenerateUnusualCategoryExplanation(transaction, mean),
                            AnomalyType = "UnusualCategory"
                        });
                    }
                }
            }

            // Detect duplicate transactions
            var duplicates = DetectDuplicates(transactions);
            anomalies.AddRange(duplicates);

            return anomalies.OrderByDescending(a => a.DeviationPercentage).ToList();
        }

        /// <summary>
        /// Calculates standard deviation for a set of values
        /// </summary>
        private double CalculateStandardDeviation(List<double> values, double mean)
        {
            if (values.Count < 2)
                return 0;

            var sumSquaredDifferences = values.Sum(v => Math.Pow(v - mean, 2));
            return Math.Sqrt(sumSquaredDifferences / values.Count);
        }

        /// <summary>
        /// Detects if a transaction is unusually high compared to category history
        /// </summary>
        private bool IsUnusualCategorySpend(List<TransactionData> categoryTransactions, TransactionData current, double mean)
        {
            // If this is the highest transaction and significantly above average
            var maxTransaction = categoryTransactions.Max(t => t.Amount);
            return current.Amount == maxTransaction && 
                   current.Amount > (decimal)mean * 1.5m &&
                   categoryTransactions.Count >= 4;
        }

        /// <summary>
        /// Detects potential duplicate transactions
        /// </summary>
        private List<Anomaly> DetectDuplicates(List<TransactionData> transactions)
        {
            var duplicates = new List<Anomaly>();
            var groupedByAmountAndCategory = transactions
                .GroupBy(t => new { t.Category, t.Amount, t.Date.Date })
                .Where(g => g.Count() > 1);

            foreach (var group in groupedByAmountAndCategory)
            {
                var transactionsInGroup = group.ToList();
                var avgAmount = transactionsInGroup.Average(t => t.Amount);

                for (int i = 1; i < transactionsInGroup.Count; i++)
                {
                    duplicates.Add(new Anomaly
                    {
                        TransactionId = transactionsInGroup[i].Id,
                        Date = transactionsInGroup[i].Date,
                        Category = transactionsInGroup[i].Category,
                        Amount = transactionsInGroup[i].Amount,
                        AverageForCategory = (decimal)avgAmount,
                        DeviationPercentage = 0,
                        Severity = "Low",
                        Explanation = $"Possible duplicate: Same amount and category as another transaction on the same day",
                        AnomalyType = "Duplicate"
                    });
                }
            }

            return duplicates;
        }

        /// <summary>
        /// Generates explanation for spike anomaly
        /// </summary>
        private string GenerateSpikeExplanation(decimal amount, decimal average, double deviationPercentage)
        {
            return deviationPercentage > 100 
                ? $"Spending is {deviationPercentage:F1}% higher than category average. This is significantly higher than your typical ₹{average:F2} spend."
                : $"Spending is {deviationPercentage:F1}% above category average of ₹{average:F2}.";
        }

        /// <summary>
        /// Generates explanation for unusual category spending
        /// </summary>
        private string GenerateUnusualCategoryExplanation(TransactionData transaction, double mean)
        {
            return $"This is the highest transaction in {transaction.Category} category. Consider if this was expected or if it needs review.";
        }

        /// <summary>
        /// Generates summary of detected anomalies
        /// </summary>
        public AnomalySummary GenerateSummary(List<Anomaly> anomalies)
        {
            return new AnomalySummary
            {
                TotalAnomaliesFound = anomalies.Count,
                HighSeverityCount = anomalies.Count(a => a.Severity == "High"),
                MediumSeverityCount = anomalies.Count(a => a.Severity == "Medium"),
                LowSeverityCount = anomalies.Count(a => a.Severity == "Low"),
                OverallInsight = GenerateOverallInsight(anomalies)
            };
        }

        /// <summary>
        /// Generates overall insight based on detected anomalies
        /// </summary>
        private string GenerateOverallInsight(List<Anomaly> anomalies)
        {
            if (anomalies.Count == 0)
                return "No unusual spending patterns detected. Your spending appears consistent with your historical patterns.";

            var highCount = anomalies.Count(a => a.Severity == "High");
            var categories = anomalies.Select(a => a.Category).Distinct().ToList();

            if (highCount > 0)
            {
                return $"Found {highCount} high-severity anomalies in {string.Join(", ", categories.Take(3))}. Review these transactions to ensure they were intentional and expected.";
            }

            return $"Found {anomalies.Count} anomalies across {categories.Count} categories. Most are minor deviations from your typical spending patterns.";
        }
    }

    /// <summary>
    /// Transaction data for statistical analysis
    /// </summary>
    public class TransactionData
    {
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public string Category { get; set; } = string.Empty;
        public decimal Amount { get; set; }
    }
}