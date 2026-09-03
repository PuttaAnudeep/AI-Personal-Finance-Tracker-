using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PersonalFinanceTrackerAPI.Migrations.FinanceTrackerDb
{
    /// <inheritdoc />
    public partial class AddPlanTypeToBudgetGoalRecommendations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PlanType",
                table: "BudgetGoalRecommendations",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PlanType",
                table: "BudgetGoalRecommendations");
        }
    }
}
