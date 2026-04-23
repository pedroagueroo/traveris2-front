import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface ConfirmDialog {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  requireText?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private dialogSubject = new Subject<{ dialog: ConfirmDialog; resolve: (result: boolean) => void }>();
  private toastSubject = new Subject<{ message: string; type: 'success' | 'error' | 'info' }>();

  dialog$ = this.dialogSubject.asObservable();
  toast$ = this.toastSubject.asObservable();

  confirm(dialog: ConfirmDialog): Promise<boolean> {
    return new Promise(resolve => {
      this.dialogSubject.next({ dialog, resolve });
    });
  }

  toast(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    this.toastSubject.next({ message, type });
  }
}
