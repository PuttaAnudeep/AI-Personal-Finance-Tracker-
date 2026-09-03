import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { Transaction, CreateTransactionRequest, PaginatedTransactionResponse, TransactionFilters } from '../models/transaction.model';
import { API_CONFIG } from '../config/api.config';
import { AuthService } from '../authentication/auth.service';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  constructor(private auth: AuthService) {}

  private requestJson<T>(url: string, init?: RequestInit): Observable<T> {
    const token = this.auth.getToken();

    return from(
      fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(init?.headers ?? {}),
        },
      }).then(async response => {
        const text = await response.text();

        if (!response.ok) {
          throw new Error(text || `Request failed with status ${response.status}`);
        }

        return text ? (JSON.parse(text) as T) : (undefined as T);
      })
    );
  }

  getAll(): Observable<Transaction[]> {
    return this.requestJson<Transaction[]>(`${API_CONFIG.baseUrl}${API_CONFIG.transactions.base}`);
  }

  getById(id: number): Observable<Transaction> {
    return this.requestJson<Transaction>(`${API_CONFIG.baseUrl}${API_CONFIG.transactions.byId(id)}`);
  }

  create(dto: CreateTransactionRequest): Observable<Transaction> {
    return this.requestJson<Transaction>(`${API_CONFIG.baseUrl}${API_CONFIG.transactions.base}`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  update(id: number, dto: CreateTransactionRequest): Observable<Transaction> {
    return this.requestJson<Transaction>(`${API_CONFIG.baseUrl}${API_CONFIG.transactions.byId(id)}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  delete(id: number): Observable<void> {
    return this.requestJson<void>(`${API_CONFIG.baseUrl}${API_CONFIG.transactions.byId(id)}`, {
      method: 'DELETE',
    });
  }

  getByType(type: string): Observable<Transaction[]> {
    return this.requestJson<Transaction[]>(`${API_CONFIG.baseUrl}${API_CONFIG.transactions.byType(type)}`);
  }

  getByCategory(category: string): Observable<Transaction[]> {
    return this.requestJson<Transaction[]>(`${API_CONFIG.baseUrl}${API_CONFIG.transactions.byCategory(category)}`);
  }

  getByDateRange(startDate: string, endDate: string): Observable<Transaction[]> {
    const params = new URLSearchParams({ startDate, endDate });
    return this.requestJson<Transaction[]>(`${API_CONFIG.baseUrl}${API_CONFIG.transactions.byDateRange}?${params.toString()}`);
  }

  getFiltered(filters: TransactionFilters): Observable<PaginatedTransactionResponse> {
    const params = new URLSearchParams();
    
    params.append('page', (filters.page || 1).toString());
    params.append('pageSize', (filters.pageSize || 10).toString());
    if (filters.type) params.append('type', filters.type);
    if (filters.category) params.append('category', filters.category);
    if (filters.startDate && filters.startDate.trim() !== '') params.append('startDate', filters.startDate);
    if (filters.endDate && filters.endDate.trim() !== '') params.append('endDate', filters.endDate);
    if (filters.search) params.append('search', filters.search);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    return this.requestJson<PaginatedTransactionResponse>(
      `${API_CONFIG.baseUrl}${API_CONFIG.transactions.filtered}?${params.toString()}`
    );
  }
}
