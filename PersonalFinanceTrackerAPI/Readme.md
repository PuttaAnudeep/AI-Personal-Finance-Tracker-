# Personal Finance Tracker API

A comprehensive .NET 10.0 Web API for personal finance management with AI-powered insights, built with Clean Architecture principles.

## 🚀 Features

### Core Features
- **Transaction Management**: Create, update, delete, and view financial transactions
- **JWT Authentication**: Secure API access with role-based authorization
- **Category-based Tracking**: Organize transactions by categories (Food, Travel, Shopping, etc.)
- **Date Range Filtering**: Analyze spending patterns over specific periods

### AI Agents

#### 1. Natural Language Transaction Creation
- **Endpoint**: `POST /api/Ai/create-transaction`
- **Purpose**: Create transactions using plain English text
- **Example Input**: "Spent ₹500 on lunch and ₹200 on taxi"
- **Example Output**: Creates 2 separate transactions with appropriate categories
- **Technology**: Google Gemini AI for intent extraction and categorization

#### 2. Spending Insights Generator
- **Endpoint**: `GET /api/Ai/insights?months=3`
- **Purpose**: Analyze spending patterns and generate actionable insights
- **Insight Types**:
  - **Positive**: Highlight good financial habits
  - **Warning**: Alert about concerning trends
  - **Trend**: Show spending patterns over time
  - **Recommendation**: Suggest actionable improvements
  - **Risk**: Flag potential financial risks
- **Technology**: Statistical analysis + Gemini AI for natural language insights

#### 3. Budget Goal Assistant
- **Endpoint**: `POST /api/Ai/budget-goal`
- **Purpose**: Generate personalized budget recommendations to achieve savings goals
- **Input**:
  - `targetSavings`: Target amount to save
  - `months`: Timeline to achieve the goal
- **Output**:
  - Current savings status
  - Savings gap analysis
  - Category-wise reduction recommendations
  - AI-generated action plan with specific steps
  - Feasibility score (0-100)
- **Technology**: Financial analytics engine + Gemini AI for personalized action plans

#### 4. Spending Anomaly Detection
- **Endpoint**: `GET /api/Ai/detect-anomalies?months=3&threshold=50`
- **Purpose**: Identify unusual spending patterns and potential errors
- **Anomaly Types**:
  - **Spike**: Transactions significantly above category average (Z-score analysis)
  - **UnusualCategory**: Highest transaction in a low-spend category
  - **Duplicate**: Same amount/category on the same day
- **Output**:
  - List of anomalies with severity levels (High/Medium/Low)
  - Statistical metrics (average, deviation percentage)
  - Overall summary with actionable insights
- **Technology**: StatisticalDetectionEngine using standard deviation and Z-score analysis

## 🏗️ Architecture

### Project Structure
```
PersonalFinanceTrackerAPI/
├── Controllers/
│   └── AiController.cs                 # AI agent endpoints
├── Data/
│   └── FinanceTrackerDbContext.cs      # Database context
├── DTOs/                               # Shared DTOs
├── Models/
│   ├── TransactionModel.cs             # Transaction entity
│   ├── TransactionCategory.cs          # Category enum
│   └── TransactionType.cs              # Type enum (Income/Expense)
├── Services/
│   ├── Interfaces/
│   │   ├── ITransactionService.cs      # Transaction operations interface
│   │   └── AI/                         # AI service interfaces
│   ├── TransactionService.cs           # Transaction implementation
│   └── AI/
│       ├── SharedInfrastructure/
│       │   └── Gemini/
│       │       └── GeminiClient.cs     # Shared Gemini API client
│       └── Agents/
│           ├── NaturalLanguageTransactionCreation/
│           │   ├── NaturalLanguageTransactionCreationService.cs
│           │   └── DTOs/
│           │       └── NlpTransactionRequestDTO.cs
│           ├── SpendingInsights/
│           │   ├── SpendingInsightsService.cs
│           │   ├── DTOs/
│           │   │   └── SpendingInsightResponseDTO.cs
│           │   └── Analytics/
│           │       └── FinancialAnalyticsEngine.cs
│           ├── BudgetGoalAssistant/
│           │   ├── BudgetGoalAssistantService.cs
│           │   ├── DTOs/
│           │   │   ├── BudgetGoalRequestDTO.cs
│           │   │   └── BudgetRecommendationDTO.cs
│           │   └── Analytics/
│           │       └── GoalGapAnalysisEngine.cs
│           └── SpendingAnomalyDetection/
│               ├── SpendingAnomalyDetectionService.cs
│               ├── DTOs/
│               │   └── AnomalyDetectionResponseDTO.cs
│               └── Analytics/
│                   └── StatisticalDetectionEngine.cs
├── Program.cs                          # Application entry point
├── appsettings.json                    # Configuration
└── Samples/
    └── SeedTransactions.json           # Sample data for testing
```

### Clean Architecture Principles
- **Separation of Concerns**: Each AI agent is self-contained in its own folder
- **DTOs per Agent**: Each agent owns its DTOs in a dedicated DTOs folder
- **Shared Infrastructure**: Common services like GeminiClient are shared
- **Interface-based Design**: Services depend on interfaces for testability
- **Dependency Injection**: All services registered in Program.cs

