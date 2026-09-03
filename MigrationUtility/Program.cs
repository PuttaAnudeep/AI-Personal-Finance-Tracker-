using Microsoft.Data.SqlClient;
using Npgsql;
using NpgsqlTypes;

internal class Program
{
    private static string AuthSqlServerConnection = string.Empty;
    private static string FinanceSqlServerConnection = string.Empty;
    private static string NeonConnectionString = string.Empty;

    private static async Task Main()
    {
        Console.WriteLine("============================================================");
        Console.WriteLine("     SQL Server LocalDB -> Neon PostgreSQL Migration");
        Console.WriteLine("============================================================");
        Console.WriteLine();

        try
        {
            LoadConfiguration();

            await TestConnectionsAsync();

            Console.WriteLine();
            Console.WriteLine("All connections successful.");
            Console.WriteLine();

            // IMPORTANT:
            // We first check whether Neon already contains data.
            await CheckDestinationIsReadyAsync();

            Console.WriteLine();
            Console.WriteLine("Starting migration...");
            Console.WriteLine();

            // ------------------------------------------------
            // AUTH
            // ------------------------------------------------
            await MigrateAspNetUsersAsync();

            // ------------------------------------------------
            // FINANCE
            // ------------------------------------------------
            await MigrateTransactionsAsync();
            await MigrateAIAnalysisRunsAsync();
            await MigrateAIInsightsAsync();
            await MigrateBudgetGoalRecommendationsAsync();
            await MigrateBudgetGoalRecommendationItemsAsync();
            await MigrateAnomalyDetectionResultsAsync();
            await MigrateAnomalyDetailsAsync();

            // ------------------------------------------------
            // SEQUENCES
            // ------------------------------------------------
            await ResetIdentitySequencesAsync();

            // ------------------------------------------------
            // VERIFY
            // ------------------------------------------------
            Console.WriteLine();
            await VerifyCountsAsync();

            Console.WriteLine();
            Console.WriteLine("============================================================");
            Console.WriteLine("              MIGRATION COMPLETED");
            Console.WriteLine("============================================================");
        }
        catch (Exception ex)
        {
            Console.WriteLine();
            Console.WriteLine("============================================================");
            Console.WriteLine("              MIGRATION FAILED");
            Console.WriteLine("============================================================");
            Console.WriteLine();
            Console.WriteLine(ex);
        }
    }

    // ========================================================
    // CONFIGURATION
    // ========================================================

    private static void LoadConfiguration()
    {
        string projectDirectory = AppContext.BaseDirectory;

        string configPath = "C:/Users/putta.anudeep/Documents/MyProjects/excercise/PersonalFinanceTracker/MigrationUtility/appsettings.json";

        if (!File.Exists(configPath))
        {
            throw new FileNotFoundException(
                $"Configuration file not found: {configPath}");
        }

        string json = File.ReadAllText(configPath);

        using var document =
            System.Text.Json.JsonDocument.Parse(json);

        var connectionStrings =
            document.RootElement
                .GetProperty("ConnectionStrings");

        AuthSqlServerConnection =
            connectionStrings
                .GetProperty("AuthCon")
                .GetString()
                ?? throw new InvalidOperationException(
                    "AuthSqlServer connection string missing.");

        FinanceSqlServerConnection =
            connectionStrings
                .GetProperty("FinanceTrackerCon")
                .GetString()
                ?? throw new InvalidOperationException(
                    "FinanceSqlServer connection string missing.");

        NeonConnectionString =
            connectionStrings
                .GetProperty("Neon")
                .GetString()
                ?? throw new InvalidOperationException(
                    "Neon connection string missing.");
    }

    // ========================================================
    // CONNECTION TEST
    // ========================================================

    private static async Task TestConnectionsAsync()
    {
        Console.WriteLine("[1] Testing SQL Server Auth database...");

        await using (var connection =
            new SqlConnection(AuthSqlServerConnection))
        {
            await connection.OpenAsync();

            Console.WriteLine(
                "    SQL Server Auth: CONNECTED");
        }

        Console.WriteLine("[2] Testing SQL Server Finance database...");

        await using (var connection =
            new SqlConnection(FinanceSqlServerConnection))
        {
            await connection.OpenAsync();

            Console.WriteLine(
                "    SQL Server Finance: CONNECTED");
        }

        Console.WriteLine("[3] Testing Neon PostgreSQL...");

        await using (var connection =
            new NpgsqlConnection(NeonConnectionString))
        {
            await connection.OpenAsync();

            Console.WriteLine(
                "    Neon PostgreSQL: CONNECTED");
        }
    }

    // ========================================================
    // CHECK NEON
    // ========================================================

    private static async Task CheckDestinationIsReadyAsync()
    {
        Console.WriteLine("[4] Checking Neon destination...");

        await using var connection =
            new NpgsqlConnection(NeonConnectionString);

        await connection.OpenAsync();

        string[] tables =
        {
            "AspNetUsers",
            "Transactions",
            "AIAnalysisRuns",
            "AIInsights",
            "BudgetGoalRecommendations",
            "BudgetGoalRecommendationItems",
            "AnomalyDetectionResults",
            "AnomalyDetails"
        };

        foreach (var table in tables)
        {
            string sql =
                $"SELECT COUNT(*) FROM \"{table}\";";

            await using var command =
                new NpgsqlCommand(sql, connection);

            long count =
                Convert.ToInt64(await command.ExecuteScalarAsync());

            Console.WriteLine(
                $"    {table}: {count} rows");
        }

        Console.WriteLine();
        Console.WriteLine(
            "    NOTE: If any destination table already contains");
        Console.WriteLine(
            "    data, stop before migration to avoid duplicates.");
    }

