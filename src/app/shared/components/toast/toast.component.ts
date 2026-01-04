import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss'
})
export class ToastComponent {
  private readonly toastService = inject(ToastService);
  toasts$ = this.toastService.toasts$;

  removeToast(id: number): void {
    this.toastService.remove(id);
  }

  getToastClass(type: string): string {
    const baseClass = 'toast align-items-center text-white border-0';
    switch (type) {
      case 'success':
        return `${baseClass} bg-success`;
      case 'error':
        return `${baseClass} bg-danger`;
      case 'warning':
        return `${baseClass} bg-warning`;
      default:
        return `${baseClass} bg-info`;
    }
  }
}

