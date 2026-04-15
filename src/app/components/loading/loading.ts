import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loading.loading$ | async) {
      <div class="loading-overlay">
        <div class="loading-content">
          <div class="spinner">
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
          </div>
          <span class="loading-text">Cargando...</span>
        </div>
      </div>
    }
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.15s ease;
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.2rem;
    }

    .spinner {
      position: relative;
      width: 56px;
      height: 56px;
    }

    .spinner-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 3px solid transparent;
    }

    .spinner-ring:nth-child(1) {
      border-top-color: #7c5cff;
      animation: spin 1s ease-in-out infinite;
    }

    .spinner-ring:nth-child(2) {
      border-right-color: #00d4aa;
      animation: spin 1.2s ease-in-out infinite reverse;
    }

    .spinner-ring:nth-child(3) {
      width: 70%;
      height: 70%;
      top: 15%;
      left: 15%;
      border-bottom-color: #ffd700;
      animation: spin 0.8s linear infinite;
    }

    .loading-text {
      color: rgba(255, 255, 255, 0.85);
      font-size: 0.85rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class LoadingComponent {
  constructor(public loading: LoadingService) {}
}