    // ========================================================
    // ASP.NET USERS
    // ========================================================

    private static async Task MigrateAspNetUsersAsync()
    {
        Console.WriteLine(
            "[5] Migrating AspNetUsers...");

        await using var sqlConnection =
            new SqlConnection(AuthSqlServerConnection);

        await sqlConnection.OpenAsync();

        await using var neonConnection =
            new NpgsqlConnection(NeonConnectionString);

        await neonConnection.OpenAsync();

        await using var sqlCommand =
            new SqlCommand(
                """
                SELECT
                    Id,
                    UserName,
                    NormalizedUserName,
                    Email,
                    NormalizedEmail,
                    EmailConfirmed,
                    PasswordHash,
                    SecurityStamp,
                    ConcurrencyStamp,
                    PhoneNumber,
                    PhoneNumberConfirmed,
                    TwoFactorEnabled,
                    LockoutEnd,
                    LockoutEnabled,
                    AccessFailedCount
                FROM AspNetUsers
                ORDER BY Id
                """,
                sqlConnection);

        await using var reader =
            await sqlCommand.ExecuteReaderAsync();

        await using var transaction =
            await neonConnection.BeginTransactionAsync();

        int count = 0;

        while (await reader.ReadAsync())
        {
            await using var command =
                new NpgsqlCommand(
                    """
                    INSERT INTO "AspNetUsers"
                    (
                        "Id",
                        "UserName",
                        "NormalizedUserName",
                        "Email",
                        "NormalizedEmail",
                        "EmailConfirmed",
                        "PasswordHash",
                        "SecurityStamp",
                        "ConcurrencyStamp",
                        "PhoneNumber",
                        "PhoneNumberConfirmed",
                        "TwoFactorEnabled",
                        "LockoutEnd",
                        "LockoutEnabled",
                        "AccessFailedCount"
                    )
                    VALUES
                    (
                        @Id,
                        @UserName,
                        @NormalizedUserName,
                        @Email,
                        @NormalizedEmail,
                        @EmailConfirmed,
                        @PasswordHash,
                        @SecurityStamp,
                        @ConcurrencyStamp,
                        @PhoneNumber,
                        @PhoneNumberConfirmed,
                        @TwoFactorEnabled,
                        @LockoutEnd,
                        @LockoutEnabled,
                        @AccessFailedCount
                    );
                    """,
                    neonConnection,
                    transaction);

            AddStringParameter(
                command,
                "@Id",
                reader,
                "Id",
                NpgsqlDbType.Varchar);

            AddStringParameter(
                command,
                "@UserName",
                reader,
                "UserName",
                NpgsqlDbType.Varchar);

            AddStringParameter(
                command,
                "@NormalizedUserName",
                reader,
                "NormalizedUserName",
                NpgsqlDbType.Varchar);

            AddStringParameter(
                command,
                "@Email",
                reader,
                "Email",
                NpgsqlDbType.Varchar);

            AddStringParameter(
                command,
                "@NormalizedEmail",
                reader,
                "NormalizedEmail",
                NpgsqlDbType.Varchar);

            AddBoolParameter(
                command,
                "@EmailConfirmed",
                reader,
                "EmailConfirmed");

            AddStringParameter(
                command,
                "@PasswordHash",
                reader,
                "PasswordHash",
                NpgsqlDbType.Text);

            AddStringParameter(
                command,
                "@SecurityStamp",
                reader,
                "SecurityStamp",
                NpgsqlDbType.Text);

            AddStringParameter(
                command,
                "@ConcurrencyStamp",
                reader,
                "ConcurrencyStamp",
                NpgsqlDbType.Text);

            AddStringParameter(
                command,
                "@PhoneNumber",
                reader,
                "PhoneNumber",
                NpgsqlDbType.Text);

            AddBoolParameter(
                command,
                "@PhoneNumberConfirmed",
                reader,
                "PhoneNumberConfirmed");

            AddBoolParameter(
                command,
                "@TwoFactorEnabled",
                reader,
                "TwoFactorEnabled");

            AddNullableDateTimeOffsetParameter(
                command,
                "@LockoutEnd",
                reader,
                "LockoutEnd");

            AddBoolParameter(
                command,
                "@LockoutEnabled",
                reader,
                "LockoutEnabled");

            AddIntParameter(
                command,
                "@AccessFailedCount",
                reader,
                "AccessFailedCount");

            await command.ExecuteNonQueryAsync();

            count++;
        }

        await transaction.CommitAsync();

        Console.WriteLine(
            $"    AspNetUsers migrated: {count}");
    }

    // ========================================================
    // TRANSACTIONS
    // ========================================================

