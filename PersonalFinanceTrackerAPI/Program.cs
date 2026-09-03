using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PersonalFinanceTrackerAPI.Data;
using PersonalFinanceTrackerAPI.Models;
using PersonalFinanceTrackerAPI.Services;
using PersonalFinanceTrackerAPI.Services.AI;
using PersonalFinanceTrackerAPI.Services.AI.Agents.BudgetGoalAssistant;
using PersonalFinanceTrackerAPI.Services.AI.Agents.BudgetGoalAssistant.Analytics;
using PersonalFinanceTrackerAPI.Services.AI.Agents.NaturalLanguageTransactionCreation;
using PersonalFinanceTrackerAPI.Services.AI.Agents.SpendingAnomalyDetection;
using PersonalFinanceTrackerAPI.Services.AI.Agents.DocumentExtraction;
using PersonalFinanceTrackerAPI.Services.AI.Agents.DocumentExtraction.Providers;
using PersonalFinanceTrackerAPI.Services.AI.Agents.SpendingAnomalyDetection.Analytics;
using PersonalFinanceTrackerAPI.Services.AI.Agents.SpendingInsights;
using PersonalFinanceTrackerAPI.Services.AI.Agents.SpendingInsights.Analytics;
using PersonalFinanceTrackerAPI.Services.AI.SharedInfrastructure.Gemini;
using PersonalFinanceTrackerAPI.Services.Interfaces;
using PersonalFinanceTrackerAPI.Services.Interfaces.AI;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// ========================================
// Add Controllers
// ========================================
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// ========================================
// CORS Configuration
// ========================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ========================================
// Database
// ========================================
//this is for local sqlserver
//builder.Services.AddDbContext<AuthDbContext>(options =>
//    options.UseSqlServer(
//        builder.Configuration.GetConnectionString("AuthCon")));

//builder.Services.AddDbContext<FinanceTrackerDbContext>(options =>
//    options.UseSqlServer(
//        builder.Configuration.GetConnectionString("FinanceTrackerCon")));
builder.Services.AddDbContext<AuthDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("AuthCon"))
    );

builder.Services.AddDbContext<FinanceTrackerDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("FinanceTrackerCon")));

// ========================================
// Identity
// ========================================
builder.Services
    .AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<AuthDbContext>()
    .AddDefaultTokenProviders();

// ========================================
// JWT Authentication
// ========================================
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

builder.Services.Configure<AuthenticationOptions>(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
});

builder.Services.AddAuthentication()
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(key)
        };
    });

// ========================================
// Dependency Injection
// ========================================
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();

builder.Services.AddScoped<IAIStorageService, AIStorageService>();
builder.Services.AddScoped<FinancialAnalyticsEngine>();
builder.Services.AddScoped<StatisticalDetectionEngine>();
builder.Services.AddScoped<GoalGapAnalysisEngine>();

builder.Services.AddHttpClient<GeminiClient>();

// ========================================
// Logging
// ========================================
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

builder.Services.AddScoped<INaturalLanguageTransactionCreationService, NaturalLanguageTransactionCreationService>();
builder.Services.AddScoped<ISpendingInsightsService, SpendingInsightsService>();
builder.Services.AddScoped<IBudgetGoalAssistantService, BudgetGoalAssistantService>();
builder.Services.AddScoped<ISpendingAnomalyDetectionService, SpendingAnomalyDetectionService>();

// ========================================
// Document Extraction Agent Configuration & DI
// ========================================
builder.Services.Configure<DocumentExtractionConfiguration>(
    builder.Configuration.GetSection("DocumentExtraction"));

builder.Services.AddScoped<IDocumentExtractionService, DocumentExtractionService>();
builder.Services.AddScoped<DocumentExtractionOrchestrator>();
builder.Services.AddScoped<IDocumentExtractionProvider, GeminiVisionExtractionProvider>();

// ========================================
// Swagger
// ========================================
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Personal Finance Tracker API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: Bearer eyJhbGc...",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// ========================================
// Configure Middleware
// ========================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Enable CORS
app.UseCors("AllowAll");

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// Map Controllers
app.MapControllers();

app.Run();