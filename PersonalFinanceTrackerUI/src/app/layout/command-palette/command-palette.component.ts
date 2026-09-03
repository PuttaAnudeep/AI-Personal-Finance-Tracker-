import { Component, input, output, signal, computed, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IconComponent, IconName } from '../../shared/icon/icon.component';

interface CommandItem {
  label: string;
  hint: string;
  icon: IconName;
  route?: string;
  action?: () => void;
  section: string;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [IconComponent],
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-[90] flex items-start justify-center pt-[12vh] px-4"
           (click)="close.emit()">
        <div class="absolute inset-0 bg-ink-950/40 backdrop-blur-sm animate-fade-in"></div>
        <div class="relative w-full max-w-xl glass-strong rounded-xl3 shadow-card overflow-hidden animate-fade-in-scale"
             (click)="$event.stopPropagation()">
          <div class="flex items-center gap-3 px-4 py-3.5 border-b border-token">
            <app-icon name="search" [size]="18" class="text-muted" />
            <input #input class="flex-1 bg-transparent outline-none text-sm" placeholder="Search pages, actions, transactions…"
                   [value]="query()" (input)="query.set($any($event.target).value)" />
            <kbd class="text-[10px] font-mono px-1.5 py-0.5 rounded border border-token bg-[var(--surface-2)] text-muted">ESC</kbd>
          </div>
          <div class="max-h-[55vh] overflow-y-auto p-2">
            @for (section of sections(); track section) {
              <div class="px-2 py-1.5 text-[11px] font-semibold text-muted uppercase tracking-wider">{{ section.section }}</div>
              @for (item of section.items; track item.label) {
                <button class="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm hover:bg-[var(--surface-2)] transition-colors text-left"
                        (click)="run(item)">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                       style="background:rgba(99,102,241,0.12);color:#4F46E5">
                    <app-icon [name]="item.icon" [size]="16" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium truncate">{{ item.label }}</p>
                    <p class="text-xs text-muted truncate">{{ item.hint }}</p>
                  </div>
                  <app-icon name="arrow-right" [size]="14" class="text-muted opacity-0 group-hover:opacity-100" />
                </button>
              }
            }
            @if (sections().length === 0) {
              <div class="px-4 py-10 text-center text-sm text-muted">No results for "{{ query() }}"</div>
            }
          </div>
          <div class="px-4 py-2.5 border-t border-token flex items-center gap-4 text-[11px] text-muted">
            <span class="flex items-center gap-1"><kbd class="font-mono px-1.5 py-0.5 rounded border border-token bg-[var(--surface-2)]">↑↓</kbd> navigate</span>
            <span class="flex items-center gap-1"><kbd class="font-mono px-1.5 py-0.5 rounded border border-token bg-[var(--surface-2)]">↵</kbd> select</span>
            <span class="flex items-center gap-1"><kbd class="font-mono px-1.5 py-0.5 rounded border border-token bg-[var(--surface-2)]">ESC</kbd> close</span>
          </div>
        </div>
      </div>
    }
  `,
})
export class CommandPaletteComponent {
  open = input(false);
  close = output<void>();

  private router = inject(Router);
  query = signal('');

  private allItems: CommandItem[] = [
    { section: 'Pages', label: 'Dashboard', hint: 'Overview & financial health', icon: 'dashboard', route: '/app/dashboard' },
    { section: 'Pages', label: 'Transactions', hint: 'Manage your transactions', icon: 'transactions', route: '/app/transactions' },
    { section: 'Pages', label: 'Smart AI Entry', hint: 'Create transactions with natural language', icon: 'ai', route: '/app/ai-assistant' },
    { section: 'Pages', label: 'AI Insights', hint: 'AI-generated spending insights', icon: 'insights', route: '/app/insights' },
    { section: 'Pages', label: 'Budget Goal Assistant', hint: 'Plan your savings goals', icon: 'budget', route: '/app/budget' },
    { section: 'Pages', label: 'Anomaly Detection', hint: 'Flag unusual spending', icon: 'anomalies', route: '/app/anomalies' },
    { section: 'Pages', label: 'Analytics', hint: 'Deep-dive analytics', icon: 'analytics', route: '/app/analytics' },
    { section: 'Pages', label: 'Reports', hint: 'Export & monthly reports', icon: 'reports', route: '/app/reports' },
    { section: 'Pages', label: 'Settings', hint: 'Profile & preferences', icon: 'settings', route: '/app/settings' },
    { section: 'Actions', label: 'Add transaction', hint: 'Create a new transaction', icon: 'plus', route: '/app/transactions' },
    { section: 'Actions', label: 'Ask AI', hint: 'Open Smart AI Entry', icon: 'sparkles', route: '/app/ai-assistant' },
    { section: 'Actions', label: 'Toggle theme', hint: 'Switch dark / light mode', icon: 'moon', action: () => document.documentElement.classList.toggle('dark') },
    { section: 'Actions', label: 'Sign out', hint: 'End your session', icon: 'logout', route: '/login' },
  ];

  sections = computed(() => {
    const q = this.query().toLowerCase().trim();
    const filtered = q ? this.allItems.filter(i => (i.label + ' ' + i.hint + ' ' + i.section).toLowerCase().includes(q)) : this.allItems;
    const map = new Map<string, CommandItem[]>();
    for (const i of filtered) {
      if (!map.has(i.section)) map.set(i.section, []);
      map.get(i.section)!.push(i);
    }
    return Array.from(map.entries()).map(([section, items]) => ({ section, items }));
  });

  run(item: CommandItem) {
    this.close.emit();
    if (item.action) item.action();
    else if (item.route) this.router.navigateByUrl(item.route);
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && this.open()) this.close.emit();
  }
}
