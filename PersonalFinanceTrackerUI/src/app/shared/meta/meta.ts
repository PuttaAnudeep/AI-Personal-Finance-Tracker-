import { TransactionCategory, InsightType, Severity, Priority } from '../../core/models/models';
import { IconName } from '../icon/icon.component';

export interface CategoryMeta {
  label: string;
  icon: IconName;
  color: string;
  bg: string;
}

const CATEGORY_ICONS: Record<TransactionCategory, IconName> = {
  Salary: 'banknote', Bonus: 'gift', Freelance: 'wallet', Investment: 'trending-up',
  Food: 'utensils', Travel: 'plane', Shopping: 'shopping', Fuel: 'car', Rent: 'home', Housing: 'home',
  Medical: 'stethoscope', Entertainment: 'film', Bills: 'receipt', Education: 'graduation',
  Groceries: 'shopping', Utilities: 'zap', Dining: 'utensils', Insurance: 'shield',
  Transportation: 'car', Health: 'heart', Gifts: 'gift', Savings: 'piggy-bank',
  Healthcare: 'stethoscope', Other: 'tag',
};

const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  Salary: '#22C55E', Bonus: '#16A34A', Freelance: '#06B6D4', Investment: '#3B82F6',
  Food: '#F59E0B', Travel: '#0EA5E9', Shopping: '#EC4899', Fuel: '#EF4444', Rent: '#8B5CF6', Housing: '#7C3AED',
  Medical: '#EF4444', Entertainment: '#F43F5E', Bills: '#14B8A6', Education: '#3B82F6',
  Groceries: '#84CC16', Utilities: '#06B6D4', Dining: '#F97316', Insurance: '#6366F1',
  Transportation: '#0EA5E9', Health: '#22C55E', Gifts: '#EC4899', Savings: '#10B981',
  Healthcare: '#DC2626', Other: '#64748B',
};

export function categoryMeta(cat: TransactionCategory): CategoryMeta {
  const color = CATEGORY_COLORS[cat] ?? '#64748B';
  return {
    label: cat,
    icon: CATEGORY_ICONS[cat] ?? 'tag',
    color,
    bg: `${color}1A`,
  };
}

export interface InsightMeta {
  label: string;
  icon: IconName;
  color: string;
  bg: string;
  border: string;
}

export function insightMeta(type: InsightType): InsightMeta {
  const map: Record<InsightType, InsightMeta> = {
    Positive: { label: 'Positive', icon: 'check-circle', color: '#16A34A', bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.30)' },
    Warning: { label: 'Warning', icon: 'alert-triangle', color: '#D97706', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)' },
    Trend: { label: 'Trend', icon: 'trending-up', color: '#0891B2', bg: 'rgba(6,182,212,0.10)', border: 'rgba(6,182,212,0.30)' },
    Risk: { label: 'Risk', icon: 'alert-triangle', color: '#DC2626', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.30)' },
    Recommendation: { label: 'Recommendation', icon: 'lightbulb', color: '#4F46E5', bg: 'rgba(79,70,229,0.10)', border: 'rgba(79,70,229,0.30)' },
    SavingsOpportunity: { label: 'Savings Opportunity', icon: 'piggy-bank', color: '#059669', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.30)' },
    CashFlow: { label: 'Cash Flow', icon: 'activity', color: '#7C3AED', bg: 'rgba(124,58,237,0.10)', border: 'rgba(124,58,237,0.30)' },
  };
  return map[type];
}

export function severityMeta(s: Severity): { color: string; bg: string; label: string } {
  if (s === 'High') return { color: '#DC2626', bg: 'rgba(239,68,68,0.12)', label: 'High' };
  if (s === 'Medium') return { color: '#D97706', bg: 'rgba(245,158,11,0.12)', label: 'Medium' };
  return { color: '#0891B2', bg: 'rgba(6,182,212,0.12)', label: 'Low' };
}

export function priorityMeta(p: Priority): { color: string; bg: string } {
  if (p === 'High') return { color: '#DC2626', bg: 'rgba(239,68,68,0.12)' };
  if (p === 'Medium') return { color: '#D97706', bg: 'rgba(245,158,11,0.12)' };
  return { color: '#0891B2', bg: 'rgba(6,182,212,0.12)' };
}

export const ALL_CATEGORIES: TransactionCategory[] = [
  'Salary', 'Bonus', 'Freelance', 'Investment',
  'Food', 'Travel', 'Shopping', 'Fuel', 'Rent', 'Housing',
  'Medical', 'Entertainment', 'Bills', 'Education',
  'Groceries', 'Utilities', 'Dining', 'Insurance',
  'Transportation', 'Health', 'Gifts', 'Savings',
  'Healthcare', 'Other',
];

export const EXPENSE_CATEGORIES: TransactionCategory[] = ALL_CATEGORIES.filter(c => !['Salary', 'Bonus', 'Freelance', 'Investment'].includes(c));
