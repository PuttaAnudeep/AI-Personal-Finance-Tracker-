using Microsoft.EntityFrameworkCore;
using PersonalFinanceTrackerAPI.Models;

namespace PersonalFinanceTrackerAPI.Data
{
    public class FinanceTrackerDbContext
        : DbContext
    {
        public FinanceTrackerDbContext(
                DbContextOptions<FinanceTrackerDbContext> options)
                : base(options)
        {
        }

        public DbSet<TransactionModel> Transactions { get; set; }

        // AI Feature Tables
        public DbSet<AIAnalysisRunModel> AIAnalysisRuns { get; set; }
        public DbSet<AIInsightModel> AIInsights { get; set; }
        public DbSet<BudgetGoalRecommendationModel> BudgetGoalRecommendations { get; set; }
        public DbSet<BudgetGoalRecommendationItemModel> BudgetGoalRecommendationItems { get; set; }
        public DbSet<AnomalyDetectionResultModel> AnomalyDetectionResults { get; set; }
        public DbSet<AnomalyDetailModel> AnomalyDetails { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ========================================
            // AIAnalysisRuns
            // ========================================
            modelBuilder.Entity<AIAnalysisRunModel>(entity =>
            {
                entity.ToTable("AIAnalysisRuns");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UserId).HasMaxLength(450).IsRequired();
                entity.Property(e => e.AgentType).HasMaxLength(50).IsRequired();
                entity.Property(e => e.AgentVersion).HasMaxLength(20).IsRequired();
                entity.Property(e => e.GeneratedAt).IsRequired();
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();

                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => new { e.UserId, e.AgentType });
            });

            // ========================================
            // AIInsights
            // ========================================
            modelBuilder.Entity<AIInsightModel>(entity =>
            {
                entity.ToTable("AIInsights");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UserId).HasMaxLength(450).IsRequired();
                entity.Property(e => e.Type).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Category).HasMaxLength(100).IsRequired();

                // SQL Server:
                // entity.Property(e => e.Insight).HasColumnType("nvarchar(max)").IsRequired();

                // PostgreSQL:
                entity.Property(e => e.Insight).HasColumnType("text").IsRequired();

                entity.Property(e => e.GeneratedAt).IsRequired();
                entity.Property(e => e.Source).HasMaxLength(50).IsRequired();
                entity.Property(e => e.AgentVersion).HasMaxLength(20).IsRequired();
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();

                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => new { e.UserId, e.Type });

                entity.HasOne(e => e.AnalysisRun)
                      .WithMany()
                      .HasForeignKey(e => e.AnalysisRunId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // ========================================
            // BudgetGoalRecommendations
            // ========================================
            modelBuilder.Entity<BudgetGoalRecommendationModel>(entity =>
            {
                entity.ToTable("BudgetGoalRecommendations");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UserId).HasMaxLength(450).IsRequired();
                entity.Property(e => e.TargetSavings).HasColumnType("decimal(18,2)").IsRequired();
                entity.Property(e => e.CurrentSavings).HasColumnType("decimal(18,2)").IsRequired();
                entity.Property(e => e.SavingsGap).HasColumnType("decimal(18,2)").IsRequired();
                entity.Property(e => e.MonthlySavingsTarget).HasColumnType("decimal(18,2)").IsRequired();
                entity.Property(e => e.CurrentMonthlySavings).HasColumnType("decimal(18,2)").IsRequired();
                entity.Property(e => e.RemainingGapAfterCuts).HasColumnType("decimal(18,2)");
                entity.Property(e => e.RevisedTarget).HasColumnType("decimal(18,2)");
                entity.Property(e => e.IncomeGapNeeded).HasColumnType("decimal(18,2)");
                entity.Property(e => e.FeasibilityLabel).HasMaxLength(50).IsRequired();
                entity.Property(e => e.DataConfidence).HasMaxLength(20).IsRequired();

                // SQL Server:
                // entity.Property(e => e.ActionPlanJson).HasColumnType("nvarchar(max)");

                // PostgreSQL:
                entity.Property(e => e.ActionPlanJson).HasColumnType("text");

                entity.Property(e => e.FinalMessage).HasMaxLength(500);
                entity.Property(e => e.TrackingMethod).HasMaxLength(500);
                entity.Property(e => e.GeneratedAt).IsRequired();
                entity.Property(e => e.AgentVersion).HasMaxLength(20).IsRequired();
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();

                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => new { e.UserId, e.IsActive });

                entity.HasOne(e => e.AnalysisRun)
                      .WithMany()
                      .HasForeignKey(e => e.AnalysisRunId)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasMany(e => e.Items)
                      .WithOne(e => e.Recommendation)
                      .HasForeignKey(e => e.RecommendationId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ========================================
            // BudgetGoalRecommendationItems
            // ========================================
            modelBuilder.Entity<BudgetGoalRecommendationItemModel>(entity =>
            {
                entity.ToTable("BudgetGoalRecommendationItems");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Category).HasMaxLength(100).IsRequired();
                entity.Property(e => e.CurrentSpending).HasColumnType("decimal(18,2)").IsRequired();
                entity.Property(e => e.RecommendedSpending).HasColumnType("decimal(18,2)").IsRequired();
                entity.Property(e => e.ReductionAmount).HasColumnType("decimal(18,2)").IsRequired();
                entity.Property(e => e.Reason).HasMaxLength(500);
                entity.Property(e => e.Priority).HasMaxLength(20).IsRequired();
                entity.Property(e => e.AgentVersion).HasMaxLength(20).IsRequired();
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();
            });

            // ========================================
            // AnomalyDetectionResults
            // ========================================
            modelBuilder.Entity<AnomalyDetectionResultModel>(entity =>
            {
                entity.ToTable("AnomalyDetectionResults");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UserId).HasMaxLength(450).IsRequired();
                entity.Property(e => e.GeneratedAt).IsRequired();

                // SQL Server:
                // entity.Property(e => e.OverallInsight).HasColumnType("nvarchar(max)");

                // PostgreSQL:
                entity.Property(e => e.OverallInsight).HasColumnType("text");

                entity.Property(e => e.AgentVersion).HasMaxLength(20).IsRequired();
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();

                entity.HasIndex(e => e.UserId);

                entity.HasOne(e => e.AnalysisRun)
                      .WithMany()
                      .HasForeignKey(e => e.AnalysisRunId)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasMany(e => e.AnomalyDetails)
                      .WithOne(e => e.AnomalyResult)
                      .HasForeignKey(e => e.AnomalyResultId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ========================================
            // AnomalyDetails
            // ========================================
            modelBuilder.Entity<AnomalyDetailModel>(entity =>
            {
                entity.ToTable("AnomalyDetails");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Category).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Amount).HasColumnType("decimal(18,2)").IsRequired();
                entity.Property(e => e.AverageForCategory).HasColumnType("decimal(18,2)").IsRequired();
                entity.Property(e => e.Severity).HasMaxLength(20).IsRequired();

                // SQL Server:
                // entity.Property(e => e.Explanation).HasColumnType("nvarchar(max)");

                // PostgreSQL:
                entity.Property(e => e.Explanation).HasColumnType("text");

                entity.Property(e => e.AnomalyType).HasMaxLength(50).IsRequired();
                entity.Property(e => e.AgentVersion).HasMaxLength(20).IsRequired();
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();
            });
        }
    }
}