import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AgenciaConfig } from '../../models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-archivos-agencias',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">📁 Archivos de Agencias</h1>
        <a routerLink="/admin" class="btn-elite-outline">← Volver</a>
      </div>

      @if (cargando) {
        <div class="text-center py-5"><div class="spinner-border" style="color: var(--primary);"></div></div>
      } @else if (agencias.length === 0) {
        <div class="glass-card-solid text-center py-4">
          <p style="color: var(--text-muted);">No hay agencias registradas.</p>
        </div>
      } @else {
        <div class="row g-4">
          @for (a of agencias; track a.id) {
            <div class="col-md-6 col-lg-4">
              <div class="glass-card-solid" style="overflow: hidden;">
                <!-- Banner Preview -->
                <div class="banner-preview" [style.background-image]="a.banner_url ? 'url(' + getBannerUrl(a.banner_url) + ')' : 'none'">
                  @if (!a.banner_url) {
                    <div class="banner-placeholder">
                      <span style="font-size: 2rem;">🖼️</span>
                      <span style="font-size: 0.8rem; color: var(--text-muted);">Sin banner</span>
                    </div>
                  }
                  <div class="banner-overlay">
                    <span class="banner-label">{{ a.nombre_comercial || a.empresa_nombre }}</span>
                  </div>
                </div>

                <!-- Info -->
                <div style="padding: 1rem;">
                  <h6 class="fw-bold mb-1">{{ a.nombre_comercial || a.empresa_nombre }}</h6>
                  <small style="color: var(--text-muted); display: block; margin-bottom: 0.5rem;">
                    {{ a.email || 'Sin email' }} | {{ a.telefono || 'Sin teléfono' }}
                  </small>

                  @if (a.banner_url) {
                    <div class="d-flex align-items-center gap-2 mb-2">
                      <span class="status-pill status-activa" style="font-size: 0.65rem;">✅ Banner cargado</span>
                    </div>
                  }

                  <div class="d-flex gap-2">
                    <label class="btn-success-elite" style="cursor: pointer; font-size: 0.75rem; padding: 0.3rem 0.8rem;">
                      <span>{{ a.banner_url ? '🔄 Cambiar Banner' : '📤 Subir Banner' }}</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" style="display: none;"
                        (change)="onBannerSeleccionado($event, a)" />
                    </label>
                    @if (a.banner_url) {
                      <button class="btn-danger-elite" style="font-size: 0.75rem; padding: 0.3rem 0.8rem;"
                        (click)="eliminarBanner(a)">🗑️ Quitar</button>
                    }
                  </div>

                  @if (subiendo === a.empresa_nombre) {
                    <div class="mt-2" style="color: var(--primary); font-size: 0.75rem;">
                      ⏳ Subiendo banner...
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .banner-preview {
      width: 100%;
      height: 120px;
      background-size: cover;
      background-position: center;
      background-color: rgba(var(--primary-rgb), 0.15);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .banner-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }
    .banner-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0,0,0,0.6));
      padding: 0.5rem 0.75rem;
    }
    .banner-label {
      color: white;
      font-size: 0.8rem;
      font-weight: 600;
    }
  `]
})
export class AdminArchivosAgenciasComponent implements OnInit {
  agencias: AgenciaConfig[] = [];
  cargando = true;
  subiendo: string | null = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.api.getAgencias().subscribe({
      next: (data) => { this.agencias = data; this.cargando = false; },
      error: () => { this.cargando = false; }
    });
  }

  getBannerUrl(url: string): string {
    if (url.startsWith('http')) return url;
    // Local fallback: prepend backend URL
    return environment.apiUrl.replace('/api', '') + '/uploads/' + url;
  }

  onBannerSeleccionado(event: Event, agencia: AgenciaConfig): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];

    this.subiendo = agencia.empresa_nombre;
    this.api.uploadBannerAgencia(agencia.empresa_nombre, file).subscribe({
      next: (res) => {
        agencia.banner_url = res.banner_url;
        this.subiendo = null;
      },
      error: () => { this.subiendo = null; }
    });
  }

  eliminarBanner(agencia: AgenciaConfig): void {
    // Set banner_url to null via update
    this.api.updateAgenciaConfig(agencia.empresa_nombre, { banner_url: null } as any).subscribe({
      next: () => { agencia.banner_url = null; },
      error: () => {}
    });
  }
}
