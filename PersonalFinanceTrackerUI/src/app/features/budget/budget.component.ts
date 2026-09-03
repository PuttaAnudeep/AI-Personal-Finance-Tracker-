import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/icon/icon.component';
import { ProgressRingComponent } from '../../shared/progress-ring/progress-ring.component';
import { PieSlice } from '../../shared/charts/charts.component';
import { AiService } from '../../core/services/ai.service';
import { AiStateService, AI_STATE_KEYS } from '../../core/services/ai-state.service';
import { ToastService } from '../../core/services/toast.service';
import { BudgetGoalResponse, BudgetRecommendation, ActionCategory, BudgetGoalHistoryResponse } from '../../core/models/models';

interface CachedBudgetGoal {
  data: BudgetGoalResponse;
  requestedAt: string;
  requestHash: string;
}

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, ProgressRingComponent],
  template: `
    <div class="space-y-6">
      <!-- Header Section -->
      <section class="header-gradient relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 p-6 text-white shadow-lg">
        <div class="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
        <div class="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
        
        <div class="relative">
          <h2 class="text-2xl font-bold font-display tracking-tight">Budget Goals</h2>
          <p class="mt-1 text-sm text-white/80">Set and track your savings targets</p>
        </div>
      </section>

      <!-- Goal Input -->
      <section class="card overflow-hidden">
        <div class="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div class="flex items-center gap-2 mb-4">
            <div class="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center text-white">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">Set Your Savings Goal</h3>
              <p class="text-xs text-muted">Define your target and timeframe</p>
            </div>
          </div>
          <form (submit)="generateGoal($event)" class="flex flex-wrap gap-3 items-end">
            <div>
              <label class="text-xs font-medium text-gray-700 mb-1.5 block">Target Savings (₹)</label>
              <input type="number" class="input w-44 font-medium" [(ngModel)]="targetSavings" name="targetSavings" min="1" required />
            </div>
            <div>
              <label class="text-xs font-medium text-gray-700 mb-1.5 block">Timeframe (months)</label>
              <input type="number" class="input w-32 font-medium" [(ngModel)]="months" name="months" min="1" max="60" required />
            </div>
            <div>
              <label class="text-xs font-medium text-gray-700 mb-1.5 block">Savings Strategy</label>
              <select class="input w-40 font-medium" [(ngModel)]="planType" name="planType">
                <option value="Balanced">Balanced Plan</option>
                <option value="Focused">Focused Plan</option>
              </select>
            </div>
            <button type="submit" class="btn-primary shadow-md hover:shadow-lg transition-all duration-200" [disabled]="loading">
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
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  Generate Plan
                </span>
              }
            </button>
          </form>
        </div>
      </section>

      <!-- Loading -->
      <section *ngIf="loading" class="card p-6">
        <div class="animate-pulse space-y-3">
          <div *ngFor="let _ of [1,2,3]" class="h-16 bg-gray-200 rounded-lg"></div>
        </div>
      </section>

      <!-- Error -->
      <section *ngIf="!loading && error" class="card p-10 text-center border-warning/20 bg-warning/5">
        <div class="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
          <svg class="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Unable to generate budget plan</h3>
        <p class="text-sm text-gray-600 max-w-md mx-auto">{{ error }}</p>
      </section>

      <!-- Active Goal Card -->
      <section *ngIf="!loading && !error && goal" class="card p-5">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h3 class="text-lg font-bold font-display text-gray-900">₹{{ goal.targetSavings | number:'1.0-0' }}</h3>
              <span class="text-xs font-medium px-2.5 py-1 rounded-full"
                    [class.bg-blue-100]="goal.planType === 'Balanced'"
                    [class.text-blue-700]="goal.planType === 'Balanced'"
                    [class.bg-purple-100]="goal.planType === 'Focused'"
                    [class.text-purple-700]="goal.planType === 'Focused'">
                {{ goal.planType === 'Balanced' ? 'Balanced Plan' : 'Focused Plan' }}
              </span>
            </div>
            <div class="flex items-center gap-4 text-sm text-muted">
              <span>{{ goal.months }} months</span>
              <span class="text-gray-300">|</span>
              <span>{{ goal.planType }}</span>
              <span class="text-gray-300">|</span>
              <span>₹{{ goal.savingsGap | number:'1.0-0' }}/month needed</span>
            </div>
          </div>
          <button (click)="openGoalSelector()" 
                  class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium">
            Change Goal
          </button>
        </div>
      </section>

      <!-- Selected Goal Details -->
      <section *ngIf="!loading && !error && goal" class="space-y-6">

        <!-- Warning: Low data confidence -->
        <div *ngIf="goal.dataConfidence === 'Low'" class="card p-4 border-amber-400 bg-amber-50 border-l-4">
          <p class="text-sm text-amber-800 font-medium">⚠️ Limited transaction history — recommendations may be less accurate. Add more transactions to improve the analysis.</p>
        </div>

        <!-- Warning: Unfeasible goal -->
        <div *ngIf="isUnfeasible" class="card p-4 border-red-400 bg-red-50 border-l-4">
          <p class="text-sm text-red-700 font-medium">
            ⚠️ Goal Not Achievable Within Selected Timeline. Even after applying all recommended expense reductions, the target cannot be reached within the selected timeframe.
          </p>
          <div class="mt-2 flex flex-wrap gap-3 text-xs text-red-700">
            <span *ngIf="goal.revisedTarget != null" class="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 border border-red-200">
              🎯 Maximum Achievable Goal: <b>₹{{ goal.revisedTarget | number:'1.0-0' }}</b>
            </span>
            <span *ngIf="goal.incomeGapNeeded != null" class="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 border border-red-200">
              💰 Additional Monthly Income Needed: ₹{{ goal.incomeGapNeeded | number:'1.0-0' }}
            </span>
            <span *ngIf="goal.extendedTimelineNeeded != null" class="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 border border-red-200">
              ⏳ Recommended Timeline: <b>{{ goal.extendedTimelineNeeded }}</b> months
            </span>
          </div>
        </div>

        <!-- Progress Card -->
        <div class="card p-6">
          <div class="flex flex-col sm:flex-row items-center gap-6">
            <app-progress-ring [value]="goalPct" [size]="140" [strokeWidth]="12" [color]="'#4F46E5'" [glow]="true">
              <span class="text-2xl font-bold font-display">{{ goalPct }}%</span>
              <span class="text-[10px] text-muted uppercase tracking-wider">of goal</span>
            </app-progress-ring>
            <div class="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 text-center sm:text-left">
              <div>
                <p class="text-xs text-muted font-medium uppercase tracking-wider">Target</p>
                <p class="text-lg font-bold font-display">₹{{ goal.targetSavings | number:'1.0-0' }}</p>
                <p class="text-[10px] text-muted">Your savings goal</p>
              </div>
              <div>
                <p class="text-xs text-muted font-medium uppercase tracking-wider">Current Savings</p>
                <p class="text-lg font-bold font-display" [style.color]="goal.currentSavings >= 0 ? '#16A34A' : '#DC2626'">
                  ₹{{ goal.currentSavings | number:'1.0-0' }}
                </p>
                <p class="text-[10px] text-muted">Amount currently available towards the target goal</p>
              </div>
              <div>
                <p class="text-xs text-muted font-medium uppercase tracking-wider">Amount Remaining</p>
                <p class="text-lg font-bold font-display text-amber-600">₹{{ amountRemaining | number:'1.0-0' }}</p>
                <p class="text-[10px] text-muted">Additional savings needed to reach your goal</p>
              </div>
              <div>
                <p class="text-xs text-muted font-medium uppercase tracking-wider">Required Monthly Savings</p>
                <p class="text-lg font-bold font-display">₹{{ goal.savingsGap | number:'1.0-0' }}</p>
                <p class="text-[10px] text-muted">Amount to save each month to achieve the target within the selected timeframe</p>
              </div>
              <div>
                <p class="text-xs text-muted font-medium uppercase tracking-wider">Monthly Target</p>
                <p class="text-lg font-bold font-display">₹{{ goal.monthlySavingsTarget | number:'1.0-0' }}</p>
                <p class="text-[10px] text-muted">Target savings per month</p>
              </div>
              <div>
                <p class="text-xs text-muted font-medium uppercase tracking-wider">Status</p>
                <p class="text-lg font-bold font-display" [style.color]="feasibilityColor(goal.feasibilityLabel)">
                  {{ feasibilityIcon }} {{ goal.feasibilityLabel }}
                </p>
              </div>
            </div>
          </div>
          <p class="text-xs text-muted mt-3">₹{{ goal.currentSavings | number:'1.0-0' }} saved out of ₹{{ goal.targetSavings | number:'1.0-0' }} target</p>
        </div>

        <!-- Goal Summary -->
        <div class="card p-5 border-l-4" [style.border-color]="isUnfeasible ? '#DC2626' : '#16A34A'">
          <div class="flex items-center gap-2 mb-2">
            <app-icon [name]="isUnfeasible ? 'x-circle' : 'check-circle'" [size]="18" [class]="isUnfeasible ? 'text-red-600' : 'text-green-600'" />
            <h4 class="font-semibold text-sm">Goal Summary</h4>
          </div>
          <p class="text-xs text-muted">
            You have already saved <b>₹{{ goal.currentSavings | number:'1.0-0' }}</b> toward your target of <b>₹{{ goal.targetSavings | number:'1.0-0' }}</b>.
            You need an additional <b>₹{{ amountRemaining | number:'1.0-0' }}</b> to reach your goal.
            Saving <b>₹{{ goal.savingsGap | number:'1.0-0' }}</b> per month for the next <b>{{ goal.months }}</b> months will help you achieve the target.
            The recommendations below fully cover the required savings amount.
          </p>
        </div>

        <!-- Plan Info Card -->
        <div class="card p-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="text-center sm:text-left">
              <p class="text-xs text-muted font-medium uppercase tracking-wider">Savings Strategy</p>
              <p class="text-lg font-bold font-display" [style.color]="goal.planType === 'Balanced' ? '#0891B2' : '#4F46E5'">
                {{ goal.planType === 'Balanced' ? '⚖️ Balanced Plan' : '🎯 Focused Plan' }}
              </p>
              <p class="text-[10px] text-muted">
                {{ goal.planType === 'Balanced' ? 'Sustainable cuts, lifestyle-friendly' : 'Aggressive cuts, maximum savings' }}
              </p>
            </div>
            <div class="text-center sm:text-left">
              <p class="text-xs text-muted font-medium uppercase tracking-wider">Lifestyle Impact</p>
              <p class="text-lg font-bold font-display" [style.color]="lifestyleImpactColor(goal.lifestyleImpact)">
                {{ lifestyleImpactIcon(goal.lifestyleImpact) }} {{ goal.lifestyleImpact }}
              </p>
              <p class="text-[10px] text-muted">{{ lifestyleImpactDescription(goal.lifestyleImpact) }}</p>
            </div>
          </div>
        </div>

        <!-- Side-by-side seamless donut charts (CSS conic-gradient) -->
        <div class="card p-6" *ngIf="!isUnfeasible && goal.recommendations.length > 0">
          <h3 class="font-semibold mb-4 text-center">Spending Distribution — Before vs After</h3>
          <div class="flex flex-col sm:flex-row items-start justify-center gap-6 sm:gap-10">
            <!-- Current -->
            <div class="flex flex-col items-center">
              <p class="text-xs text-muted font-medium uppercase tracking-wider mb-2">Current</p>
              <div class="relative cursor-pointer select-none"
                   [style.width.px]="160" [style.height.px]="160"
                   (click)="onDonutClick($event, 'current')"
                   (mouseleave)="selectedSliceCurrent = null">
                <div class="w-full h-full rounded-full transition-all duration-200"
                     [style.background]="highlightedConicGradient(currentSlices, selectedSliceCurrent ? selectedSliceCurrent.index : -1)"></div>
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div class="w-[58%] h-[58%] rounded-full bg-[var(--surface)]"></div>
                </div>

                <!-- Floating tooltip -->
                <div *ngIf="selectedSliceCurrent"
                     class="absolute z-30 pointer-events-none"
                     [style.left.px]="tooltipX"
                     [style.top.px]="tooltipY"
                     [style.transform]="'translate(-50%, -100%)'">
                  <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 text-white shadow-xl border border-gray-700">
                    <span class="w-3 h-3 rounded-sm shrink-0"
                          [style.background]="sliceColor(selectedSliceCurrent.label)"></span>
                    <div class="leading-tight">
                      <p class="text-[11px] font-semibold">{{ selectedSliceCurrent.label }}</p>
                      <p class="text-[10px] text-gray-300">₹{{ selectedSliceCurrent.value | number:'1.0-0' }}</p>
                    </div>
                  </div>
                  <div class="w-2 h-2 rotate-45 bg-gray-900 border-r border-b border-gray-700 mx-auto -mt-1"></div>
                </div>
              </div>
              <p class="text-sm font-bold font-display mt-2">₹{{ totalCurrentSpending | number:'1.0-0' }}</p>
            </div>

            <!-- Savings Badge -->
            <div class="flex flex-col items-center justify-center py-2 sm:py-0">
              <div class="flex flex-col items-center gap-1 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 shadow-sm">
                <span class="text-[10px] font-bold uppercase tracking-wider text-amber-600">Savings</span>
                <span class="text-lg font-bold font-display text-amber-700">↓ ₹{{ goal.savingsGap | number:'1.0-0' }}</span>
              </div>
            </div>

            <!-- Recommended -->
            <div class="flex flex-col items-center">
              <p class="text-xs text-muted font-medium uppercase tracking-wider mb-2">Recommended</p>
              <div class="relative cursor-pointer select-none"
                   [style.width.px]="160" [style.height.px]="160"
                   (click)="onDonutClick($event, 'recommended')"
                   (mouseleave)="selectedSliceRecommended = null">
                <!-- Main donut includes savings sector -->
                <div class="w-full h-full rounded-full transition-all duration-200"
                     [style.background]="highlightedConicGradient(recommendedSlices, selectedSliceRecommended ? selectedSliceRecommended.index : -1)"></div>
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div class="w-[58%] h-[58%] rounded-full bg-[var(--surface)]"></div>
                </div>

                <!-- Floating tooltip -->
                <div *ngIf="selectedSliceRecommended"
                     class="absolute z-30 pointer-events-none"
                     [style.left.px]="tooltipX"
                     [style.top.px]="tooltipY"
                     [style.transform]="'translate(-50%, -100%)'">
                  <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 text-white shadow-xl border border-gray-700">
                    <span class="w-3 h-3 rounded-sm shrink-0"
                          [style.background]="sliceColor(selectedSliceRecommended.label)"></span>
                    <div class="leading-tight">
                      <p class="text-[11px] font-semibold">{{ selectedSliceRecommended.label }}</p>
                      <p class="text-[10px] text-gray-300">₹{{ selectedSliceRecommended.value | number:'1.0-0' }}</p>
                    </div>
                  </div>
                  <div class="w-2 h-2 rotate-45 bg-gray-900 border-r border-b border-gray-700 mx-auto -mt-1"></div>
                </div>
              </div>
              <p class="text-sm font-bold font-display mt-2">₹{{ totalRecommendedSpending | number:'1.0-0' }}</p>
            </div>
          </div>

          <div class="mt-5 space-y-2">
            <div *ngFor="let r of goal.recommendations" class="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 px-3 rounded-lg bg-[var(--surface-2)]/50 gap-2">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full shrink-0" [style.background]="sliceColor(r.category)"></span>
                <span class="text-xs font-medium">{{ r.category }}</span>
                <span class="text-[9px] font-bold px-1 py-0.5 rounded uppercase leading-none"
                      [style.background]="priorityBg(r.priority)"
                      [style.color]="priorityColor(r.priority)">{{ r.priority }}</span>
              </div>
              <div class="flex flex-wrap items-center gap-3 text-xs text-muted">
                <span class="text-foreground font-medium">Current: ₹{{ r.currentSpending | number:'1.0-0' }}</span>
                <span class="text-primary-500">→</span>
                <span>Recommended: ₹{{ r.recommendedSpending | number:'1.0-0' }}</span>
                <span class="text-amber-600 font-bold">Savings: ₹{{ r.reductionAmount | number:'1.0-0' }}</span>
                <span class="text-green-600 font-medium">{{ contributionPct(r.reductionAmount) }}% of goal</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Plan Cards (typed from DTO) -->
        <div *ngIf="!isUnfeasible && actionCategories.length > 0">
          <h3 class="font-semibold mb-3">Action Plan</h3>
          <div class="space-y-3">
            <div *ngFor="let item of actionCategories" class="card p-4">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-primary-500/10 text-primary-600">
                  <app-icon name="zap" [size]="14" />
                </div>
                <h4 class="font-semibold text-sm">{{ item.category }}</h4>
              </div>
              <ul class="space-y-1.5">
                <li *ngFor="let action of item.actions" class="flex items-start gap-2 text-xs text-muted">
                  <span class="mt-0.5 w-4 h-4 rounded-full bg-primary-500/10 flex items-center justify-center shrink-0">
                    <app-icon name="check" [size]="10" class="text-primary-600" />
                  </span>
                  <span>{{ action }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Tracking Method Card -->
        <div class="card p-5 border-l-4" [style.border-color]="'#2563EB'" *ngIf="!isUnfeasible && trackingMethod">
          <div class="flex items-center gap-2 mb-2">
            <app-icon name="target" [size]="16" class="text-blue-600" />
            <h4 class="font-semibold text-sm">Tracking Method</h4>
          </div>
          <p class="text-xs text-muted">{{ trackingMethod }}</p>
        </div>

        <!-- Final Message Card -->
        <div class="card p-5 bg-gradient-to-r from-primary-500/5 to-transparent" *ngIf="!isUnfeasible && finalMessage">
          <div class="flex items-center gap-2 mb-2">
            <app-icon name="heart" [size]="16" class="text-primary-600" />
            <h4 class="font-semibold text-sm">Motivation</h4>
          </div>
          <p class="text-xs text-muted italic">{{ finalMessage }}</p>
        </div>

        <!-- How We Calculated This (collapsible) -->
        <div class="card p-5">
          <button class="flex items-center gap-2 w-full text-left" (click)="showCalculation = !showCalculation">
            <app-icon name="help" [size]="16" class="text-gray-500" />
            <h4 class="font-semibold text-sm">How We Calculated This</h4>
            <span class="ml-auto text-xs text-muted">{{ showCalculation ? 'Hide' : 'Show' }}</span>
          </button>
          @if (showCalculation) {
            <div class="mt-4 space-y-3">
              <div class="p-4 bg-gray-50 rounded-lg space-y-2 text-xs">
                <div class="flex justify-between">
                  <span class="text-muted">Target Savings:</span>
                  <span class="font-semibold">₹{{ goal.targetSavings | number:'1.0-0' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted">Current Savings:</span>
                  <span class="font-semibold text-green-600">₹{{ goal.currentSavings | number:'1.0-0' }}</span>
                </div>
                <div class="border-t border-gray-200 pt-2 flex justify-between">
                  <span class="text-muted font-medium">Amount Remaining:</span>
                  <span class="font-bold text-amber-600">₹{{ amountRemaining | number:'1.0-0' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted">Timeframe:</span>
                  <span class="font-semibold">{{ goal.months }} months</span>
                </div>
                <div class="border-t border-gray-200 pt-2 flex justify-between">
                  <span class="text-muted font-medium">Required Monthly Savings:</span>
                  <span class="font-bold text-primary-600">₹{{ goal.savingsGap | number:'1.0-0' }}</span>
                </div>
              </div>
              <div class="p-3 bg-blue-50 rounded-lg">
                <p class="text-xs text-blue-800">
                  <b>Formula:</b> (Target Savings - Current Savings) ÷ Timeframe = Required Monthly Savings<br>
                  <span class="text-[10px]">(₹{{ goal.targetSavings | number:'1.0-0' }} - ₹{{ goal.currentSavings | number:'1.0-0' }}) ÷ {{ goal.months }} = ₹{{ goal.savingsGap | number:'1.0-0' }}/month</span>
                </p>
              </div>
            </div>
          }
        </div>

        <p class="text-xs text-muted text-right">Generated: {{ formatDate(goal.generatedAt) }}</p>
      </section>

      <!-- Empty State -->
      <section *ngIf="!loading && !error && !goal" class="card p-6 text-center">
        <div class="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
          <app-icon name="target" [size]="28" class="text-primary-600" />
        </div>
        <h3 class="font-semibold mb-1">Set your first budget goal</h3>
        <p class="text-sm text-muted">Enter a target savings amount and timeframe above to get started.</p>
      </section>

      <!-- Goal Selector Modal -->
      @if (showGoalSelector) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="closeGoalSelector()">
          <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col" (click)="$event.stopPropagation()">
            <!-- Modal Header -->
            <div class="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 class="text-xl font-bold font-display text-gray-900">Select a Goal</h3>
                <p class="text-sm text-muted mt-1">Choose from your saved budget plans</p>
              </div>
              <button (click)="closeGoalSelector()" class="text-gray-400 hover:text-gray-600 transition-colors">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <!-- Modal Body -->
            <div class="flex-1 overflow-y-auto p-4">
              <div class="space-y-2">
                @for (g of goals; track g.id) {
                  <div class="group relative p-4 rounded-lg border-2 transition-all duration-200 hover:border-primary-300 hover:shadow-sm cursor-pointer"
                       [class.border-primary-500]="selectedGoalId === g.id"
                       [class.bg-primary-50]="selectedGoalId === g.id"
                       [class.border-gray-200]="selectedGoalId !== g.id"
                       (click)="viewPlan(g.id)">
                    
                    <div class="flex items-center justify-between">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-3 mb-2">
                          <span class="text-sm text-muted">{{ formatDate(g.generatedAt) }}</span>
                          @if (g.isActive) {
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-wider">Active</span>
                          }
                          @if (g.isArchived) {
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase tracking-wider">Archived</span>
                          }
                        </div>

                        <div class="flex items-center gap-4 mb-2">
                          <h4 class="text-lg font-bold font-display text-gray-900">₹{{ g.targetSavings | number:'1.0-0' }}</h4>
                          <span class="text-sm font-medium px-2.5 py-1 rounded-full"
                                [class.bg-blue-100]="g.planType === 'Balanced'"
                                [class.text-blue-700]="g.planType === 'Balanced'"
                                [class.bg-purple-100]="g.planType === 'Focused'"
                                [class.text-purple-700]="g.planType === 'Focused'">
                            {{ g.planType === 'Balanced' ? 'Balanced Plan' : 'Focused Plan' }}
                          </span>
                          <span class="text-xs font-bold px-2 py-1 rounded-full"
                                [class.bg-green-100]="g.feasibilityLabel === 'Achievable'"
                                [class.text-green-700]="g.feasibilityLabel === 'Achievable'"
                                [class.bg-red-100]="g.feasibilityLabel === 'Not Achievable'"
                                [class.text-red-700]="g.feasibilityLabel === 'Not Achievable'"
                                [class.bg-amber-100]="g.feasibilityLabel === 'Challenging'"
                                [class.text-amber-700]="g.feasibilityLabel === 'Challenging'">
                            {{ g.feasibilityLabel || 'Unknown' }}
                          </span>
                        </div>

                        <div class="flex items-center gap-3 text-xs text-muted">
                          <span>{{ g.months }} months</span>
                          <span class="text-gray-300">•</span>
                          <span>{{ g.planType }}</span>
                          <span class="text-gray-300">•</span>
                          <span>₹{{ g.currentSavings | number:'1.0-0' }} saved</span>
                        </div>
                      </div>

                      <!-- Overflow Menu -->
                      <div class="relative">
                        <button (click)="$event.stopPropagation(); toggleOverflowMenu(g.id)" 
                                class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                [class.bg-gray-100]="overflowMenuId === g.id">
                          <svg class="h-5 w-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
                          </svg>
                        </button>

                        @if (overflowMenuId === g.id) {
                          <div class="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            <button (click)="viewPlan(g.id)" 
                                    class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                              👁️ View Plan
                            </button>
                            @if (!g.isActive && !g.isArchived) {
                              <button (click)="setActiveGoalFromModal(g.id)" 
                                      class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                ⭐ Set Active
                              </button>
                            }
                            @if (!g.isArchived) {
                              <button (click)="archiveGoalFromModal(g.id)" 
                                      class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                🗄️ Archive
                              </button>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <p class="text-xs text-center text-muted">
                💡 Tip: Click anywhere on a goal card to view its plan, or use the menu to manage goals
              </p>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class BudgetComponent {
  private cdr = inject(ChangeDetectorRef);
  private ai = inject(AiService);
  private aiState = inject(AiStateService);
  private toast = inject(ToastService);

  targetSavings = 50000;
  months = 12;
  planType: string = 'Balanced';
  loading = false;
  error = '';
  goal: BudgetGoalResponse | null = null;
  showCalculation = false;

  // History management
  goals: BudgetGoalHistoryResponse[] = [];
  selectedGoalId: number | null = null;

  // Modal state
  showGoalSelector = false;
  overflowMenuId: number | null = null;

  selectedSliceCurrent: { index: number; label: string; value: number } | null = null;
  selectedSliceRecommended: { index: number; label: string; value: number } | null = null;
  tooltipX = 0;
  tooltipY = 0;

  constructor() {
    this.loadGoalHistory();
  }

  private loadGoalHistory() {
    this.loading = true;
    this.error = '';

    this.ai.getBudgetGoalHistory(50).subscribe({
      next: (history) => {
        this.goals = history || [];
        
        // Select the active goal, or the most recent goal
        const activeGoal = this.goals.find(g => g.isActive);
        const latestGoal = this.goals.length > 0 ? this.goals[0] : null;
        const goalToSelect = activeGoal || latestGoal;

        if (goalToSelect) {
          this.selectGoal(goalToSelect.id);
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.message || 'Failed to load budget goals.';
        this.loading = false;
        this.cdr.detectChanges();
        console.error('[BudgetGoal] Failed to load history:', err);
      }
    });
  }

  selectGoal(id: number) {
    this.selectedGoalId = id;
    const selected = this.goals.find(g => g.id === id);
    
    if (selected) {
      this.goal = this.mapHistoryToGoal(selected);
      this.targetSavings = selected.targetSavings;
      this.months = selected.months;
      this.cdr.detectChanges();
    }
  }

  openGoalSelector() {
    this.showGoalSelector = true;
    this.overflowMenuId = null;
  }

  closeGoalSelector() {
    this.showGoalSelector = false;
    this.overflowMenuId = null;
  }

  toggleOverflowMenu(id: number) {
    this.overflowMenuId = this.overflowMenuId === id ? null : id;
  }

  viewPlan(id: number) {
    this.selectGoal(id);
    this.closeGoalSelector();
  }

  setActiveGoalFromModal(id: number) {
    this.setActiveGoal(id);
    this.closeGoalSelector();
  }

  archiveGoalFromModal(id: number) {
    this.archiveGoal(id);
    this.closeGoalSelector();
  }

  setActiveGoal(id: number) {
    this.ai.activateBudgetGoal(id).subscribe({
      next: () => {
        this.toast.success('Goal activated', 'This is now your active budget goal');
        // Reload history to update active status
        this.loadGoalHistory();
      },
      error: (err) => {
        this.toast.error('Error', err.message || 'Failed to activate goal');
      }
    });
  }

  archiveGoal(id: number) {
    if (!confirm('Are you sure you want to archive this goal?')) {
      return;
    }

    this.ai.archiveBudgetGoal(id).subscribe({
      next: () => {
        this.toast.success('Goal archived', 'Goal has been moved to archive');
        // If we archived the selected goal, select another one
        if (this.selectedGoalId === id) {
          this.goal = null;
          this.selectedGoalId = null;
          const activeGoal = this.goals.find(g => g.isActive);
          const latestGoal = this.goals.length > 0 ? this.goals[0] : null;
          const goalToSelect = activeGoal || latestGoal;
          if (goalToSelect && goalToSelect.id !== id) {
            this.selectGoal(goalToSelect.id);
          }
        }
        // Reload history
        this.loadGoalHistory();
      },
      error: (err) => {
        this.toast.error('Error', err.message || 'Failed to archive goal');
      }
    });
  }

  private mapHistoryToGoal(h: any): BudgetGoalResponse {
    return {
      targetSavings: h.targetSavings,
      currentSavings: h.currentSavings,
      savingsGap: h.savingsGap,
      monthlySavingsTarget: h.monthlySavingsTarget,
      currentMonthlySavings: h.currentMonthlySavings,
      recommendations: h.recommendations || [],
      actionPlan: h.actionPlanJson ? JSON.parse(h.actionPlanJson) : null,
      feasibilityScore: h.feasibilityScore,
      feasibilityLabel: h.feasibilityLabel,
      generatedAt: h.generatedAt,
      dataConfidence: h.dataConfidence,
      remainingGapAfterCuts: h.remainingGapAfterCuts,
      revisedTarget: h.revisedTarget,
      incomeGapNeeded: h.incomeGapNeeded,
      extendedTimelineNeeded: h.extendedTimelineNeeded,
      months: h.months,
      planType: h.planType || 'Focused',
      lifestyleImpact: h.lifestyleImpact || 'Minimal',
      expectedMonthlySavingsFromRecommendations: h.expectedMonthlySavingsFromRecommendations || 0
    };
  }

  get currentHash(): string {
    return `${this.targetSavings}|${this.months}`;
  }

  get isUnfeasible(): boolean {
    return !!this.goal && this.goal.revisedTarget != null;
  }

  get amountRemaining(): number {
    if (!this.goal) return 0;
    return Math.max(0, this.goal.targetSavings - this.goal.currentSavings);
  }

  get actionCategories(): ActionCategory[] {
    return this.goal?.actionPlan?.categories ?? [];
  }

  get trackingMethod(): string {
    return this.goal?.actionPlan?.trackingMethod ?? '';
  }

  get finalMessage(): string {
    return this.goal?.actionPlan?.finalMessage ?? '';
  }

  lifestyleImpactDescription(impact: string): string {
    switch (impact) {
      case 'Minimal': return 'Only discretionary spending categories require adjustment';
      case 'Moderate': return 'Some lifestyle changes needed across multiple categories';
      case 'Significant': return 'Major spending reductions required across most categories';
      default: return 'Impact on daily lifestyle';
    }
  }

  coveragePct(): number {
    if (!this.goal || this.goal.savingsGap <= 0) return 0;
    return Math.min(100, Math.round((this.goal.expectedMonthlySavingsFromRecommendations / this.goal.savingsGap) * 100));
  }

  coverageColor(): string {
    const pct = this.coveragePct();
    if (pct >= 100) return '#16A34A';
    if (pct >= 75) return '#0891B2';
    if (pct >= 50) return '#D97706';
    return '#DC2626';
  }

  coverageLabel(): string {
    const pct = this.coveragePct();
    if (pct >= 100) return 'Fully covered';
    if (pct >= 75) return 'Well covered';
    if (pct >= 50) return 'Partially covered';
    return 'Under covered';
  }

  keyInsight(): string {
    if (!this.goal || !this.goal.recommendations.length) return '';
    
    const totalSavings = this.goal.expectedMonthlySavingsFromRecommendations;
    if (totalSavings === 0) return 'No recommendations available yet.';

    // Sort recommendations by reduction amount
    const sorted = [...this.goal.recommendations]
      .sort((a, b) => b.reductionAmount - a.reductionAmount)
      .slice(0, 2);

    const topCategories = sorted.map(r => r.category).join(' and ');
    const topSavings = sorted.reduce((sum, r) => sum + r.reductionAmount, 0);
    const pct = Math.round((topSavings / totalSavings) * 100);

    return `${pct}% of the required savings can be achieved by reducing ${topCategories} expenses.`;
  }

  completionForecast(): string {
    if (!this.goal || this.goal.expectedMonthlySavingsFromRecommendations <= 0) {
      return 'Follow the recommendations to track your progress toward the goal.';
    }

    const remaining = this.amountRemaining;
    const monthlySavings = this.goal.expectedMonthlySavingsFromRecommendations;
    
    if (monthlySavings <= 0) {
      return 'Generate recommendations to see completion forecast.';
    }

    const monthsToComplete = Math.ceil(remaining / monthlySavings);
    const today = new Date();
    const completionDate = new Date(today.setMonth(today.getMonth() + monthsToComplete));
    
    const formattedDate = completionDate.toLocaleDateString('en-IN', { 
      month: 'long', 
      year: 'numeric' 
    });

    if (remaining <= 0) {
      return '🎉 Congratulations! You have already reached your savings goal.';
    }

    return `At ₹${monthlySavings.toFixed(0)}/month, you can reach your ₹${this.goal.targetSavings.toFixed(0)} target by ${formattedDate} (${monthsToComplete} months from now).`;
  }

  get goalPct(): number {
    if (!this.goal || this.goal.targetSavings === 0) return 0;
    return Math.min(100, Math.round((this.goal.currentSavings / this.goal.targetSavings) * 100));
  }

  maxSpending(): number {
    if (!this.goal?.recommendations?.length) return 1;
    return Math.max(...this.goal.recommendations.map(r => r.currentSpending));
  }

  totalSpendingBarWidth(r: BudgetRecommendation): number {
    const max = this.maxSpending();
    return max > 0 ? (r.currentSpending / max) * 100 : 0;
  }

  recommendedBarWidth(r: BudgetRecommendation): number {
    if (r.currentSpending <= 0) return 0;
    return (r.recommendedSpending / r.currentSpending) * 100;
  }

  reductionBarWidth(r: BudgetRecommendation): number {
    if (r.currentSpending <= 0) return 0;
    return (r.reductionAmount / r.currentSpending) * 100;
  }

  reductionPct(r: BudgetRecommendation): number {
    if (r.currentSpending <= 0) return 0;
    return Math.round((r.reductionAmount / r.currentSpending) * 100);
  }

  contributionPct(reductionAmount: number): number {
    if (!this.goal || this.goal.savingsGap <= 0) return 0;
    return Math.round((reductionAmount / this.goal.savingsGap) * 100);
  }

  generateGoal(e: Event) {
    e.preventDefault();
    this.loading = true;
    this.error = '';
    this.goal = null;

    const request = { targetSavings: this.targetSavings, months: this.months, planType: this.planType };
    console.log('[BudgetGoal] Sending request:', request);

    this.ai.getBudgetGoal(request).subscribe({
      next: (data) => {
        this.goal = data;
        this.loading = false;
        // Reload history to show the new goal
        this.loadGoalHistory();
        this.cdr.detectChanges();

        console.log('[BudgetGoal] API response received:', data);
        this.toast.success('Budget plan generated', 'AI recommendations are ready');
      },
      error: (err) => {
        this.error = err.message || 'Failed to generate budget plan. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
        console.error('[BudgetGoal] API error:', err);
        this.toast.error('Error', this.error);
      },
    });
  }

  priorityBg(priority: string): string {
    switch (priority) {
      case 'High': return 'rgba(239,68,68,0.12)';
      case 'Medium': return 'rgba(245,158,11,0.12)';
      case 'Low': return 'rgba(6,182,212,0.12)';
      default: return 'rgba(6,182,212,0.12)';
    }
  }

  priorityColor(priority: string): string {
    switch (priority) {
      case 'High': return '#DC2626';
      case 'Medium': return '#D97706';
      case 'Low': return '#0891B2';
      default: return '#0891B2';
    }
  }

  feasibilityColor(label: string): string {
    if (label === 'Achievable') return '#16A34A';
    if (label === 'Challenging') return '#D97706';
    if (label === 'Not Achievable') return '#DC2626';
    return '#6B7280';
  }

  lifestyleImpactColor(impact: string): string {
    if (impact === 'Minimal') return '#16A34A';
    if (impact === 'Moderate') return '#D97706';
    if (impact === 'Significant') return '#DC2626';
    return '#6B7280';
  }

  lifestyleImpactIcon(impact: string): string {
    if (impact === 'Minimal') return '🟢';
    if (impact === 'Moderate') return '🟡';
    if (impact === 'Significant') return '🔴';
    return '⚪';
  }

  get feasibilityIcon(): string {
    if (!this.goal) return '';
    if (this.goal.feasibilityLabel === 'Achievable') return '✅';
    if (this.goal.feasibilityLabel === 'Challenging') return '⚠️';
    if (this.goal.feasibilityLabel === 'Not Achievable') return '❌';
    return '';
  }

  formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /** Stable color per category for both donut charts */
  sliceColor(category: string): string {
    const map: Record<string, string> = {
      Other: '#EF4444',
      Shopping: '#F59E0B',
      Education: '#3B82F6',
      Entertainment: '#06B6D4',
      Gifts: '#10B981',
      Housing: '#6366F1',
      Health: '#EC4899',
      Food: '#F97316',
      Travel: '#14B8A6',
      Fuel: '#64748B',
      Rent: '#8B5CF6',
      Medical: '#EF4444',
      Bills: '#F59E0B',
      Groceries: '#22C55E',
      Utilities: '#06B6D4',
      Dining: '#F97316',
      Insurance: '#6366F1',
      Transportation: '#3B82F6',
      Savings: '#10B981',
      Healthcare: '#EC4899',
    };
    return map[category] || '#6366F1';
  }

  /** Current spending slices for left donut */
  get currentSlices(): PieSlice[] {
    if (!this.goal?.recommendations?.length) return [];
    return this.goal.recommendations.map(r => ({
      label: r.category,
      value: r.currentSpending,
      color: this.sliceColor(r.category),
    }));
  }

  /** Recommended spending slices for right donut, including an explicit Savings sector */
  get recommendedSlices(): PieSlice[] {
    if (!this.goal?.recommendations?.length) return [];
    const categories = this.goal.recommendations.map(r => ({
      label: r.category,
      value: r.recommendedSpending,
      color: this.sliceColor(r.category),
    }));
    if (this.goal.savingsGap > 0) {
      categories.unshift({
        label: 'Savings',
        value: this.goal.savingsGap,
        color: '#F59E0B',
      });
    }
    return categories;
  }

  get totalCurrentSpending(): number {
    if (!this.goal?.recommendations?.length) return 0;
    return Math.round(this.goal.recommendations.reduce((s, r) => s + r.currentSpending, 0));
  }

  get totalRecommendedSpending(): number {
    if (!this.goal?.recommendations?.length) return 0;
    const spending = Math.round(this.goal.recommendations.reduce((s, r) => s + r.recommendedSpending, 0));
    return spending + (this.goal.savingsGap || 0);
  }

  /** Build a seamless conic-gradient string for a donut/pie chart */
  conicGradient(slices: PieSlice[]): string {
    if (slices.length === 0) return 'none';
    const total = slices.reduce((s, d) => s + d.value, 0) || 1;
    let angle = 0;
    const parts = slices.map(s => {
      const deg = (s.value / total) * 360;
      const start = angle;
      const end = angle + deg;
      angle = end;
      return `${s.color} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`;
    });
    return `conic-gradient(${parts.join(', ')})`;
  }

  /** Build a conic-gradient with a small surface-colored gap marking the selected slice */
  highlightedConicGradient(slices: PieSlice[], selectedIndex: number): string {
    if (slices.length === 0) return 'none';
    const total = slices.reduce((s, d) => s + d.value, 0) || 1;
    let angle = 0;
    const parts: string[] = [];
    const gapSize = 3;

    slices.forEach((s, i) => {
      const deg = (s.value / total) * 360;
      const start = angle;
      const end = angle + deg;
      angle = end;

      if (i === selectedIndex) {
        const midGap = start + gapSize;
        const midGap2 = end - gapSize;
        parts.push(`${s.color} ${start.toFixed(2)}deg ${midGap.toFixed(2)}deg`);
        parts.push(`var(--surface) ${midGap.toFixed(2)}deg ${midGap2.toFixed(2)}deg`);
        parts.push(`${s.color} ${midGap2.toFixed(2)}deg ${end.toFixed(2)}deg`);
      } else {
        parts.push(`${s.color} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`);
      }
    });
    return `conic-gradient(${parts.join(', ')})`;
  }

  /** Click on donut: identify slice from the angle of the click and position tooltip */
  onDonutClick(event: MouseEvent, donutType: 'current' | 'recommended') {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;

    let angle = Math.atan2(x, -y) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    const slices = donutType === 'current' ? this.currentSlices : this.recommendedSlices;
    const total = slices.reduce((s: any, d: any) => s + d.value, 0);
    if (total === 0) return;

    let cumulative = 0;
    for (let i = 0; i < slices.length; i++) {
      const sliceAngle = (slices[i].value / total) * 360;
      if (angle >= cumulative && angle < cumulative + sliceAngle) {
        const result = { index: i, label: slices[i].label, value: slices[i].value };
        if (donutType === 'current') {
          this.selectedSliceCurrent = result;
        } else {
          this.selectedSliceRecommended = result;
        }

        const midAngle = ((cumulative + sliceAngle / 2) * Math.PI) / 180;
        const radius = rect.width / 2 + 10;
        this.tooltipX = rect.width / 2 + Math.sin(midAngle) * radius;
        this.tooltipY = rect.height / 2 - Math.cos(midAngle) * radius;
        return;
      }
      cumulative += sliceAngle;
    }
  }
}