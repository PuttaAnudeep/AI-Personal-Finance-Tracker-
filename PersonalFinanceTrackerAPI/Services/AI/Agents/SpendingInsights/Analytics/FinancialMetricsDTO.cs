namespace PersonalFinanceTrackerAPI.Services.AI.Agents.SpendingInsights.Analytics
{
    public class FinancialMetrics
    {
        // Basic Metrics
        public decimal TotalIncome { get; set; }
        public decimal TotalExpenses { get; set; }
        public decimal NetSavings { get; set; }
        public double SavingsRate { get; set; }
        public double ExpenseToIncomeRatio { get; set; }
        
        // Category Breakdown
        public List<CategoryMetric> CategoryBreakdown { get; set; } = new();
        
        // Top Categories
        public string? TopSpendingCategory { get; set; }
        public decimal TopSpendingAmount { get; set; }
        
        // Transaction Metrics
        public int TotalTransactions { get; set; }
        public decimal AverageTransactionValue { get; set; }
        public decimal HighestExpense { get; set; }
        public decimal LargestDailySpend { get; set; }
        
        // Time-based Metrics
        public List<MonthlyMetric> MonthlyBreakdown { get; set; } = new();
        public List<CategoryGrowth> CategoryGrowthRates { get; set; } = new();
        
        // Advanced Metrics
        public int RecurringExpenseCount { get; set; }
        public decimal RecurringExpenseTotal { get; set; }
        public int SpendingFrequency { get; set; }
        public List<decimal> DailySpends { get; set; } = new();
    }

    public class CategoryMetric
    {
        public string Category { get; set; } = string.Empty;
        public decimal Total { get; set; }
        public int Count { get; set; }
        public double Percentage { get; set; }
    }

    public class MonthlyMetric
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public decimal Income { get; set; }
        public decimal Expenses { get; set; }
        public decimal NetSavings { get; set; }
        public int TransactionCount { get; set; }
    }

    public class CategoryGrowth
    {
        public string Category { get; set; } = string.Empty;
        public double GrowthRate { get; set; }
        public string Period { get; set; } = string.Empty;
    }
}