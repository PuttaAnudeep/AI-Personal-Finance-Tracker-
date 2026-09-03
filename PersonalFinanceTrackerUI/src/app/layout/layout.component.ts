import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IconComponent } from '../shared/icon/icon.component';
import { TopbarComponent } from './topbar/topbar.component';
import { CommandPaletteComponent } from './command-palette/command-palette.component';
import { AuthService } from '../core/authentication/auth.service';
import { ToastService } from '../core/services/toast.service';
import { ToastContainerComponent } from '../shared/toast-container/toast-container.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, TopbarComponent, CommandPaletteComponent, ToastContainerComponent],
  template: `
    <div class="min-h-screen flex bg-[var(--bg)]">
      <!-- Mobile sidebar backdrop -->
      @if (sidebarOpen()) {
        <div class="fixed inset-0 bg-black/40 z-40 md:hidden" (click)="sidebarOpen.set(false)"></div>
      }

      <!-- Sidebar: always visible on desktop, slide-in on mobile -->
      <aside [class.-translate-x-full]="!sidebarOpen()"
             class="fixed md:static inset-y-0 left-0 z-50 md:z-auto flex flex-col w-60 border-r border-[var(--border)] bg-[var(--surface)] transition-transform duration-300 md:translate-x-0">
        <div class="flex items-center justify-between px-6 py-5">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary-500 to-accent-500 text-white">
              <app-icon name="sparkles" [size]="18" strokeColor="white" />
            </div>
            <div>
              <p class="font-display font-bold text-sm">SmartLedger</p>
              <p class="text-[10px] text-muted uppercase tracking-wider">Personal Finance</p>
            </div>
          </div>
          <button class="md:hidden btn-ghost !p-1.5" (click)="sidebarOpen.set(false)" aria-label="Close sidebar">
            <app-icon name="x" [size]="18" />
          </button>
        </div>

        <nav class="flex-1 px-3 space-y-0.5">
          <a routerLink="/app/dashboard" routerLinkActive="bg-[var(--surface-2)] text-primary-600" class="nav-item">
            <app-icon name="dashboard" [size]="18" /> Dashboard
          </a>
          <a routerLink="/app/transactions" routerLinkActive="bg-[var(--surface-2)] text-primary-600" class="nav-item">
            <app-icon name="receipt" [size]="18" /> Transactions
          </a>
          <a routerLink="/app/ai-assistant" routerLinkActive="bg-[var(--surface-2)] text-primary-600" class="nav-item">
            <app-icon name="message" [size]="18" /> Smart AI Entry
          </a>
          <a routerLink="/app/insights" routerLinkActive="bg-[var(--surface-2)] text-primary-600" class="nav-item">
            <app-icon name="lightbulb" [size]="18" /> Insights
          </a>
          <a routerLink="/app/budget" routerLinkActive="bg-[var(--surface-2)] text-primary-600" class="nav-item">
            <app-icon name="target" [size]="18" /> Budget
          </a>
          <a routerLink="/app/anomalies" routerLinkActive="bg-[var(--surface-2)] text-primary-600" class="nav-item">
            <app-icon name="alert-triangle" [size]="18" /> Anomalies
          </a>
          <a routerLink="/app/analytics" routerLinkActive="bg-[var(--surface-2)] text-primary-600" class="nav-item">
            <app-icon name="bar-chart" [size]="18" /> Analytics
          </a>
          <a routerLink="/app/reports" routerLinkActive="bg-[var(--surface-2)] text-primary-600" class="nav-item">
            <app-icon name="file-text" [size]="18" /> Reports
          </a>
          <a routerLink="/app/settings" routerLinkActive="bg-[var(--surface-2)] text-primary-600" class="nav-item">
            <app-icon name="settings" [size]="18" /> Settings
          </a>
        </nav>

        <div class="p-3">
          <button class="nav-item w-full text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950" (click)="logout()">
            <app-icon name="logout" [size]="18" /> Sign out
          </button>
        </div>
      </aside>

      <div class="flex-1 flex flex-col min-w-0">
        <app-topbar (toggleSidebar)="sidebarOpen.set(!sidebarOpen())"
                    (openCommand)="commandOpen.set(true)"
                    (quickAdd)="quickAdd()" />

        <main class="flex-1 p-4 sm:p-8 overflow-auto">
          <router-outlet />
        </main>
      </div>

      <app-command-palette [open]="commandOpen()" (close)="commandOpen.set(false)" />
      <app-toast-container />
    </div>
  `,
  styles: [`
    :host { display: block; }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 0.85rem;
      border-radius: 0.75rem;
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--text-muted);
      transition: all 0.15s ease;
      text-decoration: none;
    }
    .nav-item:hover { background: var(--surface-2); color: var(--text); }
  `]
})
export class LayoutComponent {
  private router = inject(Router);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  commandOpen = signal(false);
  sidebarOpen = signal(false);

  get pageTitle() { return document.title?.replace(' · SmartLedger', '') ?? 'SmartLedger'; }

  get initials() {
    const name = this.auth.user()?.userName ?? 'User';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  quickAdd() {
    this.router.navigateByUrl('/app/transactions');
  }

  logout() {
    this.auth.logout();
    this.toast.success('Signed out', 'You have been logged out successfully');
  }
}
