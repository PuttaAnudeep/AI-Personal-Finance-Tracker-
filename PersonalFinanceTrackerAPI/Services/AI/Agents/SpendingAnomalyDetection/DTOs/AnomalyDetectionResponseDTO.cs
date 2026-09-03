using System;
using System.Collections.Generic;

namespace PersonalFinanceTrackerAPI.Services.AI.Agents.SpendingAnomalyDetection.DTOs
{
    public class AnomalyDetectionResponseDTO
    {
        public List<Anomaly> Anomalies { get; set; } = new List<Anomaly>();
        public AnomalySummary Summary { get; set; } = new AnomalySummary();
    }

    public class Anomaly
    {
        public int TransactionId { get; set; }
        public DateTime Date { get; set; }
        public string Category { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public decimal AverageForCategory { get; set; }
        public double DeviationPercentage { get; set; }
        public string Severity { get; set; } = string.Empty; // Low, Medium, High
        public string Explanation { get; set; } = string.Empty;
        public string AnomalyType { get; set; } = "Spike"; // Spike, UnusualCategory, Duplicate, PatternBreak
    }

    public class AnomalySummary
    {
        public int TotalAnomaliesFound { get; set; }
        public int HighSeverityCount { get; set; }
        public int MediumSeverityCount { get; set; }
        public int LowSeverityCount { get; set; }
        public string OverallInsight { get; set; } = string.Empty;
    }
}
