import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ConfirmService } from '../../services/confirm.service';
import { Cliente } from '../../models';

@Component({
  selector: 'app-import-clientes',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="animate-fadeInUp">
      <div class="page-header">
        <div>
          <h1 class="page-title">📥 Importar Clientes</h1>
          <p class="page-subtitle">Importá clientes desde un archivo Excel (.xlsx) o CSV — Compatible con formato legado</p>
        </div>
        <a routerLink="/clientes" class="btn-elite-outline">← Volver</a>
      </div>

      <!-- Paso 1: Subir archivo -->
      @if (!preview && !resultado) {
        <div class="glass-card-solid" style="text-align: center; padding: 3rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📄</div>
          <h5 style="font-weight: 700;">Subí tu archivo Excel</h5>
          <p style="color: var(--text-muted); margin-bottom: 0.5rem;">
            <strong>Formato estándar:</strong> Nombre Completo, DNI, Email, Teléfono, Fecha Nacimiento, Nacionalidad, Sexo
          </p>
          <p style="color: var(--text-muted); margin-bottom: 1.5rem; font-size: 0.8rem;">
            <strong>Formato legado:</strong> NOMBRE, NOMB1, NOMB2, TIPO, NUMERO, CELULAR, FEC_NAC, EMAIL, NACIONALIDAD — <em>Se detecta automáticamente</em>
          </p>
          <label class="btn-elite" style="cursor: pointer;">
            <span>📤 Seleccionar Archivo</span>
            <input type="file" hidden accept=".xlsx,.xls,.csv" (change)="onFileSelected($event)" />
          </label>
          @if (error) {
            <div style="margin-top: 1rem; color: var(--danger);">{{ error }}</div>
          }
        </div>
      }

      <!-- Paso 2: Preview -->
      @if (preview) {
        <div class="glass-card-solid mb-3" style="padding: 1rem;">
          <div class="d-flex justify-content-between align-items-center flex-wrap" style="gap: 0.5rem;">
            <div>
              @if (preview.formato) {
                <span class="status-pill" [ngClass]="preview.formato === 'LEGACY' ? 'consumida' : 'activa'" style="margin-right: 0.5rem;">
                  {{ preview.formato === 'LEGACY' ? '📋 Formato Legado' : '📄 Formato Estándar' }}
                </span>
              }
              <span style="color: var(--success); font-weight: 600;">✅ {{ preview.validos }} válidos</span>
              @if (preview.invalidos > 0) {
                <span style="color: var(--danger); font-weight: 600; margin-left: 1rem;">❌ {{ preview.invalidos }} inválidos</span>
              }
              <span style="color: var(--text-muted); margin-left: 1rem;">Total: {{ preview.total }}</span>
            </div>
            <div class="d-flex gap-2">
              <button class="btn-elite" (click)="confirmarImport()" [disabled]="importando">
                <span>{{ importando ? 'Importando...' : '✅ Confirmar Importación' }}</span>
              </button>
              <button class="btn-elite-outline" (click)="cancelar()">Cancelar</button>
            </div>
          </div>
        </div>

        <div class="glass-card-solid" style="padding: 0; overflow-x: auto;">
          <table class="table-premium">
            <thead><tr>
              <th>Fila</th><th>Apellido</th><th>Nombre</th><th>DNI</th><th>Email</th><th>Teléfono</th>
              <th>Nac.</th><th>CUIT</th><th>Pasaporte</th><th>Estado</th>
            </tr></thead>
            <tbody>
              @for (c of preview.clientes; track c.fila) {
                <tr [class.invalid-row]="!c.valido">
                  <td>{{ c.fila }}</td>
                  <td class="fw-semibold">{{ c.apellido || '—' }}</td>
                  <td>{{ c.nombre || '—' }}</td>
                  <td>{{ c.dni_pasaporte || '-' }}</td>
                  <td style="font-size: 0.8rem;">{{ c.email || '-' }}</td>
                  <td>{{ c.telefono || '-' }}</td>
                  <td style="font-size: 0.8rem;">{{ c.fecha_nacimiento || '-' }}</td>
                  <td style="font-size: 0.8rem;">{{ c.cuit_cuil || '-' }}</td>
                  <td style="font-size: 0.8rem;">{{ c.pasaporte_nro || '-' }}</td>
                  <td>
                    @if (c.valido) {
                      <span class="status-pill activa">OK</span>
                    } @else {
                      <span class="status-pill cancelado" [title]="c.errores?.join(', ')">ERROR</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Resultado -->
      @if (resultado) {
        <div class="glass-card-solid mt-3" style="text-align: center; padding: 2rem;">
          <div style="font-size: 3rem;">🎉</div>
          <h5 style="font-weight: 700; margin-top: 0.5rem;">Importación completada</h5>
          <p>
            <span style="color: var(--success); font-weight: 600;">{{ resultado.importados }} nuevos</span>
            @if (resultado.actualizados) {
              <span style="color: var(--primary); font-weight: 600; margin-left: 0.5rem;">— {{ resultado.actualizados }} actualizados</span>
            }
            @if (resultado.errores > 0) {
              <span style="color: var(--danger); font-weight: 600; margin-left: 0.5rem;">— {{ resultado.errores }} con errores</span>
            }
          </p>
          <a routerLink="/clientes" class="btn-elite"><span>Ver Clientes</span></a>
        </div>
      }
    </div>
  `,
  styles: [`.invalid-row { background: rgba(239, 68, 68, 0.05); }`]
})
export class ImportClientesComponent {
  preview: {
    formato?: string;
    columnas_detectadas?: string[];
    clientes: (Partial<Cliente> & { fila?: number; valido?: boolean; errores?: string[]; cuit_cuil?: string; pasaporte_nro?: string })[];
    validos: number;
    invalidos: number;
    total: number;
  } | null = null;

  resultado: { importados: number; actualizados?: number; errores: number } | null = null;
  error = '';
  importando = false;

  constructor(private api: ApiService, private confirmSvc: ConfirmService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.error = '';
    this.api.importPreview(input.files[0]).subscribe({
      next: (res) => this.preview = res as typeof this.preview,
      error: (err) => this.error = err.error?.error || 'Error al procesar archivo'
    });
  }

  confirmarImport(): void {
    if (!this.preview) return;
    this.importando = true;
    const validos = this.preview.clientes.filter(c => (c as { valido?: boolean }).valido !== false);
    this.api.importConfirmar(validos).subscribe({
      next: (res) => {
        this.resultado = res;
        this.preview = null;
        this.importando = false;
        this.confirmSvc.toast(`${res.importados} clientes importados${res.actualizados ? `, ${res.actualizados} actualizados` : ''}`);
      },
      error: () => {
        this.importando = false;
        this.confirmSvc.toast('Error al importar clientes', 'error');
      }
    });
  }

  cancelar(): void {
    this.preview = null;
    this.error = '';
  }
}