## 🔧 Technology Stack

- **Framework**: .NET 10.0
- **Runtime**: ASP.NET Core Web API
- **Database**: SQL Server / LocalDB
- **ORM**: Entity Framework Core 9.0.0
- **Authentication**: JWT Bearer + Identity
- **AI**: Google Gemini API
- **Documentation**: Swagger/OpenAPI

## 📊 Database Schema

### TransactionModel
```csharp
public class TransactionModel
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public TransactionType Type { get; set; }        // Income or Expense
    public TransactionCategory Category { get; set; } // See categories below
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public string UserId { get; set; }
}
```

### Transaction Categories
- Salary, Bonus, Freelance, Investment
- Food, Travel, Shopping, Fuel, Rent, Housing
- Medical, Entertainment, Bills, Education
- Groceries, Utilities, Dining, Insurance
- Transportation, Health, Gifts, Savings
- Healthcare, Other

## 🚦 Getting Started

### Prerequisites
- .NET 10.0 SDK
- SQL Server / LocalDB
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PersonalFinanceTracker
   ```

2. **Update Configuration**
   
   Edit `PersonalFinanceTrackerAPI/appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "FinanceTrackerCon": "Your database connection string",
       "AuthCon": "Your auth database connection string"
     },
     "Jwt": {
       "Key": "Your secure JWT key",
       "Issuer": "FinanceTracker",
       "Audience": "FinanceTrackerUsers",
       "DurationInMinutes": 60
     },
     "Gemini": {
       "ApiKey": "Your Google Gemini API key",
       "ModelName": "gemini-1.5-flash"
     }
   }
   ```

3. **Restore Dependencies**
   ```bash
   dotnet restore
   ```

4. **Run Database Migrations**
   ```bash
   dotnet ef database update --project PersonalFinanceTrackerAPI
   ```

5. **Seed Sample Data** (Optional)
   ```bash
   # Get your user ID from the AspNetUsers table
   sqlcmd -S "(localdb)\ProjectModels" -d "FinancialTrackerAuthDB" -Q "SELECT Id FROM AspNetUsers WHERE Email = 'your-email@example.com'"
   
   # Run seed script with your user ID
   sqlcmd -S "(localdb)\ProjectModels" -d "FinanceTrackerDB" -v UserId="your-user-id" -i "SeedDb\seed.sql"
   ```

6. **Run the Application**
   ```bash
   dotnet run --project PersonalFinanceTrackerAPI
   ```

7. **Access Swagger UI**
   ```
   https://localhost:5001/swagger
   ```

## 🔑 Authentication

All AI endpoints require JWT authentication:

1. **Login** to get JWT token
2. **Include Authorization header**:
   ```
   Authorization: Bearer <your-jwt-token>
   ```

## 📡 API Endpoints

### Transaction Management
- `GET /api/Transaction` - Get all transactions
- `GET /api/Transaction/{id}` - Get transaction by ID
- `POST /api/Transaction` - Create transaction
- `PUT /api/Transaction/{id}` - Update transaction
- `DELETE /api/Transaction/{id}` - Delete transaction

### AI Agents
- `POST /api/Ai/create-transaction` - NLP transaction creation
- `GET /api/Ai/insights?months=3` - Generate spending insights
- `POST /api/Ai/budget-goal` - Get budget recommendations
- `GET /api/Ai/detect-anomalies?months=3&threshold=50` - Detect anomalies

## 🧪 Testing the AI Agents

### Sample Requests

#### 1. Create Transaction via NLP
```bash
POST /api/Ai/create-transaction
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Spent ₹500 on tea and snacks"
}
```

**Response**:
```json
[
  {
    "id": 61,
    "date": "2026-07-19T15:33:23Z",
    "type": "Expense",
    "category": "Food",
    "amount": 500,
    "description": "tea and snacks",
    "userId": "fa56f87f-2491-4d16-9629-dfbc4b854c35"
  }
]
```

#### 2. Generate Insights
```bash
GET /api/Ai/insights?months=3
Authorization: Bearer <token>
```

**Response**:
```json
[
  {
    "type": "Risk",
    "category": "Medical",
    "insight": "Medical expenses account for over 34% of your total spending...",
    "generatedAt": "2026-07-19T15:36:24Z"
  },
  {
    "type": "Trend",
    "category": "Cash Flow",
    "insight": "Your July performance resulted in a negative net savings...",
    "generatedAt": "2026-07-19T15:36:24Z"
  }
]
```

#### 3. Budget Goal Recommendations
```bash
POST /api/Ai/budget-goal
Authorization: Bearer <token>
Content-Type: application/json

