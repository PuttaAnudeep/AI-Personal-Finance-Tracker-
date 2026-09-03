using System;
using System.Collections.Generic;
using System.Linq;
using PersonalFinanceTrackerAPI.Services.AI.Agents.BudgetGoalAssistant.DTOs;
using PersonalFinanceTrackerAPI.Services.AI.Agents.SpendingInsights.Analytics;

namespace PersonalFinanceTrackerAPI.Services.AI.Agents.BudgetGoalAssistant.Analytics
{
    /// <summary>
    /// Analyzes the gap between current savings and target savings goals.
    /// Single source of truth for feasibility scoring, category reductions,
    /// and unfeasible-goal what-if scenarios.
    /// </summary>
    public class GoalGapAnalysisEngine
    {
        public enum PlanType
        {
            Focused,
            Balanced
        }

        private const decimal MaxCategoryReductionPctFocused = 0.5m;

        /// <summary>
        /// Categories considered fixed/essential expenses that should NOT receive reduction recommendations.
        /// These are typically non-discretionary costs that cannot be easily reduced.
        /// </summary>
        private static readonly HashSet<string> FixedEssentialCategories = new(StringComparer.OrdinalIgnoreCase)
        {
            "Rent", "Housing", "Bills","Health","Food", "Medical", "Healthcare", "Insurance",
            "Utilities", "Fuel", "Transportation", "Groceries", "Savings","Education"
        };

        /// <summary>
        /// Determines if a category is a fixed essential expense (exact normalized match).
        /// </summary>
        public static bool IsFixedEssential(string category)
        {
            return FixedEssentialCategories.Contains(category.Trim().ToLowerInvariant());
        }

        /// <summary>
        /// Variable/discretionary expense categories that CAN receive reduction recommendations.
        /// This is an explicit whitelist — only these 6 categories will receive cut recommendations.
        /// </summary>
        private static readonly HashSet<string> ReducibleCategories = new(StringComparer.OrdinalIgnoreCase)
        {
            "Shopping", "Entertainment", "Dining", "Travel", "Other"
        };

        /// <summary>
        /// Determines if a category is a reducible (variable) expense (exact match against whitelist).
        /// </summary>
        public static bool IsReducible(string category)
        {
            return ReducibleCategories.Contains(category.Trim());
        }

        /// <summary>
        /// Maximum reduction percentages per category by plan type.
        /// Focused Plan: Aggressive cuts (50% across all categories)
        /// Balanced Plan: Sustainable cuts (category-specific lower limits)
        /// </summary>
        private static readonly Dictionary<string, Dictionary<PlanType, decimal>> CategoryMaxReductionPct = 
            new(StringComparer.OrdinalIgnoreCase)
        {
            { "Shopping", new() { { PlanType.Focused, 0.50m }, { PlanType.Balanced, 0.15m } } },
            { "Entertainment", new() { { PlanType.Focused, 0.50m }, { PlanType.Balanced, 0.10m } } },
            { "Dining", new() { { PlanType.Focused, 0.50m }, { PlanType.Balanced, 0.15m } } },
            { "Travel", new() { { PlanType.Focused, 0.50m }, { PlanType.Balanced, 0.15m } } },
            { "Other", new() { { PlanType.Focused, 0.50m }, { PlanType.Balanced, 0.15m } } }
        };

        /// <summary>
        /// Analyzes the savings gap and generates the full recommendation set:
        /// gap figures, feasibility score, category-wise reductions (plan-specific caps),
        /// and unfeasible-goal what-if scenarios.
        /// </summary>
        public GoalGapAnalysisResult AnalyzeGap(
            FinancialMetrics metrics,
            decimal targetSavings,
            int months,
            int actualSpanMonths,
            PlanType planType = PlanType.Focused)
        {
            var currentSavings = metrics.NetSavings;
            var monthlySavingsTarget = targetSavings / months;
            var requiredSavings = Math.Max(0, targetSavings - currentSavings);
            var savingsGap = requiredSavings / months; // Required monthly savings

            var result = new GoalGapAnalysisResult
            {
                TargetSavings = targetSavings,
                CurrentSavings = currentSavings,
                SavingsGap = savingsGap,
                MonthlySavingsTarget = monthlySavingsTarget,
                CurrentMonthlySavings = actualSpanMonths > 0
                    ? currentSavings / actualSpanMonths
                    : 0,
                Months = months,
                ActualSpanMonths = actualSpanMonths
            };

            // Calculate reductions across only the 5 whitelisted variable categories
            if (savingsGap > 0)
            {
                result.RequiredReductions = CalculateRequiredReductions(metrics, savingsGap, actualSpanMonths, planType);

                var totalPossibleCuts = result.RequiredReductions.Sum(r => (decimal)r.RequiredReduction);
                result.RemainingGapAfterCuts = totalPossibleCuts < savingsGap
                    ? savingsGap - totalPossibleCuts
                    : 0;
                result.IsUnfeasible = result.RemainingGapAfterCuts > 100.0m;
                result.ExpectedMonthlySavingsFromRecommendations = totalPossibleCuts;
                result.LifestyleImpact = CalculateLifestyleImpact(result.RequiredReductions, planType);
                result.PlanType = planType.ToString();

                if (result.IsUnfeasible)
                {
                    // What-if scenarios for unfeasible goals
                    result.RevisedTarget = currentSavings + (totalPossibleCuts * months);
                    result.IncomeGapNeeded = result.RemainingGapAfterCuts;
                    result.ExtendedTimelineNeeded = totalPossibleCuts > 0
                        ? (int)Math.Ceiling(requiredSavings / totalPossibleCuts)
                        : 0;
                }
            }
            else
            {
                result.RequiredReductions = new List<CategoryReductionTarget>();
            }

            // Feasibility label and score
            result.FeasibilityLabel = DetermineFeasibilityLabel(result);
            result.FeasibilityScore = DetermineFeasibilityScore(result);

            result.Insights = GenerateInsights(result);
            return result;
        }

