import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { IconComponent } from '../../shared/icon/icon.component';
import { StatCardComponent } from '../../shared/stat-card/stat-card.component';
import { TransactionService } from '../../core/services/transaction.service';
import { AiStateService, AI_STATE_KEYS } from '../../core/services/ai-state.service';
import { ToastService } from '../../core/services/toast.service';
import { Transaction } from '../../core/models/transaction.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, IconComponent, StatCardComponent],
  template: `
    <div class="space-y-6">
      <!-- Header Section -->
      <section class="header-gradient relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 p-6 text-white shadow-lg">
        <div class="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
        <div class="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
        
        <div class="relative">
          <h2 class="text-2xl font-bold font-display tracking-tight">Reports</h2>
          <p class="mt-1 text-sm text-white/80">Generate and view financial reports</p>
        </div>
      </section>

      <!-- Control Panel -->
      <section class="card p-5">
        <div class="flex flex-wrap items-end gap-3">
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1.5 block">Start Date</label>
            <input type="date" class="input font-medium" [(ngModel)]="startDate" name="startDate" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1.5 block">End Date</label>
            <input type="date" class="input font-medium" [(ngModel)]="endDate" name="endDate" />
          </div>
          <button class="btn-primary shadow-md hover:shadow-lg transition-all duration-200" (click)="load()" [disabled]="loading">
            @if (loading) {
              <span class="inline-flex items-center gap-2">
                <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            } @else {
              <span class="inline-flex items-center gap-2">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Generate Report
              </span>
            }
          </button>
          <button class="btn-ghost shadow-sm hover:shadow-md transition-all" (click)="exportCsv()" [disabled]="!transactions.length">
            <span class="inline-flex items-center gap-2">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Export CSV
            </span>
          </button>
        </div>
      </section>

      <div *ngIf="!loading && !error && transactions.length > 0">
        <section class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <app-stat-card label="Total Income" subtitle="Period" [value]="totalIncome" icon="trending-up" iconBg="rgba(34,197,94,0.12)" iconColor="#16A34A" [trend]="0" [formatter]="curFmt" footer="selected period" />
          <app-stat-card label="Total Expenses" subtitle="Period" [value]="totalExpense" icon="trending-up" iconBg="rgba(239,68,68,0.12)" iconColor="#DC2626" [trend]="0" [formatter]="curFmt" footer="selected period" />
          <app-stat-card label="Net Balance" subtitle="Period" [value]="totalIncome - totalExpense" icon="wallet" iconBg="rgba(99,102,241,0.12)" iconColor="#4F46E5" [trend]="0" [formatter]="curFmt" footer="selected period" />
        </section>

        <section class="card overflow-hidden">
          <div class="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 class="font-semibold text-gray-900">Transaction List ({{ transactions.length }})</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left bg-gray-50/50">
                  <th class="pb-3 pl-5 pr-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th class="pb-3 pr-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                  <th class="pb-3 pr-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                  <th class="pb-3 pr-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                  <th class="pb-3 pr-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let t of transactions" class="border-b last:border-b-0 hover:bg-gray-50/50 transition-colors">
                  <td class="py-3 pl-5 pr-2 text-xs text-muted">{{ formatDate(t.date) }}</td>
                  <td class="py-3 pr-2 text-sm">{{ t.description || '-' }}</td>
                  <td class="py-3 pr-2">
                    <span class="inline-flex px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                      {{ t.category }}
                    </span>
                  </td>
                  <td class="py-3 pr-2">
                    <span class="inline-flex px-2.5 py-1 rounded-md text-xs font-medium"
                          [class.bg-green-100]="t.type === 'Income'"
                          [class.text-green-700]="t.type === 'Income'"
                          [class.bg-red-100]="t.type === 'Expense'"
                          [class.text-red-700]="t.type === 'Expense'">
                      {{ t.type }}
                    </span>
                  </td>
                  <td class="py-3 pr-5 text-right text-sm font-semibold" [style.color]="t.type === 'Income' ? '#16A34A' : 'var(--text)'">
                    {{ t.type === 'Income' ? '+' : '−' }}{{ t.amount | currency:'INR':'symbol':'1.0-0' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div *ngIf="!loading && error" class="card p-6 text-center">
        <div class="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
          <app-icon name="alert-triangle" [size]="28" class="text-warning" />
        </div>
        <h3 class="font-semibold mb-1">Failed to load report</h3>
        <p class="text-sm text-muted">{{ error }}</p>
      </div>

      <div *ngIf="!loading && !error && transactions.length === 0" class="card p-6 text-center">
        <div class="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
          <app-icon name="file-text" [size]="28" class="text-primary-600" />
        </div>
        <h3 class="font-semibold mb-1">No transactions found</h3>
        <p class="text-sm text-muted">Select a date range and click Generate Report.</p>
      </div>
    </div>
  `,
})
export class ReportsComponent {
  private cdr = inject(ChangeDetectorRef);
  private txnService = inject(TransactionService);
  private aiState = inject(AiStateService);
  private toast = inject(ToastService);

