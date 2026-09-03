using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PersonalFinanceTrackerAPI.Migrations.FinanceTrackerDb
{
    /// <inheritdoc />
    public partial class AddLifestyleImpactToBudgetGoalRecommendations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LifestyleImpact",
                table: "BudgetGoalRecommendations",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LifestyleImpact",
                table: "BudgetGoalRecommendations");
        }
    }
}
