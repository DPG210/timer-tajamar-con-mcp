/**
 * TimerMenu — hamburger drawer for TimerView (standalone page, no AppLayout).
 *
 * Provides navigation to all public routes and, when authenticated,
 * the admin section — without depending on AppLayout, Menu or MenuPopUp.
 *
 * Theme: dark (bg-gray-900 / bg-gray-800) to match TimerView.
 * Closes on: backdrop click, Escape key, or NavLink click.
 */

import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router';
import { useAuthStore } from '../../stores/authStore';

interface TimerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  /** Stable id forwarded from the hamburger button's aria-controls (L-05). */
  id?: string;
}

const baseLink =
  'block rounded px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-700 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400';

const activeLink = `${baseLink} bg-gray-700 text-white`;

function linkClass({ isActive }: { isActive: boolean }): string {
  return isActive ? activeLink : baseLink;
}

export function TimerMenu({ isOpen, onClose, id }: TimerMenuProps) {
  const { isAuthenticated: auth } = useAuthStore();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Trap focus inside panel while open (move focus to panel on open)
  useEffect(() => {
    if (isOpen) {
      panelRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    // Overlay
    <div
      id={id}
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Menú de navegación"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative z-10 flex flex-col w-64 max-w-full h-full bg-gray-900 shadow-2xl outline-none animate-slide-in-right"
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-4 bg-gray-800 border-b border-gray-700">
          <span className="text-sm font-semibold text-gray-100">Navegación</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            aria-label="Cerrar menú"
          >
            {/* X icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Navigation links */}
        <nav
          aria-label="Menú principal"
          className="flex flex-col gap-1 p-4 flex-1 overflow-y-auto"
        >
          <NavLink to="/" end className={linkClass} onClick={onClose}>
            Temporizador
          </NavLink>
          <NavLink to="/horario" className={linkClass} onClick={onClose}>
            Horario
          </NavLink>
          <NavLink to="/empresastimersnew" className={linkClass} onClick={onClose}>
            Empresas en evento
          </NavLink>
          <NavLink to="/empresastimers" className={linkClass} onClick={onClose}>
            Empresas (detalle)
          </NavLink>

          {auth && (
            <>
              <hr className="my-2 border-gray-700" />
              <p className="px-4 text-xs uppercase tracking-wider text-gray-500 mb-1">
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
              <hr className="my-2 border-gray-700" />
              <NavLink to="/login" className={linkClass} onClick={onClose}>
                Gestión de sesión
              </NavLink>
            </>
          )}

          {!auth && (
            <>
              <hr className="my-2 border-gray-700" />
              <NavLink to="/login" className={linkClass} onClick={onClose}>
                Iniciar sesión
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}
