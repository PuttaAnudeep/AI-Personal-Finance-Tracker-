export type TransactionType = 'Income' | 'Expense';

export type TransactionCategory =
  | 'Salary' | 'Bonus' | 'Freelance' | 'Investment'
  | 'Food' | 'Travel' | 'Shopping' | 'Fuel' | 'Rent' | 'Housing'
  | 'Medical' | 'Entertainment' | 'Bills' | 'Education'
  | 'Groceries' | 'Utilities' | 'Dining' | 'Insurance'
  | 'Transportation' | 'Health' | 'Gifts' | 'Savings'
  | 'Healthcare' | 'Other';

export interface Transaction {
  id: number;
  date: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string;
  userId: string;
}

export type InsightType = 'Positive' | 'Warning' | 'Trend' | 'Risk' | 'Recommendation' | 'SavingsOpportunity' | 'CashFlow';

export interface SpendingInsight {
  type: InsightType;
  category: string;
  insight: string;
  generatedAt: string;
}

export type Severity = 'High' | 'Medium' | 'Low';
export type AnomalyType = 'Spike' | 'UnusualCategory' | 'Duplicate';

export interface Anomaly {
  transactionId: number;
  date: string;
  category: TransactionCategory;
  amount: number;
  averageForCategory: number;
  deviationPercentage: number;
  severity: Severity;
  explanation: string;
  anomalyType: AnomalyType;
}

export interface AnomalySummary {
  totalAnomaliesFound: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  overallInsight: string;
}

export interface AnomalyDetectionResponse {
  anomalies: Anomaly[];
  summary: AnomalySummary;
}

export type Priority = 'High' | 'Medium' | 'Low';

export interface BudgetRecommendation {
  category: TransactionCategory;
  currentSpending: number;
  recommendedSpending: number;
  reductionAmount: number;
  reason: string;
  priority: Priority;
}

export interface BudgetGoalResponse {
  targetSavings: number;
  currentSavings: number;
  /// <summary>Required monthly savings to close the gap: (target - current) / months</summary>
  savingsGap: number;
  /// <summary>Monthly savings target = target / months (display value)</summary>
  monthlySavingsTarget: number;
  currentMonthlySavings: number;
  recommendations: BudgetRecommendation[];
  actionPlan: ActionPlanDTO | null;
  feasibilityScore: number;
  feasibilityLabel: string;
  generatedAt: string;
  dataConfidence: string;          // 'High' | 'Medium' | 'Low'
  remainingGapAfterCuts: number;
  revisedTarget: number | null;    // unfeasible goals only
  incomeGapNeeded: number | null;  // unfeasible goals only
  extendedTimelineNeeded: number | null; // unfeasible goals only
  months: number;
  planType: string;                          // 'Focused' | 'Balanced'
  lifestyleImpact: string;                   // 'Minimal' | 'Moderate' | 'Significant'
  expectedMonthlySavingsFromRecommendations: number;
}

export interface ActionPlanDTO {
  categories: ActionCategory[];
  trackingMethod: string;
  finalMessage: string;
}

export interface ActionCategory {
  category: string;
  actions: string[];
}

export interface BudgetGoalRequest {
  targetSavings: number;
  months: number;
  planType?: string;  // 'Focused' | 'Balanced', defaults to 'Focused'
}

// ================================================================
// AI History Types
// ================================================================
export interface InsightHistoryItem {
  id: number;
  type: InsightType;
  category: string;
  insight: string;
  generatedAt: string;
  months: number;
  source: string;
  agentVersion: string;
}

export interface InsightHistoryResponse {
  analysisRunId: number;
  generatedAt: string;
  agentVersion: string;
  months: number;
  insights: InsightHistoryItem[];
}

export interface BudgetGoalHistoryResponse {
  id: number;
  targetSavings: number;
  currentSavings: number;
  savingsGap: number;
  monthlySavingsTarget: number;
  currentMonthlySavings: number;
  feasibilityScore: number;
  feasibilityLabel: string;
  dataConfidence: string;
  isActive: boolean;
  isArchived: boolean;
  planType: string;
  lifestyleImpact: string;
  expectedMonthlySavingsFromRecommendations: number;
  actionPlanJson: string;
  finalMessage: string;
  trackingMethod: string;
  generatedAt: string;
  months: number;
  remainingGapAfterCuts: number;
  revisedTarget: number | null;
  incomeGapNeeded: number | null;
  extendedTimelineNeeded: number | null;
  agentVersion: string;
  recommendations: BudgetRecommendation[];
}

export interface AnomalyHistoryResponse {
  id: number;
  totalAnomaliesFound: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  overallInsight: string;
  threshold: number;
  months: number;
  generatedAt: string;
  agentVersion: string;
  anomalies: Anomaly[];
}

export interface AnalysisRunHistory {
  id: number;
  agentType: string;
  agentVersion: string;
  generatedAt: string;
}

export interface NlpTransactionRequest {
  text: string;
}

export interface UpcomingBill {
  id: number;
  name: string;
  category: TransactionCategory;
  amount: number;
  dueDate: string;
  status: 'Upcoming' | 'Paid' | 'Overdue';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  joinedAt: string;
  currency: string;
}

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}