        /// <summary>
        /// Determines the feasibility label: Achievable / Challenging / Not Achievable
        /// </summary>
        private static string DetermineFeasibilityLabel(GoalGapAnalysisResult result)
        {
            if (result.IsUnfeasible)
                return "Not Achievable";

            if (result.SavingsGap <= 0)
                return "Achievable";

            // Feasible but check if cuts are significant (>= 30% of variable spending)
            var totalCuts = result.RequiredReductions.Sum(r => (decimal)r.RequiredReduction);
            var totalVariableSpending = result.RequiredReductions.Sum(r => r.CurrentSpending);

            if (totalVariableSpending > 0 && totalCuts / totalVariableSpending >= 0.3m)
                return "Challenging";

            return "Achievable";
        }

        /// <summary>
        /// Determines feasibility score (0-100).
        /// </summary>
        private static double DetermineFeasibilityScore(GoalGapAnalysisResult result)
        {
            if (result.SavingsGap <= 0)
                return 100.0;

            if (result.IsUnfeasible)
                return 0.0;

            var totalCuts = result.RequiredReductions.Sum(r => (decimal)r.RequiredReduction);
            var totalVariableSpending = result.RequiredReductions.Sum(r => r.CurrentSpending);

            if (totalVariableSpending > 0 && totalCuts / totalVariableSpending >= 0.3m)
                return 50.0;

            return 80.0;
        }

        /// <summary>
        /// Calculates required reductions per reducible category, capped at plan-specific percentages.
        /// Only the 5 whitelisted categories participate. All figures are normalized to MONTHLY.
        /// </summary>
        private static List<CategoryReductionTarget> CalculateRequiredReductions(
            FinancialMetrics metrics,
            decimal savingsGap,
            int actualSpanMonths,
            PlanType planType)
        {
            var reductions = new List<CategoryReductionTarget>();

            // Filter to reducible categories only — explicit whitelist
            var reducibleCategories = metrics.CategoryBreakdown
                .Where(c => IsReducible(c.Category))
                .ToList();

            if (reducibleCategories.Count == 0)
                return reductions;

            var totalReducibleExpensesPeriod = reducibleCategories.Sum(c => c.Total);
            if (totalReducibleExpensesPeriod <= 0)
                return reductions;

            var totalReducibleExpensesMonthly = totalReducibleExpensesPeriod / actualSpanMonths;
            var totalReduction = 0m;

            foreach (var category in reducibleCategories)
            {
                if (totalReduction >= savingsGap)
                    break;

                // Convert period total to monthly
                var monthlyCategorySpend = category.Total / actualSpanMonths;
                var categoryWeight = (double)(monthlyCategorySpend / totalReducibleExpensesMonthly);
                var proportionalReduction = savingsGap * (decimal)categoryWeight;

                // Get plan-specific max reduction for this category
                var maxReductionPct = CategoryMaxReductionPct.TryGetValue(category.Category, out var planLimits)
                    ? planLimits.GetValueOrDefault(planType, MaxCategoryReductionPctFocused)
                    : MaxCategoryReductionPctFocused;
                
                var maxReduction = monthlyCategorySpend * maxReductionPct;
                var actualReduction = Math.Min(proportionalReduction, maxReduction);
                var newMonthlySpending = monthlyCategorySpend - actualReduction;
                var reductionPercentage = monthlyCategorySpend > 0
                    ? ((double)(actualReduction / monthlyCategorySpend)) * 100
                    : 0;

                reductions.Add(new CategoryReductionTarget
                {
                    Category = category.Category,
                    CurrentSpending = monthlyCategorySpend,
                    TargetSpending = newMonthlySpending,
                    RequiredReduction = actualReduction,
                    ReductionPercentage = reductionPercentage,
                    IsDiscretionary = true,
                    Priority = reductionPercentage > 30 ? "High" : reductionPercentage > 15 ? "Medium" : "Low"
                });

                totalReduction += actualReduction;
            }

            return reductions;
        }

