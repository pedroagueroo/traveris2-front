import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Cliente, Proveedor, Reserva, ServicioDetallado,
  Pago, PagoRequest, ConversionRequest,
  MetodoPago, TarjetaCliente,
  Recibo, ReciboDetalle,
  BalanceCaja, DetalleCaja, ReporteDiario, CierreMensual,
  DeudaProveedorAgrupada, DeudaClienteDetalle, DeudaTotales,
  DeudasResponse,
  AgenciaConfig, ReciboConfig, Usuario,
  PaginatedResponse, Cotizacion, Moneda
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ─── AUTH ──────────────────────────────────────────────────────────────────
  getPerfil(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.api}/auth/perfil`);
  }

  // ─── ADMIN — AGENCIAS ──────────────────────────────────────────────────────
  getAgencias(): Observable<AgenciaConfig[]> {
    return this.http.get<AgenciaConfig[]>(`${this.api}/admin/agencias`);
  }

  crearAgencia(data: Partial<AgenciaConfig>): Observable<AgenciaConfig> {
    return this.http.post<AgenciaConfig>(`${this.api}/admin/agencias`, data);
  }

  getAgenciaConfig(empresa: string): Observable<AgenciaConfig> {
    return this.http.get<AgenciaConfig>(`${this.api}/admin/agencias/${encodeURIComponent(empresa)}`);
  }

  updateAgenciaConfig(empresa: string, data: Partial<AgenciaConfig>): Observable<AgenciaConfig> {
    return this.http.put<AgenciaConfig>(`${this.api}/admin/agencias/${encodeURIComponent(empresa)}`, data);
  }

  uploadLogoAgencia(empresa: string, file: File): Observable<{ logo_url: string }> {
    const fd = new FormData();
    fd.append('logo', file);
    return this.http.post<{ logo_url: string }>(`${this.api}/admin/agencias/${encodeURIComponent(empresa)}/logo`, fd);
  }

  updateReciboConfig(empresa: string, config: Partial<ReciboConfig>): Observable<{ recibo_config: ReciboConfig }> {
    return this.http.put<{ recibo_config: ReciboConfig }>(
      `${this.api}/admin/agencias/${encodeURIComponent(empresa)}/recibo-config`, config
    );
  }

  getReciboPreview(empresa: string): Observable<AgenciaConfig> {
    return this.http.get<AgenciaConfig>(`${this.api}/admin/agencias/${encodeURIComponent(empresa)}/recibo-preview`);
  }

  // ─── ADMIN — USUARIOS ─────────────────────────────────────────────────────
  getUsuarios(empresa?: string): Observable<Usuario[]> {
    let params = new HttpParams();
    if (empresa) params = params.set('empresa', empresa);
    return this.http.get<Usuario[]>(`${this.api}/admin/usuarios`, { params });
  }

  crearUsuario(data: { nombre_usuario: string; password: string; rol: string; empresa_nombre?: string | null }): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.api}/admin/usuarios`, data);
  }

  updateUsuario(id: number, data: Partial<Usuario & { password?: string }>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.api}/admin/usuarios/${id}`, data);
  }

  deleteUsuario(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.api}/admin/usuarios/${id}`);
  }

  // ─── CLIENTES ──────────────────────────────────────────────────────────────
  getClientes(page = 1, limit = 20, busqueda = ''): Observable<PaginatedResponse<Cliente>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (busqueda) params = params.set('busqueda', busqueda);
    return this.http.get<PaginatedResponse<Cliente>>(`${this.api}/clientes`, { params });
  }

  getTodosClientes(): Observable<Partial<Cliente>[]> {
    return this.http.get<Partial<Cliente>[]>(`${this.api}/clientes/todos`);
  }

  getCliente(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.api}/clientes/${id}`);
  }

  crearCliente(data: Partial<Cliente>): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.api}/clientes`, data);
  }

  updateCliente(id: number, data: Partial<Cliente>): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.api}/clientes/${id}`, data);
  }

  deleteCliente(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.api}/clientes/${id}`);
  }

  deleteAllClientes(): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.api}/clientes/todos`);
  }

  uploadClienteArchivo(idCliente: number, file: File): Observable<{ id: number; nombre_archivo: string; ruta_archivo: string }> {
    const fd = new FormData();
    fd.append('archivo', file);
    return this.http.post<{ id: number; nombre_archivo: string; ruta_archivo: string }>(
      `${this.api}/clientes/${idCliente}/archivos`, fd
    );
  }

  deleteClienteArchivo(idCliente: number, idArchivo: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.api}/clientes/${idCliente}/archivos/${idArchivo}`);
  }

  // ─── PROVEEDORES ───────────────────────────────────────────────────────────
  getProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(`${this.api}/proveedores`);
  }

  getProveedor(id: number): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.api}/proveedores/${id}`);
  }

  crearProveedor(data: Partial<Proveedor>): Observable<Proveedor> {
    return this.http.post<Proveedor>(`${this.api}/proveedores`, data);
  }

  updateProveedor(id: number, data: Partial<Proveedor>): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.api}/proveedores/${id}`, data);
  }

  deleteProveedor(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.api}/proveedores/${id}`);
  }

  // ─── RESERVAS ──────────────────────────────────────────────────────────────
  getReservas(page = 1, limit = 20, busqueda = '', estado = ''): Observable<PaginatedResponse<Reserva>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (busqueda) params = params.set('busqueda', busqueda);
    if (estado) params = params.set('estado', estado);
    return this.http.get<PaginatedResponse<Reserva>>(`${this.api}/reservas`, { params });
  }

  getReserva(id: number): Observable<Reserva> {
    return this.http.get<Reserva>(`${this.api}/reservas/${id}`);
  }

  getReservasCliente(idCliente: number): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.api}/reservas/cliente/${idCliente}`);
  }

  crearReserva(data: Partial<Reserva>): Observable<Reserva> {
    return this.http.post<Reserva>(`${this.api}/reservas`, data);
  }

  updateReserva(id: number, data: Partial<Reserva>): Observable<Reserva> {
    return this.http.put<Reserva>(`${this.api}/reservas/${id}`, data);
  }

  deleteReserva(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.api}/reservas/${id}`);
  }

  deleteAllReservas(): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.api}/reservas/todos`);
  }

  uploadReservaArchivo(idReserva: number, file: File): Observable<ReservaArchivo> {
    const fd = new FormData();
    fd.append('archivo', file);
    return this.http.post<ReservaArchivo>(`${this.api}/reservas/${idReserva}/archivos`, fd);
  }

  getProximosVencimientos(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.api}/reservas/proximos-vencimientos`);
  }

  // ─── SERVICIOS ─────────────────────────────────────────────────────────────
  getServiciosReserva(idReserva: number): Observable<ServicioDetallado[]> {
    return this.http.get<ServicioDetallado[]>(`${this.api}/servicios/reserva/${idReserva}`);
  }

  crearServicio(data: Partial<ServicioDetallado>): Observable<ServicioDetallado> {
    return this.http.post<ServicioDetallado>(`${this.api}/servicios`, data);
  }

  updateServicio(id: number, data: Partial<ServicioDetallado>): Observable<ServicioDetallado> {
    return this.http.put<ServicioDetallado>(`${this.api}/servicios/${id}`, data);
  }

  deleteServicio(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.api}/servicios/${id}`);
  }

  // ─── DEUDAS ────────────────────────────────────────────────────────────────
  listarDeudasProveedores(idReserva: number): Observable<DeudasResponse> {
    return this.http.get<DeudasResponse>(`${this.api}/deudas/reserva/${idReserva}/proveedores`);
  }

  listarDeudasClientes(idReserva: number): Observable<DeudasResponse> {
    return this.http.get<DeudasResponse>(`${this.api}/deudas/reserva/${idReserva}/clientes`);
  }

  // ─── PAGOS ─────────────────────────────────────────────────────────────────
  getPagosReserva(idReserva: number): Observable<Pago[]> {
    return this.http.get<Pago[]>(`${this.api}/pagos/reserva/${idReserva}`);
  }

  registrarPago(data: PagoRequest): Observable<Pago> {
    return this.http.post<Pago>(`${this.api}/pagos`, data);
  }

  convertirMoneda(data: ConversionRequest): Observable<{ egreso: Pago; ingreso: Pago }> {
    return this.http.post<{ egreso: Pago; ingreso: Pago }>(`${this.api}/pagos/convertir`, data);
  }

  anularPago(id: number): Observable<{ mensaje: string }> {
    return this.http.put<{ mensaje: string }>(`${this.api}/pagos/${id}/anular`, {});
  }

  // ─── MÉTODOS DE PAGO ──────────────────────────────────────────────────────
  getMetodosPago(moneda: Moneda): Observable<MetodoPago[]> {
    return this.http.get<MetodoPago[]>(`${this.api}/metodos-pago/${moneda}`);
  }

  getTodosMetodosPago(): Observable<MetodoPago[]> {
    return this.http.get<MetodoPago[]>(`${this.api}/metodos-pago`);
  }

  crearMetodoPago(data: { nombre: string; moneda: Moneda; tipo: string }): Observable<MetodoPago> {
    return this.http.post<MetodoPago>(`${this.api}/metodos-pago`, data);
  }

  // ─── TARJETAS ──────────────────────────────────────────────────────────────
  getTarjetasDisponibles(): Observable<TarjetaCliente[]> {
    return this.http.get<TarjetaCliente[]>(`${this.api}/tarjetas/disponibles`);
  }

  getTarjetasDisponiblesPorProveedor(idProveedor: number): Observable<TarjetaCliente[]> {
    return this.http.get<TarjetaCliente[]>(`${this.api}/tarjetas/disponibles/proveedor/${idProveedor}`);
  }

  getTarjetas(estado?: string): Observable<TarjetaCliente[]> {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    return this.http.get<TarjetaCliente[]>(`${this.api}/tarjetas`, { params });
  }

  liquidarTarjeta(id: number): Observable<{ mensaje: string; monto_ingresado?: number }> {
    return this.http.post<{ mensaje: string; monto_ingresado?: number }>(`${this.api}/tarjetas/${id}/liquidar`, {});
  }

  // ─── RECIBOS ───────────────────────────────────────────────────────────────
  getRecibosReserva(idReserva: number): Observable<Recibo[]> {
    return this.http.get<Recibo[]>(`${this.api}/recibos/reserva/${idReserva}`);
  }

  getRecibo(id: number): Observable<ReciboDetalle> {
    return this.http.get<ReciboDetalle>(`${this.api}/recibos/${id}`);
  }

  getRecibos(page = 1, limit = 20): Observable<PaginatedResponse<Recibo>> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    return this.http.get<PaginatedResponse<Recibo>>(`${this.api}/recibos`, { params });
  }

  // ─── CAJA ──────────────────────────────────────────────────────────────────
  getCotizaciones(): Observable<Cotizacion[]> {
    return this.http.get<Cotizacion[]>(`${this.api}/caja/cotizaciones-completas`);
  }

  getBalanceCaja(): Observable<BalanceCaja[]> {
    return this.http.get<BalanceCaja[]>(`${this.api}/caja/balance`);
  }

  getDetalleCaja(moneda: Moneda): Observable<DetalleCaja[]> {
    return this.http.get<DetalleCaja[]>(`${this.api}/caja/detalle/${moneda}`);
  }

  getReporteDiario(fecha?: string): Observable<ReporteDiario> {
    let params = new HttpParams();
    if (fecha) params = params.set('fecha', fecha);
    return this.http.get<ReporteDiario>(`${this.api}/caja/reporte-diario`, { params });
  }

  getCierreMensual(mes?: number, anio?: number): Observable<CierreMensual> {
    let params = new HttpParams();
    if (mes) params = params.set('mes', mes.toString());
    if (anio) params = params.set('anio', anio.toString());
    return this.http.get<CierreMensual>(`${this.api}/caja/cierre-mensual`, { params });
  }

  eliminarMovimientoCaja(id: number): Observable<any> {
    return this.http.delete(`${this.api}/pagos/${id}`);
  }

  // ─── IMPORT ────────────────────────────────────────────────────────────────
  importPreview(file: File): Observable<{ formato?: string; columnas_detectadas?: string[]; clientes: Partial<Cliente>[]; validos: number; invalidos: number; total: number }> {
    const fd = new FormData();
    fd.append('archivo', file);
    return this.http.post<{ formato?: string; columnas_detectadas?: string[]; clientes: Partial<Cliente>[]; validos: number; invalidos: number; total: number }>(
      `${this.api}/import-clientes/preview`, fd
    );
  }

  importConfirmar(clientes: Partial<Cliente>[]): Observable<{ importados: number; actualizados?: number; errores: number }> {
    return this.http.post<{ importados: number; actualizados?: number; errores: number }>(
      `${this.api}/import-clientes/confirmar`, { clientes }
    );
  }
}

// Re-export for convenience
interface ReservaArchivo {
  id: number;
  id_reserva: number;
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_archivo: string | null;
  fecha_subida: string;
}
