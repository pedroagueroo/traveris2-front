import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private loadingCount = 0;
  private _loading = new BehaviorSubject<boolean>(false);
  private safetyTimer: ReturnType<typeof setTimeout> | null = null;
  loading$ = this._loading.asObservable();

  show(): void {
    this.loadingCount++;
    this._loading.next(true);
    // Safety timeout: force hide after 30 seconds to prevent infinite loading
    this.resetSafetyTimer();
  }

  hide(): void {
    this.loadingCount = Math.max(0, this.loadingCount - 1);
    if (this.loadingCount === 0) {
      this._loading.next(false);
      this.clearSafetyTimer();
    }
  }

  /** Force reset — used as emergency escape */
  forceHide(): void {
    this.loadingCount = 0;
    this._loading.next(false);
    this.clearSafetyTimer();
  }

  private resetSafetyTimer(): void {
    this.clearSafetyTimer();
    this.safetyTimer = setTimeout(() => {
      if (this.loadingCount > 0) {
        console.warn('[LoadingService] Safety timeout triggered — forcing hide after 30s');
        this.forceHide();
      }
    }, 30000);
  }

  private clearSafetyTimer(): void {
    if (this.safetyTimer) {
      clearTimeout(this.safetyTimer);
      this.safetyTimer = null;
    }
  }
}
