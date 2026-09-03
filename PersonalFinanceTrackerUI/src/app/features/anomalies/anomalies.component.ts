import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/icon/icon.component';
import { AiService } from '../../core/services/ai.service';
import { AiStateService, AI_STATE_KEYS } from '../../core/services/ai-state.service';
import { ToastService } from '../../core/services/toast.service';
import { Anomaly } from '../../core/models/models';

@Component({
  selector: 'app-anomalies',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="space-y-6">
      <!-- Header Section -->
      <section class="header-gradient relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 p-6 text-white shadow-lg">
        <div class="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
        <div class="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
        
        <div class="relative">
          <h2 class="text-2xl font-bold font-display tracking-tight">Anomaly Detection</h2>
          <p class="mt-1 text-sm text-white/80">Unusual spending patterns flagged by AI</p>
        </div>
      </section>

      <!-- Control Panel -->
      <section class="card p-5">
        <div class="flex flex-wrap items-end gap-3">
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1.5 block">Months to analyze</label>
            <input type="number" class="input w-28 font-medium" [(ngModel)]="months" name="months" min="1" max="12" />
          </div>
          <div class="text-xs text-muted self-center pb-2 bg-[var(--surface-2)] px-3 py-1.5 rounded-lg">
            Deviation threshold: <strong class="text-gray-900">200%</strong>
          </div>
          <button class="btn-primary shadow-md hover:shadow-lg transition-all duration-200" (click)="detect()" [disabled]="loading">
            @if (loading) {
              <span class="inline-flex items-center gap-2">
                <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Detecting...
              </span>
            } @else {
              <span class="inline-flex items-center gap-2">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                Detect Anomalies
              </span>
            }
          </button>
        </div>
      </section>

      <section *ngIf="loading" class="card p-6">
        <div class="animate-pulse space-y-3">
          <div *ngFor="let _ of [1,2,3]" class="h-16 bg-gray-200 rounded-lg"></div>
        </div>
      </section>

      <section *ngIf="!loading && error" class="card p-10 text-center border-warning/20 bg-warning/5">
        <div class="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
          <svg class="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Unable to detect anomalies</h3>
        <p class="text-sm text-gray-600 max-w-md mx-auto">{{ error }}</p>
        <button class="btn-primary mt-6" (click)="detect()">Try Again</button>
      </section>

      <section *ngIf="!loading && !error && response && response.anomalies.length === 0" class="card p-16 text-center">
        <div class="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <app-icon name="check-circle" [size]="28" class="text-success" />
        </div>
        <h3 class="font-semibold mb-1">No anomalies detected</h3>
        <p class="text-sm text-muted">{{ response.summary.overallInsight }}</p>
      </section>

      <section *ngIf="!loading && !error && response && response.anomalies.length > 0">
        <div class="flex items-center gap-3 mb-4">
          <div class="text-sm text-muted">
            <strong class="text-warning">{{ response.summary.totalAnomaliesFound }}</strong> anomaly(ies) found
            · <strong class="text-danger-600">{{ response.summary.highSeverityCount }}</strong> high
            · <strong class="text-warning">{{ response.summary.mediumSeverityCount }}</strong> medium
            · <strong class="text-muted">{{ response.summary.lowSeverityCount }}</strong> low
          </div>
        </div>
        <p class="text-sm bg-[var(--surface-2)] p-3 rounded-lg mb-4">{{ response.summary.overallInsight }}</p>

        <div class="space-y-3">
          <div *ngFor="let a of response.anomalies" class="card p-4 flex items-start gap-4">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                 [style.background]="severityBg(a.severity)"
                 [style.color]="severityColor(a.severity)">
              <app-icon name="alert-triangle" [size]="20" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h4 class="font-semibold">{{ a.category }}</h4>
                <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase"
                      [style.background]="severityBg(a.severity)"
                      [style.color]="severityColor(a.severity)">{{ a.severity }}</span>
              </div>
              <p class="text-sm text-muted mt-1">{{ a.explanation }}</p>
              <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted">
                <span>Amount: <strong>{{ formatAmount(a.amount) }}</strong></span>
                <span>Avg: <strong>{{ formatAmount(a.averageForCategory) }}</strong></span>
                <span>Deviation: <strong>{{ formatDeviation(a.deviationPercentage) }}</strong></span>
                <span>{{ formatDate(a.date) }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section *ngIf="initialState" class="card p-6 text-center">
        <div class="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
          <app-icon name="alert-triangle" [size]="28" class="text-primary-600" />
        </div>
        <h3 class="font-semibold mb-1">Ready to detect anomalies</h3>
        <p class="text-sm text-muted">Set the parameters and click "Detect Anomalies".</p>
      </section>
    </div>
  `,
})
export class AnomaliesComponent {
  private cdr = inject(ChangeDetectorRef);
  private ai = inject(AiService);
  private aiState = inject(AiStateService);
  private toast = inject(ToastService);

  loading = false;
  error = '';
  months = 3;
  initialState = true;
  response: { anomalies: Anomaly[]; summary: { totalAnomaliesFound: number; highSeverityCount: number; mediumSeverityCount: number; lowSeverityCount: number; overallInsight: string } } | null = null;

  constructor() {
    // Load latest anomaly results from database history (not sessionStorage)
    this.loadLatestFromHistory();
  }

  private loadLatestFromHistory() {
    this.ai.getAnomalyHistory(1).subscribe({
      next: (history) => {
        if (history && history.length > 0) {
          const latest = history[0];
          this.response = {
            anomalies: latest.anomalies,
            summary: {
              totalAnomaliesFound: latest.totalAnomaliesFound,
              highSeverityCount: latest.highSeverityCount,
              mediumSeverityCount: latest.mediumSeverityCount,
              lowSeverityCount: latest.lowSeverityCount,
              overallInsight: latest.overallInsight
            }
          };
          // Update form field with saved value
          if (latest.months) {
            this.months = latest.months;
          }
          this.initialState = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        // Silently fail — user can still detect new anomalies
        console.warn('[Anomalies] Failed to load history:', err);
      }
    });
  }

  detect() {
    this.loading = true;
    this.error = '';
    this.initialState = false;

    console.log('[Anomalies] Detecting anomalies for months:', this.months, '(threshold: 150 fixed)');

    this.ai.detectAnomalies(this.months).subscribe({
      next: (data) => {
        this.response = data;
        this.loading = false;
        this.aiState.set(AI_STATE_KEYS.ANOMALIES, data);
        this.cdr.detectChanges();

        console.log('[Anomalies] API response received:', data);
        console.log('[Anomalies] Anomalies count:', data.anomalies?.length);
        console.log('[Anomalies] Summary:', data.summary);
      },
      error: (err) => {
        this.error = err.message || 'Failed to detect anomalies. Please try again later.';
        this.loading = false;
        this.cdr.detectChanges();

        console.error('[Anomalies] API error:', err);

        this.toast.error('Error', this.error);
      },
    });
  }

  severityBg(severity: string): string {
    switch (severity) {
      case 'High': return 'rgba(239,68,68,0.12)';
      case 'Medium': return 'rgba(245,158,11,0.12)';
      case 'Low': return 'rgba(6,182,212,0.12)';
      default: return 'rgba(6,182,212,0.12)';
    }
  }

  severityColor(severity: string): string {
    switch (severity) {
      case 'High': return '#DC2626';
      case 'Medium': return '#D97706';
      case 'Low': return '#0891B2';
      default: return '#0891B2';
    }
  }

  formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatAmount(value: number): string {
    return '₹' + value.toFixed(2);
  }

  formatDeviation(value: number): string {
    return value.toFixed(2) + '%';
  }
}