    private static async Task MigrateTransactionsAsync()
    {
        Console.WriteLine(
            "[6] Migrating Transactions...");

        await using var sqlConnection =
            new SqlConnection(FinanceSqlServerConnection);

        await sqlConnection.OpenAsync();

        await using var neonConnection =
            new NpgsqlConnection(NeonConnectionString);

        await neonConnection.OpenAsync();

        await using var sqlCommand =
            new SqlCommand(
                """
                SELECT
                    Id,
                    Date,
                    Type,
                    Category,
                    Amount,
                    Description,
                    UserId
                FROM Transactions
                ORDER BY Id
                """,
                sqlConnection);

        await using var reader =
            await sqlCommand.ExecuteReaderAsync();

        await using var transaction =
            await neonConnection.BeginTransactionAsync();

        int count = 0;

        while (await reader.ReadAsync())
        {
            await using var command =
                new NpgsqlCommand(
                    """
                    INSERT INTO "Transactions"
                    (
                        "Id",
                        "Date",
                        "Type",
                        "Category",
                        "Amount",
                        "Description",
                        "UserId"
                    )
                    VALUES
                    (
                        @Id,
                        @Date,
                        @Type,
                        @Category,
                        @Amount,
                        @Description,
                        @UserId
                    );
                    """,
                    neonConnection,
                    transaction);

            AddIntParameter(command, "@Id", reader, "Id");

            AddDateTimeParameter(command, "@Date", reader, "Date");

            AddIntParameter(command, "@Type", reader, "Type");

            AddIntParameter(
                command,
                "@Category",
                reader,
                "Category");

            AddDecimalParameter(
                command,
                "@Amount",
                reader,
                "Amount");

            AddStringParameter(
                command,
                "@Description",
                reader,
                "Description",
                NpgsqlDbType.Text);

            AddStringParameter(
                command,
                "@UserId",
                reader,
                "UserId",
                NpgsqlDbType.Varchar);

            await command.ExecuteNonQueryAsync();

            count++;
        }

        await transaction.CommitAsync();

        Console.WriteLine(
            $"    Transactions migrated: {count}");
    }

    // ========================================================
    // AI ANALYSIS RUNS
    // ========================================================

    private static async Task MigrateAIAnalysisRunsAsync()
    {
        Console.WriteLine(
            "[7] Migrating AIAnalysisRuns...");

        await using var sqlConnection =
            new SqlConnection(FinanceSqlServerConnection);

        await sqlConnection.OpenAsync();

        await using var neonConnection =
            new NpgsqlConnection(NeonConnectionString);

        await neonConnection.OpenAsync();

        await using var sqlCommand =
            new SqlCommand(
                """
                SELECT
                    Id,
                    UserId,
                    AgentType,
                    GeneratedAt,
                    AgentVersion,
                    IsArchived,
                    CreatedAt,
                    UpdatedAt
                FROM AIAnalysisRuns
                ORDER BY Id
                """,
                sqlConnection);

        await using var reader =
            await sqlCommand.ExecuteReaderAsync();

        await using var transaction =
            await neonConnection.BeginTransactionAsync();

        int count = 0;

        while (await reader.ReadAsync())
        {
            await using var command =
                new NpgsqlCommand(
                    """
                    INSERT INTO "AIAnalysisRuns"
                    (
                        "Id",
                        "UserId",
                        "AgentType",
                        "GeneratedAt",
                        "AgentVersion",
                        "IsArchived",
                        "CreatedAt",
                        "UpdatedAt"
                    )
                    VALUES
                    (
                        @Id,
                        @UserId,
                        @AgentType,
                        @GeneratedAt,
                        @AgentVersion,
                        @IsArchived,
                        @CreatedAt,
                        @UpdatedAt
                    );
                    """,
                    neonConnection,
                    transaction);

            AddIntParameter(command, "@Id", reader, "Id");

            AddStringParameter(
                command,
                "@UserId",
                reader,
                "UserId",
                NpgsqlDbType.Varchar);

            AddStringParameter(
                command,
                "@AgentType",
                reader,
                "AgentType",
                NpgsqlDbType.Varchar);

            AddDateTimeParameter(
                command,
                "@GeneratedAt",
                reader,
                "GeneratedAt");

            AddStringParameter(
                command,
                "@AgentVersion",
                reader,
                "AgentVersion",
                NpgsqlDbType.Varchar);

            AddBoolParameter(
                command,
                "@IsArchived",
                reader,
                "IsArchived");

            AddDateTimeParameter(
                command,
                "@CreatedAt",
                reader,
                "CreatedAt");

            AddDateTimeParameter(
                command,
                "@UpdatedAt",
                reader,
                "UpdatedAt");

            await command.ExecuteNonQueryAsync();

            count++;
        }

        await transaction.CommitAsync();

        Console.WriteLine(
            $"    AIAnalysisRuns migrated: {count}");
    }

    // ========================================================
    // AI INSIGHTS
    // ========================================================