  loading = false;
  error = '';
  transactions: Transaction[] = [];
  loaded = false;

  constructor() {
    const cached = this.aiState.get<{transactions: Transaction[]; totalIncome: number; totalExpense: number}>(AI_STATE_KEYS.REPORTS);
    if (cached) {
      this.transactions = cached.transactions;
      this.loaded = true;
    }
  }

  startDate = '';
  endDate = '';

  curFmt = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

  get totalIncome() {
    return this.transactions.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
  }

  get totalExpense() {
    return this.transactions.filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
  }

  ngOnInit() {
    // Set default range: last 30 days (but don't auto-load)
    const now = new Date();
    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    this.startDate = past.toISOString().split('T')[0];
    this.endDate = now.toISOString().split('T')[0];
  }

  load() {
    this.loading = true;
    this.error = '';

    console.log('[Reports] Fetching transactions for date range:', this.startDate, 'to', this.endDate);

    if (this.startDate && this.endDate) {
      this.txnService.getByDateRange(
        new Date(this.startDate).toISOString(),
        new Date(this.endDate).toISOString()
      ).subscribe({
        next: (data) => {
          this.transactions = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          this.loading = false;
          this.loaded = true;
          this.aiState.set(AI_STATE_KEYS.REPORTS, {
            transactions: this.transactions,
            totalIncome: this.totalIncome,
            totalExpense: this.totalExpense,
          });
          this.cdr.detectChanges();

          console.log('[Reports] Transactions received:', data.length);
          console.log('[Reports] Income:', this.totalIncome, 'Expense:', this.totalExpense);
        },
        error: (err) => {
          this.error = err.message || 'Failed to load transactions.';
          this.loading = false;
          this.loaded = true;
          this.cdr.detectChanges();

          console.error('[Reports] API error:', err);

          this.toast.error('Error', this.error);
        },
      });
    } else {
      this.txnService.getAll().subscribe({
        next: (data) => {
          this.transactions = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          this.loading = false;
          this.loaded = true;
          this.aiState.set(AI_STATE_KEYS.REPORTS, {
            transactions: this.transactions,
            totalIncome: this.totalIncome,
            totalExpense: this.totalExpense,
          });
          this.cdr.detectChanges();

          console.log('[Reports] All transactions received:', data.length);
        },
        error: (err) => {
          this.error = err.message || 'Failed to load transactions.';
          this.loading = false;
          this.loaded = true;
          this.cdr.detectChanges();

          console.error('[Reports] API error:', err);

          this.toast.error('Error', this.error);
        },
      });
    }
  }

  exportCsv() {
    console.log('[Reports] Exporting CSV with', this.transactions.length, 'transactions');

    const header = 'Date,Description,Category,Type,Amount\n';
    const rows = this.transactions.map(t =>
      `"${t.date.split('T')[0]}","${(t.description || '').replace(/"/g, '""')}","${t.category}","${t.type}",${t.amount}`
    ).join('\n');
    const csv = header + rows;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-report-${this.startDate || 'all'}-to-${this.endDate || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    this.toast.success('Exported', `${this.transactions.length} transactions exported`);
  }

  formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}