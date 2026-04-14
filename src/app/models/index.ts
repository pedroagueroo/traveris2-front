// ============================================================================
// MODELS — Interfaces TypeScript estrictas (cero any)
// ============================================================================

// ─── AUTH ────────────────────────────────────────────────────────────────────
export interface LoginRequest {
  nombre_usuario: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface Usuario {
  id: number;
  nombre_usuario: string;
  rol: 'ADMIN' | 'EMPRESA';
  empresa_nombre: string | null;
  activo?: boolean;
  creado_en?: string;
}

// ─── AGENCIA ─────────────────────────────────────────────────────────────────
export interface AgenciaConfig {
  id: number;
  empresa_nombre: string;
  nombre_comercial: string | null;
  titular: string | null;
  cuit_cuil: string | null;
  condicion_fiscal: 'MONOTRIBUTO' | 'RESP_INSCRIPTO' | 'EXENTO' | null;
  domicilio: string | null;
  telefono: string | null;
  email: string | null;
  pagina_web: string | null;
  logo_url: string | null;
  recibo_template: string;
  recibo_config: ReciboConfig;
  recibo_footer_legal: string | null;
  activa: boolean;
  creada_en: string;
  actualizada_en: string;
  total_usuarios?: number;
}

export interface ReciboConfig {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoPosition: 'left' | 'center' | 'right';
  showArcaLogo: boolean;
  extraText: string;
}

// ─── CLIENTE ─────────────────────────────────────────────────────────────────
export interface Cliente {
  id: number;
  nombre_completo: string;
  dni_pasaporte: string | null;
  email: string | null;
  telefono: string | null;
  fecha_nacimiento: string | null;
  cuit_cuil: string | null;
  nacionalidad: string | null;
  pasaporte_nro: string | null;
  pasaporte_emision: string | null;
  pasaporte_vencimiento: string | null;
  sexo: string | null;
  pref_asiento: string | null;
  pref_comida: string | null;
  observaciones_salud: string | null;
  empresa_nombre: string;
  dni_emision: string | null;
  dni_vencimiento: string | null;
  created_at: string;
  archivos?: ClienteArchivo[];
}

export interface ClienteArchivo {
  id: number;
  id_cliente: number;
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_archivo: string | null;
  fecha_subida: string;
}

// ─── PROVEEDOR ───────────────────────────────────────────────────────────────
export interface Proveedor {
  id: number;
  empresa_nombre: string;
  nombre_comercial: string;
  razon_social_cuit: string | null;
  contacto: string | null;
  email: string | null;
  created_at: string;
}

// ─── RESERVA ─────────────────────────────────────────────────────────────────
export interface Reserva {
  id: number;
  id_titular: number;
  destino_final: string | null;
  fecha_viaje_salida: string | null;
  fecha_viaje_regreso: string | null;
  operador_mayorista: string | null;
  nro_expediente_operador: string | null;
  empresa_nombre: string;
  observaciones_internas: string | null;
  estado: 'ABIERTO' | 'CERRADO' | 'CANCELADO';
  fecha_limite_pago: string | null;
  fecha_creacion: string;
  estado_eliminado: boolean;
  titular_nombre?: string;
  titular_dni?: string;
  titular_email?: string;
  titular_telefono?: string;
  pasajeros?: Pasajero[];
  vuelos?: Vuelo[];
  servicios?: ServicioDetallado[];
  archivos?: ReservaArchivo[];
}

export interface Pasajero {
  id: number;
  id_reserva: number;
  id_cliente: number;
  es_titular: boolean;
  nombre_completo?: string;
  dni_pasaporte?: string;
  email?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  sexo?: string;
}

export interface Vuelo {
  id?: number;
  id_reserva?: number;
  aerolinea: string | null;
  nro_vuelo: string | null;
  origen: string | null;
  destino: string | null;
  fecha_salida: string | null;
  fecha_llegada: string | null;
  clase: string | null;
  codigo_reserva: string | null;
  observaciones: string | null;
}

export interface ReservaArchivo {
  id: number;
  id_reserva: number;
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_archivo: string | null;
  fecha_subida: string;
}

// ─── SERVICIO ────────────────────────────────────────────────────────────────
export type TipoServicio = 'HOTEL' | 'VUELO' | 'ASISTENCIA' | 'VISA' | 'CRUCERO' | 'SERVICIO';
export type Moneda = 'ARS' | 'USD' | 'EUR';

export interface ServicioDetallado {
  id: number;
  id_reserva: number;
  tipo_servicio: TipoServicio;
  descripcion: string | null;
  // Hotel
  hotel_nombre: string | null;
  hotel_ciudad: string | null;
  hotel_check_in: string | null;
  hotel_check_out: string | null;
  hotel_regimen: string | null;
  hotel_noches: number | null;
  hotel_categoria: string | null;
  // Vuelo
  vuelo_aerolinea: string | null;
  vuelo_nro: string | null;
  vuelo_origen: string | null;
  vuelo_destino: string | null;
  vuelo_fecha_salida: string | null;
  vuelo_fecha_llegada: string | null;
  vuelo_clase: string | null;
  vuelo_codigo_reserva: string | null;
  // Asistencia
  asistencia_compania: string | null;
  asistencia_plan: string | null;
  asistencia_fecha_desde: string | null;
  asistencia_fecha_hasta: string | null;
  asistencia_cobertura: string | null;
  // Visa
  visa_pais: string | null;
  visa_tipo: string | null;
  visa_fecha_tramite: string | null;
  visa_nro_tramite: string | null;
  // Crucero
  crucero_naviera: string | null;
  crucero_barco: string | null;
  crucero_itinerario: string | null;
  crucero_cabina: string | null;
  crucero_fecha_embarque: string | null;
  crucero_fecha_desembarque: string | null;
  // Financieros
  id_proveedor: number | null;
  moneda: Moneda;
  precio_cliente: number;
  costo_proveedor: number;
  proveedor_nombre?: string | null;
  created_at: string;
}

// ─── DEUDA ───────────────────────────────────────────────────────────────────
export interface DeudaServicio {
  id: number;
  id_servicio: number;
  id_reserva: number;
  id_proveedor: number | null;
  tipo: 'CLIENTE' | 'PROVEEDOR';
  moneda: Moneda;
  monto_total: number;
  monto_pagado: number;
  empresa_nombre: string;
  creada_en: string;
}

export interface DeudaProveedorAgrupada {
  id: number;
  id_servicio: number;
  id_proveedor: number | null;
  tipo_servicio: TipoServicio;
  descripcion: string | null;
  servicio_nombre: string | null;
  proveedor_nombre: string | null;
  moneda: Moneda;
  deuda_total: number;
  pagado_total: number;
  saldo: number;
}

export interface DeudaClienteDetalle {
  id: number;
  id_servicio: number;
  tipo_servicio: TipoServicio;
  descripcion: string | null;
  servicio_nombre: string | null;
  proveedor_nombre: string | null;
  moneda: Moneda;
  deuda_total: number;
  pagado_total: number;
  saldo: number;
}

export interface DeudaTotales {
  moneda: Moneda;
  deuda_total: number;
  pagado_total: number;
  saldo: number;
}

export interface DeudasResponse {
  detalle: DeudaProveedorAgrupada[] | DeudaClienteDetalle[];
  totales: DeudaTotales[];
}

// ─── PAGO ────────────────────────────────────────────────────────────────────
export type TipoPago = 'COBRO_CLIENTE' | 'PAGO_PROVEEDOR' | 'INGRESO_GENERAL' | 'EGRESO_GENERAL' | 'CONVERSION' | 'AJUSTE_TARJETA';

export interface Pago {
  id: number;
  id_reserva: number | null;
  id_servicio: number | null;
  id_deuda: number | null;
  id_proveedor: number | null;
  id_cliente: number | null;
  tipo: TipoPago;
  moneda: Moneda;
  monto: number;
  metodo_pago_id: number | null;
  id_tarjeta_cliente: number | null;
  observaciones: string | null;
  fecha: string;
  empresa_nombre: string;
  anulado: boolean;
  metodo_nombre?: string;
  metodo_tipo?: string;
  cliente_nombre?: string;
  proveedor_nombre?: string;
  tarjeta_mask?: string;
  banco_detectado?: string;
}

export interface PagoRequest {
  id_reserva?: number | null;
  id_servicio?: number | null;
  id_deuda?: number | null;
  id_proveedor?: number | null;
  id_cliente?: number | null;
  tipo: TipoPago;
  moneda: Moneda;
  monto: number;
  metodo_pago_id?: number | null;
  id_tarjeta_cliente?: number | null;
  observaciones?: string | null;
  tarjeta?: TarjetaInput | null;
}

export interface TarjetaInput {
  titular: string;
  numero: string;
  expiracion: string;
  cvv?: string;
}

export interface ConversionRequest {
  moneda_origen: Moneda;
  moneda_destino: Moneda;
  monto_origen: number;
  monto_destino: number;
  metodo_pago_id_origen?: number | null;
  metodo_pago_id_destino?: number | null;
  observaciones?: string | null;
}

// ─── MÉTODO DE PAGO ──────────────────────────────────────────────────────────
export interface MetodoPago {
  id: number;
  nombre: string;
  moneda: Moneda;
  tipo: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA';
  activo: boolean;
  empresa_nombre: string;
}

// ─── TARJETA ─────────────────────────────────────────────────────────────────
export interface TarjetaCliente {
  id: number;
  titular: string;
  numero_mask: string;
  expiracion: string | null;
  banco_detectado: string | null;
  moneda: Moneda;
  monto_original: number;
  monto_disponible: number;
  estado: 'ACTIVA' | 'CONSUMIDA' | 'LIQUIDADA';
  fecha_cobro: string;
  id_pago_origen: number | null;
  empresa_nombre: string;
}

// ─── RECIBO ──────────────────────────────────────────────────────────────────
export interface Recibo {
  id: number;
  numero_recibo: number;
  id_pago: number | null;
  id_reserva: number | null;
  id_cliente: number | null;
  nombre_cliente: string | null;
  dni_cliente: string | null;
  concepto: string | null;
  moneda: Moneda;
  monto: number;
  metodo_pago: string | null;
  empresa_nombre: string;
  fecha: string;
  anulado: boolean;
  pago_tipo?: string;
  pago_fecha?: string;
}

export interface ReciboDetalle {
  recibo: Recibo;
  agencia: AgenciaConfig | null;
  reserva: { destino_final: string; fecha_viaje_salida: string; fecha_viaje_regreso: string } | null;
}

// ─── CAJA ────────────────────────────────────────────────────────────────────
export interface BalanceCaja {
  moneda: Moneda;
  saldo: number;
}

export interface DetalleCaja {
  metodo_id: number;
  metodo_nombre: string;
  metodo_tipo: string;
  saldo: number;
}

export interface ReporteDiario {
  movimientos: Pago[];
  totales: { moneda: Moneda; ingresos: number; egresos: number }[];
  fecha: string;
}

export interface CierreMensual {
  mes: number;
  anio: number;
  saldo_anterior: BalanceCaja[];
  movimientos: { moneda: Moneda; tipo: TipoPago; cantidad: number; total: number }[];
  rentabilidad: { moneda: Moneda; total_venta: number; total_costo: number; ganancia: number }[];
}

// ─── PAGINACIÓN ──────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

// ─── COTIZACIÓN ──────────────────────────────────────────────────────────────
export interface Cotizacion {
  nombre: string;
  compra: number;
  venta: number;
  casa: string;
}