    private static async Task MigrateAIInsightsAsync()
    {
        Console.WriteLine(
            "[8] Migrating AIInsights...");

        await using var sqlConnection =
            new SqlConnection(FinanceSqlServerConnection);

        await sqlConnection.OpenAsync();

        await using var neonConnection =
            new NpgsqlConnection(NeonConnectionString);

        await neonConnection.OpenAsync();

        await using var sqlCommand =
            new SqlCommand(
                """
                SELECT
                    Id,
                    UserId,
                    Type,
                    Category,
                    Insight,
                    GeneratedAt,
                    Months,
                    Source,
                    AnalysisRunId,
                    IsArchived,
                    CreatedAt,
                    UpdatedAt,
                    AgentVersion
                FROM AIInsights
                ORDER BY Id
                """,
                sqlConnection);

        await using var reader =
            await sqlCommand.ExecuteReaderAsync();

        await using var transaction =
            await neonConnection.BeginTransactionAsync();

        int count = 0;

        while (await reader.ReadAsync())
        {
            await using var command =
                new NpgsqlCommand(
                    """
                    INSERT INTO "AIInsights"
                    (
                        "Id",
                        "UserId",
                        "Type",
                        "Category",
                        "Insight",
                        "GeneratedAt",
                        "Months",
                        "Source",
                        "AnalysisRunId",
                        "IsArchived",
                        "CreatedAt",
                        "UpdatedAt",
                        "AgentVersion"
                    )
                    VALUES
                    (
                        @Id,
                        @UserId,
                        @Type,
                        @Category,
                        @Insight,
                        @GeneratedAt,
                        @Months,
                        @Source,
                        @AnalysisRunId,
                        @IsArchived,
                        @CreatedAt,
                        @UpdatedAt,
                        @AgentVersion
                    );
                    """,
                    neonConnection,
                    transaction);

            AddIntParameter(command, "@Id", reader, "Id");

            AddStringParameter(
                command,
                "@UserId",
                reader,
                "UserId",
                NpgsqlDbType.Varchar);

            AddStringParameter(
                command,
                "@Type",
                reader,
                "Type",
                NpgsqlDbType.Varchar);

            AddStringParameter(
                command,
                "@Category",
                reader,
                "Category",
                NpgsqlDbType.Varchar);

            AddStringParameter(
                command,
                "@Insight",
                reader,
                "Insight",
                NpgsqlDbType.Text);

            AddDateTimeParameter(
                command,
                "@GeneratedAt",
                reader,
                "GeneratedAt");

            AddIntParameter(
                command,
                "@Months",
                reader,
                "Months");

            AddStringParameter(
                command,
                "@Source",
                reader,
                "Source",
                NpgsqlDbType.Varchar);

            AddNullableIntParameter(
                command,
                "@AnalysisRunId",
                reader,
                "AnalysisRunId");

            AddBoolParameter(
                command,
                "@IsArchived",
                reader,
                "IsArchived");

            AddDateTimeParameter(
                command,
                "@CreatedAt",
                reader,
                "CreatedAt");

            AddDateTimeParameter(
                command,
                "@UpdatedAt",
                reader,
                "UpdatedAt");

            AddStringParameter(
                command,
                "@AgentVersion",
                reader,
                "AgentVersion",
                NpgsqlDbType.Varchar);

            await command.ExecuteNonQueryAsync();

            count++;
        }

        await transaction.CommitAsync();

        Console.WriteLine(
            $"    AIInsights migrated: {count}");
    }

    // ========================================================
    // BUDGET RECOMMENDATIONS
    // ========================================================

