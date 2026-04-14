import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { ReciboDetalle, AgenciaConfig, Moneda } from '../models';

// Importaciones dinámicas para reducir bundle inicial
declare const jspdf: { jsPDF: new (options?: Record<string, unknown>) => JsPDFInstance };

interface JsPDFInstance {
  setFontSize(size: number): JsPDFInstance;
  setTextColor(r: number, g: number, b: number): JsPDFInstance;
  setDrawColor(r: number, g: number, b: number): JsPDFInstance;
  setFillColor(r: number, g: number, b: number): JsPDFInstance;
  setFont(font: string, style?: string): JsPDFInstance;
  text(text: string, x: number, y: number, options?: Record<string, unknown>): JsPDFInstance;
  rect(x: number, y: number, w: number, h: number, style?: string): JsPDFInstance;
  roundedRect(x: number, y: number, w: number, h: number, rx: number, ry: number, style?: string): JsPDFInstance;
  line(x1: number, y1: number, x2: number, y2: number): JsPDFInstance;
  setLineDashPattern(pattern: number[], phase: number): JsPDFInstance;
  addImage(data: string, format: string, x: number, y: number, w: number, h: number): JsPDFInstance;
  save(filename: string): void;
  output(type: string): string;
  internal: { pageSize: { getWidth(): number; getHeight(): number } };
}

@Injectable({ providedIn: 'root' })
export class ReciboPdfService {
  constructor(private api: ApiService) {}

  async generarReciboPDF(idRecibo: number): Promise<void> {
    // Cargar datos del recibo
    const detalle = await this.api.getRecibo(idRecibo).toPromise();
    if (!detalle) throw new Error('No se pudo cargar el recibo');

    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as unknown as JsPDFInstance;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 12;
    const contentW = pageW - 2 * margin;
    const halfH = pageH / 2;

    const recibo = detalle.recibo;
    const agencia = detalle.agencia;
    const reserva = detalle.reserva;

    // Parsear colores
    const primary = this.hexToRgb(agencia?.recibo_config?.primaryColor || '#6366F1');
    const secondary = this.hexToRgb(agencia?.recibo_config?.secondaryColor || '#8B5CF6');

    // ═══════════════════════════════════════════════════════════════
    // COPIA 1 — AGENCIA (top half)
    // ═══════════════════════════════════════════════════════════════
    this.dibujarRecibo(doc, recibo, agencia, reserva, primary, secondary, margin, contentW, pageW, 0, 'ORIGINAL — AGENCIA');

    // ═══════════════════════════════════════════════════════════════
    // LÍNEA DE CORTE
    // ═══════════════════════════════════════════════════════════════
    doc.setDrawColor(180, 180, 180);
    doc.setLineDashPattern([3, 2], 0);
    doc.line(5, halfH, pageW - 5, halfH);
    // Scissors icon
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.setFont('helvetica', 'normal');
    doc.text('✂ — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — ', pageW / 2, halfH - 1, { align: 'center' });
    doc.setLineDashPattern([], 0);

    // ═══════════════════════════════════════════════════════════════
    // COPIA 2 — CLIENTE (bottom half)
    // ═══════════════════════════════════════════════════════════════
    this.dibujarRecibo(doc, recibo, agencia, reserva, primary, secondary, margin, contentW, pageW, halfH + 2, 'DUPLICADO — CLIENTE');

    // ANULADO watermark
    if (recibo.anulado) {
      doc.setFontSize(50);
      doc.setTextColor(239, 68, 68);
      doc.setFont('helvetica', 'bold');
      doc.text('ANULADO', pageW / 2, halfH / 2, { align: 'center', angle: 30 } as Record<string, unknown>);
      doc.text('ANULADO', pageW / 2, halfH + halfH / 2, { align: 'center', angle: 30 } as Record<string, unknown>);
    }

    const filename = `Recibo_${String(recibo.numero_recibo).padStart(6, '0')}_${recibo.nombre_cliente?.replace(/\s+/g, '_') || 'cliente'}.pdf`;
    doc.save(filename);
  }

