import { Component, output, inject, signal, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { IconComponent, IconName } from '../../shared/icon/icon.component';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/authentication/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [IconComponent],
  template: `
    <header class="h-16 sticky top-0 z-40 glass border-b border-token flex items-center gap-3 px-4 sm:px-6">
      <button class="lg:hidden btn-ghost !p-2.5" (click)="toggleSidebar.emit()" aria-label="Menu">
        <app-icon name="menu" [size]="20" />
      </button>

      <button class="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl border border-token bg-[var(--surface)] text-sm text-muted hover:border-primary-400 transition-all w-72"
              (click)="openCommand.emit()">
        <app-icon name="search" [size]="16" />
        <span class="flex-1 text-left">Search or jump to…</span>
        <kbd class="text-[10px] font-mono px-1.5 py-0.5 rounded border border-token bg-[var(--surface-2)]">⌘K</kbd>
      </button>
      <button class="sm:hidden btn-ghost !p-2.5" (click)="openCommand.emit()" aria-label="Search">
        <app-icon name="search" [size]="18" />
      </button>

      <div class="flex-1"></div>

      <button class="btn-primary !px-3.5 !py-2 inline-flex" (click)="quickAdd.emit()">
        <app-icon name="plus" [size]="16" />
        <span class="hidden md:inline">Add</span>
      </button>

      <button class="btn-ghost !p-2.5" (click)="theme.toggle()" [attr.aria-label]="theme.isDark() ? 'Light mode' : 'Dark mode'">
        <app-icon [name]="theme.isDark() ? 'sun' : 'moon'" [size]="18" />
      </button>

      <div class="relative">
        <button class="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-xl hover:bg-[var(--surface-2)] transition-colors"
                (click)="profileOpen.set(!profileOpen())">
          <img [src]="user.avatarUrl" [alt]="user.name" class="w-8 h-8 rounded-lg object-cover ring-2 ring-primary-500/30" />
          <div class="hidden md:block text-left">
            <p class="text-sm font-semibold leading-tight">{{ user.name }}</p>
            <p class="text-[11px] text-muted leading-tight">Premium</p>
          </div>
          <app-icon name="chevron-down" [size]="14" class="text-muted hidden md:block" />
        </button>
        @if (profileOpen()) {
          <div class="absolute right-0 top-12 w-60 card p-2 animate-fade-in-scale z-50">
            <div class="flex items-center gap-3 p-2.5 border-b border-token mb-1">
              <img [src]="user.avatarUrl" [alt]="user.name" class="w-10 h-10 rounded-lg object-cover" />
              <div class="min-w-0">
                <p class="text-sm font-semibold truncate">{{ user.name }}</p>
                <p class="text-xs text-muted truncate">{{ user.email }}</p>
              </div>
            </div>
            @for (item of profileMenu; track item.label) {
              <button class="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm hover:bg-[var(--surface-2)] transition-colors"
                      (click)="navigate(item.route); profileOpen.set(false)">
                <app-icon [name]="item.icon" [size]="16" class="text-muted" />
                <span>{{ item.label }}</span>
              </button>
            }
            <div class="border-t border-token mt-1 pt-1">
              <button class="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm text-danger-600 hover:bg-danger-500/10 transition-colors"
                      (click)="logout()">
                <app-icon name="logout" [size]="16" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        }
      </div>

      <div class="pl-2">
        <img src="/assets/incedo_logo.jpg" alt="Incedo Logo" class="h-8 w-auto rounded-md" />
      </div>
    </header>
  `,
})
export class TopbarComponent {
  toggleSidebar = output<void>();
  openCommand = output<void>();
  quickAdd = output<void>();

  theme = inject(ThemeService);
  private router = inject(Router);
  private auth = inject(AuthService);

  get user() {
    const u = this.auth.user();
    return {
      name: u?.userName ?? 'User',
      email: u?.email ?? '',
      avatarUrl: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(u?.userName ?? 'User') + '&background=6366F1&color=fff',
    };
  }
  profileOpen = signal(false);

  profileMenu = [
    { label: 'My Profile', icon: 'user' as IconName, route: '/app/settings' },
    { label: 'Reports', icon: 'reports' as IconName, route: '/app/reports' }
  ];

  navigate(route: string) { this.router.navigateByUrl(route); }
  logout() { this.router.navigateByUrl('/login'); }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const t = e.target as HTMLElement;
    if (!t.closest('app-topbar')) {
      this.profileOpen.set(false);
    }
  }
}