        /// <summary>
        /// Calculates lifestyle impact based on total reduction percentage of variable spending and plan type.
        /// Balanced plans have more lenient thresholds since they're designed to be sustainable.
        /// </summary>
        private static string CalculateLifestyleImpact(List<CategoryReductionTarget> reductions, PlanType planType)
        {
            var totalCuts = reductions.Sum(r => (decimal)r.RequiredReduction);
            var totalVariableSpending = reductions.Sum(r => r.CurrentSpending);

            if (totalVariableSpending == 0)
                return "Minimal";

            var totalReductionPct = ((double)(totalCuts / totalVariableSpending)) * 100;
            Console.WriteLine($"Total Reduction %: {totalReductionPct:F2} for plan type {planType}");
            // Balanced plan: moderate cuts expected (sustainable lifestyle changes)
            // Focused plan: aggressive cuts expected (maximum savings priority)
            if (planType == PlanType.Balanced)
            {
                return totalReductionPct < 15 ? "Minimal" :
                       totalReductionPct < 25 ? "Moderate" :
                       "Significant";
            }
            else // Focused
            {
                return totalReductionPct < 25 ? "Minimal" :
                       totalReductionPct < 40 ? "Moderate" :
                       "Significant";
            }
        }

        /// <summary>
        /// Generates insights about the savings goal.
        /// </summary>
        private static List<string> GenerateInsights(GoalGapAnalysisResult result)
        {
            var insights = new List<string>();

            if (result.SavingsGap <= 0)
            {
                insights.Add($"✓ You're already on track to save ₹{result.CurrentSavings:F2} in {result.Months} months");
                insights.Add($"✓ Your current savings rate exceeds your target by ₹{Math.Abs(result.SavingsGap):F2}/month");
                return insights;
            }

            insights.Add($"⚠ You need to save an additional ₹{result.SavingsGap:F2}/month to reach your goal");
            insights.Add($"📅 You have {result.Months} months to achieve this goal");
            insights.Add($"📊 Based on {result.ActualSpanMonths} month(s) of transaction history");

            if (result.IsUnfeasible)
            {
                insights.Add("⚠️ This goal is not achievable by cutting variable expenses alone.");
                if (result.RevisedTarget != null)
                    insights.Add($"💡 A realistic target is ~₹{result.RevisedTarget:F2} in {result.Months} months.");
                if (result.IncomeGapNeeded != null && result.IncomeGapNeeded > 0)
                    insights.Add($"💰 You need ₹{result.IncomeGapNeeded:F2}/month more in income.");
                if (result.ExtendedTimelineNeeded != null && result.ExtendedTimelineNeeded > 0)
                    insights.Add($"⏳ Extending to {result.ExtendedTimelineNeeded} months would make the original target achievable.");
            }
            else
            {
                insights.Add("✅ This is achievable with cuts to discretionary spending.");
            }

            return insights;
        }
    }

    /// <summary>
    /// Result of goal gap analysis.
    /// </summary>
    public class GoalGapAnalysisResult
    {
        public decimal TargetSavings { get; set; }
        public decimal CurrentSavings { get; set; }
        /// <summary>Required monthly savings = (Target - Current) / months</summary>
        public decimal SavingsGap { get; set; }
        /// <summary>Monthly savings target = Target / months (display value)</summary>
        public decimal MonthlySavingsTarget { get; set; }
        public decimal CurrentMonthlySavings { get; set; }
        public int Months { get; set; }
        public int ActualSpanMonths { get; set; }
        public bool IsUnfeasible { get; set; }
        /// <summary>Feasibility label: "Achievable", "Challenging", or "Not Achievable"</summary>
        public string FeasibilityLabel { get; set; } = string.Empty;
        /// <summary>Feasibility score (0-100)</summary>
        public double FeasibilityScore { get; set; }
        public decimal RemainingGapAfterCuts { get; set; }
        public decimal? RevisedTarget { get; set; }
        public decimal? IncomeGapNeeded { get; set; }
        public int? ExtendedTimelineNeeded { get; set; }
        public List<string> Insights { get; set; } = new();
        public List<CategoryReductionTarget> RequiredReductions { get; set; } = new();
        public string PlanType { get; set; } = "Focused";
        public string LifestyleImpact { get; set; } = "Minimal";
        public decimal ExpectedMonthlySavingsFromRecommendations { get; set; }
    }

    /// <summary>
    /// Target reduction for a specific category.
    /// </summary>
    public class CategoryReductionTarget
    {
        public string Category { get; set; } = string.Empty;
        public decimal CurrentSpending { get; set; }
        public decimal TargetSpending { get; set; }
        public decimal RequiredReduction { get; set; }
        public double ReductionPercentage { get; set; }
        public bool IsDiscretionary { get; set; }
        public string Priority { get; set; } = "Medium";
    }
}
