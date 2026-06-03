/**
 * Login — migrated from Login.js (class component).
 *
 * Resolves:
 *   M-08: Swal lives here (component), not in service layer
 *   M-02: errors from useLogin() propagate correctly
 *   M-auth: clearToken uses removeItem, not localStorage.clear()
 *   L-01: DarkToggle imported from shared component (no local copy).
 *   L-05: hamburger button wired with aria-controls and aria-expanded.
 *
 * socket emit "vamos" is also here (Start Event button).
 * socket emit "start" (emergency reset) is intentionally NOT exposed in UI (PRD: WONT).
 */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import Swal from 'sweetalert2';
import axios from 'axios';
import { useLogin } from '../../hooks/useAuth';
import { useIncreaseTimers } from '../../hooks/useTimers';
import { useAuthStore } from '../../stores/authStore';
import { TimerMenu } from '../timer/TimerMenu';
import { DarkToggle } from '../layout/DarkToggle';

const LOGIN_TIMER_MENU_ID = 'login-timer-menu';

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { mutate: login, isPending } = useLogin();
  const { isAuthenticated: authenticated, clearToken } = useAuthStore();

  const adjustSchedule = useIncreaseTimers();
  const [adjustMinutes, setAdjustMinutes] = useState(5);

  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login(
      { userName, password },
      {
        onSuccess: () => {
          const next = searchParams.get('next') ?? '/horario';
          void navigate(next);
        },
        onError: (error) => {
          // M-08: Swal in component, not in service
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            void Swal.fire({
              title: 'Acceso denegado',
              text: 'Credenciales incorrectas. Inténtalo de nuevo.',
              icon: 'error',
              confirmButtonText: 'Cerrar',
            });
          } else {
            void Swal.fire({
              title: 'Error de conexión',
              text: 'No se pudo conectar con el servidor. Comprueba tu conexión.',
              icon: 'error',
              confirmButtonText: 'Cerrar',
            });
          }
        },
      }
    );
  }

  async function handleAdjust(delta: number) {
    const action = delta > 0 ? 'adelantar' : 'retrasar';
    const abs = Math.abs(delta);
    const result = await Swal.fire({
      title: `¿${delta > 0 ? 'Adelantar' : 'Retrasar'} el horario?`,
      text: `Todos los temporizadores se ${action}án ${abs} minuto${abs !== 1 ? 's' : ''}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    adjustSchedule.mutate(delta, {
      onSuccess: () => void Swal.fire('Hecho', `Horario ${action}do ${abs} min.`, 'success'),
      onError: () => void Swal.fire('Error', 'No se pudo ajustar el horario.', 'error'),
    });
  }

  function handleSignOut() {
    clearToken(); // only removes "token" key (M-auth fix)
    void navigate('/login');
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Top bar with hamburger */}
      <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Timers</span>
        <div className="flex items-center gap-1">
          <DarkToggle />
          <button
            type="button"
            onClick={() => setShowMenu(true)}
            aria-label="Abrir menú"
            aria-controls={LOGIN_TIMER_MENU_ID}
            aria-expanded={showMenu}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      <TimerMenu id={LOGIN_TIMER_MENU_ID} isOpen={showMenu} onClose={() => setShowMenu(false)} />

      <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8 text-gray-800 dark:text-gray-100">
          Timers — Panel de control
        </h1>

        {!authenticated ? (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 space-y-4">
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Usuario
              </label>
              <input
                id="userName"
                type="text"
                autoComplete="username"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                disabled={isPending}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                disabled={isPending}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </button>
          </form>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 space-y-4">
            <p className="text-gray-700 dark:text-gray-200 text-center font-medium">Sesión activa</p>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Ajustar horario
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={adjustMinutes}
                  onChange={(e) => setAdjustMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-center dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={adjustSchedule.isPending}
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">min</span>
                <button
                  type="button"
                  onClick={() => void handleAdjust(adjustMinutes)}
                  disabled={adjustSchedule.isPending}
                  className="flex-1 bg-amber-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ◀ Retrasar
                </button>
                <button
                  type="button"
                  onClick={() => void handleAdjust(-adjustMinutes)}
                  disabled={adjustSchedule.isPending}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Adelantar ▶
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg py-2 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
      </div>
    </main>
  );
}
