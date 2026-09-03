import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../core/services/toast.service';
import { IconComponent, IconName } from '../icon/icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      @for (toast of toasts(); track toast.id) {
        <div class="card p-4 min-w-[320px] max-w-sm shadow-lg border-l-4 animate-fade-in-up flex items-start gap-3"
             [class.border-l-success]="toast.type === 'success'"
             [class.border-l-error]="toast.type === 'error'"
             [class.border-l-warning]="toast.type === 'warning'"
             [class.border-l-primary]="toast.type === 'info'">
          <div class="shrink-0 mt-0.5">
            <app-icon [name]="icon(toast.type)" [size]="18" [class.text-success]="toast.type === 'success'"
                      [class.text-error]="toast.type === 'error'"
                      [class.text-warning]="toast.type === 'warning'"
                      [class.text-primary]="toast.type === 'info'" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold">{{ toast.title }}</p>
            @if (toast.message) {
              <p class="text-xs text-muted mt-0.5">{{ toast.message }}</p>
            }
          </div>
          <button class="btn-ghost !p-1 text-muted hover:text-[var(--text)]" (click)="dismiss(toast.id)">
            <app-icon name="x" [size]="14" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  toast = inject(ToastService);
  toasts = this.toast.toasts;

  dismiss(id: number) { this.toast.dismiss(id); }

  icon(type: Toast['type']): IconName {
    const map: Record<Toast['type'], IconName> = {
      success: 'check-circle',
      error: 'alert-triangle',
      warning: 'alert-triangle',
      info: 'info',
    };
    return map[type];
  }
}