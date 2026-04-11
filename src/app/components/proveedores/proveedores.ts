import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Proveedor } from '../../models';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="animate-fadeInUp">
      <div class="page-header">
        <div>
          <h1 class="page-title">Proveedores</h1>
          <p class="page-subtitle">{{ proveedores.length }} proveedores registrados</p>
        </div>
        <button class="btn-elite" (click)="mostrarForm = true"><span>➕ Nuevo</span></button>
      </div>

      @if (mostrarForm) {
        <div class="glass-card-solid mb-3">
          <h5 style="font-weight: 700; margin-bottom: 1rem;">{{ editandoId ? 'Editar' : 'Nuevo' }} Proveedor</h5>
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label-elite">Nombre Comercial *</label>
              <input class="form-control-elite w-100" [(ngModel)]="form.nombre_comercial" />
            </div>
            <div class="col-md-4">
              <label class="form-label-elite">Razón Social / CUIT</label>
              <input class="form-control-elite w-100" [(ngModel)]="form.razon_social_cuit" />
            </div>
            <div class="col-md-4">
              <label class="form-label-elite">Contacto</label>
              <input class="form-control-elite w-100" [(ngModel)]="form.contacto" />
            </div>
            <div class="col-md-4">
              <label class="form-label-elite">Email</label>
              <input class="form-control-elite w-100" [(ngModel)]="form.email" />
            </div>
          </div>
          <div class="d-flex gap-2 mt-3">
            <button class="btn-elite" (click)="guardar()"><span>Guardar</span></button>
            <button class="btn-elite-outline" (click)="cancelar()">Cancelar</button>
          </div>
        </div>
      }

      <div class="glass-card-solid" style="padding: 0; overflow: hidden;">
        <table class="table-premium">
          <thead><tr><th>Nombre</th><th>Razón Social</th><th>Contacto</th><th>Email</th><th>Acciones</th></tr></thead>
          <tbody>
            @for (p of proveedores; track p.id) {
              <tr>
                <td style="font-weight: 600;">{{ p.nombre_comercial }}</td>
                <td>{{ p.razon_social_cuit || '-' }}</td>
                <td>{{ p.contacto || '-' }}</td>
                <td>{{ p.email || '-' }}</td>
                <td>
                  <button class="btn-elite-outline" style="padding: 0.25rem 0.5rem; font-size: 0.7rem;" (click)="editar(p)">Editar</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">Sin proveedores</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ProveedoresComponent implements OnInit {
  proveedores: Proveedor[] = [];
  mostrarForm = false;
  editandoId: number | null = null;
  form = { nombre_comercial: '', razon_social_cuit: '', contacto: '', email: '' };

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.api.getProveedores().subscribe({ next: (d) => this.proveedores = d });
  }

  guardar(): void {
    if (!this.form.nombre_comercial) return;
    const obs = this.editandoId
      ? this.api.updateProveedor(this.editandoId, this.form)
      : this.api.crearProveedor(this.form);
    obs.subscribe({ next: () => { this.cancelar(); this.cargar(); } });
  }

  editar(p: Proveedor): void {
    this.editandoId = p.id;
    this.form = { nombre_comercial: p.nombre_comercial, razon_social_cuit: p.razon_social_cuit || '', contacto: p.contacto || '', email: p.email || '' };
    this.mostrarForm = true;
  }

  cancelar(): void {
    this.mostrarForm = false;
    this.editandoId = null;
    this.form = { nombre_comercial: '', razon_social_cuit: '', contacto: '', email: '' };
  }
}
