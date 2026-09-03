using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PersonalFinanceTrackerAPI.Migrations.FinanceTrackerDb
{
    /// <inheritdoc />
    public partial class AddAIFeatureTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AIAnalysisRuns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    AgentType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    GeneratedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AgentVersion = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsArchived = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AIAnalysisRuns", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AIInsights",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Insight = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GeneratedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Months = table.Column<int>(type: "int", nullable: false),
                    Source = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    AnalysisRunId = table.Column<int>(type: "int", nullable: true),
                    IsArchived = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AgentVersion = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AIInsights", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AIInsights_AIAnalysisRuns_AnalysisRunId",
                        column: x => x.AnalysisRunId,
                        principalTable: "AIAnalysisRuns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "AnomalyDetectionResults",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    GeneratedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Months = table.Column<int>(type: "int", nullable: false),
                    Threshold = table.Column<double>(type: "float", nullable: false),
                    TotalAnomaliesFound = table.Column<int>(type: "int", nullable: false),
                    HighSeverityCount = table.Column<int>(type: "int", nullable: false),
                    MediumSeverityCount = table.Column<int>(type: "int", nullable: false),
                    LowSeverityCount = table.Column<int>(type: "int", nullable: false),
                    OverallInsight = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AnalysisRunId = table.Column<int>(type: "int", nullable: true),
                    IsArchived = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AgentVersion = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnomalyDetectionResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AnomalyDetectionResults_AIAnalysisRuns_AnalysisRunId",
                        column: x => x.AnalysisRunId,
                        principalTable: "AIAnalysisRuns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "BudgetGoalRecommendations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    TargetSavings = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CurrentSavings = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SavingsGap = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MonthlySavingsTarget = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CurrentMonthlySavings = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    FeasibilityScore = table.Column<double>(type: "float", nullable: false),
                    FeasibilityLabel = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DataConfidence = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RemainingGapAfterCuts = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    RevisedTarget = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    IncomeGapNeeded = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ExtendedTimelineNeeded = table.Column<int>(type: "int", nullable: true),
                    Months = table.Column<int>(type: "int", nullable: false),
                    GeneratedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ActionPlanJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FinalMessage = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    TrackingMethod = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    AnalysisRunId = table.Column<int>(type: "int", nullable: true),
                    IsArchived = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AgentVersion = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BudgetGoalRecommendations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BudgetGoalRecommendations_AIAnalysisRuns_AnalysisRunId",
                        column: x => x.AnalysisRunId,
                        principalTable: "AIAnalysisRuns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "AnomalyDetails",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AnomalyResultId = table.Column<int>(type: "int", nullable: false),
                    TransactionId = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    AverageForCategory = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DeviationPercentage = table.Column<double>(type: "float", nullable: false),
                    Severity = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Explanation = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AnomalyType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AgentVersion = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnomalyDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AnomalyDetails_AnomalyDetectionResults_AnomalyResultId",
                        column: x => x.AnomalyResultId,
                        principalTable: "AnomalyDetectionResults",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BudgetGoalRecommendationItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RecommendationId = table.Column<int>(type: "int", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CurrentSpending = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    RecommendedSpending = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ReductionAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Priority = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AgentVersion = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BudgetGoalRecommendationItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BudgetGoalRecommendationItems_BudgetGoalRecommendations_RecommendationId",
                        column: x => x.RecommendationId,
                        principalTable: "BudgetGoalRecommendations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AIAnalysisRuns_UserId",
                table: "AIAnalysisRuns",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AIAnalysisRuns_UserId_AgentType",
                table: "AIAnalysisRuns",
                columns: new[] { "UserId", "AgentType" });

            migrationBuilder.CreateIndex(
                name: "IX_AIInsights_AnalysisRunId",
                table: "AIInsights",
                column: "AnalysisRunId");

            migrationBuilder.CreateIndex(
                name: "IX_AIInsights_UserId",
                table: "AIInsights",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AIInsights_UserId_Type",
                table: "AIInsights",
                columns: new[] { "UserId", "Type" });

            migrationBuilder.CreateIndex(
                name: "IX_AnomalyDetails_AnomalyResultId",
                table: "AnomalyDetails",
                column: "AnomalyResultId");

            migrationBuilder.CreateIndex(
                name: "IX_AnomalyDetectionResults_AnalysisRunId",
                table: "AnomalyDetectionResults",
                column: "AnalysisRunId");

            migrationBuilder.CreateIndex(
                name: "IX_AnomalyDetectionResults_UserId",
                table: "AnomalyDetectionResults",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_BudgetGoalRecommendationItems_RecommendationId",
                table: "BudgetGoalRecommendationItems",
                column: "RecommendationId");

            migrationBuilder.CreateIndex(
                name: "IX_BudgetGoalRecommendations_AnalysisRunId",
                table: "BudgetGoalRecommendations",
                column: "AnalysisRunId");

            migrationBuilder.CreateIndex(
                name: "IX_BudgetGoalRecommendations_UserId",
                table: "BudgetGoalRecommendations",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_BudgetGoalRecommendations_UserId_IsActive",
                table: "BudgetGoalRecommendations",
                columns: new[] { "UserId", "IsActive" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AIInsights");

            migrationBuilder.DropTable(
                name: "AnomalyDetails");

            migrationBuilder.DropTable(
                name: "BudgetGoalRecommendationItems");

            migrationBuilder.DropTable(
                name: "AnomalyDetectionResults");

            migrationBuilder.DropTable(
                name: "BudgetGoalRecommendations");

            migrationBuilder.DropTable(
                name: "AIAnalysisRuns");
        }
    }
}
