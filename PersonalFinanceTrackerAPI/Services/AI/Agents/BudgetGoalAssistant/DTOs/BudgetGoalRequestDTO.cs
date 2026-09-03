using System.ComponentModel.DataAnnotations;

namespace PersonalFinanceTrackerAPI.Services.AI.Agents.BudgetGoalAssistant.DTOs
{
    public class BudgetGoalRequestDTO
    {
        [Range(1, 100_000_000)]
        public decimal TargetSavings { get; set; }

        [Range(1, 600)]
        public int Months { get; set; }

        /// <summary>
        /// Savings strategy: "Focused" (aggressive cuts) or "Balanced" (sustainable cuts).
        /// Defaults to "Focused" if not provided.
        /// </summary>
        public string PlanType { get; set; } = "Focused";
    }
}
