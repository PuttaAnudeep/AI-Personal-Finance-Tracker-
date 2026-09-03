import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/icon/icon.component';
import { AiService } from '../../core/services/ai.service';
import { AiStateService, AI_STATE_KEYS } from '../../core/services/ai-state.service';
import { ToastService } from '../../core/services/toast.service';
import { SpendingInsight } from '../../core/models/models';
import { IconName } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="space-y-8">
      <!-- Header Section -->
      <section class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 p-6 text-white shadow-lg">
        <div class="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
        <div class="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
        
        <div class="relative flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold font-display tracking-tight">Financial Insights</h2>
            <p class="mt-1 text-sm text-white/80">AI-powered analysis of your spending patterns</p>
          </div>
          <div class="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
        </div>
      </section>

      <!-- Control Panel -->
      <section class="card p-6 shadow-sm">
        <div class="flex flex-wrap items-end gap-4">
          <div class="flex-1 min-w-[200px]">
            <label class="text-sm font-medium text-gray-700 mb-2 block">Analysis Period</label>
            <div class="flex items-center gap-3">
              <input type="number" class="input w-24 text-center font-medium" [(ngModel)]="months" name="months" min="1" max="12" />
              <span class="text-sm text-gray-600 font-medium">months</span>
            </div>
          </div>
          <button class="btn-primary min-w-[180px] shadow-md hover:shadow-lg transition-all duration-200" (click)="generate()" [disabled]="loading">
            @if (loading) {
              <span class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Analyzing...</span>
              </span>
            } @else {
              <span class="flex items-center justify-center gap-2">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                <span>Generate Insights</span>
              </span>
            }
          </button>
        </div>
      </section>

      @if (loading) {
        <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          @for (i of [1,2,3]; track i) {
            <div class="card p-6 animate-pulse space-y-4">
              <div class="flex items-center gap-3">
                <div class="h-11 w-11 rounded-xl bg-gray-200"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div class="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div class="space-y-2.5">
                <div class="h-3 bg-gray-200 rounded"></div>
                <div class="h-3 bg-gray-200 rounded w-5/6"></div>
                <div class="h-3 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          }
        </section>
      } @else if (error) {
        <section class="card p-10 text-center border-warning/20 bg-warning/5">
          <div class="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <svg class="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Unable to generate insights</h3>
          <p class="text-sm text-gray-600 max-w-md mx-auto">{{ error }}</p>
          <button class="btn-primary mt-6 inline-flex items-center gap-2" (click)="generate()">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            <span>Try Again</span>
          </button>
        </section>
      } @else if (insights.length === 0 && !initialState) {
        <section class="card p-16 text-center">
          <div class="w-20 h-20 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mx-auto mb-5">
            <svg class="h-10 w-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">No insights generated yet</h3>
          <p class="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">Add more transactions to your account and click "Generate Insights" to receive AI-powered analysis about your spending patterns.</p>
        </section>
      } @else {
        <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          @for (insight of insights; track $index) {
            <div class="group card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-default border-l-4"
                 [style.border-left-color]="textColor(insight.type)">
              
              <!-- Card Header -->
              <div class="flex items-start gap-3.5 mb-4">
                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110"
                     [style.background]="bgColor(insight.type)"
                     [style.color]="textColor(insight.type)">
                  <app-icon [name]="iconName(insight.type)" [size]="22" />
                </div>
                <div class="flex-1 min-w-0 pt-0.5">
                  <h3 class="font-semibold text-sm text-gray-900 truncate">{{ insight.category }}</h3>
                  <span class="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
                        [style.background]="bgColor(insight.type)"
                        [style.color]="textColor(insight.type)">
                    {{ severityLabel(insight.type) }}
                  </span>
                </div>
              </div>

              <!-- Card Content -->
              <p class="text-sm text-gray-700 leading-relaxed mb-4">{{ insight.insight }}</p>

              <!-- Card Footer -->
              <div class="pt-3 border-t border-gray-100">
                <p class="text-xs text-gray-500 flex items-center gap-1.5">
                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <span class="font-medium">{{ formatDate(insight.generatedAt) }}</span>
                </p>
              </div>
            </div>
          }
        </section>
      }

      @if (initialState) {
        <section class="card p-10 text-center border-dashed border-2">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mx-auto mb-4">
            <svg class="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Ready to analyze your finances</h3>
          <p class="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">Select the number of months and click "Generate Insights" to get AI-powered analysis of your spending patterns.</p>
        </section>
      }
    </div>
  `,
})
export class InsightsComponent {
  private cdr = inject(ChangeDetectorRef);
  private ai = inject(AiService);
  private aiState = inject(AiStateService);
  private toast = inject(ToastService);

  loading = false;
  error = '';
  insights: SpendingInsight[] = [];
  months = 3;
  initialState = true;

  constructor() {
    // Load latest insights from database history (not sessionStorage)
    this.loadLatestFromHistory();
  }

  private loadLatestFromHistory() {
    this.ai.getInsightHistory(1).subscribe({
      next: (history) => {
        if (history && history.length > 0) {
          const latest = history[0];
          this.insights = latest.insights.map(i => ({
            type: i.type as any,
            category: i.category,
            insight: i.insight,
            generatedAt: i.generatedAt
          }));
          // Update form field with saved value
          if (latest.months) {
            this.months = latest.months;
          }
          this.initialState = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        // Silently fail — user can still generate new insights
        console.warn('[Insights] Failed to load history:', err);
      }
    });
  }

  generate() {
    this.loading = true;
    this.error = '';
    this.initialState = false;

    console.log('[Insights] Generating insights for months:', this.months);

    this.ai.getInsights(this.months).subscribe({
      next: (data) => {
        this.insights = data;
        this.loading = false;
        this.aiState.set(AI_STATE_KEYS.INSIGHTS, data);
        this.cdr.detectChanges();

        console.log('[Insights] API response received:', data);
        console.log('[Insights] Insights count:', data.length);
      },
      error: (err) => {
        this.error = err.message || 'Failed to load insights. Please try again later.';
        this.loading = false;
        this.cdr.detectChanges();

        console.error('[Insights] API error:', err);

        this.toast.error('Error', this.error);
      },
    });
  }

  iconName(type: string): IconName {
    switch (type) {
      case 'Positive': return 'trending-up';
      case 'Warning': return 'alert-triangle';
      case 'Risk': return 'alert-triangle';
      case 'SavingsOpportunity': return 'piggy-bank';
      case 'CashFlow': return 'bar-chart';
      case 'Recommendation': return 'sparkles';
      default: return 'insights';
    }
  }

  severityLabel(type: string): string {
    switch (type) {
      case 'Positive': return 'Good';
      case 'Warning': return 'Attention';
      case 'Risk': return 'High Risk';
      case 'SavingsOpportunity': return 'Opportunity';
      case 'CashFlow': return 'Trend';
      case 'Recommendation': return 'Tip';
      default: return 'Insight';
    }
  }

  bgColor(type: string): string {
    switch (type) {
      case 'Positive': return 'rgba(34,197,94,0.12)';
      case 'Warning': return 'rgba(239,68,68,0.12)';
      case 'Risk': return 'rgba(239,68,68,0.12)';
      case 'SavingsOpportunity': return 'rgba(99,102,241,0.12)';
      default: return 'rgba(6,182,212,0.12)';
    }
  }

  textColor(type: string): string {
    switch (type) {
      case 'Positive': return '#16A34A';
      case 'Warning': return '#DC2626';
      case 'Risk': return '#DC2626';
      case 'SavingsOpportunity': return '#4F46E5';
      default: return '#0891B2';
    }
  }

  formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