  private dibujarRecibo(
    doc: JsPDFInstance,
    recibo: ReciboDetalle['recibo'],
    agencia: ReciboDetalle['agencia'],
    reserva: ReciboDetalle['reserva'],
    primary: { r: number; g: number; b: number },
    secondary: { r: number; g: number; b: number },
    margin: number, contentW: number, pageW: number,
    offsetY: number, copyLabel: string
  ): void {
    let y = offsetY + 5;

    // ── HEADER ──
    doc.setFillColor(primary.r, primary.g, primary.b);
    doc.rect(0, offsetY, pageW, 22, 'F');

    // Agency name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(agencia?.nombre_comercial || agencia?.empresa_nombre || 'Traveris Pro', margin, y + 6);

    // Contact
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    const contactLine = [agencia?.domicilio, agencia?.telefono, agencia?.email].filter(Boolean).join(' | ');
    doc.text(contactLine, margin, y + 11);

    // CUIT
    const fiscalLine = [
      agencia?.cuit_cuil ? `CUIT: ${agencia.cuit_cuil}` : null,
      agencia?.condicion_fiscal
    ].filter(Boolean).join(' — ');
    if (fiscalLine) doc.text(fiscalLine, margin, y + 15);

    // Nro recibo (right)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`#${String(recibo.numero_recibo).padStart(6, '0')}`, pageW - margin, y + 6, { align: 'right' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('RECIBO NO FISCAL', pageW - margin, y + 12, { align: 'right' });

    // Copy label (ORIGINAL / DUPLICADO)
    doc.setFontSize(5.5);
    doc.text(copyLabel, pageW - margin, y + 16, { align: 'right' });

    y = offsetY + 25;

    // ── DATOS DEL CLIENTE ──
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('RECIBÍ DE:', margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(recibo.nombre_cliente || 'Sin nombre', margin + 22, y);

    // DNI + Date (same line)
    y += 5;
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    if (recibo.dni_cliente) {
      doc.text(`DNI/Pasaporte: ${recibo.dni_cliente}`, margin, y);
    }
    doc.text(`Fecha: ${this.formatFecha(recibo.fecha)}`, pageW - margin, y, { align: 'right' });

    y += 7;

    // ── CONCEPTO + MONTO BOX ──
    doc.setDrawColor(primary.r, primary.g, primary.b);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentW, 22, 2, 2, 'FD');

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('CONCEPTO', margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const concepto = recibo.concepto || this.generarConcepto(recibo, reserva);
    doc.text(concepto, margin + 4, y + 11);

    // Monto
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(primary.r, primary.g, primary.b);
    const montoStr = this.formatMonto(recibo.monto, recibo.moneda);
    doc.text(montoStr, pageW - margin - 4, y + 10, { align: 'right' });

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(recibo.moneda, pageW - margin - 4, y + 16, { align: 'right' });

    y += 25;

    // ── DETALLES ──
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLES', margin, y);
    y += 3;

    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageW - margin, y);
    y += 3.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);

    const detalles: [string, string][] = [
      ['Tipo de pago', this.traducirTipo(recibo.pago_tipo || '')],
      ['Método', recibo.metodo_pago || '-'],
      ['Fecha pago', this.formatFecha(recibo.pago_fecha || recibo.fecha)]
    ];

    if (reserva) {
      detalles.push(['Destino', reserva.destino_final || '-']);
      if (reserva.fecha_viaje_salida) {
        detalles.push(['Viaje', `${this.formatFechaCorta(reserva.fecha_viaje_salida)} → ${this.formatFechaCorta(reserva.fecha_viaje_regreso || '')}`]);
      }
    }

    detalles.forEach(([label, value]) => {
      doc.setTextColor(130, 130, 130);
      doc.text(label, margin, y);
      doc.setTextColor(60, 60, 60);
      doc.text(value, margin + 30, y);
      y += 4;
    });

