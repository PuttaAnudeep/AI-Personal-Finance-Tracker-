# SmartLedger — Personal Finance Tracker

A full-stack personal finance management application with AI-powered insights, built with Angular frontend and .NET Web API backend.

> **SmartLedger** — Track smarter. Spend better. Powered by AI.

---

## 🚀 Features

### Frontend (Angular)
- **Authentication**: Sign up / Sign in with JWT, profile management, change password
- **Dashboard**: Financial health overview with progress ring, animated counters, stat cards, and charts
- **Transaction Management**: Full CRUD with **pagination**, quick filters, sorting, search, and date-range filters
- **Smart AI Entry**:
  - **Natural Language Transaction Creation** — "Spent ₹500 on lunch"
  - **Document Upload** — Drag-and-drop bills/receipts
  - **Dual OCR Pipeline** — Puter.js OCR (browser) with Gemini Vision (backend) fallback
  - **Auto-Save with Inline Editing** — Edit or delete parsed transactions directly
- **AI Insights**: Visual charts and actionable financial insights with history
- **Budget Planning**: Savings goals with AI recommendations, feasibility scoring, plan types (Focused/Balanced), active goal tracking
- **Anomaly Detection**: Statistical anomaly detection with severity classification and history
- **Analytics**: Spending trends with custom SVG area/bar charts and PrimeNG charts
- **Reports**: Transaction-based financial reports with income/expense summaries
- **Settings**: Update profile, change password, theme preferences
- **Dark/Light Mode**: Theme toggle with localStorage persistence and system preference detection
- **Command Palette (⌘K)**: Quick search and navigation across pages and actions

### Backend (.NET Web API)
- **Transaction Management**: Full CRUD operations, filtering, pagination, sorting
- **JWT Authentication**: Secure API access with role-based authorization
- **Category-based Tracking**: Organize transactions by categories
- **AI Agents**:
  - Natural Language Transaction Creation
  - Spending Insights Generator
  - Budget Goal Assistant
  - Spending Anomaly Detection
- **AI Result History**: Persistent storage of insights, budget goals, and anomaly detection runs
- **Document Processing**: Gemini Vision endpoint for receipt/bill OCR extraction
- **Clean Architecture**: Modular, maintainable code structure

---

## 📁 Project Structure

