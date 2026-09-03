import { Component, Input } from '@angular/core';
import { IconComponent, IconName } from '../icon/icon.component';
import { AnimatedCounterComponent } from '../animated-counter/animated-counter.component';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [IconComponent, AnimatedCounterComponent],
  template: `
    <div class="card p-5 group relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-card animate-fade-in-up">
      <div class="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-10 transition-transform group-hover:scale-150"
           [style.background]="iconBg"></div>
      <div class="flex items-start justify-between relative">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center"
               [style.background]="iconBg" [style.color]="iconColor">
            <app-icon [name]="icon" [size]="22" />
          </div>
          <div>
            <p class="text-xs font-medium text-muted uppercase tracking-wider">{{ label }}</p>
            <p class="text-[11px] text-muted mt-0.5">{{ subtitle }}</p>
          </div>
        </div>
        @if (trend !== null && trend !== 0) {
          <div class="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
               [style.color]="(trend ?? 0) >= 0 ? '#16A34A' : '#DC2626'"
               [style.background]="(trend ?? 0) >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'">
            <app-icon [name]="(trend ?? 0) >= 0 ? 'trending-up' : 'trending-down'" [size]="12" />
            {{ (trend ?? 0) >= 0 ? '+' : '' }}{{ trend }}%
          </div>
        }
      </div>
      <div class="mt-4 flex items-end gap-2">
        <span class="text-2xl font-bold tracking-tight font-display">
          <app-animated-counter [value]="value" [formatter]="formatter" />
        </span>
      </div>
      @if (footer) {
        <p class="mt-2 text-xs text-muted">{{ footer }}</p>
      }
    </div>
  `,
})
export class StatCardComponent {
  @Input() label = '';
  @Input() subtitle = '';
  @Input() value = 0;
  @Input() icon: IconName = 'wallet';
  @Input() iconBg = 'rgba(99,102,241,0.12)';
  @Input() iconColor = '#6366F1';
  @Input() trend: number | null = null;
  @Input() footer = '';
  @Input({ required: false }) formatter: (v: number) => string = (v) => Math.round(v).toString();
}
