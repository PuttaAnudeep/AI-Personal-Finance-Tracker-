import { Component, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { TransactionService } from '../../core/services/transaction.service';
import { AuthService } from '../../core/authentication/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { Transaction, PaginatedTransactionResponse, TransactionFilters, SORT_OPTIONS, PAGE_SIZE_OPTIONS, SortOption, TransactionSummary } from '../../core/models/transaction.model';
import { categoryMeta } from '../../shared/meta/meta';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [RouterLink, FormsModule, CurrencyPipe, CommonModule, DatePipe, IconComponent],
  template: `
    <div class="space-y-4">
      <!-- Header Section -->
      <section class="header-gradient relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 p-5 text-white shadow-lg">
        <div class="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
        <div class="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
        
        <div class="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold font-display tracking-tight">Transactions</h2>
            <p class="mt-1 text-sm text-white/80">Manage your income and expenses</p>
          </div>
          <button class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-primary-700 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200" (click)="openForm()">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            Add Transaction
          </button>
        </div>
      </section>

      <!-- Summary Stats - Minimal -->
      <section class="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div class="card px-2.5 py-2">
          <p class="text-[10px] font-medium text-muted mb-0.5">Transactions</p>
          <p class="text-base font-bold text-gray-900">{{ summary()?.transactionCount || 0 }}</p>
        </div>
        <div class="card px-2.5 py-2">
          <p class="text-[10px] font-medium text-muted mb-0.5">Income</p>
          <p class="text-base font-bold text-green-600">{{ summary()?.totalIncome | currency:'INR':'symbol':'1.0-0' }}</p>
        </div>
        <div class="card px-2.5 py-2">
          <p class="text-[10px] font-medium text-muted mb-0.5">Expenses</p>
          <p class="text-base font-bold text-red-600">{{ summary()?.totalExpense | currency:'INR':'symbol':'1.0-0' }}</p>
        </div>
        <div class="card px-2.5 py-2">
          <p class="text-[10px] font-medium text-muted mb-0.5">Balance</p>
          <p class="text-base font-bold" [class.text-green-600]="(summary()?.netBalance || 0) >= 0" [class.text-red-600]="(summary()?.netBalance || 0) < 0">
            {{ summary()?.netBalance | currency:'INR':'symbol':'1.0-0' }}
          </p>
        </div>
      </section>

      <!-- Compact Quick Filters -->
      <section class="flex flex-wrap gap-1.5">
        <button class="px-2 py-0.5 rounded text-xs font-medium transition-all"
                [class.bg-primary-600]="activeQuickFilter() === 'recent'" [class.text-white]="activeQuickFilter() === 'recent'"
                [class.bg-gray-100]="activeQuickFilter() !== 'recent'" [class.text-gray-700]="activeQuickFilter() !== 'recent'"
                (click)="applyQuickFilter('recent')">
          Recent
        </button>
        <button class="px-2 py-0.5 rounded text-xs font-medium transition-all"
                [class.bg-primary-600]="activeQuickFilter() === 'thisMonth'" [class.text-white]="activeQuickFilter() === 'thisMonth'"
                [class.bg-gray-100]="activeQuickFilter() !== 'thisMonth'" [class.text-gray-700]="activeQuickFilter() !== 'thisMonth'"
                (click)="applyQuickFilter('thisMonth')">
          This Month
        </button>
        <button class="px-2 py-0.5 rounded text-xs font-medium transition-all"
                [class.bg-primary-600]="activeQuickFilter() === 'lastMonth'" [class.text-white]="activeQuickFilter() === 'lastMonth'"
                [class.bg-gray-100]="activeQuickFilter() !== 'lastMonth'" [class.text-gray-700]="activeQuickFilter() !== 'lastMonth'"
                (click)="applyQuickFilter('lastMonth')">
          Last Month
        </button>
        <button class="px-2 py-0.5 rounded text-xs font-medium transition-all"
                [class.bg-primary-600]="activeQuickFilter() === 'last3Months'" [class.text-white]="activeQuickFilter() === 'last3Months'"
                [class.bg-gray-100]="activeQuickFilter() !== 'last3Months'" [class.text-gray-700]="activeQuickFilter() !== 'last3Months'"
                (click)="applyQuickFilter('last3Months')">
          Last 3 Months
        </button>
        <button class="px-2 py-0.5 rounded text-xs font-medium transition-all"
                [class.bg-primary-600]="activeQuickFilter() === 'income'" [class.text-white]="activeQuickFilter() === 'income'"
                [class.bg-gray-100]="activeQuickFilter() !== 'income'" [class.text-gray-700]="activeQuickFilter() !== 'income'"
                (click)="applyQuickFilter('income')">
          Income
        </button>
        <button class="px-2 py-0.5 rounded text-xs font-medium transition-all"
                [class.bg-primary-600]="activeQuickFilter() === 'expense'" [class.text-white]="activeQuickFilter() === 'expense'"
                [class.bg-gray-100]="activeQuickFilter() !== 'expense'" [class.text-gray-700]="activeQuickFilter() !== 'expense'"
                (click)="applyQuickFilter('expense')">
          Expenses
        </button>
      </section>

      <!-- Compact Essential Filters (Always Visible) -->
      <section class="card p-2">
        <div class="flex flex-col sm:flex-row gap-1.5">
          <!-- Type & Category Row -->
          <div class="flex gap-1.5">
            <select class="input !py-0.5 !text-[11px] !h-7" [(ngModel)]="filters.type" (ngModelChange)="onFilterChange()">
              <option value="">All Types</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
            <select class="input !py-0.5 !text-[11px] !h-7" [(ngModel)]="filters.category" (ngModelChange)="onFilterChange()">
              <option value="">All Categories</option>
              @for (c of categories; track c) {
                <option [value]="c">{{ c }}</option>
              }
            </select>
          </div>
          
          <!-- Search -->
          <div class="relative flex-1">
            <app-icon name="search" [size]="12" class="absolute left-2 top-1/2 -translate-y-1/2 text-muted" />
            <input class="input !py-0.5 !text-xs !pl-7 !h-7" placeholder="Search..." [(ngModel)]="filters.search" (ngModelChange)="onSearchChange()" />
          </div>

          <!-- Sort -->
          <select class="input !py-0.5 !text-xs !h-7 !w-auto" [(ngModel)]="selectedSort" (ngModelChange)="onSortChange()">
            @for (sort of sortOptions; track sort.value) {
              <option [value]="sort.value">{{ sort.label }}</option>
            }
          </select>

          <!-- Advanced Toggle -->
          <button class="btn-ghost !py-0.5 !px-2 gap-1" (click)="toggleAdvancedFilters()">
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
            </svg>
            <span class="text-[11px]">{{ showAdvancedFilters() ? 'Less' : 'More' }}</span>
          </button>
        </div>

        <!-- Advanced Filters (Collapsible) -->
        @if (showAdvancedFilters()) {
          <div class="mt-2 pt-2 border-t border-gray-200 space-y-1.5">
            <!-- Date Range -->
            <div class="space-y-1">
              <label class="text-[10px] font-medium text-muted">Date Range</label>
              <div class="flex flex-wrap gap-1">
                @for (preset of datePresets; track preset.value) {
                  <button class="px-1.5 py-0.5 rounded text-[10px] font-medium transition-all"
                          [class.bg-primary-600]="activeDatePreset() === preset.value" [class.text-white]="activeDatePreset() === preset.value"
                          [class.bg-gray-100]="activeDatePreset() !== preset.value" [class.text-gray-700]="activeDatePreset() !== preset.value"
                          (click)="applyDatePreset(preset.value)">
                    {{ preset.label }}
                  </button>
                }
              </div>
              <div class="grid grid-cols-2 gap-1.5">
                <div>
                  <label class="text-[10px] text-muted mb-0.5 block">From</label>
                  <input type="date" class="input !py-0.5 !text-[11px] !h-6" [(ngModel)]="filters.startDate" (ngModelChange)="onCustomDateChange()" />
                </div>
                <div>
                  <label class="text-[10px] text-muted mb-0.5 block">To</label>
                  <input type="date" class="input !py-0.5 !text-[11px] !h-6" [(ngModel)]="filters.endDate" (ngModelChange)="onCustomDateChange()" />
                </div>
              </div>
            </div>

            <!-- Page Size & Reset -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <label class="text-[10px] font-medium text-muted">Page Size:</label>
                <select class="input !py-0.5 !text-[11px] !h-6 !w-auto" [(ngModel)]="filters.pageSize" (ngModelChange)="onPageSizeChange()">
                  @for (size of pageSizeOptions; track size) {
                    <option [value]="size">{{ size }}</option>
                  }
                </select>
              </div>
              <button class="text-[10px] text-primary-600 hover:text-primary-700 font-medium" (click)="resetFilters()">Reset All</button>
            </div>
          </div>
        }
      </section>

      <!-- Active Filters Display -->
      @if (hasActiveFilters()) {
        <div class="flex items-center gap-1.5 text-xs text-muted flex-wrap">
          <span class="font-medium">Filters:</span>
          @if (filters.type) {
            <span class="px-2 py-0.5 bg-primary-100 text-primary-700 rounded">Type: {{ filters.type }}</span>
          }
          @if (filters.category) {
            <span class="px-2 py-0.5 bg-primary-100 text-primary-700 rounded">Category: {{ filters.category }}</span>
          }
          @if (filters.search) {
            <span class="px-2 py-0.5 bg-primary-100 text-primary-700 rounded">Search: "{{ filters.search }}"</span>
          }
          @if (filters.startDate || filters.endDate) {
            <span class="px-2 py-0.5 bg-primary-100 text-primary-700 rounded">Date: {{ formatDateRange() }}</span>
          }
        </div>
      }

      <!-- Loading State -->
      @if (loading) {
        <div class="space-y-2">
          @for (_ of [1,2,3,4,5]; track $index) {
            <div class="card p-3 animate-pulse h-16 bg-[var(--surface)]"></div>
          }
        </div>
      } @else if (paginatedResponse() && paginatedResponse()!.items.length === 0) {
        <!-- Empty State -->
        <div class="card p-12 text-center">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-3">
            <svg class="h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
            </svg>
          </div>
          <h3 class="text-base font-semibold text-gray-900 mb-1.5">No transactions found</h3>
          <p class="text-sm text-gray-600 max-w-sm mx-auto">Try adjusting your filters or add a new transaction to get started.</p>
        </div>
      } @else {
        <!-- Transactions Table -->
        <div class="card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th class="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Transaction</th>
                  <th class="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Category</th>
                  <th class="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th class="px-3 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th class="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                  <th class="px-3 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (t of paginatedResponse()?.items; track t.id) {
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-3 py-3">
                      <div class="flex items-center gap-2.5">
                        <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                             [style.background]="catMeta(t.category).bg" [style.color]="catMeta(t.category).color">
                          <app-icon [name]="catMeta(t.category).icon" [size]="18" />
                        </div>
                        <div class="min-w-0">
                          <p class="font-medium text-sm text-gray-900 truncate">{{ t.description || catMeta(t.category).label }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-3 py-3 text-sm text-gray-600 hidden md:table-cell">{{ t.category }}</td>
                    <td class="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{{ t.date | date:'MMM d, yyyy' }}</td>
                    <td class="px-3 py-3 text-right whitespace-nowrap">
                      <p class="font-semibold text-sm" [class.text-green-600]="t.type === 'Income'" [class.text-gray-900]="t.type === 'Expense'">
                        {{ t.type === 'Income' ? '+' : '−' }}{{ t.amount | currency:'INR':'symbol':'1.0-0' }}
                      </p>
                    </td>
                    <td class="px-3 py-3 text-center">
                      <span class="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                            [class.bg-green-100]="t.type === 'Income'"
                            [class.text-green-700]="t.type === 'Income'"
                            [class.bg-red-100]="t.type === 'Expense'"
                            [class.text-red-700]="t.type === 'Expense'">
                        {{ t.type }}
                      </span>
                    </td>
                    <td class="px-3 py-3 text-right whitespace-nowrap">
                      <div class="flex items-center justify-end gap-0.5">
                        <button class="btn-ghost !p-1.5" aria-label="Edit" (click)="edit(t)">
                          <app-icon name="edit" [size]="14" />
                        </button>
                        <button class="btn-ghost !p-1.5 text-red-600 hover:bg-red-50" aria-label="Delete" (click)="remove(t.id)">
                          <app-icon name="trash" [size]="14" />
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination Controls -->
          @if (paginatedResponse() && paginatedResponse()!.totalPages > 1) {
            <div class="px-3 py-2.5 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div class="text-xs text-muted">
                Showing {{ getStartItem() }}
                to {{ getEndItem() }}
                of {{ paginatedResponse()!.totalCount }} transactions
              </div>
              <div class="flex items-center gap-1">
                <button class="btn-ghost !px-2.5 !py-1.5 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        [disabled]="paginatedResponse()!.page <= 1"
                        (click)="goToPage(1)">
                  First
                </button>
                <button class="btn-ghost !px-2.5 !py-1.5 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        [disabled]="paginatedResponse()!.page <= 1"
                        (click)="goToPage(paginatedResponse()!.page - 1)">
                  Previous
                </button>
                <span class="text-xs text-muted px-2">
                  {{ paginatedResponse()!.page }} / {{ paginatedResponse()!.totalPages }}
                </span>
                <button class="btn-ghost !px-2.5 !py-1.5 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        [disabled]="paginatedResponse()!.page >= paginatedResponse()!.totalPages"
                        (click)="goToPage(paginatedResponse()!.page + 1)">
                  Next
                </button>
                <button class="btn-ghost !px-2.5 !py-1.5 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        [disabled]="paginatedResponse()!.page >= paginatedResponse()!.totalPages"
                        (click)="goToPage(paginatedResponse()!.totalPages)">
                  Last
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Transaction Form Modal -->
    @if (showForm) {
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" (click)="closeForm()">
        <div class="card p-6 w-full max-w-lg max-h-[90vh] overflow-auto animate-fade-in-scale" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="font-bold text-lg text-gray-900">{{ editingId ? 'Edit Transaction' : 'New Transaction' }}</h3>
              <p class="text-xs text-muted mt-0.5">{{ editingId ? 'Update transaction details' : 'Add a new income or expense' }}</p>
            </div>
            <button class="btn-ghost !p-2" (click)="closeForm()">
              <app-icon name="x" [size]="18" />
            </button>
          </div>
          <form (submit)="save($event)" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-medium text-muted mb-1.5 block">Type</label>
                <select class="input" [(ngModel)]="form.type" name="type" required>
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>
              <div>
                <label class="text-xs font-medium text-muted mb-1.5 block">Category</label>
                <select class="input" [(ngModel)]="form.category" name="category" required>
                  @for (c of categories; track c) {
                    <option [value]="c">{{ c }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-medium text-muted mb-1.5 block">Amount</label>
                <input type="number" class="input" placeholder="0.00" [(ngModel)]="form.amount" name="amount" required min="0.01" step="0.01" />
              </div>
              <div>
                <label class="text-xs font-medium text-muted mb-1.5 block">Date</label>
                <input type="date" class="input" [(ngModel)]="form.date" name="date" required />
              </div>
            </div>
            <div>
              <label class="text-xs font-medium text-muted mb-1.5 block">Description</label>
              <input class="input" placeholder="What was this for?" [(ngModel)]="form.description" name="description" />
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" class="btn-ghost" (click)="closeForm()">Cancel</button>
              <button type="submit" class="btn-primary">Save Transaction</button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class TransactionsComponent implements OnInit {
  private txnService = inject(TransactionService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  showForm = false;
  editingId: number | null = null;

  categories = ['Food','Dining','Groceries','Shopping','Travel','Fuel','Rent','Medical','Entertainment','Utilities','Bills','Salary','Bonus','Freelance','Investment','Education','Gifts','Savings','Other'];
  catMeta = categoryMeta;

  paginatedResponse = signal<PaginatedTransactionResponse | null>(null);
  summary = signal<TransactionSummary | null>(null);
  activeQuickFilter = signal<string>('');
  activeDatePreset = signal<string>('');
  showAdvancedFilters = signal(false);

  filters: TransactionFilters = {
    page: 1,
    pageSize: 10,
    type: '',
    category: '',
    startDate: '',
    endDate: '',
    search: '',
    sortBy: 'date',
    sortOrder: 'desc'
  };

  selectedSort = 'newest';
  sortOptions: SortOption[] = SORT_OPTIONS;
  pageSizeOptions: number[] = PAGE_SIZE_OPTIONS;

  form: any = { type: 'Expense', category: 'Food', amount: null, date: new Date().toISOString().split('T')[0], description: '' };

  datePresets = [
    { value: 'today', label: 'Today' },
    { value: 'last7Days', label: 'Last 7 Days' },
    { value: 'last30Days', label: 'Last 30 Days' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'last3Months', label: 'Last 3 Months' },
    { value: 'thisYear', label: 'This Year' }
  ];

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    this.loading = true;
    this.txnService.getFiltered(this.filters).subscribe({
      next: (response) => {
        this.paginatedResponse.set(response);
        this.summary.set(response.summary);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('Failed to load transactions', 'Please try again later');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleAdvancedFilters() {
    this.showAdvancedFilters.update(v => !v);
  }

  onFilterChange() {
    this.filters.page = 1;
    this.activeQuickFilter.set('');
    this.activeDatePreset.set('');
    this.loadTransactions();
  }

  onSortChange() {
    const sort = SORT_OPTIONS.find(s => s.value === this.selectedSort);
    if (sort) {
      this.filters.sortBy = sort.sortBy;
      this.filters.sortOrder = sort.sortOrder;
    }
    this.onFilterChange();
  }

  onSearchChange() {
    this.filters.page = 1;
    this.loadTransactions();
  }

  onPageSizeChange() {
    this.filters.page = 1;
    this.loadTransactions();
  }

  goToPage(page: number) {
    this.filters.page = page;
    this.loadTransactions();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  applyQuickFilter(filter: string) {
    if (this.activeQuickFilter() === filter) {
      this.activeQuickFilter.set('');
      this.resetDateFilters();
      this.onFilterChange();
      return;
    }

    this.activeQuickFilter.set(filter);
    this.activeDatePreset.set('');
    this.filters.type = '';
    this.filters.category = '';
    this.filters.search = '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'recent':
        this.filters.startDate = '';
        this.filters.endDate = '';
        this.filters.page = 1;
        this.loadTransactions();
        break;
      case 'thisMonth':
        this.filters.startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        this.filters.endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        this.filters.page = 1;
        this.loadTransactions();
        break;
      case 'lastMonth':
        this.filters.startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
        this.filters.endDate = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
        this.filters.page = 1;
        this.loadTransactions();
        break;
      case 'last3Months':
        this.filters.startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1).toISOString().split('T')[0];
        this.filters.endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        this.filters.page = 1;
        this.loadTransactions();
        break;
      case 'income':
        this.filters.type = 'Income';
        this.filters.startDate = '';
        this.filters.endDate = '';
        this.filters.page = 1;
        this.loadTransactions();
        break;
      case 'expense':
        this.filters.type = 'Expense';
        this.filters.startDate = '';
        this.filters.endDate = '';
        this.filters.page = 1;
        this.loadTransactions();
        break;
    }
  }

  applyDatePreset(preset: string) {
    if (this.activeDatePreset() === preset) {
      this.resetDateFilters();
      this.onFilterChange();
      return;
    }

    this.activeDatePreset.set(preset);
    this.activeQuickFilter.set('');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (preset) {
      case 'today':
        this.filters.startDate = today.toISOString().split('T')[0];
        this.filters.endDate = today.toISOString().split('T')[0];
        break;
      case 'last7Days':
        this.filters.startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        this.filters.endDate = today.toISOString().split('T')[0];
        break;
      case 'last30Days':
        this.filters.startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        this.filters.endDate = today.toISOString().split('T')[0];
        break;
      case 'thisMonth':
        this.filters.startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        this.filters.endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case 'lastMonth':
        this.filters.startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
        this.filters.endDate = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
        break;
      case 'last3Months':
        this.filters.startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1).toISOString().split('T')[0];
        this.filters.endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case 'thisYear':
        this.filters.startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        this.filters.endDate = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
        break;
    }

    this.filters.page = 1;
    this.loadTransactions();
  }

  onCustomDateChange() {
    this.activeDatePreset.set('');
    this.onFilterChange();
  }

  resetDateFilters() {
    this.filters.startDate = '';
    this.filters.endDate = '';
    this.activeDatePreset.set('');
  }

  resetFilters() {
    this.filters = {
      page: 1,
      pageSize: 10,
      type: '',
      category: '',
      startDate: '',
      endDate: '',
      search: '',
      sortBy: 'date',
      sortOrder: 'desc'
    };
    this.selectedSort = 'newest';
    this.activeQuickFilter.set('');
    this.activeDatePreset.set('');
    this.showAdvancedFilters.set(false);
    this.loadTransactions();
  }

  formatDateRange(): string {
    const start = this.filters.startDate;
    const end = this.filters.endDate;
    if (start && end) {
      if (start === end) return start;
      return `${start} - ${end}`;
    } else if (start) {
      return `From ${start}`;
    } else if (end) {
      return `Until ${end}`;
    }
    return '';
  }

  getStartItem(): number {
    if (!this.paginatedResponse()) return 0;
    const response = this.paginatedResponse()!;
    return response.page > 1 ? (response.page - 1) * response.pageSize + 1 : 1;
  }

  getEndItem(): number {
    if (!this.paginatedResponse()) return 0;
    const response = this.paginatedResponse()!;
    const min = response.page * response.pageSize;
    return min < response.totalCount ? min : response.totalCount;
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.type || this.filters.category || this.filters.search || 
              this.filters.startDate || this.filters.endDate || this.activeQuickFilter());
  }

  openForm() {
    this.editingId = null;
    this.form = { type: 'Expense', category: 'Food', amount: null, date: new Date().toISOString().split('T')[0], description: '' };
    this.showForm = true;
  }

  edit(t: Transaction) {
    this.editingId = t.id;
    this.form = { type: t.type, category: t.category, amount: t.amount, date: t.date.split('T')[0], description: t.description || '' };
    this.showForm = true;
  }

  save(e: Event) {
    e.preventDefault();
    const payload = {
      date: new Date(this.form.date).toISOString(),
      type: this.form.type,
      category: this.form.category,
      amount: Number(this.form.amount),
      description: this.form.description || '',
    };

    const operation = this.editingId 
      ? this.txnService.update(this.editingId, payload)
      : this.txnService.create(payload);

    operation.subscribe({
      next: () => {
        this.loadTransactions();
        this.closeForm();
        this.toast.success(this.editingId ? 'Updated' : 'Added', 
                          this.editingId ? 'Transaction updated successfully' : 'Transaction added successfully');
      },
      error: () => {
        this.toast.error('Error', this.editingId ? 'Failed to update transaction' : 'Failed to add transaction');
      }
    });
  }

  remove(id: number) {
    if (!confirm('Delete this transaction?')) return;
    this.txnService.delete(id).subscribe({
      next: () => {
        this.loadTransactions();
        this.toast.success('Deleted', 'Transaction removed');
      },
      error: () => {
        this.toast.error('Error', 'Failed to delete transaction');
      }
    });
  }

  closeForm() {
    this.showForm = false;
    this.editingId = null;
  }
}