    y += 2;

    // ── MONTO EN LETRAS ──
    doc.setFillColor(secondary.r, secondary.g, secondary.b);
    doc.roundedRect(margin, y, contentW, 8, 1.5, 1.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`SON: ${this.montoEnLetras(recibo.monto, recibo.moneda)}`, margin + 3, y + 5.5);

    y += 12;

    // ── FIRMAS ──
    doc.setDrawColor(180, 180, 180);
    const firmaW = 50;

    doc.line(margin + 10, y + 8, margin + 10 + firmaW, y + 8);
    doc.setTextColor(130, 130, 130);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text('Firma y sello', margin + 10 + firmaW / 2, y + 11, { align: 'center' });

    doc.line(pageW - margin - 10 - firmaW, y + 8, pageW - margin - 10, y + 8);
    doc.text('Firma del cliente', pageW - margin - 10 - firmaW / 2, y + 11, { align: 'center' });

    // ── FOOTER LEGAL ──
    const footerY = offsetY + (297 / 2) - 8;
    doc.setFontSize(5.5);
    doc.setTextColor(160, 160, 160);
    const footerLegal = agencia?.recibo_footer_legal || 'Documento no fiscal. No válido como factura.';
    doc.text(footerLegal, pageW / 2, footerY, { align: 'center' });
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : { r: 99, g: 102, b: 241 };
  }

  private formatFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  private formatFechaCorta(fecha: string): string {
    if (!fecha) return '?';
    return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private formatMonto(monto: number, moneda: Moneda): string {
    const symbol = moneda === 'USD' ? 'US$' : moneda === 'EUR' ? '€' : '$';
    return `${symbol} ${new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(monto)}`;
  }

  private generarConcepto(recibo: ReciboDetalle['recibo'], reserva: ReciboDetalle['reserva']): string {
    const tipo = this.traducirTipo(recibo.pago_tipo || '');
    if (reserva?.destino_final) {
      return `${tipo} — Viaje a ${reserva.destino_final}`;
    }
    return tipo;
  }

  private traducirTipo(tipo: string): string {
    const map: Record<string, string> = {
      'COBRO_CLIENTE': 'Cobro a cliente',
      'PAGO_PROVEEDOR': 'Pago a proveedor',
      'INGRESO_GENERAL': 'Ingreso general',
      'EGRESO_GENERAL': 'Egreso general'
    };
    return map[tipo] || tipo || 'Pago';
  }

  private montoEnLetras(monto: number, moneda: Moneda): string {
    const entero = Math.floor(Math.abs(monto));
    const decimales = Math.round((Math.abs(monto) - entero) * 100);
    const monedaTexto = moneda === 'USD' ? 'DÓLARES' : moneda === 'EUR' ? 'EUROS' : 'PESOS';

    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    const convertir = (n: number): string => {
      if (n === 0) return 'CERO';
      if (n === 100) return 'CIEN';
      let resultado = '';
      if (n >= 1000) {
        const miles = Math.floor(n / 1000);
        resultado += (miles === 1 ? 'MIL' : convertir(miles) + ' MIL');
        n %= 1000;
        if (n > 0) resultado += ' ';
      }
      if (n >= 100) {
        resultado += centenas[Math.floor(n / 100)];
        n %= 100;
        if (n > 0) resultado += ' ';
      }
      if (n >= 10 && n <= 19) {
        resultado += especiales[n - 10];
      } else if (n >= 20) {
        resultado += decenas[Math.floor(n / 10)];
        const u = n % 10;
        if (u > 0) resultado += ' Y ' + unidades[u];
      } else if (n > 0) {
        resultado += unidades[n];
      }
      return resultado;
    };

    return `${convertir(entero)} ${monedaTexto} CON ${String(decimales).padStart(2, '0')}/100`;
  }
}
