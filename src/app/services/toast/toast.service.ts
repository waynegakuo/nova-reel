import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  showToast(message: string, type: Toast['type'] = 'info', duration: number = 4000): void {
    const id = this.generateId();
    const toast: Toast = { id, message, type, duration };

    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, toast]);

    // Auto-remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, duration);
    }
  }

  removeToast(id: string): void {
    const currentToasts = this.toastsSubject.value;
    const filteredToasts = currentToasts.filter(toast => toast.id !== id);
    this.toastsSubject.next(filteredToasts);
  }

  clearAll(): void {
    this.toastsSubject.next([]);
  }

  // Convenience methods
  success(message: string, duration?: number): void {
    this.showToast(message, 'success', duration);
  }

  error(message: string, duration?: number): void {
    this.showToast(message, 'error', duration);
  }

  warning(message: string, duration?: number): void {
    this.showToast(message, 'warning', duration);
  }

  info(message: string, duration?: number): void {
    this.showToast(message, 'info', duration);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}
