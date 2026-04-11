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

    // Importar jsPDF dinámicamente
    const { jsPDF } = await import('jspdf');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as unknown as JsPDFInstance;
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentW = pageW - 2 * margin;

    const recibo = detalle.recibo;
    const agencia = detalle.agencia;
    const reserva = detalle.reserva;

    // Parsear colores del config
    const primaryColor = this.hexToRgb(agencia?.recibo_config?.primaryColor || '#6366F1');
    const secondaryColor = this.hexToRgb(agencia?.recibo_config?.secondaryColor || '#8B5CF6');

    let y = margin;

    // ═══════════════════════════════════════════════════════════════════
    // HEADER — Franja superior con color
    // ═══════════════════════════════════════════════════════════════════
    doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.rect(0, 0, pageW, 35, 'F');

    // Nombre agencia
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(agencia?.nombre_comercial || agencia?.empresa_nombre || 'Traveris Pro', margin, 15);

    // Datos de contacto de la agencia
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const contactLine = [agencia?.domicilio, agencia?.telefono, agencia?.email].filter(Boolean).join(' | ');
    doc.text(contactLine, margin, 22);

    // CUIT y condición fiscal
    const fiscalLine = [
      agencia?.cuit_cuil ? `CUIT: ${agencia.cuit_cuil}` : null,
      agencia?.condicion_fiscal
    ].filter(Boolean).join(' — ');
    doc.text(fiscalLine, margin, 28);

    // Número de recibo (derecha)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text(`#${String(recibo.numero_recibo).padStart(6, '0')}`, pageW - margin, 18, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('RECIBO NO FISCAL', pageW - margin, 26, { align: 'right' });

    y = 45;

    // ═══════════════════════════════════════════════════════════════════
    // DATOS DEL CLIENTE
    // ═══════════════════════════════════════════════════════════════════
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('RECIBÍ DE:', margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(recibo.nombre_cliente || 'Sin nombre', margin + 28, y);

    y += 8;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    if (recibo.dni_cliente) {
      doc.text(`DNI/Pasaporte: ${recibo.dni_cliente}`, margin, y);
    }

    // Fecha
    doc.text(`Fecha: ${this.formatFecha(recibo.fecha)}`, pageW - margin - 50, y);

    y += 12;

    // ═══════════════════════════════════════════════════════════════════
    // CONCEPTO Y MONTO
    // ═══════════════════════════════════════════════════════════════════
    // Box con borde
    doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentW, 35, 3, 3, 'FD');

    y += 10;
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('CONCEPTO', margin + 5, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const concepto = recibo.concepto || this.generarConcepto(recibo, reserva);
    doc.text(concepto, margin + 5, y + 7);

    // Monto grande a la derecha
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
    const montoStr = this.formatMonto(recibo.monto, recibo.moneda);
    doc.text(montoStr, pageW - margin - 5, y + 5, { align: 'right' });

    // Moneda label
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(recibo.moneda, pageW - margin - 5, y + 12, { align: 'right' });

    y += 40;

    // ═══════════════════════════════════════════════════════════════════
    // DETALLES
    // ═══════════════════════════════════════════════════════════════════
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLES DEL PAGO', margin, y);
    y += 6;

    // Línea separadora
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageW - margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const detalles: [string, string][] = [
      ['Tipo de pago', this.traducirTipo(recibo.pago_tipo || '')],
      ['Método de pago', recibo.metodo_pago || '-'],
      ['Fecha de pago', this.formatFecha(recibo.pago_fecha || recibo.fecha)]
    ];

    if (reserva) {
      detalles.push(['Destino', reserva.destino_final || '-']);
      if (reserva.fecha_viaje_salida) detalles.push(['Fecha viaje', `${reserva.fecha_viaje_salida} → ${reserva.fecha_viaje_regreso || '?'}`]);
    }

    detalles.forEach(([label, value]) => {
      doc.setTextColor(130, 130, 130);
      doc.text(label, margin, y);
      doc.setTextColor(60, 60, 60);
      doc.text(value, margin + 50, y);
      y += 6;
    });

    y += 8;

    // ═══════════════════════════════════════════════════════════════════
    // MONTO EN LETRAS
    // ═══════════════════════════════════════════════════════════════════
    doc.setFillColor(secondaryColor.r, secondaryColor.g, secondaryColor.b);
    doc.roundedRect(margin, y, contentW, 12, 2, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`SON: ${this.montoEnLetras(recibo.monto, recibo.moneda)}`, margin + 5, y + 8);

    y += 20;

    // ═══════════════════════════════════════════════════════════════════
    // FIRMA
    // ═══════════════════════════════════════════════════════════════════
    doc.setDrawColor(180, 180, 180);
    doc.line(margin + 20, y + 15, margin + 80, y + 15);
    doc.setTextColor(130, 130, 130);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Firma y sello', margin + 40, y + 20);

    doc.line(pageW - margin - 80, y + 15, pageW - margin - 20, y + 15);
    doc.text('Firma del cliente', pageW - margin - 60, y + 20);

    y += 30;

    // ═══════════════════════════════════════════════════════════════════
    // FOOTER LEGAL
    // ═══════════════════════════════════════════════════════════════════
    const footerY = 270;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, footerY, pageW - margin, footerY);

    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');

    const footerLegal = agencia?.recibo_footer_legal || 'Documento no fiscal. No válido como factura.';
    doc.text(footerLegal, pageW / 2, footerY + 5, { align: 'center' });

    if (recibo.anulado) {
      doc.setFontSize(40);
      doc.setTextColor(239, 68, 68);
      doc.setFont('helvetica', 'bold');
      doc.text('ANULADO', pageW / 2, 150, { align: 'center', angle: 45 } as Record<string, unknown>);
    }

    // Generar nombre y descargar
    const filename = `Recibo_${String(recibo.numero_recibo).padStart(6, '0')}_${recibo.nombre_cliente?.replace(/\s+/g, '_') || 'cliente'}.pdf`;
    doc.save(filename);
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
