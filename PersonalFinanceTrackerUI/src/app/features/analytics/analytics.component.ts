import { Component, inject, ChangeDetectorRef, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyPipe } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { combineLatest } from 'rxjs';
import { IconComponent } from '../../shared/icon/icon.component';
import { StatCardComponent } from '../../shared/stat-card/stat-card.component';
import { AreaChartComponent, BarChartComponent, SeriesPoint } from '../../shared/charts/charts.component';
import { DashboardService } from '../dashboard/services/dashboard.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, IconComponent, StatCardComponent, AreaChartComponent, BarChartComponent, ChartModule],
  template: `
    <div class="space-y-6">
      <!-- Header Section -->
      <section class="header-gradient relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 p-6 text-white shadow-lg">
        <div class="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
        <div class="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
        
        <div class="relative flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold font-display tracking-tight">Analytics</h2>
            <p class="mt-1 text-sm text-white/80">Deep dive into your financial data</p>
          </div>
          <div class="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
        </div>
      </section>

      @if (loading) {
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="card p-5 animate-pulse h-28 bg-[var(--surface)]"></div>
          }
        </div>
      } @else {
        <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <app-stat-card label="Income" subtitle="Total" [value]="income" icon="trending-up" iconBg="rgba(34,197,94,0.12)" iconColor="#16A34A" [trend]="0" [formatter]="curFmt" footer="overall" />
          <app-stat-card label="Expenses" subtitle="Total" [value]="expense" icon="trending-up" iconBg="rgba(239,68,68,0.12)" iconColor="#DC2626" [trend]="0" [formatter]="curFmt" footer="overall" />
          <app-stat-card label="Balance" subtitle="Net" [value]="balance" icon="wallet" iconBg="rgba(99,102,241,0.12)" iconColor="#4F46E5" [trend]="0" [formatter]="curFmt" footer="current" />
          <app-stat-card label="Transactions" subtitle="Total count" [value]="txCount" icon="receipt" iconBg="rgba(6,182,212,0.12)" iconColor="#0891B2" [trend]="0" [formatter]="numFmt" footer="recorded" />
        </section>

        <section class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="card p-5 lg:col-span-2">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="font-semibold">Monthly Spending Trend</h3>
                <p class="text-xs text-muted mt-0.5">Last 6 months overview</p>
              </div>
            </div>
            <app-area-chart [data]="spendingTrend" [color]="'#6366F1'" [height]="240" />
          </div>

          <div class="card p-5">
            <h3 class="font-semibold">Category Breakdown</h3>
            <p class="text-xs text-muted mt-0.5">Where your money goes</p>
            <div class="flex items-center justify-center my-4">
              <p-chart type="doughnut" [data]="doughnutData" [options]="doughnutOptions" class="w-full md:w-120" />
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

        <section class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold">Monthly Income vs Expense</h3>
          </div>
          <app-bar-chart [data]="monthlyComparison" [color]="'#06B6D4'" [height]="240" />
        </section>
      }
    </div>
  `,
})
export class AnalyticsComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private dashService = inject(DashboardService);
  private toast = inject(ToastService);

  loading = false;
  loaded = false;
  income = 0;
  expense = 0;
  balance = 0;
  txCount = 0;

  spendingTrend: SeriesPoint[] = [];
  categorySlices: { label: string; value: number; color: string }[] = [];
  monthlyComparison: SeriesPoint[] = [];

  curFmt = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
  numFmt = (v: number) => new Intl.NumberFormat('en-IN').format(v);

  pct(s: { label: string; value: number; color: string }) {
    if (!this.categorySlices.length) return 0;
    const total = this.categorySlices.reduce((a, b) => a + b.value, 0);
    return total ? Math.round((s.value / total) * 100) : 0;
  }

  ngOnInit() {
    this.load();
  }

  doughnutData: any = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
        hoverBackgroundColor: [],
      },
    ],
  };

  doughnutOptions: any = {
    cutout: '60%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.label}: ₹${new Intl.NumberFormat('en-IN').format(ctx.parsed)}`,
        },
      },
    },
  };

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

  load() {
    this.loading = true;
    this.loaded = false;

    console.log('[Analytics] Loading dashboard stats...');

    combineLatest([
      this.dashService.getStats(),
      this.dashService.getSpendingByCategory(),
      this.dashService.getMonthlySummary(),
    ]).subscribe({
      next: ([stats, data, monthly]) => {
        // Stats
        this.income = stats.totalIncome;
        this.expense = stats.totalExpense;
        this.balance = stats.balance;
        this.txCount = stats.transactionCount;
        console.log('[Analytics] Stats received:', stats);

        // Categories + doughnut
        const palette = ['#EF4444', '#8B5CF6', '#F59E0B', '#EC4899', '#6366F1', '#64748B', '#10B981', '#06B6D4'];
        this.categorySlices = data.map((item, idx) => ({
          label: item.category,
          value: item.total,
          color: palette[idx % palette.length],
        }));
        this.initDoughnut();
        this.syncDoughnut();
        console.log('[Analytics] Categories received:', data);

        // Monthly trend
        const sorted = [...monthly].sort((a, b) => a.year === b.year ? a.month - b.month : a.year - b.year);
        const last6 = sorted.slice(-6);
        this.spendingTrend = last6.map((m) => ({
          label: `${m.year}-${String(m.month).padStart(2, '0')}`,
          value: m.expense,
        }));
        this.monthlyComparison = last6.map((m) => ({
          label: `${m.year}-${String(m.month).padStart(2, '0')}`,
          value: m.income,
        }));
        console.log('[Analytics] Monthly summary received:', monthly);

        this.loading = false;
        this.loaded = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[Analytics] Load error:', err);
        this.loading = false;
        this.loaded = true;
        this.cdr.detectChanges();
        this.toast.error('Error', 'Failed to load analytics');
      },
    });
  }
}