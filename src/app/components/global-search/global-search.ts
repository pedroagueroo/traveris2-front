import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Cliente, Reserva } from '../../models';

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    @if (visible) {
      <div class="search-backdrop" (click)="cerrar()">
        <div class="search-modal animate-fadeInUp" (click)="$event.stopPropagation()">
          <div class="search-input-wrap">
            <span style="font-size: 1.1rem; opacity: 0.5;">🔍</span>
            <input
              #searchInput
              class="search-input"
              [(ngModel)]="query"
              (input)="buscar()"
              placeholder="Buscar clientes, reservas..."
              autocomplete="off"
            />
            <span class="search-esc" (click)="cerrar()">ESC</span>
          </div>

          @if (cargando) {
            <div class="search-empty">Buscando...</div>
          } @else if (query.length >= 2 && !clientes.length && !reservas.length) {
            <div class="search-empty">Sin resultados para "{{ query }}"</div>
          } @else if (query.length >= 2) {
            <div class="search-results">
              @if (clientes.length) {
                <div class="result-section-label">Clientes</div>
                @for (c of clientes; track c.id) {
                  <a [routerLink]="['/clientes/detalle', c.id]"
                     class="result-item" (click)="cerrar()">
                    <div class="result-icon">👤</div>
                    <div>
                      <div class="result-title">{{ c.apellido }} {{ c.nombre }}</div>
                      <div class="result-sub">{{ c.dni_pasaporte || 'Sin DNI' }} · {{ c.email || '-' }}</div>
                    </div>
                  </a>
                }
              }
              @if (reservas.length) {
                <div class="result-section-label">Reservas</div>
                @for (r of reservas; track r.id) {
                  <a [routerLink]="['/reservas', r.id]"
                     class="result-item" (click)="cerrar()">
                    <div class="result-icon">📋</div>
                    <div>
                      <div class="result-title">{{ r.titular_nombre }}</div>
                      <div class="result-sub">#{{ r.id }} · {{ r.destino_final || 'Sin destino' }}</div>
                    </div>
                    <span class="status-pill {{ r.estado.toLowerCase() }}" style="font-size: 0.65rem; margin-left: auto;">
                      {{ r.estado }}
                    </span>
                  </a>
                }
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .search-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      backdrop-filter: blur(4px); z-index: 99999;
      display: flex; align-items: flex-start; justify-content: center;
      padding-top: 10vh;
    }
    .search-modal {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: 16px; width: 100%; max-width: 560px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4); overflow: hidden;
      margin: 0 1rem;
    }
    .search-input-wrap {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-color);
    }
    .search-input {
      flex: 1; background: none; border: none; outline: none;
      font-size: 1rem; color: var(--text-primary); font-family: inherit;
    }
    .search-input::placeholder { color: var(--text-muted); }
    .search-esc {
      font-size: 0.7rem; padding: 2px 6px; border-radius: 4px;
      background: var(--bg-secondary); color: var(--text-muted);
      cursor: pointer; border: 1px solid var(--border-color);
    }
    .search-results { max-height: 420px; overflow-y: auto; }
    .result-section-label {
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.06em; color: var(--text-muted);
      padding: 0.75rem 1.25rem 0.25rem;
    }
    .result-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.75rem 1.25rem; text-decoration: none;
      transition: background 0.15s; cursor: pointer;
    }
    .result-item:hover { background: var(--bg-secondary); }
    .result-icon { font-size: 1rem; opacity: 0.6; }
    .result-title { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }
    .result-sub { font-size: 0.75rem; color: var(--text-muted); }
    .search-empty { padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.9rem; }
  `]
})
export class GlobalSearchComponent implements OnInit, OnDestroy {
  visible = false;
  query = '';
  clientes: Partial<Cliente>[] = [];
  reservas: Reserva[] = [];
  cargando = false;
  private timeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private api: ApiService, private router: Router) {}

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      this.visible ? this.cerrar() : this.abrir();
    }
    if (e.key === 'Escape') this.cerrar();
  }

  ngOnInit(): void {}
  ngOnDestroy(): void { if (this.timeout) clearTimeout(this.timeout); }

  abrir(): void { this.visible = true; this.query = ''; }

  cerrar(): void {
    this.visible = false;
    this.query = '';
    this.clientes = [];
    this.reservas = [];
  }

  buscar(): void {
    if (this.timeout) clearTimeout(this.timeout);
    if (this.query.length < 2) { this.clientes = []; this.reservas = []; return; }
    this.cargando = true;
    this.timeout = setTimeout(() => {
      Promise.all([
        this.api.getClientes(1, 5, this.query).toPromise(),
        this.api.getReservas(1, 5, this.query).toPromise()
      ]).then(([cls, res]) => {
        this.clientes = cls?.data || [];
        this.reservas = res?.data || [];
        this.cargando = false;
      }).catch(() => { this.cargando = false; });
    }, 300);
  }
}