    private static async Task MigrateBudgetGoalRecommendationsAsync()
    {
        Console.WriteLine(
            "[9] Migrating BudgetGoalRecommendations...");

        await using var sqlConnection =
            new SqlConnection(FinanceSqlServerConnection);

        await sqlConnection.OpenAsync();

        await using var neonConnection =
            new NpgsqlConnection(NeonConnectionString);

        await neonConnection.OpenAsync();

        await using var sqlCommand =
            new SqlCommand(
                """
                SELECT
                    Id,
                    UserId,
                    TargetSavings,
                    CurrentSavings,
                    SavingsGap,
                    MonthlySavingsTarget,
                    CurrentMonthlySavings,
                    FeasibilityScore,
                    FeasibilityLabel,
                    DataConfidence,
                    RemainingGapAfterCuts,
                    RevisedTarget,
                    IncomeGapNeeded,
                    ExtendedTimelineNeeded,
                    Months,
                    GeneratedAt,
                    ActionPlanJson,
                    FinalMessage,
                    TrackingMethod,
                    IsActive,
                    AnalysisRunId,
                    IsArchived,
                    CreatedAt,
                    UpdatedAt,
                    AgentVersion,
                    PlanType,
                    LifestyleImpact
                FROM BudgetGoalRecommendations
                ORDER BY Id
                """,
                sqlConnection);

        await using var reader =
            await sqlCommand.ExecuteReaderAsync();

        await using var transaction =
            await neonConnection.BeginTransactionAsync();

        int count = 0;

        while (await reader.ReadAsync())
        {
            await using var command =
                new NpgsqlCommand(
                    """
                    INSERT INTO "BudgetGoalRecommendations"
                    (
                        "Id",
                        "UserId",
                        "TargetSavings",
                        "CurrentSavings",
                        "SavingsGap",
                        "MonthlySavingsTarget",
                        "CurrentMonthlySavings",
                        "FeasibilityScore",
                        "FeasibilityLabel",
                        "DataConfidence",
                        "RemainingGapAfterCuts",
                        "RevisedTarget",
                        "IncomeGapNeeded",
                        "ExtendedTimelineNeeded",
                        "Months",
                        "GeneratedAt",
                        "ActionPlanJson",
                        "FinalMessage",
                        "TrackingMethod",
                        "IsActive",
                        "AnalysisRunId",
                        "IsArchived",
                        "CreatedAt",
                        "UpdatedAt",
                        "AgentVersion",
                        "PlanType",
                        "LifestyleImpact"
                    )
                    VALUES
                    (
                        @Id,
                        @UserId,
                        @TargetSavings,
                        @CurrentSavings,
                        @SavingsGap,
                        @MonthlySavingsTarget,
                        @CurrentMonthlySavings,
                        @FeasibilityScore,
                        @FeasibilityLabel,
                        @DataConfidence,
                        @RemainingGapAfterCuts,
                        @RevisedTarget,
                        @IncomeGapNeeded,
                        @ExtendedTimelineNeeded,
                        @Months,
                        @GeneratedAt,
                        @ActionPlanJson,
                        @FinalMessage,
                        @TrackingMethod,
                        @IsActive,
                        @AnalysisRunId,
                        @IsArchived,
                        @CreatedAt,
                        @UpdatedAt,
                        @AgentVersion,
                        @PlanType,
                        @LifestyleImpact
                    );
                    """,
                    neonConnection,
                    transaction);

            AddIntParameter(command, "@Id", reader, "Id");

            AddStringParameter(
                command,
                "@UserId",
                reader,
                "UserId",
                NpgsqlDbType.Varchar);

            AddDecimalParameter(
                command,
                "@TargetSavings",
                reader,
                "TargetSavings");

            AddDecimalParameter(
                command,
                "@CurrentSavings",
                reader,
                "CurrentSavings");

            AddDecimalParameter(
                command,
                "@SavingsGap",
                reader,
                "SavingsGap");

            AddDecimalParameter(
                command,
                "@MonthlySavingsTarget",
                reader,
                "MonthlySavingsTarget");

            AddDecimalParameter(
                command,
                "@CurrentMonthlySavings",
                reader,
                "CurrentMonthlySavings");

            AddDoubleParameter(
                command,
                "@FeasibilityScore",
                reader,
                "FeasibilityScore");

            AddStringParameter(
                command,
                "@FeasibilityLabel",
                reader,
                "FeasibilityLabel",
                NpgsqlDbType.Varchar);

            AddStringParameter(
                command,
                "@DataConfidence",
                reader,
                "DataConfidence",
                NpgsqlDbType.Varchar);

            AddDecimalParameter(
                command,
                "@RemainingGapAfterCuts",
                reader,
                "RemainingGapAfterCuts");

            AddNullableDecimalParameter(
                command,
                "@RevisedTarget",
                reader,
                "RevisedTarget");

            AddNullableDecimalParameter(
                command,
                "@IncomeGapNeeded",
                reader,
                "IncomeGapNeeded");

            AddNullableIntParameter(
                command,
                "@ExtendedTimelineNeeded",
                reader,
                "ExtendedTimelineNeeded");

            AddIntParameter(command, "@Months", reader, "Months");

            AddDateTimeParameter(
                command,
                "@GeneratedAt",
                reader,
                "GeneratedAt");

            AddStringParameter(
                command,
                "@ActionPlanJson",
                reader,
                "ActionPlanJson",
                NpgsqlDbType.Text);

            AddStringParameter(
                command,
                "@FinalMessage",
                reader,
                "FinalMessage",
                NpgsqlDbType.Varchar);

            AddStringParameter(
                command,
                "@TrackingMethod",
                reader,
                "TrackingMethod",
                NpgsqlDbType.Varchar);

            AddBoolParameter(
                command,
                "@IsActive",
                reader,
                "IsActive");

            AddNullableIntParameter(
                command,
                "@AnalysisRunId",
                reader,
                "AnalysisRunId");

            AddBoolParameter(
                command,
                "@IsArchived",
                reader,
                "IsArchived");

            AddDateTimeParameter(
                command,
                "@CreatedAt",
                reader,
                "CreatedAt");

            AddDateTimeParameter(
                command,
                "@UpdatedAt",
                reader,
                "UpdatedAt");

            AddStringParameter(
                command,
                "@AgentVersion",
                reader,
                "AgentVersion",
                NpgsqlDbType.Varchar);

            AddStringParameter(
                command,
                "@PlanType",
                reader,
                "PlanType",
                NpgsqlDbType.Text);

            AddStringParameter(
                command,
                "@LifestyleImpact",
                reader,
                "LifestyleImpact",
                NpgsqlDbType.Text);

            await command.ExecuteNonQueryAsync();

            count++;
        }

        await transaction.CommitAsync();

        Console.WriteLine(
            $"    BudgetGoalRecommendations migrated: {count}");
    }

    // ========================================================
    // BUDGET ITEMS
    // ========================================================

