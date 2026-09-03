import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { DashboardStats, SpendingByCategory, MonthlySummary, Transaction } from '../../../core/models/transaction.model';
import { API_CONFIG } from '../../../core/config/api.config';
import { AuthService } from '../../../core/authentication/auth.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private auth: AuthService) {}

  private requestJson<T>(url: string): Observable<T> {
    const token = this.auth.getToken();

    return from(
      fetch(url, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      }).then(async response => {
        const text = await response.text();

        if (!response.ok) {
          throw new Error(text || `Request failed with status ${response.status}`);
        }

        return JSON.parse(text) as T;
      })
    );
  }

  getStats(): Observable<DashboardStats> {
    return this.requestJson<DashboardStats>(`${API_CONFIG.baseUrl}${API_CONFIG.auth.dashboard}`);
  }

  getSpendingByCategory(): Observable<SpendingByCategory[]> {
    return this.requestJson<SpendingByCategory[]>(`${API_CONFIG.baseUrl}${API_CONFIG.auth.spendingByCategory}`);
  }

  getMonthlySummary(): Observable<MonthlySummary[]> {
    return this.requestJson<MonthlySummary[]>(`${API_CONFIG.baseUrl}${API_CONFIG.auth.monthlySummary}`);
  }

  getRecentTransactions(): Observable<Transaction[]> {
    return this.requestJson<Transaction[]>(`${API_CONFIG.baseUrl}${API_CONFIG.transactions.base}`);
  }
}