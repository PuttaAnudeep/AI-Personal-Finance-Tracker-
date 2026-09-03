import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IconComponent } from '../../shared/icon/icon.component';
import { ThemeService } from '../../core/services/theme.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/authentication/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, IconComponent],
  template: `
    <div class="min-h-screen flex relative overflow-hidden">
      <!-- Left: brand / illustration -->
      <div class="hidden lg:flex flex-col justify-between w-1/2 p-12 text-white relative"
           style="background:linear-gradient(135deg,#4F46E5 0%,#6366F1 45%,#06B6D4 100%)">
        <div class="absolute inset-0 bg-mesh opacity-50"></div>
        <div class="absolute -right-20 top-20 w-72 h-72 rounded-full bg-white/10 blur-3xl animate-float"></div>
        <div class="absolute left-10 bottom-20 w-56 h-56 rounded-full bg-accent-400/20 blur-3xl"></div>

        <div class="relative flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center bg-white/15 backdrop-blur-sm">
            <app-icon name="sparkles" [size]="22" strokeColor="white" />
          </div>
          <div>
            <p class="font-display font-bold text-lg">SmartLedger</p>
            <p class="text-white/70 text-xs uppercase tracking-wider">Personal Finance</p>
          </div>
        </div>

        <div class="relative">
          <h1 class="text-4xl font-bold font-display leading-tight">Track smarter.<br />Spend better.<br /><span class="text-white/80">Powered by AI.</span></h1>
          <p class="text-white/80 mt-4 max-w-md">Your AI-powered personal finance companion. Natural-language transactions, smart insights, anomaly detection, and personalized budget goals.</p>
          <div class="flex flex-wrap gap-2 mt-6">
            @for (f of features; track f) {
              <span class="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-xs font-medium border border-white/15">{{ f }}</span>
            }
          </div>
        </div>

        <div class="relative grid grid-cols-3 gap-4">
          @for (s of stats; track s.label) {
            <div>
              <p class="text-2xl font-bold font-display">{{ s.value }}</p>
              <p class="text-white/70 text-xs">{{ s.label }}</p>
            </div>
          }
        </div>
      </div>

      <!-- Right: form -->
      <div class="flex-1 flex items-center justify-center p-6 sm:p-12 bg-[var(--bg)]">
        <div class="absolute top-6 right-6">
          <button class="btn-ghost !p-2.5" (click)="theme.toggle()" [attr.aria-label]="'Toggle theme'">
            <app-icon [name]="theme.isDark() ? 'sun' : 'moon'" [size]="18" />
          </button>
        </div>

        <div class="w-full max-w-md animate-fade-in-up">
          <div class="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center" style="background:linear-gradient(135deg,#6366F1,#06B6D4)">
              <app-icon name="sparkles" [size]="22" strokeColor="white" />
            </div>
            <p class="font-display font-bold text-xl">SmartLedger</p>
          </div>

          <h2 class="text-2xl font-bold font-display">{{ mode() === 'login' ? 'Welcome back' : 'Create your account' }}</h2>
          <p class="text-sm text-muted mt-1">{{ mode() === 'login' ? 'Sign in to continue to your dashboard' : 'Start tracking your finances with AI' }}</p>

          <form class="mt-7 space-y-4">
            @if (mode() === 'signup') {
              <div>
                <label class="text-xs font-medium text-muted mb-1.5 block">Full Name</label>
                <div class="relative">
                  <app-icon name="user" [size]="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input class="input pl-9" placeholder="Aarav Mehta" [(ngModel)]="name" name="name" required />
                </div>
              </div>

              <div>
                <label class="text-xs font-medium text-muted mb-1.5 block">Phone Number</label>
                <div class="relative">
                  <app-icon name="phone" [size]="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input class="input pl-9" placeholder="9876543210" [(ngModel)]="phoneNumber" name="phoneNumber" required />
                </div>
              </div>
            }

            <div>
              <label class="text-xs font-medium text-muted mb-1.5 block">Email</label>
              <div class="relative">
                <app-icon name="mail" [size]="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input type="email" class="input pl-9" placeholder="you@example.com" [(ngModel)]="email" name="email" required />
              </div>
            </div>

            <div>
              <label class="text-xs font-medium text-muted mb-1.5 block">Password</label>
              <div class="relative">
                <app-icon name="lock" [size]="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input [type]="showPwd() ? 'text' : 'password'" class="input pl-9 pr-9" placeholder="••••••••" [(ngModel)]="password" name="password" required />
                <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-[var(--text)]" (click)="showPwd.set(!showPwd())" [attr.aria-label]="'Toggle password'">
                  <app-icon [name]="showPwd() ? 'eye-off' : 'eye'" [size]="16" />
                </button>
              </div>
            </div>

            @if (mode() === 'login') {
              <div class="flex items-center justify-between text-sm">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" class="accent-primary-600" [(ngModel)]="remember" name="remember" />
                  <span class="text-muted">Remember me</span>
                </label>
                <button type="button" class="text-primary-600 hover:underline" (click)="toast.info('Reset password', 'Check your email')">Forgot password?</button>
              </div>
            }

            <button type="submit" class="btn-primary w-full !py-3" (click)="onSubmit()" [disabled]="loading()">
              @if (loading()) {
                <span class="inline-flex items-center gap-2">
                  <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ mode() === 'login' ? 'Signing in...' : 'Creating account...' }}
                </span>
              } @else {
                <span class="inline-flex items-center gap-2">
                  {{ mode() === 'login' ? 'Sign in' : 'Create account' }}
                  <app-icon name="arrow-right" [size]="16" />
                </span>
              }
            </button>

            <div class="flex items-center gap-3 my-4">
              <div class="flex-1 h-px bg-[var(--border)]"></div>
              <span class="text-xs text-muted">or continue with</span>
              <div class="flex-1 h-px bg-[var(--border)]"></div>
            </div>

            <div class="grid grid-cols-3 gap-2">
              @for (p of providers; track p.label) {
                <button type="button" class="btn-ghost !py-2.5 justify-center" (click)="social(p.label)">
                  <app-icon [name]="p.icon" [size]="18" />
                </button>
              }
            </div>
          </form>

          <p class="text-sm text-muted text-center mt-6">
            {{ mode() === 'login' ? "Don't have an account?" : 'Already have an account?' }}
            <button type="button" class="text-primary-600 font-semibold hover:underline ml-1" (click)="toggleMode()">
              {{ mode() === 'login' ? 'Sign up' : 'Sign in' }}
            </button>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private router = inject(Router);
  theme = inject(ThemeService);
  toast = inject(ToastService);
  private auth = inject(AuthService);

  mode = signal<'login' | 'signup'>('login');
  showPwd = signal(false);
  loading = signal(false);
  email = 'user@smartledger.app';
  password = '';
  name = '';
  phoneNumber = '';
  remember = true;

  features = ['NLP Transactions', 'AI Insights', 'Anomaly Detection', 'Budget Goals'];
  stats = [
    { label: 'Active users', value: '24K+' },
    { label: 'Insights/mo', value: '1.2M' },
    { label: 'Savings rate', value: '+22%' },
  ];
  providers = [
    { label: 'Google', icon: 'globe' as const },
    { label: 'Apple', icon: 'sparkles' as const },
    { label: 'GitHub', icon: 'bot' as const },
  ];

  toggleMode() { this.mode.update(m => (m === 'login' ? 'signup' : 'login')); }

  social(p: string) {
    this.toast.info('Social sign-in', `${p} login is not configured in this demo`);
  }

  onSubmit() {
    const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement | null;
    const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement | null;
    const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement | null;
    const phoneInput = document.querySelector('input[name="phoneNumber"]') as HTMLInputElement | null;

    const email = emailInput?.value?.trim() ?? '';
    const password = passwordInput?.value ?? '';
    const name = nameInput?.value?.trim() ?? '';
    const phoneNumber = phoneInput?.value?.trim() ?? '';

    if (!email || !password) {
      this.toast.error('Required', 'Please enter email and password');
      return;
    }

    this.loading.set(true);

    const endpoint = this.mode() === 'signup' ? '/register' : '/login';
    fetch(`${'https://localhost:7100/api/Auth'}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.mode() === 'signup' ? { email, password, userName: name, phoneNumber } : { email, password }),
    })
      .then(async response => {
        const data = await response.json();

        if (!response.ok || !data.isSuccess) {
          throw new Error(data.message || 'Authentication failed');
        }

        if (data.token) {
          this.auth.setSession(data.token);
        }

        this.loading.set(false);
        this.toast.success(this.mode() === 'login' ? 'Welcome back' : 'Account created', 'Redirecting…');
        setTimeout(() => this.router.navigateByUrl('/app/dashboard'), 500);
      })
      .catch(() => {
        this.loading.set(false);
        this.toast.error('Error', 'Unable to reach server');
      });
  }
}