{
  "targetSavings": 150000,
  "months": 3
}
```

**Response**:
```json
{
  "targetSavings": 150000,
  "currentSavings": 24100,
  "savingsGap": 41966.67,
  "monthlySavingsTarget": 50000,
  "currentMonthlySavings": 8033.33,
  "recommendations": [
    {
      "category": "Medical",
      "currentSpending": 69200,
      "recommendedSpending": 54830.41,
      "reductionAmount": 14369.59,
      "reason": "This category represents 34.2% of your total spending",
      "priority": "High"
    }
  ],
  "actionPlan": "To reach your goal of saving ₹150,000 in 3 months...",
  "generatedAt": "2026-07-19T15:37:59Z"
}
```

#### 4. Detect Anomalies
```bash
GET /api/Ai/detect-anomalies?months=3&threshold=50
Authorization: Bearer <token>
```

**Response**:
```json
{
  "anomalies": [
    {
      "transactionId": 56,
      "date": "2026-07-15T00:00:00",
      "category": "Medical",
      "amount": 45000,
      "averageForCategory": 13840,
      "deviationPercentage": 225.14,
      "severity": "High",
      "explanation": "This medical expense is significantly higher than your typical spending...",
      "anomalyType": "Spike"
    }
  ],
  "summary": {
    "totalAnomaliesFound": 2,
    "highSeverityCount": 2,
    "mediumSeverityCount": 0,
    "lowSeverityCount": 0,
    "overallInsight": "Two high-severity anomalies were identified..."
  }
}
```

## 🎯 Key Features Explained

### 1. Statistical Anomaly Detection
The `StatisticalDetectionEngine` uses:
- **Z-Score Analysis**: Identifies transactions that deviate significantly from category averages
- **Duplicate Detection**: Flags potential duplicate transactions
- **Unusual Category Spending**: Detects out-of-pattern spending in typically low-spend categories

### 2. Goal Gap Analysis
The `GoalGapAnalysisEngine` provides:
- **Feasibility Scoring**: 0-100 score based on savings gap and timeline
- **Category-wise Reductions**: Proportional reduction recommendations
- **Priority Classification**: High/Medium/Low based on impact
- **Discretionary vs Essential**: Identifies which categories can be reduced

### 3. Natural Language Processing
The NLP agent:
- Parses natural language text to extract transaction details
- Identifies amount, description, and transaction type
- Maps to appropriate categories using AI
- Supports multiple transactions in one sentence

### 4. Gemini AI Integration
The `GeminiClient` provides:
- **Model Fallback**: Tries multiple models if one fails
- **Error Handling**: Graceful degradation with fallback responses
- **Standardized Prompts**: Consistent AI behavior across agents
- **Response Cleaning**: Handles markdown and code blocks in AI responses

## 🔒 Security

- JWT-based authentication
- Role-based authorization
- User-specific data isolation
- Secure password hashing with Identity
- HTTPS enforcement in production

## 🧩 Clean Architecture Benefits

1. **Maintainability**: Each agent is independent and can be modified separately
2. **Testability**: Interface-based design enables unit testing
3. **Scalability**: Easy to add new AI agents following the same pattern
4. **Reusability**: Shared components like GeminiClient reduce duplication
5. **Flexibility**: Easy to swap AI providers or add new detection methods

## 📝 Development Notes

### Adding a New AI Agent
1. Create a new folder under `Services/AI/Agents/YourAgent/`
2. Add DTOs in a `DTOs/` subfolder
3. Create service interface in `Services/Interfaces/AI/`
4. Implement the service
5. Register in `Program.cs`
6. Add endpoint in `AiController.cs`

### Modifying Transaction Categories
Update the `TransactionCategory` enum in `Models/TransactionCategory.cs`. The NLP agent will automatically recognize new categories.

## 🐛 Known Issues

- SeedDb cleanup may fail if Visual Studio locks files; close VS and retry
- Gemini AI responses may vary; fallback logic handles failures
- Anomaly detection requires at least 3 transactions per category for statistical significance

## 📄 License

This project is created for educational purposes.

## 👤 Author

Built with ❤️ using .NET and AI

## 🎨 Frontend Integration Guide

### Base URL
```
https://localhost:5001/api
```

### Authentication Flow
1. **Login**: POST to `/api/Auth/login` with email and password
2. **Store Token**: Save JWT token in localStorage
3. **Include Token**: Add `Authorization: Bearer <token>` header

### Component Structure
```
src/
├── components/
│   ├── Transaction/
│   │   ├── TransactionList.jsx
│   │   ├── CreateTransaction.jsx
│   │   └── TransactionChart.jsx
│   ├── Insights/
│   │   ├── InsightsDashboard.jsx
│   │   └── InsightCard.jsx
│   ├── Budget/
│   │   ├── BudgetGoalForm.jsx
│   │   ├── Recommendations.jsx
│   │   └── ProgressTracker.jsx
│   └── Anomalies/
│       ├── AnomalyList.jsx
│       └── AnomalyDetail.jsx
├── services/
│   ├── api.js
│   └── auth.js
└── hooks/
    ├── useTransactions.js
    ├── useInsights.js
    └── useAnomalies.js
```

</parameter>
<parameter=task_progress>
- [x] Review agent outputs for correctness
- [x] Update README.md with implementation details
- [x] Document API endpoints and usage
- [ ] Provide frontend integration guide
</task_progress>
</write_to_file>