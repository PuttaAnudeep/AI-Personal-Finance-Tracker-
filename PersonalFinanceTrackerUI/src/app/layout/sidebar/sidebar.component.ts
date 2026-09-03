import { Component, input, output, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent, IconName } from '../../shared/icon/icon.component';
import { ThemeService } from '../../core/services/theme.service';

interface NavItem {
  label: string;
  icon: IconName;
  route: string;
  badge?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  template: `
    <aside class="fixed inset-y-0 left-0 z-50 flex flex-col glass-strong border-r border-token transition-all duration-300"
           [style.width.px]="collapsed() ? 80 : 264"
           [class.-translate-x-full]="!open() && isMobile()">
      <!-- Brand -->
      <div class="h-16 flex items-center gap-3 px-4 border-b border-token shrink-0">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
             style="background:linear-gradient(135deg,#6366F1,#06B6D4);box-shadow:0 6px 18px -6px rgba(79,70,229,0.6)">
          <app-icon name="sparkles" [size]="22" strokeColor="white" />
        </div>
        @if (!collapsed()) {
          <div class="overflow-hidden">
            <p class="font-display font-bold text-base leading-tight">SmartLedger</p>
            <p class="text-[10px] text-muted tracking-wider uppercase">Personal Finance</p>
          </div>
        }
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-1">
        @for (item of navItems; track item.route) {
          <a [routerLink]="item.route" routerLinkActive="nav-active"
             class="nav-link group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative"
             [title]="collapsed() ? item.label : ''"
             [style.justifyContent]="collapsed() ? 'center' : 'flex-start'">
            <app-icon [name]="item.icon" [size]="20" />
            @if (!collapsed()) {
              <span class="flex-1 truncate">{{ item.label }}</span>
              @if (item.badge) {
                <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style="background:rgba(239,68,68,0.14);color:#DC2626">{{ item.badge }}</span>
              }
            }
          </a>
        }
      </nav>

      <!-- Collapse toggle (desktop) -->
      <div class="p-3 border-t border-token">
        <button (click)="toggleCollapse.emit()"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:bg-[var(--surface-2)] transition-all"
                [style.justifyContent]="collapsed() ? 'center' : 'flex-start'">
          <app-icon [name]="collapsed() ? 'chevron-right' : 'chevron-left'" [size]="20" />
          @if (!collapsed()) { <span>Collapse</span> }
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .nav-link { color: var(--text-muted); }
    .nav-link:hover { background: var(--surface-2); color: var(--text); }
    .nav-active {
      background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(6,182,212,0.08));
      color: #4F46E5 !important;
      box-shadow: inset 0 0 0 1px rgba(99,102,241,0.18);
    }
    .nav-active app-icon { color: #4F46E5; }
    :host-context(.dark) .nav-active { color: #A5B4FC !important; }
  `],
})
export class SidebarComponent {
  collapsed = input(false);
  open = input(false);
  toggleCollapse = output<void>();

  theme = inject(ThemeService);

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/app/dashboard' },
    { label: 'Transactions', icon: 'transactions', route: '/app/transactions' },
    { label: 'Smart AI Entry', icon: 'ai', route: '/app/ai-assistant' },
    { label: 'AI Insights', icon: 'insights', route: '/app/insights', badge: '7' },
    { label: 'Budget Goal', icon: 'budget', route: '/app/budget' },
    { label: 'Anomalies', icon: 'anomalies', route: '/app/anomalies', badge: '4' },
    { label: 'Analytics', icon: 'analytics', route: '/app/analytics' },
    { label: 'Reports', icon: 'reports', route: '/app/reports' },
    { label: 'Settings', icon: 'settings', route: '/app/settings' },
  ];

  isMobile() { return typeof window !== 'undefined' && window.innerWidth < 1024; }
}