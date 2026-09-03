import { Injectable } from '@angular/core';
import { SpendingInsight } from '../models/models';
import { Anomaly } from '../models/models';
import { BudgetGoalResponse } from '../models/models';
import { Transaction } from '../models/transaction.model';

export interface ReportsState {
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
}

@Injectable({ providedIn: 'root' })
export class AiStateService {
  private cache = new Map<string, any>();

  constructor() {
    this.hydrateFromSessionStorage();
  }

  private hydrateFromSessionStorage(): void {
    try {
      const raw = sessionStorage.getItem('ai_state_cache');
      if (raw) {
        const entries: [string, any][] = JSON.parse(raw);
        entries.forEach(([k, v]) => this.cache.set(k, v));
      }
    } catch {
      // ignore parse errors
    }
  }

  private persistToSessionStorage(): void {
    try {
      const entries: [string, any][] = Array.from(this.cache.entries());
      sessionStorage.setItem('ai_state_cache', JSON.stringify(entries));
    } catch {
      // ignore storage errors
    }
  }

  set<T>(key: string, value: T): void {
    this.cache.set(key, value);
    this.persistToSessionStorage();
  }

  get<T>(key: string): T | undefined {
    return this.cache.get(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
    this.persistToSessionStorage();
  }
}

export const AI_STATE_KEYS = {
  INSIGHTS: 'insights',
  ANOMALIES: 'anomalies',
  BUDGET_GOAL: 'budget_goal',
  REPORTS: 'reports',
} as const;