```
PersonalFinanceTracker/
├── PersonalFinanceTrackerAPI/              # Backend .NET Web API
│   ├── Controllers/
│   │   └── AiController.cs                # AI agent endpoints
│   ├── Data/
│   │   └── FinanceTrackerDbContext.cs     # Database context
│   ├── DTOs/                              # Data Transfer Objects
│   ├── Models/
│   │   ├── TransactionModel.cs            # Transaction entity
│   │   ├── TransactionCategory.cs         # Category enum
│   │   └── TransactionType.cs             # Type enum (Income/Expense)
│   ├── Services/
│   │   ├── Interfaces/                    # Service interfaces
│   │   ├── TransactionService.cs          # Transaction operations
│   │   └── AI/                            # AI agents
│   │       ├── SharedInfrastructure/
│   │       │   └── Gemini/
│   │       │       └── GeminiClient.cs    # Shared Gemini API client
│   │       └── Agents/
│   │           ├── NaturalLanguageTransactionCreation/
│   │           ├── SpendingInsights/
│   │           ├── BudgetGoalAssistant/
│   │           └── SpendingAnomalyDetection/
│   ├── Program.cs                         # Application entry point
│   ├── appsettings.json                   # Configuration
│   └── Readme.md                          # API documentation
│
└── PersonalFinanceTrackerUI/              # Frontend Angular app
    ├── src/
    │   ├── app/
    │   │   ├── core/
    │   │   │   ├── authentication/
    │   │   │   │   ├── auth.guard.ts           # Route guard
    │   │   │   │   └── auth.service.ts         # Auth (signals + JWT)
    │   │   │   ├── config/
    │   │   │   │   └── api.config.ts           # API base URL & endpoints
    │   │   │   ├── data/
    │   │   │   ├── interceptors/
    │   │   │   │   └── auth.interceptor.ts     # HTTP interceptor
    │   │   │   ├── models/
    │   │   │   │   ├── models.ts               # AI/Insights/Budget types
    │   │   │   │   └── transaction.model.ts    # Transaction types
    │   │   │   └── services/
    │   │   │       ├── ai.service.ts           # AI API service (NLP, OCR, history)
    │   │   │       ├── ai-state.service.ts     # AI state management (session storage)
    │   │   │       ├── theme.service.ts        # Dark/light theme
    │   │   │       ├── toast.service.ts        # Toast notifications
    │   │   │       └── transaction.service.ts  # Transaction CRUD service
    │   │   ├── features/                        # Feature modules
    │   │   │   ├── auth/
    │   │   │   │   └── login.component.ts       # Login/Signup page
    │   │   │   ├── dashboard/
    │   │   │   │   ├── services/
    │   │   │   │   │   └── dashboard.service.ts # Dashboard data service
    │   │   │   │   └── dashboard.component.ts   # Dashboard overview
    │   │   │   ├── transactions/
    │   │   │   │   └── transactions.component.ts # Transaction list (paginated)
    │   │   │   ├── ai-assistant/
    │   │   │   │   └── ai-assistant.component.ts # NLP + document upload
    │   │   │   ├── insights/
    │   │   │   │   └── insights.component.ts    # Spending insights
    │   │   │   ├── budget/
    │   │   │   │   └── budget.component.ts      # Budget planning
    │   │   │   ├── anomalies/
    │   │   │   │   └── anomalies.component.ts   # Anomaly detection
    │   │   │   ├── analytics/
    │   │   │   │   └── analytics.component.ts   # Analytics charts
    │   │   │   ├── reports/
    │   │   │   │   └── reports.component.ts     # Financial reports
    │   │   │   └── settings/
    │   │   │       └── settings.component.ts    # Profile & password
    │   │   ├── layout/                          # Layout components
    │   │   │   ├── layout.component.ts
    │   │   │   ├── sidebar/
    │   │   │   │   └── sidebar.component.ts
    │   │   │   ├── topbar/
    │   │   │   │   └── topbar.component.ts      # Top bar w/ search, theme, profile
    │   │   │   └── command-palette/
    │   │   │       └── command-palette.component.ts # ⌘K quick navigation
    │   │   └── shared/                          # Shared components
    │   │       ├── animated-counter/
    │   │       │   └── animated-counter.component.ts
    │   │       ├── charts/
    │   │       │   └── charts.component.ts      # Area/bar/donut charts
    │   │       ├── icon/
    │   │       │   └── icon.component.ts
    │   │       ├── meta/
    │   │       │   └── meta.ts                  # Category/insight metadata
    │   │       ├── progress-ring/
    │   │       │   └── progress-ring.component.ts
    │   │       ├── stat-card/
    │   │       │   └── stat-card.component.ts
    │   │       └── toast-container/
    │   │           └── toast-container.component.ts
    │   ├── global_styles.css              # Global styles
    │   └── index.html
    │
    ├── angular.json
    ├── package.json
    ├── tailwind.config.js
    └── tsconfig.json
```

---

## 🏗️ Architecture

### Backend: Clean Architecture
- **Separation of Concerns**: Each AI agent is self-contained
- **Interface-based Design**: Services depend on interfaces for testability
- **Shared Infrastructure**: Common services like GeminiClient
- **Dependency Injection**: All services registered in Program.cs

### Frontend: Feature-based Architecture
- **Core**: Shared services (auth, AI, theme, toast, transactions), models, and configuration
- **Features**: Independent feature modules (dashboard, transactions, AI assistant, etc.)
- **Shared**: Reusable UI components (icons, charts, progress rings, stat cards, animated counters)
- **Layout**: Shell components (sidebar, topbar, command palette)
- **State Management**: Use of **Angular Signals** (`signal`, `computed`, `effect`) for reactive state

---

## 🔧 Technology Stack

### Backend
- **Framework**: .NET 10.0
- **Runtime**: ASP.NET Core Web API
- **Database**: SQL Server / LocalDB
- **ORM**: Entity Framework Core
- **Authentication**: JWT Bearer + Identity
- **AI**: Google Gemini API

### Frontend
- **Framework**: Angular 21
- **Language**: TypeScript
- **Styling**: Tailwind CSS (3.4+)
- **Component Library**: PrimeNG 21
- **Charts**: Custom SVG charts + Chart.js + PrimeNG ChartModule
- **State Management**: Angular Signals (`signal`, `computed`, `effect`)
- **OCR**: Puter.js SDK v2 (browser-based) + Gemini Vision (backend fallback)
- **Icons**: Inline SVG icons via shared IconComponent

---

## 📊 Database Schema

