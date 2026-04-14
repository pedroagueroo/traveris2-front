import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ConfirmService, ConfirmDialog } from '../../services/confirm.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- CONFIRM MODAL -->
    @if (visible) {
      <div class="confirm-overlay" (click)="cancel()">
        <div class="confirm-modal animate-fadeInUp" (click)="$event.stopPropagation()">
          <div class="confirm-icon" [ngClass]="dialog.type || 'warning'">
            @if (dialog.type === 'danger') { 🗑️ }
            @else if (dialog.type === 'info') { ℹ️ }
            @else { ⚠️ }
          </div>
          <h3 class="confirm-title">{{ dialog.title }}</h3>
          <p class="confirm-message">{{ dialog.message }}</p>
          <div class="confirm-actions">
            <button class="confirm-btn cancel" (click)="cancel()">{{ dialog.cancelText || 'Cancelar' }}</button>
            <button class="confirm-btn" [ngClass]="dialog.type === 'danger' ? 'danger' : 'primary'" (click)="accept()">{{ dialog.confirmText || 'Confirmar' }}</button>
          </div>
        </div>
      </div>
    }

    <!-- TOASTS -->
    <div class="toast-container">
      @for (t of toasts; track t.id) {
        <div class="toast-item" [ngClass]="t.type" [class.toast-exit]="t.exiting">
          @if (t.type === 'success') { ✅ }
          @else if (t.type === 'error') { ❌ }
          @else { ℹ️ }
          <span>{{ t.message }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .confirm-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.15s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .confirm-modal {
      background: var(--card-bg, #1E293B);
      border: 1px solid var(--border-light, rgba(99,102,241,0.15));
      border-radius: 20px;
      padding: 2rem;
      width: 100%;
      max-width: 420px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }

    .confirm-icon {
      font-size: 2.5rem;
      margin-bottom: 0.75rem;
    }

    .confirm-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary, #E2E8F0);
      margin-bottom: 0.5rem;
    }

    .confirm-message {
      font-size: 0.9rem;
      color: var(--text-secondary, #94A3B8);
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }

    .confirm-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
    }

    .confirm-btn {
      padding: 0.6rem 1.5rem;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .confirm-btn.cancel {
      background: var(--bg-secondary, rgba(100,116,139,0.15));
      color: var(--text-secondary, #94A3B8);
      border: 1px solid var(--border-light, rgba(100,116,139,0.2));
    }
    .confirm-btn.cancel:hover {
      background: rgba(100,116,139,0.25);
    }

    .confirm-btn.primary {
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white;
    }
    .confirm-btn.primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(99,102,241,0.4);
    }

    .confirm-btn.danger {
      background: linear-gradient(135deg, #EF4444, #DC2626);
      color: white;
    }
    .confirm-btn.danger:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(239,68,68,0.4);
    }

    /* TOASTS */
    .toast-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 10001;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .toast-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 500;
      color: white;
      box-shadow: 0 8px 25px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease;
      transition: all 0.3s ease;
    }

    .toast-item.success { background: linear-gradient(135deg, #10B981, #059669); }
    .toast-item.error { background: linear-gradient(135deg, #EF4444, #DC2626); }
    .toast-item.info { background: linear-gradient(135deg, #6366F1, #8B5CF6); }

    .toast-exit {
      opacity: 0;
      transform: translateX(100%);
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(100%); }
      to { opacity: 1; transform: translateX(0); }
    }
  `]
})
export class ConfirmModalComponent implements OnInit, OnDestroy {
  visible = false;
  dialog: ConfirmDialog = { title: '', message: '' };
  toasts: { id: number; message: string; type: string; exiting: boolean }[] = [];

  private resolve: ((result: boolean) => void) | null = null;
  private subs: Subscription[] = [];
  private toastId = 0;

  constructor(private confirmService: ConfirmService) {}

  ngOnInit(): void {
    this.subs.push(
      this.confirmService.dialog$.subscribe(({ dialog, resolve }) => {
        this.dialog = dialog;
        this.resolve = resolve;
        this.visible = true;
      }),
      this.confirmService.toast$.subscribe(({ message, type }) => {
        const id = ++this.toastId;
        this.toasts.push({ id, message, type, exiting: false });
        setTimeout(() => {
          const t = this.toasts.find(x => x.id === id);
          if (t) t.exiting = true;
          setTimeout(() => this.toasts = this.toasts.filter(x => x.id !== id), 300);
        }, 3000);
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  accept(): void {
    this.visible = false;
    this.resolve?.(true);
    this.resolve = null;
  }

  cancel(): void {
    this.visible = false;
    this.resolve?.(false);
    this.resolve = null;
  }
}