    private static async Task MigrateBudgetGoalRecommendationItemsAsync()
    {
        Console.WriteLine(
            "[10] Migrating BudgetGoalRecommendationItems...");

        await using var sqlConnection =
            new SqlConnection(FinanceSqlServerConnection);

        await sqlConnection.OpenAsync();

        await using var neonConnection =
            new NpgsqlConnection(NeonConnectionString);

        await neonConnection.OpenAsync();

        await using var sqlCommand =
            new SqlCommand(
                """
                SELECT
                    Id,
                    RecommendationId,
                    Category,
                    CurrentSpending,
                    RecommendedSpending,
                    ReductionAmount,
                    Reason,
                    Priority,
                    CreatedAt,
                    UpdatedAt,
                    AgentVersion
                FROM BudgetGoalRecommendationItems
                ORDER BY Id
                """,
                sqlConnection);

        await using var reader =
            await sqlCommand.ExecuteReaderAsync();

        await using var transaction =
            await neonConnection.BeginTransactionAsync();

        int count = 0;

        while (await reader.ReadAsync())
        {
            await using var command =
                new NpgsqlCommand(
                    """
                    INSERT INTO "BudgetGoalRecommendationItems"
                    (
                        "Id",
                        "RecommendationId",
                        "Category",
                        "CurrentSpending",
                        "RecommendedSpending",
                        "ReductionAmount",
                        "Reason",
                        "Priority",
                        "CreatedAt",
                        "UpdatedAt",
                        "AgentVersion"
                    )
                    VALUES
                    (
                        @Id,
                        @RecommendationId,
                        @Category,
                        @CurrentSpending,
                        @RecommendedSpending,
                        @ReductionAmount,
                        @Reason,
                        @Priority,
                        @CreatedAt,
                        @UpdatedAt,
                        @AgentVersion
                    );
                    """,
                    neonConnection,
                    transaction);

            AddIntParameter(command, "@Id", reader, "Id");

            AddIntParameter(
                command,
                "@RecommendationId",
                reader,
                "RecommendationId");

            AddStringParameter(
                command,
                "@Category",
                reader,
                "Category",
                NpgsqlDbType.Varchar);

            AddDecimalParameter(
                command,
                "@CurrentSpending",
                reader,
                "CurrentSpending");

            AddDecimalParameter(
                command,
                "@RecommendedSpending",
                reader,
                "RecommendedSpending");

            AddDecimalParameter(
                command,
                "@ReductionAmount",
                reader,
                "ReductionAmount");

            AddStringParameter(
                command,
                "@Reason",
                reader,
                "Reason",
                NpgsqlDbType.Varchar);

            AddStringParameter(
                command,
                "@Priority",
                reader,
                "Priority",
                NpgsqlDbType.Varchar);

            AddDateTimeParameter(
                command,
                "@CreatedAt",
                reader,
                "CreatedAt");

            AddDateTimeParameter(
                command,
                "@UpdatedAt",
                reader,
                "UpdatedAt");

            AddStringParameter(
                command,
                "@AgentVersion",
                reader,
                "AgentVersion",
                NpgsqlDbType.Varchar);

            await command.ExecuteNonQueryAsync();

            count++;
        }

        await transaction.CommitAsync();

        Console.WriteLine(
            $"    BudgetGoalRecommendationItems migrated: {count}");
    }

    // ========================================================
    // ANOMALY RESULTS
    // ========================================================

    private static async Task MigrateAnomalyDetectionResultsAsync()
    {
        Console.WriteLine(
            "[11] Migrating AnomalyDetectionResults...");

        await using var sqlConnection =
            new SqlConnection(FinanceSqlServerConnection);

        await sqlConnection.OpenAsync();

        await using var neonConnection =
            new NpgsqlConnection(NeonConnectionString);

        await neonConnection.OpenAsync();

        await using var sqlCommand =
            new SqlCommand(
                """
                SELECT
                    Id,
                    UserId,
                    GeneratedAt,
                    Months,
                    Threshold,
                    TotalAnomaliesFound,
                    HighSeverityCount,
                    MediumSeverityCount,
                    LowSeverityCount,
                    OverallInsight,
                    AnalysisRunId,
                    IsArchived,
                    CreatedAt,
                    UpdatedAt,
                    AgentVersion
                FROM AnomalyDetectionResults
                ORDER BY Id
                """,
                sqlConnection);

        await using var reader =
            await sqlCommand.ExecuteReaderAsync();

        await using var transaction =
            await neonConnection.BeginTransactionAsync();

        int count = 0;

        while (await reader.ReadAsync())
        {
            await using var command =
                new NpgsqlCommand(
                    """
                    INSERT INTO "AnomalyDetectionResults"
                    (
                        "Id",
                        "UserId",
                        "GeneratedAt",
                        "Months",
                        "Threshold",
                        "TotalAnomaliesFound",
                        "HighSeverityCount",
                        "MediumSeverityCount",
                        "LowSeverityCount",
                        "OverallInsight",
                        "AnalysisRunId",
                        "IsArchived",
                        "CreatedAt",
                        "UpdatedAt",
                        "AgentVersion"
                    )
                    VALUES
                    (
                        @Id,
                        @UserId,
                        @GeneratedAt,
                        @Months,
                        @Threshold,
                        @TotalAnomaliesFound,
                        @HighSeverityCount,
                        @MediumSeverityCount,
                        @LowSeverityCount,
                        @OverallInsight,
                        @AnalysisRunId,
                        @IsArchived,
                        @CreatedAt,
                        @UpdatedAt,
                        @AgentVersion
                    );
                    """,
                    neonConnection,
                    transaction);

            AddIntParameter(command, "@Id", reader, "Id");

            AddStringParameter(
                command,
                "@UserId",
                reader,
                "UserId",
                NpgsqlDbType.Varchar);

            AddDateTimeParameter(
                command,
                "@GeneratedAt",
                reader,
                "GeneratedAt");

            AddIntParameter(command, "@Months", reader, "Months");

            AddDoubleParameter(
                command,
                "@Threshold",
                reader,
                "Threshold");

            AddIntParameter(
                command,
                "@TotalAnomaliesFound",
                reader,
                "TotalAnomaliesFound");

            AddIntParameter(
                command,
                "@HighSeverityCount",
                reader,
                "HighSeverityCount");

            AddIntParameter(
                command,
                "@MediumSeverityCount",
                reader,
                "MediumSeverityCount");

            AddIntParameter(
                command,
                "@LowSeverityCount",
                reader,
                "LowSeverityCount");

            AddStringParameter(
                command,
                "@OverallInsight",
                reader,
                "OverallInsight",
                NpgsqlDbType.Text);

            AddNullableIntParameter(
                command,
                "@AnalysisRunId",
                reader,
                "AnalysisRunId");

            AddBoolParameter(
                command,
                "@IsArchived",
                reader,
                "IsArchived");

            AddDateTimeParameter(
                command,
                "@CreatedAt",
                reader,
                "CreatedAt");

            AddDateTimeParameter(
                command,
                "@UpdatedAt",
                reader,
                "UpdatedAt");

            AddStringParameter(
                command,
                "@AgentVersion",
                reader,
                "AgentVersion",
                NpgsqlDbType.Varchar);

            await command.ExecuteNonQueryAsync();

            count++;
        }

        await transaction.CommitAsync();

        Console.WriteLine(
            $"    AnomalyDetectionResults migrated: {count}");
    }

