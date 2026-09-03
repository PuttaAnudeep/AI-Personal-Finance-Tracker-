import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private _idCounter = 0;

  success(title: string, message?: string) {
    this.add('success', title, message);
  }

  error(title: string, message?: string) {
    this.add('error', title, message);
  }

  info(title: string, message?: string) {
    this.add('info', title, message);
  }

  warning(title: string, message?: string) {
    this.add('warning', title, message);
  }

  dismiss(id: number) {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  private add(type: ToastType, title: string, message?: string) {
    const id = ++this._idCounter;
    this._toasts.update(list => [...list, { id, type, title, message }]);
    setTimeout(() => this.dismiss(id), 4000);
  }
}