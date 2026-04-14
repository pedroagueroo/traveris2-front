import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ConfirmService } from '../../services/confirm.service';
import { AgenciaConfig, ReciboConfig } from '../../models';

@Component({
  selector: 'app-admin-agencia-config',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="animate-fadeInUp">
      <div class="page-header">
        <div>
          <h1 class="page-title">⚙️ {{ agencia?.nombre_comercial || empresaNombre }}</h1>
          <p class="page-subtitle">Configuración de la agencia</p>
        </div>
        <a routerLink="/admin" class="btn-elite-outline">← Volver</a>
      </div>

      @if (agencia) {
        <div class="row g-3">
          <!-- Datos de la empresa -->
          <div class="col-lg-8">
            <div class="glass-card-solid">
              <h5 class="section-title">🏢 Datos de la Empresa</h5>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label-elite">Nombre Comercial</label>
                  <input class="form-control-elite w-100" [(ngModel)]="agencia.nombre_comercial" />
                </div>
                <div class="col-md-6">
                  <label class="form-label-elite">Titular</label>
                  <input class="form-control-elite w-100" [(ngModel)]="agencia.titular" />
                </div>
                <div class="col-md-4">
                  <label class="form-label-elite">CUIT/CUIL</label>
                  <input class="form-control-elite w-100" [(ngModel)]="agencia.cuit_cuil" />
                </div>
                <div class="col-md-4">
                  <label class="form-label-elite">Condición Fiscal</label>
                  <select class="form-select-elite w-100" [(ngModel)]="agencia.condicion_fiscal">
                    <option value="">Seleccionar</option>
                    <option value="MONOTRIBUTO">Monotributo</option>
                    <option value="RESP_INSCRIPTO">Resp. Inscripto</option>
                    <option value="EXENTO">Exento</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label-elite">Teléfono</label>
                  <input class="form-control-elite w-100" [(ngModel)]="agencia.telefono" />
                </div>
                <div class="col-md-6">
                  <label class="form-label-elite">Domicilio</label>
                  <input class="form-control-elite w-100" [(ngModel)]="agencia.domicilio" />
                </div>
                <div class="col-md-3">
                  <label class="form-label-elite">Email</label>
                  <input class="form-control-elite w-100" [(ngModel)]="agencia.email" />
                </div>
                <div class="col-md-3">
                  <label class="form-label-elite">Web</label>
                  <input class="form-control-elite w-100" [(ngModel)]="agencia.pagina_web" />
                </div>
                <div class="col-12">
                  <label class="form-label-elite">Footer Legal (para recibos)</label>
                  <textarea class="form-control-elite w-100" [(ngModel)]="agencia.recibo_footer_legal" rows="2"></textarea>
                </div>
              </div>
              <button class="btn-elite mt-3" (click)="guardarAgencia()"><span>💾 Guardar Cambios</span></button>
            </div>
          </div>

          <!-- Logo y estado -->
          <div class="col-lg-4">
            <div class="glass-card-solid mb-3">
              <h5 class="section-title">🖼️ Logo</h5>
              @if (agencia.logo_url) {
                <img [src]="agencia.logo_url" alt="Logo" style="max-width: 100%; border-radius: 8px; margin-bottom: 1rem;" />
              } @else {
                <div style="background: var(--bg-secondary); border-radius: 8px; padding: 2rem; text-align: center; color: var(--text-muted); margin-bottom: 1rem;">
                  Sin logo
                </div>
              }
              <label class="btn-elite-outline w-100" style="text-align: center; cursor: pointer;">
                <span>📤 Subir Logo</span>
                <input type="file" hidden accept="image/*" (change)="subirLogo($event)" />
              </label>
            </div>

            <div class="glass-card-solid">
              <h5 class="section-title">⚡ Estado</h5>
              <div class="d-flex justify-content-between align-items-center">
                <span>Agencia activa</span>
                <span class="status-pill" [ngClass]="agencia.activa ? 'activa' : 'cancelado'">
                  {{ agencia.activa ? 'ACTIVA' : 'INACTIVA' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Configuración de recibo -->
          <div class="col-12">
            <div class="glass-card-solid">
              <h5 class="section-title">🧾 Personalización de Recibos</h5>
              <div class="row g-3">
                <div class="col-md-3">
                  <label class="form-label-elite">Color Primario</label>
                  <div class="d-flex gap-2 align-items-center">
                    <input type="color" [ngModel]="reciboConfig.primaryColor" (ngModelChange)="reciboConfig.primaryColor = $event" style="width: 40px; height: 35px; border: none; cursor: pointer;" />
                    <input class="form-control-elite" style="flex: 1;" [(ngModel)]="reciboConfig.primaryColor" />
                  </div>
                </div>
                <div class="col-md-3">
                  <label class="form-label-elite">Color Secundario</label>
                  <div class="d-flex gap-2 align-items-center">
                    <input type="color" [ngModel]="reciboConfig.secondaryColor" (ngModelChange)="reciboConfig.secondaryColor = $event" style="width: 40px; height: 35px; border: none; cursor: pointer;" />
                    <input class="form-control-elite" style="flex: 1;" [(ngModel)]="reciboConfig.secondaryColor" />
                  </div>
                </div>
                <div class="col-md-3">
                  <label class="form-label-elite">Posición Logo</label>
                  <select class="form-select-elite w-100" [(ngModel)]="reciboConfig.logoPosition">
                    <option value="left">Izquierda</option>
                    <option value="center">Centro</option>
                    <option value="right">Derecha</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <label class="form-label-elite">Mostrar Logo ARCA</label>
                  <select class="form-select-elite w-100" [(ngModel)]="reciboConfig.showArcaLogo">
                    <option [ngValue]="true">Sí</option>
                    <option [ngValue]="false">No</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label-elite">Familia Tipográfica</label>
                  <input class="form-control-elite w-100" [(ngModel)]="reciboConfig.fontFamily" />
                </div>
                <div class="col-md-6">
                  <label class="form-label-elite">Texto Extra</label>
                  <input class="form-control-elite w-100" [(ngModel)]="reciboConfig.extraText" />
                </div>
              </div>
              <button class="btn-elite mt-3" (click)="guardarReciboConfig()"><span>💾 Guardar Config Recibo</span></button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`.section-title { font-weight: 700; font-size: 1rem; margin-bottom: 1rem; }`]
})
export class AdminAgenciaConfigComponent implements OnInit {
  agencia: AgenciaConfig | null = null;
  empresaNombre = '';
  reciboConfig: ReciboConfig = {
    primaryColor: '#6366F1', secondaryColor: '#8B5CF6',
    fontFamily: 'Inter', logoPosition: 'left', showArcaLogo: true, extraText: ''
  };

  constructor(private api: ApiService, private route: ActivatedRoute, private confirmSvc: ConfirmService) {}

  ngOnInit(): void {
    this.empresaNombre = this.route.snapshot.paramMap.get('empresa') || '';
    this.api.getAgenciaConfig(this.empresaNombre).subscribe({
      next: (a) => {
        this.agencia = a;
        if (a.recibo_config) this.reciboConfig = { ...this.reciboConfig, ...a.recibo_config };
      }
    });
  }

  guardarAgencia(): void {
    if (!this.agencia) return;
    this.api.updateAgenciaConfig(this.empresaNombre, this.agencia).subscribe({
      next: () => this.confirmSvc.toast('Agencia actualizada correctamente')
    });
  }

  subirLogo(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.api.uploadLogoAgencia(this.empresaNombre, input.files[0]).subscribe({
      next: (res) => { if (this.agencia) this.agencia.logo_url = res.logo_url; }
    });
  }

  guardarReciboConfig(): void {
    this.api.updateReciboConfig(this.empresaNombre, this.reciboConfig).subscribe({
      next: () => this.confirmSvc.toast('Configuración de recibo actualizada')
    });
  }
}
