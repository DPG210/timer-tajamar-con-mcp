/**
 * Menu — side navigation.
 * Migrated from Menu.js (class component).
 * Functional component with React Router v7 NavLink.
 */

import { NavLink } from 'react-router';
import { useAuthStore } from '../../stores/authStore';

interface MenuProps {
  onClose?: () => void;
}

export function Menu({ onClose }: MenuProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
    }`;

  return (
    <nav aria-label="Navegación principal" className="flex flex-col gap-1 p-4">
      <NavLink to="/" end className={linkClass} onClick={onClose}>
        Temporizador
      </NavLink>

      <NavLink to="/horario" className={linkClass} onClick={onClose}>
        Horario
      </NavLink>

      <NavLink to="/empresastimersnew" className={linkClass} onClick={onClose}>
        Empresas en evento
      </NavLink>

      {/* Rehabilitated route (PRD: EmpresasEventoTimers rehabilitada) */}
      <NavLink to="/empresastimers" className={linkClass} onClick={onClose}>
        Empresas (detalle)
      </NavLink>

      {isAuthenticated && (
        <>
          <hr className="my-2 border-gray-200 dark:border-gray-700" />
          <p className="px-4 text-xs uppercase tracking-wider text-gray-400 mb-1">
            Administración
          </p>
          <NavLink to="/salas" className={linkClass} onClick={onClose}>
            Salas
          </NavLink>
          <NavLink to="/empresas" className={linkClass} onClick={onClose}>
            Empresas
          </NavLink>
          <NavLink to="/categorias" className={linkClass} onClick={onClose}>
            Categorías
          </NavLink>
          <NavLink to="/temporizadores" className={linkClass} onClick={onClose}>
            Temporizadores
          </NavLink>
          <hr className="my-2 border-gray-200 dark:border-gray-700" />
          <NavLink to="/login" className={linkClass} onClick={onClose}>
            Gestión de sesión
          </NavLink>
        </>
      )}

      {!isAuthenticated && (
        <>
          <hr className="my-2 border-gray-200 dark:border-gray-700" />
          <NavLink to="/login" className={linkClass} onClick={onClose}>
            Iniciar sesión
          </NavLink>
        </>
      )}
    </nav>
  );
}
