import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-tarjetas-guardadas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="animate-fadeInUp">
      <div class="page-header">
        <div>
          <h1 class="page-title">💳 Tarjetas de la Agencia</h1>
          <p class="page-subtitle">Vault seguro — los números se guardan encriptados</p>
        </div>
        <button class="btn-elite" (click)="mostrarForm = !mostrarForm">
          <span>➕ Nueva Tarjeta</span>
        </button>
      </div>

      @if (mostrarForm) {
        <div class="glass-card-solid mb-3">
          <h6 class="fw-bold mb-3">Nueva Tarjeta</h6>
          <div class="row g-3">
            <div class="col-md-3">
              <label class="form-label-elite">Alias *</label>
              <input class="form-control-elite w-100" [(ngModel)]="form.alias"
                placeholder="Ej: VISA_GALICIA_1234" />
            </div>
            <div class="col-md-4">
              <label class="form-label-elite">Número completo *</label>
              <input class="form-control-elite w-100" [(ngModel)]="form.nro_tarjeta_completo"
                placeholder="Solo dígitos, se encripta al guardar"
                type="password" autocomplete="off" />
            </div>
            <div class="col-md-3">
              <label class="form-label-elite">Banco</label>
              <input class="form-control-elite w-100" [(ngModel)]="form.banco"
                placeholder="Ej: Galicia" />
            </div>
            <div class="col-md-2">
              <label class="form-label-elite">Vencimiento</label>
              <input class="form-control-elite w-100" [(ngModel)]="form.vencimiento"
                placeholder="MM/AA" maxlength="5" />
            </div>
          </div>
          <div class="d-flex gap-2 mt-3">
            <button class="btn-elite" (click)="guardar()"><span>💾 Guardar</span></button>
            <button class="btn-elite-outline" (click)="cancelar()">Cancelar</button>
          </div>
          <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.75rem;">
            El número completo se encripta con AES antes de guardarse. Solo se muestra los últimos 4 dígitos.
          </p>
        </div>
      }

      <div class="glass-card-solid" style="padding: 0; overflow-x: auto;">
        <table class="table-premium">
          <thead>
            <tr>
              <th>Alias</th>
              <th>Número</th>
              <th>Banco</th>
              <th>Vencimiento</th>
              <th>Últ. 4 dígitos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (t of tarjetas; track t.id) {
              <tr>
                <td class="fw-bold">{{ t.alias }}</td>
                <td>{{ t.nro_tarjeta }}</td>
                <td>{{ t.banco || '-' }}</td>
                <td>{{ t.vencimiento || '-' }}</td>
                <td>
                  <span class="status-pill abierto" style="font-size: 0.7rem; letter-spacing: 0.1em;">
                    **** {{ t.ultimos_4 }}
                  </span>
                </td>
                <td>
                  <button class="btn-danger-elite"
                    style="padding: 0.2rem 0.5rem; font-size: 0.7rem;"
                    (click)="eliminar(t.id)">🗑️</button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                  Sin tarjetas guardadas
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class TarjetasGuardadasComponent implements OnInit {
  tarjetas: any[] = [];
  mostrarForm = false;
  form = { alias: '', nro_tarjeta_completo: '', banco: '', vencimiento: '' };

  constructor(private api: ApiService, private confirmSvc: ConfirmService) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.api.getTarjetasGuardadas().subscribe({ next: (t) => this.tarjetas = t });
  }

  guardar(): void {
    if (!this.form.alias || !this.form.nro_tarjeta_completo) {
      this.confirmSvc.toast('Alias y número son requeridos', 'error');
      return;
    }
    this.api.crearTarjetaGuardada(this.form).subscribe({
      next: () => {
        this.confirmSvc.toast('Tarjeta guardada de forma segura');
        this.cancelar();
        this.cargar();
      },
      error: (err) => this.confirmSvc.toast(err.error?.error || 'Error al guardar', 'error')
    });
  }

  cancelar(): void {
    this.mostrarForm = false;
    this.form = { alias: '', nro_tarjeta_completo: '', banco: '', vencimiento: '' };
  }

  async eliminar(id: number): Promise<void> {
    const ok = await this.confirmSvc.confirm({
      title: 'Eliminar Tarjeta',
      message: '¿Eliminar esta tarjeta del vault? Esta acción no se puede deshacer.',
      confirmText: 'Sí, eliminar',
      type: 'danger'
    });
    if (!ok) return;
    this.api.deleteTarjetaGuardada(id).subscribe({
      next: () => { this.confirmSvc.toast('Tarjeta eliminada'); this.cargar(); },
      error: (err) => this.confirmSvc.toast(err.error?.error || 'Error al eliminar', 'error')
    });
  }
}