    // ========================================================
    // ANOMALY DETAILS
    // ========================================================

    private static async Task MigrateAnomalyDetailsAsync()
    {
        Console.WriteLine(
            "[12] Migrating AnomalyDetails...");

        await using var sqlConnection =
            new SqlConnection(FinanceSqlServerConnection);

        await sqlConnection.OpenAsync();

        await using var neonConnection =
            new NpgsqlConnection(NeonConnectionString);

        await neonConnection.OpenAsync();

        await using var sqlCommand =
            new SqlCommand(
                """
                SELECT
                    Id,
                    AnomalyResultId,
                    TransactionId,
                    Date,
                    Category,
                    Amount,
                    AverageForCategory,
                    DeviationPercentage,
                    Severity,
                    Explanation,
                    AnomalyType,
                    CreatedAt,
                    UpdatedAt,
                    AgentVersion
                FROM AnomalyDetails
                ORDER BY Id
                """,
                sqlConnection);

        await using var reader =
            await sqlCommand.ExecuteReaderAsync();

        await using var transaction =
            await neonConnection.BeginTransactionAsync();

        int count = 0;

        while (await reader.ReadAsync())
        {
            await using var command =
                new NpgsqlCommand(
                    """
                    INSERT INTO "AnomalyDetails"
                    (
                        "Id",
                        "AnomalyResultId",
                        "TransactionId",
                        "Date",
                        "Category",
                        "Amount",
                        "AverageForCategory",
                        "DeviationPercentage",
                        "Severity",
                        "Explanation",
                        "AnomalyType",
                        "CreatedAt",
                        "UpdatedAt",
                        "AgentVersion"
                    )
                    VALUES
                    (
                        @Id,
                        @AnomalyResultId,
                        @TransactionId,
                        @Date,
                        @Category,
                        @Amount,
                        @AverageForCategory,
                        @DeviationPercentage,
                        @Severity,
                        @Explanation,
                        @AnomalyType,
                        @CreatedAt,
                        @UpdatedAt,
                        @AgentVersion
                    );
                    """,
                    neonConnection,
                    transaction);

            AddIntParameter(command, "@Id", reader, "Id");

            AddIntParameter(
                command,
                "@AnomalyResultId",
                reader,
                "AnomalyResultId");

            AddIntParameter(
                command,
                "@TransactionId",
                reader,
                "TransactionId");

            AddDateTimeParameter(
                command,
                "@Date",
                reader,
                "Date");

            AddStringParameter(
                command,
                "@Category",
                reader,
                "Category",
                NpgsqlDbType.Varchar);

            AddDecimalParameter(
                command,
                "@Amount",
                reader,
                "Amount");

            AddDecimalParameter(
                command,
                "@AverageForCategory",
                reader,
                "AverageForCategory");

            AddDoubleParameter(
                command,
                "@DeviationPercentage",
                reader,
                "DeviationPercentage");

            AddStringParameter(
                command,
                "@Severity",
                reader,
                "Severity",
                NpgsqlDbType.Varchar);

            AddStringParameter(
                command,
                "@Explanation",
                reader,
                "Explanation",
                NpgsqlDbType.Text);

            AddStringParameter(
                command,
                "@AnomalyType",
                reader,
                "AnomalyType",
                NpgsqlDbType.Varchar);

            AddDateTimeParameter(
                command,
                "@CreatedAt",
                reader,
                "CreatedAt");

            AddDateTimeParameter(
                command,
                "@UpdatedAt",
                reader,
                "UpdatedAt");

            AddStringParameter(
                command,
                "@AgentVersion",
                reader,
                "AgentVersion",
                NpgsqlDbType.Varchar);

            await command.ExecuteNonQueryAsync();

            count++;
        }

        await transaction.CommitAsync();

        Console.WriteLine(
            $"    AnomalyDetails migrated: {count}");
    }

    // ========================================================
    // RESET POSTGRES IDENTITY SEQUENCES
    // ========================================================

    private static async Task ResetIdentitySequencesAsync()
    {
        Console.WriteLine();
        Console.WriteLine(
            "[13] Resetting PostgreSQL identity sequences...");

        await using var connection =
            new NpgsqlConnection(NeonConnectionString);

        await connection.OpenAsync();

        string[] tables =
        {
            "Transactions",
            "AIAnalysisRuns",
            "AIInsights",
            "BudgetGoalRecommendations",
            "BudgetGoalRecommendationItems",
            "AnomalyDetectionResults",
            "AnomalyDetails"
        };

        foreach (var table in tables)
        {
            string sql =
                $"""
                SELECT setval(
                    pg_get_serial_sequence('"{table}"', 'Id'),
                    COALESCE(
                        (SELECT MAX("Id") FROM "{table}"),
                        1
                    ),
                    true
                );
                """;

            await using var command =
                new NpgsqlCommand(sql, connection);

            try
            {
                await command.ExecuteScalarAsync();

                Console.WriteLine(
                    $"    {table}: sequence reset");
            }
            catch (PostgresException ex)
            {
                Console.WriteLine(
                    $"    {table}: sequence reset skipped - {ex.MessageText}");
            }
        }
    }

