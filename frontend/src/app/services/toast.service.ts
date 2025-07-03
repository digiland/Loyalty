import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts: { message: string; type: 'success' | 'error' | 'info' }[] = [];

  show(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.toasts.push({ message, type });
    setTimeout(() => this.toasts.shift(), 3500);
  }

  clear() {
    this.toasts = [];
  }
}
