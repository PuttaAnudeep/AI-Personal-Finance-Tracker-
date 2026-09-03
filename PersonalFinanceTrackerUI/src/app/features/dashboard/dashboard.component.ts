import { Component, inject, OnInit, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { DashboardService } from './services/dashboard.service';
import { AuthService } from '../../core/authentication/auth.service';
import { AiService } from '../../core/services/ai.service';
import { ToastService } from '../../core/services/toast.service';
import { StatCardComponent } from '../../shared/stat-card/stat-card.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { AnimatedCounterComponent } from '../../shared/animated-counter/animated-counter.component';
import { ProgressRingComponent } from '../../shared/progress-ring/progress-ring.component';
import { AreaChartComponent, BarChartComponent, SeriesPoint } from '../../shared/charts/charts.component';
import { categoryMeta } from '../../shared/meta/meta';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, StatCardComponent, IconComponent, AnimatedCounterComponent, ProgressRingComponent, AreaChartComponent, BarChartComponent, ChartModule],
  template: `
    <div class="space-y-6">
      <!-- Welcome Header -->
      <section class="header-gradient relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-6 sm:p-8 text-white shadow-lg">
        <div class="absolute top-0 right-0 -mt-8 -mr-8 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
        <div class="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
        <div class="absolute inset-0 bg-mesh opacity-20"></div>
        
        <div class="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <p class="text-white/80 text-sm font-medium">{{ today }}</p>
            <h1 class="text-2xl sm:text-3xl font-bold font-display tracking-tight mt-1">Welcome back, {{ userName }} 👋</h1>
            <p class="text-white/80 text-sm mt-2 max-w-md">Your financial health snapshot for this month.</p>
            <div class="flex flex-wrap gap-3 mt-5">
              <a routerLink="/app/ai-assistant" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-primary-700 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200">
                <app-icon name="sparkles" [size]="16" /> Smart AI Entry
              </a>
              <a routerLink="/app/budget" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 text-white text-sm font-semibold hover:bg-white/25 transition-all backdrop-blur-sm border border-white/20">
                <app-icon name="target" [size]="16" /> Budget
              </a>
            </div>
          </div>
          <div class="flex items-center gap-5 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-lg">
            <app-progress-ring [value]="healthScore" [size]="100" [strokeWidth]="10" color="#22C55E" trackColor="rgba(255,255,255,0.18)" [glow]="true">
              <span class="text-3xl font-bold">{{ healthScore }}</span>
              <span class="text-[10px] text-white/70 uppercase tracking-wider">Health</span>
            </app-progress-ring>
            <div class="space-y-2">
              <div>
                <p class="text-[11px] text-white/70 uppercase tracking-wider">Current Balance</p>
                <p class="text-2xl font-bold font-display">{{ balance | currency:'INR':'symbol':'1.0-0' }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats Cards -->
      @if (loading) {
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="card p-5 animate-pulse h-28 bg-[var(--surface)]"></div>
          }
        </div>
      } @else {
        <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <app-stat-card label="Income" subtitle="This month" [value]="income" icon="trending-up" iconBg="rgba(34,197,94,0.12)" iconColor="#16A34A" [trend]="incomeTrend" [formatter]="curFmt" footer="↑ vs last month" />
          <app-stat-card label="Expenses" subtitle="This month" [value]="expense" icon="trending-up" iconBg="rgba(239,68,68,0.12)" iconColor="#DC2626" [trend]="expenseTrend" [formatter]="curFmt" footer="↓ vs last month" />
          <app-stat-card label="Savings" subtitle="Net this month" [value]="savings" icon="piggy-bank" iconBg="rgba(99,102,241,0.12)" iconColor="#4F46E5" [trend]="savingsTrend" [formatter]="curFmt" footer="savings rate" />
          <app-stat-card label="Transactions" subtitle="Total count" [value]="txCount" icon="receipt" iconBg="rgba(6,182,212,0.12)" iconColor="#0891B2" [trend]="0" [formatter]="numFmt" footer="recorded" />
        </section>
      }


      @if (loading) {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="card p-5 lg:col-span-2 animate-pulse h-72 bg-[var(--surface)]"></div>
          <div class="card p-5 animate-pulse h-72 bg-[var(--surface)]"></div>
        </div>
      } @else {
        <section class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="card p-5 lg:col-span-2 animate-fade-in-up">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="font-semibold">Monthly Spending Trend</h3>
                <p class="text-xs text-muted mt-0.5">Last 6 months overview</p>
              </div>
            </div>
            <app-area-chart [data]="spendingTrend" [color]="'#6366F1'" [height]="240" />
          </div>

          <div class="card p-5 animate-fade-in-up">
            <h3 class="font-semibold">Category Breakdown</h3>
            <p class="text-xs text-muted mt-0.5">Where your money goes</p>
            <div class="flex items-center justify-center my-4">
              <p-chart #chart type="doughnut" [data]="doughnutData" [options]="doughnutOptions" class="w-full md:w-120" />
            </div>
            <div class="space-y-2">
              @for (c of categorySlices.slice(0, 5); track c.label) {
                <div class="flex items-center gap-2.5 text-sm">
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" [style.background]="c.color"></span>
                  <span class="flex-1 truncate">{{ c.label }}</span>
                  <span class="text-muted text-xs">{{ pct(c) }}%</span>
                </div>
              }
            </div>
          </div>
        </section>
      }

      @if (loading) {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="card p-5 lg:col-span-2 animate-pulse h-56 bg-[var(--surface)]"></div>
          <div class="card p-5 animate-pulse h-56 bg-[var(--surface)]"></div>
        </div>
      } @else {
        <section class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="card p-5 lg:col-span-2 animate-fade-in-up">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold">Recent Transactions</h3>
              <a routerLink="/app/transactions" class="text-xs text-primary-600 hover:underline flex items-center gap-1">View all <app-icon name="arrow-right" [size]="12" /></a>
            </div>
            <div class="space-y-1">
              @for (t of recentTxns; track t.id) {
                <div class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--surface-2)] transition-colors">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                       [style.background]="catMeta(t.category).bg" [style.color]="catMeta(t.category).color">
                    <app-icon [name]="catMeta(t.category).icon" [size]="18" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">{{ t.description }}</p>
                    <p class="text-xs text-muted">{{ catMeta(t.category).label }} · {{ rel(t.date) }}</p>
                  </div>
                  <span class="text-sm font-semibold" [style.color]="t.type === 'Income' ? '#16A34A' : 'var(--text)'">
                    {{ t.type === 'Income' ? '+' : '−' }}{{ cur(t.amount) }}
                  </span>
                </div>
              }
            </div>
          </div>

          <div class="card p-5 animate-fade-in-up">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold">Goal Tracker</h3>
              <a routerLink="/app/budget" class="text-xs text-primary-600 hover:underline">Adjust</a>
            </div>
            <div class="flex flex-col items-center justify-center py-4">
              <app-progress-ring [value]="goalPct" [size]="160" [strokeWidth]="12" [color]="'#4F46E5'" [glow]="true">
                <span class="text-3xl font-bold font-display">{{ goalPct }}%</span>
                <span class="text-[11px] text-muted uppercase tracking-wider mt-1">of goal</span>
              </app-progress-ring>
              <div class="mt-4 text-center">
                <p class="text-sm font-semibold">{{ savings | currency:'INR':'symbol':'1.0-0' }} <span class="text-muted font-normal">/ {{ monthlyTarget | currency:'INR':'symbol':'1.0-0' }}</span></p>
                <p class="text-xs text-muted mt-0.5">{{ monthlyTarget - savings | currency:'INR':'symbol':'1.0-0' }} to go</p>
              </div>
            </div>
          </div>
        </section>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private dashService = inject(DashboardService);
  private auth = inject(AuthService);
  private ai = inject(AiService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  userName = 'User';
  today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  income = 0;
  expense = 0;
  savings = 0;
  txCount = 0;
  balance = 0;
  healthScore = 60;
  incomeTrend = 0;
  expenseTrend = 0;
  savingsTrend = 0;
  monthlyTarget = 50000;
  goalPct = 0;
  loading = true;

  spendingTrend: SeriesPoint[] = [];
  categorySlices: { label: string; value: number; color: string }[] = [];
  recentTxns: any[] = [];

  curFmt = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
  cur = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(v);
  numFmt = (v: number) => new Intl.NumberFormat('en-IN').format(v);
  rel = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };
  catMeta = categoryMeta;

  pct(s: { label: string; value: number; color: string }) {
    if (!this.categorySlices.length) return 0;
    const total = this.categorySlices.reduce((a, b) => a + b.value, 0);
    return total ? Math.round((s.value / total) * 100) : 0;
  }

  ngOnInit() {
    this.userName = this.auth.user()?.userName?.split(' ')[0] ?? 'User';
    this.initDoughnut();
    setTimeout(() => this.loadDashboard());
  }

  doughnutData: any;
  doughnutOptions: any;

  initDoughnut() {
    if (isPlatformBrowser(this.platformId)) {
      const documentStyle = getComputedStyle(document.documentElement);
      const textColor = documentStyle.getPropertyValue('--p-text-color');

      this.doughnutData = {
        labels: [] as string[],
        datasets: [
          {
            data: [] as number[],
            backgroundColor: [] as string[],
            hoverBackgroundColor: [] as string[],
          },
        ],
      };

      this.doughnutOptions = {
        cutout: '60%',
        plugins: {
          legend: {
            labels: {
              color: textColor,
            },
          },
        },
      };
    }
  }

  syncDoughnut() {
    if (!this.doughnutData) return;
    const labels = this.categorySlices.map(s => s.label);
    const data = this.categorySlices.map(s => s.value);
    const bg = this.categorySlices.map(s => s.color);
    const hover = this.categorySlices.map(s => s.color);
    this.doughnutData.labels = labels;
    this.doughnutData.datasets[0].data = data;
    this.doughnutData.datasets[0].backgroundColor = bg;
    this.doughnutData.datasets[0].hoverBackgroundColor = hover;
  }

  loadDashboard() {
    this.loading = true;
    const renderDelay = 250;
    
    // Load latest budget goal to get the monthly target
    this.ai.getActiveBudgetGoal().subscribe({
      next: (goal) => {
        if (goal) {
          this.monthlyTarget = goal.targetSavings;
        }
      },
      error: () => {
        // Silently fail - monthlyTarget will keep default value
      }
    });
    
    this.dashService.getStats().subscribe({
      next: (stats) => {
        setTimeout(() => {
          this.income = stats.totalIncome;
          this.expense = stats.totalExpense;
          this.balance = stats.balance;
          this.savings = stats.balance;
          this.txCount = stats.transactionCount;
          this.goalPct = this.monthlyTarget > 0 ? Math.min(100, Math.round((this.savings / this.monthlyTarget) * 100)) : 0;
          this.cdr.detectChanges();
        }, renderDelay);
      },
      error: () => setTimeout(() => {
        this.toast.error('Failed to load dashboard', 'Please try again later');
        this.cdr.detectChanges();
      }, renderDelay),
    });

    this.dashService.getSpendingByCategory().subscribe({
      next: (data) => {
        setTimeout(() => {
          const palette = ['#EF4444', '#8B5CF6', '#F59E0B', '#EC4899', '#6366F1', '#64748B', '#10B981', '#06B6D4'];
          this.categorySlices = data.map((item, idx) => ({
            label: item.category,
            value: item.total,
            color: palette[idx % palette.length],
          }));
          this.syncDoughnut();
          this.cdr.detectChanges();
        }, renderDelay);
      },
      error: () => setTimeout(() => {
        this.toast.error('Failed to load categories', 'Please try again later');
        this.cdr.detectChanges();
      }, renderDelay),
    });

    this.dashService.getMonthlySummary().subscribe({
      next: (data) => {
        setTimeout(() => {
          this.spendingTrend = data.slice(0, 6).reverse().map((m) => ({ label: `${m.year}-${String(m.month).padStart(2, '0')}`, value: m.expense }));
          this.cdr.detectChanges();
        }, renderDelay);
      },
      error: () => setTimeout(() => {
        this.toast.error('Failed to load monthly summary', 'Please try again later');
        this.cdr.detectChanges();
      }, renderDelay),
    });

    this.dashService.getRecentTransactions().subscribe({
      next: (txns) => {
        setTimeout(() => {
          this.recentTxns = txns.slice(0, 6);
          this.loading = false;
          this.cdr.detectChanges();
        }, renderDelay);
      },
      error: () => {
        setTimeout(() => {
          this.recentTxns = [];
          this.loading = false;
          this.toast.error('Failed to load transactions', 'Please try again later');
          this.cdr.detectChanges();
        }, renderDelay);
      },
    });
  }
}