    // ========================================================
    // VERIFY COUNTS
    // ========================================================

    private static async Task VerifyCountsAsync()
    {
        Console.WriteLine(
            "[14] Verifying migration counts...");

        var expected = new Dictionary<string, long>
        {
            ["AspNetUsers"] = 3,
            ["Transactions"] = 128,
            ["AIAnalysisRuns"] = 44,
            ["AIInsights"] = 5,
            ["BudgetGoalRecommendations"] = 39,
            ["BudgetGoalRecommendationItems"] = 195,
            ["AnomalyDetectionResults"] = 3,
            ["AnomalyDetails"] = 22
        };

        await using var connection =
            new NpgsqlConnection(NeonConnectionString);

        await connection.OpenAsync();

        bool allMatch = true;

        foreach (var item in expected)
        {
            string sql =
                $"SELECT COUNT(*) FROM \"{item.Key}\";";

            await using var command =
                new NpgsqlCommand(sql, connection);

            long actual =
                Convert.ToInt64(
                    await command.ExecuteScalarAsync());

            bool matches =
                actual == item.Value;

            if (!matches)
                allMatch = false;

            Console.WriteLine(
                $"    {item.Key,-40} Expected: {item.Value,5}  Actual: {actual,5}  {(matches ? "OK" : "MISMATCH")}");
        }

        Console.WriteLine();

        if (!allMatch)
        {
            throw new InvalidOperationException(
                "One or more migration row counts do not match.");
        }

        Console.WriteLine(
            "    All expected row counts match.");
    }

    // ========================================================
    // PARAMETER HELPERS
    // ========================================================

    private static void AddIntParameter(
        NpgsqlCommand command,
        string name,
        SqlDataReader reader,
        string column)
    {
        object value =
            reader.IsDBNull(reader.GetOrdinal(column))
                ? DBNull.Value
                : reader.GetInt32(reader.GetOrdinal(column));

        command.Parameters.AddWithValue(name, NpgsqlDbType.Integer, value);
    }

    private static void AddNullableIntParameter(
        NpgsqlCommand command,
        string name,
        SqlDataReader reader,
        string column)
    {
        int ordinal = reader.GetOrdinal(column);

        object value =
            reader.IsDBNull(ordinal)
                ? DBNull.Value
                : reader.GetInt32(ordinal);

        command.Parameters.AddWithValue(
            name,
            NpgsqlDbType.Integer,
            value);
    }

    private static void AddDecimalParameter(
        NpgsqlCommand command,
        string name,
        SqlDataReader reader,
        string column)
    {
        int ordinal = reader.GetOrdinal(column);

        object value =
            reader.IsDBNull(ordinal)
                ? DBNull.Value
                : reader.GetDecimal(ordinal);

        command.Parameters.AddWithValue(
            name,
            NpgsqlDbType.Numeric,
            value);
    }

    private static void AddNullableDecimalParameter(
        NpgsqlCommand command,
        string name,
        SqlDataReader reader,
        string column)
    {
        int ordinal = reader.GetOrdinal(column);

        object value =
            reader.IsDBNull(ordinal)
                ? DBNull.Value
                : reader.GetDecimal(ordinal);

        command.Parameters.AddWithValue(
            name,
            NpgsqlDbType.Numeric,
            value);
    }

    private static void AddDoubleParameter(
        NpgsqlCommand command,
        string name,
        SqlDataReader reader,
        string column)
    {
        int ordinal = reader.GetOrdinal(column);

        object value;

        if (reader.IsDBNull(ordinal))
        {
            value = DBNull.Value;
        }
        else
        {
            value = Convert.ToDouble(reader.GetValue(ordinal));
        }

        command.Parameters.AddWithValue(
            name,
            NpgsqlDbType.Double,
            value);
    }

    private static void AddBoolParameter(
        NpgsqlCommand command,
        string name,
        SqlDataReader reader,
        string column)
    {
        int ordinal = reader.GetOrdinal(column);

        object value =
            reader.IsDBNull(ordinal)
                ? DBNull.Value
                : reader.GetBoolean(ordinal);

        command.Parameters.AddWithValue(
            name,
            NpgsqlDbType.Boolean,
            value);
    }

    private static void AddDateTimeParameter(
        NpgsqlCommand command,
        string name,
        SqlDataReader reader,
        string column)
    {
        int ordinal = reader.GetOrdinal(column);

        object value =
            reader.IsDBNull(ordinal)
                ? DBNull.Value
                : reader.GetDateTime(ordinal);

        command.Parameters.AddWithValue(
            name,
            NpgsqlDbType.Timestamp,
            value);
    }

    private static void AddNullableDateTimeOffsetParameter(
        NpgsqlCommand command,
        string name,
        SqlDataReader reader,
        string column)
    {
        int ordinal = reader.GetOrdinal(column);

        object value =
            reader.IsDBNull(ordinal)
                ? DBNull.Value
                : reader.GetFieldValue<DateTimeOffset>(ordinal);

        command.Parameters.AddWithValue(
            name,
            NpgsqlDbType.TimestampTz,
            value);
    }

    private static void AddStringParameter(
        NpgsqlCommand command,
        string name,
        SqlDataReader reader,
        string column,
        NpgsqlDbType type)
    {
        int ordinal = reader.GetOrdinal(column);

        object value =
            reader.IsDBNull(ordinal)
                ? DBNull.Value
                : reader.GetString(ordinal);

        command.Parameters.AddWithValue(
            name,
            type,
            value);
    }
}