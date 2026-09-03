import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, from } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, UserProfile, UpdateProfileRequest, ChangePasswordRequest } from '../models/transaction.model';
import { API_CONFIG, TOKEN_KEY } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<UserProfile | null>(null);
  private readonly _token = signal<string | null>(null);
  private readonly _isAuthenticated = computed(() => !!this._token() && !!this._user());

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = this._isAuthenticated;

  constructor(private http: HttpClient, private router: Router) {
    this._initFromStorage();
  }

  private _initFromStorage() {
    const stored = localStorage.getItem(TOKEN_KEY);
    const userProfile = localStorage.getItem('finance_tracker_user');
    if (stored) {
      this._token.set(stored);
      if (userProfile) {
        try {
          this._user.set(JSON.parse(userProfile));
        } catch {}
      }
      this._refreshProfile();
    }
  }

  private _setSession(token: string) {
    this._token.set(token);
    localStorage.setItem(TOKEN_KEY, token);
    this._user.set(null);
    localStorage.removeItem('finance_tracker_user');
  }

  setSession(token: string) {
    this._setSession(token);
    this._refreshProfile();
  }

  private _refreshProfile() {
    if (!this._token()) return;

    this.getProfile().subscribe({
      error: () => {
        // Ignore profile refresh failures here; authenticated routes will handle API errors.
      },
    });
  }

  login(request: LoginRequest) {
    return this.http.post<AuthResponse>(`${API_CONFIG.baseUrl}${API_CONFIG.auth.login}`, request).pipe(
      tap(res => {
        if (res.isSuccess && res.token) {
          this._setSession(res.token);
          this._refreshProfile();
        }
      })
    );
  }

  register(request: RegisterRequest) {
    return this.http.post<AuthResponse>(`${API_CONFIG.baseUrl}${API_CONFIG.auth.register}`, request).pipe(
      tap(res => {
        if (res.isSuccess && res.token) {
          this._setSession(res.token);
          this._refreshProfile();
        }
      })
    );
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('finance_tracker_user');
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getProfile() {
    return from(
      fetch(`${API_CONFIG.baseUrl}${API_CONFIG.auth.me}`, {
        headers: this._token()
          ? {
              Authorization: `Bearer ${this._token()}`,
            }
          : undefined,
      }).then(async response => {
        const text = await response.text();
        if (!response.ok) {
          throw new Error(text || `Request failed with status ${response.status}`);
        }
        const user = JSON.parse(text) as UserProfile;
        this._user.set(user);
        localStorage.setItem('finance_tracker_user', JSON.stringify(user));
        return user;
      })
    );
  }

  updateProfile(request: UpdateProfileRequest) {
    return from(
      fetch(`${API_CONFIG.baseUrl}${API_CONFIG.auth.updateProfile}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(this._token() ? { Authorization: `Bearer ${this._token()}` } : {}),
        },
        body: JSON.stringify(request),
      }).then(async response => {
        const text = await response.text();
        if (!response.ok) {
          throw new Error(text || `Request failed with status ${response.status}`);
        }
        const res = JSON.parse(text) as { message: string; userName: string; email: string; phoneNumber?: string };
        this._user.update(u => {
          if (!u) return null;
          const next: UserProfile = { ...u };
          if (res.userName) next.userName = res.userName;
          if (res.email) next.email = res.email;
          if (res.phoneNumber) next.phoneNumber = res.phoneNumber;
          return next;
        });
        if (this._user()) localStorage.setItem('finance_tracker_user', JSON.stringify(this._user()));
        return res;
      })
    );
  }

  changePassword(request: ChangePasswordRequest) {
    return from(
      fetch(`${API_CONFIG.baseUrl}${API_CONFIG.auth.changePassword}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(this._token() ? { Authorization: `Bearer ${this._token()}` } : {}),
        },
        body: JSON.stringify(request),
      }).then(async response => {
        const text = await response.text();
        if (!response.ok) {
          throw new Error(text || `Request failed with status ${response.status}`);
        }
        return JSON.parse(text) as { message: string };
      })
    );
  }

  getDashboard() {
    return this.http.get<{ totalIncome: number; totalExpense: number; balance: number; transactionCount: number }>(
      `${API_CONFIG.baseUrl}${API_CONFIG.auth.dashboard}`
    );
  }

  getSpendingByCategory() {
    return this.http.get<Array<{ category: string; total: number; count: number }>>(
      `${API_CONFIG.baseUrl}${API_CONFIG.auth.spendingByCategory}`
    );
  }

  getMonthlySummary() {
    return this.http.get<Array<{ year: number; month: number; income: number; expense: number; count: number }>>(
      `${API_CONFIG.baseUrl}${API_CONFIG.auth.monthlySummary}`
    );
  }

  getToken(): string | null {
    return this._token();
  }
}