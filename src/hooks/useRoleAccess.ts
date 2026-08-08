import { UserRole } from './useAuthStore';
import { AdminView } from '@/components/dashboard/Sidebar';

// Matriz de permisos por rol (Módulo x Rol)
const PERMISSIONS_MATRIX: Record<UserRole, AdminView[]> = {
  admin: [
    'inicio', 'pipeline', 'calendario', 'almacen', 'finanzas', 'instalaciones',
    'quejas', 'ajustes', 'calculadora', 'historial', 'plantillas', 'errores',
    'manuales', 'asignaciones', 'validacion', 'herramientas', 'utiles', 'entregas', 'levantamiento'
  ],
  comercial: [
    'inicio', 'pipeline', 'calendario', 'quejas', 'calculadora',
    'plantillas', 'utiles', 'manuales', 'levantamiento'
  ],
  tecnico: [
    'inicio', 'calendario', 'instalaciones', 'almacen', 'asignaciones',
    'validacion', 'herramientas', 'utiles', 'manuales', 'errores', 'levantamiento'
  ],
  proyectista: [
    'inicio', 'levantamiento', 'calendario', 'calculadora', 'utiles', 'manuales',
    'herramientas', 'errores'
  ],
  transportista: [
    'inicio', 'entregas', 'almacen', 'utiles', 'manuales'
  ],
  almacenero: [
    'inicio', 'pedidos', 'almacen', 'utiles', 'manuales'
  ],
  contable: [
    'inicio', 'finanzas', 'almacen', 'utiles', 'manuales', 'plantillas'
  ],
  comprador: [
    'inicio', 'almacen', 'finanzas', 'utiles', 'manuales'
  ],
  designado: [
    'inicio', 'almacen', 'pipeline', 'utiles', 'manuales'
  ]
};

export function canAccessView(role: UserRole | undefined, view: AdminView): boolean {
  if (!role) return false;
  if (role === 'admin') return true;
  const allowed = PERMISSIONS_MATRIX[role] || ['inicio'];
  return allowed.includes(view);
}

export function getAllowedViews(role: UserRole | undefined): AdminView[] {
  if (!role) return ['inicio'];
  return PERMISSIONS_MATRIX[role] || ['inicio'];
}

export function useRoleAccess(role: UserRole | undefined) {
  return {
    canAccess: (view: AdminView) => canAccessView(role, view),
    allowedViews: getAllowedViews(role),
    isAdmin: role === 'admin',
    isComercial: role === 'comercial',
    isTecnico: role === 'tecnico',
    isProyectista: role === 'proyectista',
    isContable: role === 'contable',
    isAlmacenero: role === 'almacenero',
    isTransportista: role === 'transportista',
    isComprador: role === 'comprador',
    isDesignado: role === 'designado'
  };
}
