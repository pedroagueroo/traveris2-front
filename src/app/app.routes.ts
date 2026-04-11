import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  // Ruta pública
  { path: 'login', loadComponent: () => import('./components/login/login').then(m => m.LoginComponent) },

  // Rutas protegidas
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./components/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'clientes', loadComponent: () => import('./components/clientes-lista/clientes-lista').then(m => m.ClientesListaComponent) },
      { path: 'clientes/nuevo', loadComponent: () => import('./components/cliente-nuevo/cliente-nuevo').then(m => m.ClienteNuevoComponent) },
      { path: 'clientes/detalle/:id', loadComponent: () => import('./components/cliente-detalle/cliente-detalle').then(m => m.ClienteDetalleComponent) },
      { path: 'clientes/importar', loadComponent: () => import('./components/import-clientes/import-clientes').then(m => m.ImportClientesComponent) },
      { path: 'proveedores', loadComponent: () => import('./components/proveedores/proveedores').then(m => m.ProveedoresComponent) },
      { path: 'reservas', loadComponent: () => import('./components/reservas-lista/reservas-lista').then(m => m.ReservasListaComponent) },
      { path: 'reservas/nuevo', loadComponent: () => import('./components/reserva-nueva/reserva-nueva').then(m => m.ReservaNuevaComponent) },
      { path: 'reservas/editar/:id', loadComponent: () => import('./components/reserva-nueva/reserva-nueva').then(m => m.ReservaNuevaComponent) },
      { path: 'reservas/:id', loadComponent: () => import('./components/reserva-detalle/reserva-detalle').then(m => m.ReservaDetalleComponent) },
      { path: 'caja', loadComponent: () => import('./components/caja/caja').then(m => m.CajaComponent) },
      { path: 'estadisticas', loadComponent: () => import('./components/estadisticas/estadisticas').then(m => m.EstadisticasComponent) },

      // Admin
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          { path: '', loadComponent: () => import('./components/admin-dashboard/admin-dashboard').then(m => m.AdminDashboardComponent) },
          { path: 'agencias', loadComponent: () => import('./components/admin-dashboard/admin-dashboard').then(m => m.AdminDashboardComponent) },
          { path: 'agencias/:empresa', loadComponent: () => import('./components/admin-agencia-config/admin-agencia-config').then(m => m.AdminAgenciaConfigComponent) },
          { path: 'usuarios', loadComponent: () => import('./components/admin-usuarios/admin-usuarios').then(m => m.AdminUsuariosComponent) }
        ]
      },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: 'login' }
];
