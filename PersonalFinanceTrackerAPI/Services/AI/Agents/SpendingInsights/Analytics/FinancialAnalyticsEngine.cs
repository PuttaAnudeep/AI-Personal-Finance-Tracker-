using Microsoft.EntityFrameworkCore;
using PersonalFinanceTrackerAPI.Data;
using PersonalFinanceTrackerAPI.DTOs;
using PersonalFinanceTrackerAPI.Models;
using PersonalFinanceTrackerAPI.Services.Interfaces;
namespace PersonalFinanceTrackerAPI.Services.AI.Agents.SpendingInsights.Analytics
{
    public class FinancialAnalyticsEngine
    {
        private readonly ITransactionService _transactionService;
        private readonly FinanceTrackerDbContext _context;

        public FinancialAnalyticsEngine(
            ITransactionService transactionService,
            FinanceTrackerDbContext context)
        {
            _transactionService = transactionService;
            _context = context;
        }

        public async Task<FinancialMetrics> CalculateMetricsAsync(string userId, int months)
        {
            var endDate = DateTime.UtcNow;
            var startDate = endDate.AddMonths(-months);

            var transactions = await _transactionService.GetByDateRangeAsync(startDate, endDate, userId);

            return CalculateMetrics(transactions, months);
        }

        /// <summary>
        /// Computes financial metrics from an already-fetched list of transactions.
        /// Used by the budget goal service to avoid a second DB query.
        /// </summary>
        public FinancialMetrics CalculateMetricsAsync(IEnumerable<TransactionResponseDTO> transactions)
        {
            // Estimate months as actual span from data (max ~1 if only one calendar month)
            var list = transactions.ToList();
            var span = EstimateSpanMonths(list);
            return CalculateMetrics(list, span);
        }

        private static int EstimateSpanMonths(List<TransactionResponseDTO> transactions)
        {
            if (transactions == null || transactions.Count == 0) return 1;
            var first = transactions.Min(t => t.Date);
            var last = transactions.Max(t => t.Date);
            return Math.Max(1,
                (last.Year - first.Year) * 12 + (last.Month - first.Month) + 1);
        }

        private FinancialMetrics CalculateMetrics(List<TransactionResponseDTO>? transactions, int months)
        {
            if (transactions == null || transactions.Count == 0)
            {
                return new FinancialMetrics();
            }

            var metrics = new FinancialMetrics();
            var expenseTransactions = transactions.Where(t => t.Type == "Expense").ToList();
            var incomeTransactions = transactions.Where(t => t.Type == "Income").ToList();

            // Basic Metrics
            metrics.TotalIncome = incomeTransactions.Sum(t => t.Amount);
            metrics.TotalExpenses = expenseTransactions.Sum(t => t.Amount);
            metrics.NetSavings = metrics.TotalIncome - metrics.TotalExpenses;
            metrics.SavingsRate = metrics.TotalIncome > 0 ? (double)((metrics.NetSavings / metrics.TotalIncome) * 100) : 0;
            metrics.ExpenseToIncomeRatio = metrics.TotalIncome > 0 ? (double)((metrics.TotalExpenses / metrics.TotalIncome) * 100) : 0;

            // Category Breakdown
            metrics.CategoryBreakdown = expenseTransactions
                .GroupBy(t => t.Category)
                .Select(g => new CategoryMetric
                {
                    Category = g.Key,
                    Total = g.Sum(t => t.Amount),
                    Count = g.Count(),
                    Percentage = metrics.TotalExpenses > 0 ? (double)((g.Sum(t => t.Amount) / metrics.TotalExpenses) * 100) : 0
                })
                .OrderByDescending(c => c.Total)
                .ToList();

            // Top Spending Category
            var topCategory = metrics.CategoryBreakdown.FirstOrDefault();
            if (topCategory != null)
            {
                metrics.TopSpendingCategory = topCategory.Category;
                metrics.TopSpendingAmount = topCategory.Total;
            }

            // Transaction Metrics
            metrics.TotalTransactions = transactions.Count;
            metrics.AverageTransactionValue = expenseTransactions.Count > 0 
                ? expenseTransactions.Average(t => t.Amount) 
                : 0;
            metrics.HighestExpense = expenseTransactions.Any() 
                ? expenseTransactions.Max(t => t.Amount) 
                : 0;

            // Daily Spends
            metrics.DailySpends = expenseTransactions
                .GroupBy(t => t.Date.Date)
                .Select(g => g.Sum(t => t.Amount))
                .ToList();

            metrics.LargestDailySpend = metrics.DailySpends.Any() 
                ? metrics.DailySpends.Max() 
                : 0;

            // Monthly Breakdown
            metrics.MonthlyBreakdown = transactions
                .GroupBy(t => new { t.Date.Year, t.Date.Month })
                .Select(g => new MonthlyMetric
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    Income = g.Where(t => t.Type == "Income").Sum(t => t.Amount),
                    Expenses = g.Where(t => t.Type == "Expense").Sum(t => t.Amount),
                    NetSavings = g.Where(t => t.Type == "Income").Sum(t => t.Amount) - 
                                g.Where(t => t.Type == "Expense").Sum(t => t.Amount),
                    TransactionCount = g.Count()
                })
                .OrderByDescending(m => m.Year)
                .ThenByDescending(m => m.Month)
                .ToList();

            // Category Growth (month-over-month)
            metrics.CategoryGrowthRates = CalculateCategoryGrowth(expenseTransactions);

            // Recurring Expenses (simplified: categories with consistent spending)
            metrics.RecurringExpenseCount = metrics.CategoryBreakdown.Count(c => c.Count >= 3);
            metrics.RecurringExpenseTotal = metrics.CategoryBreakdown
                .Where(c => c.Count >= 3)
                .Sum(c => c.Total);

            // Spending Frequency (transactions per week)
            var weeks = months * 4;
            metrics.SpendingFrequency = weeks > 0 ? (int)Math.Round(expenseTransactions.Count / (double)weeks) : 0;

            return metrics;
        }

        private List<CategoryGrowth> CalculateCategoryGrowth(List<TransactionResponseDTO> expenses)
        {
            var growthRates = new List<CategoryGrowth>();
            
            var monthlyCategorySpending = expenses
                .GroupBy(t => new { t.Date.Year, t.Date.Month, t.Category })
                .Select(g => new
                {
                    g.Key.Year,
                    g.Key.Month,
                    g.Key.Category,
                    Total = g.Sum(t => t.Amount)
                })
                .OrderBy(x => x.Year)
                .ThenBy(x => x.Month)
                .ToList();

            var categoryGroups = monthlyCategorySpending.GroupBy(x => x.Category);
            
            foreach (var group in categoryGroups)
            {
                var ordered = group.OrderBy(x => x.Year).ThenBy(x => x.Month).ToList();
                
                if (ordered.Count >= 2)
                {
                    var current = ordered.Last();
                    var previous = ordered[ordered.Count - 2];
                    
                    var growthRate = previous.Total > 0 
                        ? ((current.Total - previous.Total) / previous.Total) * 100 
                        : 0;

                    growthRates.Add(new CategoryGrowth
                    {
                        Category = group.Key,
                        GrowthRate = (double)growthRate,
                        Period = "vs last month"
                    });
                }
            }

            return growthRates.OrderByDescending(g => Math.Abs(g.GrowthRate)).ToList();
        }
    }
}