import { Routes } from '@angular/router';
import { App } from './app.component';
import { LayoutComponent } from './layout/layout.component';
import { authGuard } from './core/authentication/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent),
    title: 'Sign in · SmartLedger',
  },
  {
    path: 'app',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Dashboard · SmartLedger',
      },
      {
        path: 'transactions',
        loadComponent: () => import('./features/transactions/transactions.component').then(m => m.TransactionsComponent),
        title: 'Transactions · SmartLedger',
      },
      {
        path: 'ai-assistant',
        loadComponent: () => import('./features/ai-assistant/ai-assistant.component').then(m => m.AiAssistantComponent),
        title: 'Smart AI Entry · SmartLedger',
      },
      {
        path: 'insights',
        loadComponent: () => import('./features/insights/insights.component').then(m => m.InsightsComponent),
        title: 'Insights · SmartLedger',
      },
      {
        path: 'budget',
        loadComponent: () => import('./features/budget/budget.component').then(m => m.BudgetComponent),
        title: 'Budget · SmartLedger',
      },
      {
        path: 'anomalies',
        loadComponent: () => import('./features/anomalies/anomalies.component').then(m => m.AnomaliesComponent),
        title: 'Anomalies · SmartLedger',
      },
      {
        path: 'analytics',
        loadComponent: () => import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent),
        title: 'Analytics · SmartLedger',
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent),
        title: 'Reports · SmartLedger',
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
        title: 'Settings · SmartLedger',
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];