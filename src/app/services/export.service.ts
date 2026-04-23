import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({ providedIn: 'root' })
export class ExportService {

  exportarCierreMensual(cierre: any, mes: number, anio: number): void {
    const wb = XLSX.utils.book_new();

    // Hoja 1: Movimientos
    const movData = cierre.movimientos.map((m: any) => ({
      'Moneda': m.moneda,
      'Tipo': m.tipo,
      'Cantidad': m.cantidad,
      'Total': parseFloat(m.total)
    }));
    const wsMov = XLSX.utils.json_to_sheet(movData.length ? movData : [{ 'Sin datos': '-' }]);
    XLSX.utils.book_append_sheet(wb, wsMov, 'Movimientos');

    // Hoja 2: Rentabilidad
    const rentData = cierre.rentabilidad.map((r: any) => ({
      'Moneda': r.moneda,
      'Total Venta': parseFloat(r.total_venta),
      'Total Costo': parseFloat(r.total_costo),
      'Ganancia': parseFloat(r.ganancia)
    }));
    const wsRent = XLSX.utils.json_to_sheet(rentData.length ? rentData : [{ 'Sin datos': '-' }]);
    XLSX.utils.book_append_sheet(wb, wsRent, 'Rentabilidad');

    // Hoja 3: Saldo anterior
    const saldoData = cierre.saldo_anterior.map((s: any) => ({
      'Moneda': s.moneda,
      'Saldo inicio de mes': parseFloat(s.saldo)
    }));
    const wsSaldo = XLSX.utils.json_to_sheet(saldoData.length ? saldoData : [{ 'Sin datos': '-' }]);
    XLSX.utils.book_append_sheet(wb, wsSaldo, 'Saldo Anterior');

    const nombreMes = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
      'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][mes - 1];

    XLSX.writeFile(wb, `Cierre_${nombreMes}_${anio}.xlsx`);
  }

  exportarReporteDiario(reporte: any, fecha: string): void {
    const wb = XLSX.utils.book_new();

    const data = reporte.movimientos.map((m: any) => ({
      'Fecha': new Date(m.fecha).toLocaleString('es-AR'),
      'Tipo': m.tipo,
      'Moneda': m.moneda,
      'Monto': parseFloat(m.monto),
      'Método': m.metodo_nombre || '-',
      'Cliente': m.cliente_nombre || '-',
      'Proveedor': m.proveedor_nombre || '-',
      'Observaciones': m.observaciones || '-',
      'Anulado': m.anulado ? 'Sí' : 'No'
    }));

    const ws = XLSX.utils.json_to_sheet(data.length ? data : [{ 'Sin movimientos': '-' }]);
    XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');

    // Hoja de totales
    const totales = reporte.totales.map((t: any) => ({
      'Moneda': t.moneda,
      'Ingresos': parseFloat(t.ingresos),
      'Egresos': parseFloat(t.egresos),
      'Neto': parseFloat(t.ingresos) - parseFloat(t.egresos)
    }));
    const wsTotales = XLSX.utils.json_to_sheet(totales.length ? totales : [{ 'Sin datos': '-' }]);
    XLSX.utils.book_append_sheet(wb, wsTotales, 'Totales');

    XLSX.writeFile(wb, `Reporte_Caja_${fecha}.xlsx`);
  }
}
