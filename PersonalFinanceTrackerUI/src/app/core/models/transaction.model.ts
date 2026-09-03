export type TransactionType = 'Income' | 'Expense';
export type TransactionCategory =
  | 'Food'
  | 'Dining'
  | 'Groceries'
  | 'Shopping'
  | 'Travel'
  | 'Fuel'
  | 'Rent'
  | 'Medical'
  | 'Entertainment'
  | 'Utilities'
  | 'Bills'
  | 'Salary'
  | 'Bonus'
  | 'Freelance'
  | 'Investment'
  | 'Education'
  | 'Gifts'
  | 'Savings'
  | 'Other';

export interface Transaction {
  id: number;
  date: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description?: string;
  userId: string;
}

export interface CreateTransactionRequest {
  date: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description?: string;
}

export type SortField = 'date' | 'amount' | 'category';

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactionCount: number;
}

export interface PaginatedTransactionResponse {
  items: Transaction[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: TransactionSummary;
}

export interface TransactionFilters {
  page?: number;
  pageSize?: number;
  type?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: SortField;
  sortOrder?: 'asc' | 'desc';
}

export interface SortOption {
  value: string;
  label: string;
  sortBy: SortField;
  sortOrder: 'asc' | 'desc';
}

export const SORT_OPTIONS: SortOption[] = [
  { value: 'newest', label: 'Newest First', sortBy: 'date', sortOrder: 'desc' },
  { value: 'oldest', label: 'Oldest First', sortBy: 'date', sortOrder: 'asc' },
  { value: 'highest', label: 'Highest Amount', sortBy: 'amount', sortOrder: 'desc' },
  { value: 'lowest', label: 'Lowest Amount', sortBy: 'amount', sortOrder: 'asc' },
  { value: 'category-asc', label: 'Category A-Z', sortBy: 'category', sortOrder: 'asc' },
  { value: 'category-desc', label: 'Category Z-A', sortBy: 'category', sortOrder: 'desc' },
];

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export interface AuthResponse {
  isSuccess: boolean;
  message: string;
  token?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  userName?: string;
  phoneNumber?: string;
}

export interface UserProfile {
  id: string;
  userName: string;
  email: string;
  phoneNumber?: string;
}

export interface UpdateProfileRequest {
  userName?: string;
  phoneNumber?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

export interface SpendingByCategory {
  category: string;
  total: number;
  count: number;
}

export interface MonthlySummary {
  year: number;
  month: number;
  income: number;
  expense: number;
  count: number;
}