### TransactionModel
```csharp
public class TransactionModel
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public TransactionType Type { get; set; }        // Income or Expense
    public TransactionCategory Category { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public string UserId { get; set; }
}
```

### Transaction Categories
Salary, Bonus, Freelance, Investment, Food, Travel, Shopping, Fuel, Rent, Housing, Medical, Entertainment, Bills, Education, Groceries, Utilities, Dining, Insurance, Transportation, Health, Gifts, Savings, Healthcare, Other

---

## 🚦 Getting Started

### Prerequisites
- **.NET 10.0 SDK** — [Download](https://dotnet.microsoft.com/download)
- **SQL Server / LocalDB** — [Download](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
- **Node.js** (18+) and npm — [Download](https://nodejs.org/)
- **Google Gemini API key** — [Get a key](https://aistudio.google.com/)
- **Angular CLI** — `npm install -g @angular/cli`

### Installation

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd PersonalFinanceTracker
```

#### 2. Backend Setup
```bash
cd PersonalFinanceTrackerAPI

# Update appsettings.json with your configuration:
#   - Database connection strings (DefaultConnection)
#   - JWT settings (Key, Issuer, Audience)
#   - Gemini API key (Gemini:ApiKey)

# Restore dependencies
dotnet restore

# Run database migrations
dotnet ef database update --project PersonalFinanceTrackerAPI

# Run the API
dotnet run --project PersonalFinanceTrackerAPI
```

> The API will be available at `https://localhost:7100`.
>
> Swagger UI: `https://localhost:7100/swagger`

#### 3. Frontend Setup
```bash
cd PersonalFinanceTrackerUI

# Install dependencies
npm install

# If your backend runs on a different port, update the API base URL:
#   Edit src/app/core/config/api.config.ts (API_CONFIG.baseUrl)

# Run development server
ng serve
```

> The UI will be available at `http://localhost:4200`.
>
> Open your browser and go to `http://localhost:4200`.

---

## 🔑 Authentication

### Backend Authentication Flow
1. **Register**: `POST /api/Auth/register` with email, password, userName, phoneNumber
2. **Login**: `POST /api/Auth/login` with email and password
3. **Receive JWT Token**: Token returned in response
4. **Include Token**: Add `Authorization: Bearer <token>` header to all requests

### Frontend Authentication
- **Login/Signup Page**: Server-rendered split UI with theme toggle
- **Auth Service** (`auth.service.ts`): Uses Angular signals; stores JWT and user profile in localStorage
- **Route Guard** (`auth.guard.ts`): Protects `/app` routes — redirects unauthenticated users to `/login`
- **HTTP Interceptor** (`auth.interceptor.ts`): Automatically attaches Bearer token to HTTP requests
- **Profile Management**: Fetch/update profile, change password from Settings

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/Auth/register` | User registration |
| POST | `/api/Auth/login` | User login |
| GET | `/api/Auth/me` | Get current user profile |
| PUT | `/api/Auth/me` | Update user profile |
| PUT | `/api/Auth/me/change-password` | Change password |
| GET | `/api/Auth/me/dashboard` | Dashboard stats |
| GET | `/api/Auth/me/spending-by-category` | Spending by category |
| GET | `/api/Auth/me/monthly-summary` | Monthly income/expense summary |

### Transaction Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transaction` | Get all transactions |
| GET | `/api/transaction/{id}` | Get transaction by ID |
| POST | `/api/transaction` | Create transaction |
| PUT | `/api/transaction/{id}` | Update transaction |
| DELETE | `/api/transaction/{id}` | Delete transaction |
| GET | `/api/transaction/user/{userId}` | Get transactions by user |
| GET | `/api/transaction/type/{type}` | Get transactions by type |
| GET | `/api/transaction/category/{category}` | Get transactions by category |
| GET | `/api/transaction/date-range?startDate=&endDate=` | Get transactions by date range |
| GET | `/api/transaction/filtered?page=&pageSize=&type=&category=&startDate=&endDate=&search=&sortBy=&sortOrder=` | Filter, paginate, sort |

### AI Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/create-transaction` | Create transactions via NLP |
| POST | `/api/ai/process-document` | Process document (receipt/bill) via Gemini Vision |
| GET | `/api/ai/insights?months=3` | Generate spending insights |
| POST | `/api/ai/budget-goal` | Get budget recommendations |
| GET | `/api/ai/detect-anomalies?months=3` | Detect anomalies |

### AI History & Retrieval
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai/insights/history?limit=&includeArchived=` | Past AI insight sets |
| GET | `/api/ai/budget-goal/history?limit=&includeArchived=` | Past budget goal sets |
| GET | `/api/ai/detect-anomalies/history?limit=&includeArchived=` | Past anomaly sets |
| GET | `/api/ai/analysis-runs?limit=&agentType=` | Central audit trail |
| GET | `/api/ai/budget-goal/active` | Current active budget goal |
| PUT | `/api/ai/budget-goal/{id}/activate` | Set active budget goal |
| DELETE | `/api/ai/insights/{id}/archive` | Soft-delete insight |
| DELETE | `/api/ai/budget-goal/{id}/archive` | Soft-delete budget goal |
| DELETE | `/api/ai/detect-anomalies/{id}/archive` | Soft-delete anomaly result |

---

## 🎨 Frontend Features

### Dashboard
- **Health Score**: Visual progress ring with glowing effect
- **Stat Cards**: Animated counters for Income, Expenses, Savings, Transaction Count
- **Charts**: Custom SVG area/bar charts for monthly trends and category breakdown
- **Quick Actions**: "Smart AI Entry" and "Budget" shortcut buttons
- **Recent Transactions**: Latest transactions with category badges

### Smart AI Entry
- **Text-based NLP Entry**: Type natural language to create transactions
- **Document Upload**:
  - Drag-and-drop or click to browse
  - Supported formats: **JPG, JPEG, PNG, WebP, PDF**
  - **Puter OCR** (browser-based) as primary extraction method
  - **Gemini Vision** (backend) as fallback or manual override
  - Toggle between extraction modes via UI
- **Auto-Save**: Parsed/extracted transactions are saved automatically to the database
- **Inline Editing**: Edit (description, category, type, amount, date) or delete parsed transactions directly
- **Example Inputs**: Quick-start chips with suggested phrases

### Transactions
- **Pagination**: 10 / 25 / 50 / 100 items per page
- **Quick Filters**: Recent, This Month, Last Month, Last 3 Months, Income, Expenses
- **Advanced Filters**: Category, date range, search, type
- **Sorting**: Newest, Oldest, Highest Amount, Lowest Amount, Category A–Z, Category Z–A
- **Summary Cards**: Transaction count, total income, total expenses, net balance

### Budget Planning
- **Goal Setting**: Target savings and timeframe
- **Plan Types**: Focused or Balanced
- **AI Recommendations**: Category-wise reduction plans with priorities
- **Feasibility Scoring**: 0–100 achievability rating with confidence level
- **Alternative Plans**: Revised targets, income gap, extended timeline for unfeasible goals
- **Active Goal Tracking**: Save, activate, and persist budget goals
- **History**: View past budget goal recommendations

### AI Insights & Anomalies
- **Insight Types**: Positive, Warning, Trend, Risk, Recommendation, Savings Opportunity, Cash Flow
- **Anomaly Classification**: Spike, Unusual Category, Duplicate with severity (High/Medium/Low)
- **History**: Browse past analysis runs with archive/unarchive support

### Theme & UX
- **Dark/Light Mode**: Toggle in topbar or login page; persists to localStorage
- **Command Palette (⌘K)**: Search pages and actions with keyboard navigation
- **Toast Notifications**: Success/error/warning/info feedback

### Settings
- **Profile Management**: Update full name, email, phone number
- **Change Password**: Securely update account password

---

## 🔒 Security

- JWT-based authentication with route guards
- HTTP interceptor for automatic token attachment
- User-specific data isolation
- Secure password hashing with Identity
- HTTPS enforcement in production
- Change password and profile update validation

---

## 🧩 Clean Architecture Benefits

1. **Maintainability**: Each AI agent is independent
2. **Testability**: Interface-based design enables unit testing
3. **Scalability**: Easy to add new AI agents
4. **Reusability**: Shared components reduce duplication
5. **Flexibility**: Easy to swap AI providers

---

## 📝 Development Notes

### Adding a New AI Agent (Backend)
1. Create folder under `PersonalFinanceTrackerAPI/Services/AI/Agents/YourAgent/`
2. Add DTOs in `DTOs/` subfolder
3. Create service interface in `Services/Interfaces/AI/`
4. Implement the service
5. Register in `Program.cs`
6. Add endpoint in `AiController.cs`

### Adding a New Feature (Frontend)
1. Create feature folder under `PersonalFinanceTrackerUI/src/app/features/`
2. Add component file (e.g., `your-feature.component.ts`)
3. Register route in `app.routes.ts`
4. Add navigation item in `sidebar.component.ts`
5. Create shared components if needed in `shared/`

### Document Extraction Flow
1. User uploads a file (JPG/PNG/WebP/PDF) in Smart AI Entry
2. **Primary path**: Puter.js OCR extracts text in the browser → sends text to NLP endpoint
3. **Fallback path**: If Puter fails/timeouts → backend Gemini Vision processes the file → returns transactions
4. Extracted transactions are auto-saved and shown in an editable table

### Adding Transaction Categories
Update the `TransactionCategory` enum in `PersonalFinanceTrackerAPI/Models/TransactionCategory.cs`. The NLP agent will automatically recognize new categories.

---

## 🐛 Known Issues

- SeedDb cleanup may fail if Visual Studio locks files
- Gemini AI responses may vary; fallback logic handles failures
- Anomaly detection requires at least 3 transactions per category for statistical significance
- Puter.js OCR requires internet connection and may time out on large documents
- Social login providers (Google/Apple/GitHub) are UI-only placeholders

---

## 📄 License

This project is created for educational purposes.

## 👤 Author

Built with ❤️ using Angular, .NET, and AI

---

## 🔗 Quick Links

- **Backend Documentation**: See [PersonalFinanceTrackerAPI/Readme.md](PersonalFinanceTrackerAPI/Readme.md) for detailed API documentation
- **Frontend Development**: Run `ng serve` in `PersonalFinanceTrackerUI/` directory (`http://localhost:4200`)
- **Backend Development**: Run `dotnet run` in `PersonalFinanceTrackerAPI/` directory (`https://localhost:7100`)
- **Swagger UI**: Available at `https://localhost:7100/swagger` when backend is running

---

## 🎯 Key Features Explained

### 1. Statistical Anomaly Detection
The `StatisticalDetectionEngine` uses:
- **Z-Score Analysis**: Identifies transactions that deviate significantly from category averages
- **Duplicate Detection**: Flags potential duplicate transactions
- **Unusual Category Spending**: Detects out-of-pattern spending

### 2. Goal Gap Analysis
The `GoalGapAnalysisEngine` provides:
- **Feasibility Scoring**: 0–100 score based on savings gap and timeline
- **Category-wise Reductions**: Proportional reduction recommendations
- **Priority Classification**: High/Medium/Low based on impact
- **Plan Types**: Focused vs Balanced saving strategies
- **Unfeasibility Handling**: Revised targets, income gap, extended timeline suggestions

### 3. Natural Language Processing
The NLP agent:
- Parses natural language text to extract transaction details
- Identifies amount, description, and transaction type
- Maps to appropriate categories using AI
- Supports multiple transactions in one sentence

### 4. Document Processing (Dual OCR Pipeline)
The document extraction pipeline:
- **Puter.js OCR**: Client-side OCR via `puter.ai.img2txt` SDK v2
- **Gemini Vision**: Backend fallback via `/api/ai/process-document`
- **Smart Fallback**: Automatically falls back if Puter returns empty/fails
- **Manual Override**: User can toggle extraction mode directly in the UI

### 5. AI History & Audit Trail
The history system:
- Persists all AI analysis runs (insights, budget goals, anomalies)
- Provides `analysis-runs` central audit trail
- Supports archiving/unarchiving and activating budget goals
- Enables review of past recommendations

### 6. AI State Management
The `AiStateService`:
- Caches AI results (insights, anomalies, budget goals, reports) in sessionStorage
- Enables cross-component data sharing without re-fetching
- Provides typed keys and clear/reset functionality

### 7. Transactions with Pagination & Filtering
The transactions module:
- Server-side pagination (10/25/50/100 per page)
- Multiple quick filters (recent, this month, last month, last 3 months, income, expenses)
- Advanced filters (category, date range, search, type)
- Six sorting options
- Summary cards with income/expense/balance totals

### 8. Dark/Light Theme
The `ThemeService`:
- Uses Angular signals with computed `isDark` state
- Persists theme preference to localStorage
- Detects system preference (`prefers-color-scheme`) as default
- Toggles `dark` class on the document root for Tailwind dark mode

### 9. Command Palette
The command palette:
- Opens via **⌘K** shortcut or search button in the topbar
- Filters pages/actions in real time
- Keyboard navigation (↑↓ to move, ↵ to select, ESC to close)
- All main routes available as quick actions