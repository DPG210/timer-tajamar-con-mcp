/**
 * App — router configuration.
 *
 * Route structure:
 *   /          → TimerView  (standalone — full-screen sala display, no sidebar)
 *   /login     → Login      (standalone — no sidebar)
 *
 *   AppLayout (sidebar desktop / hamburger mobile):
 *     /horario              → Horario
 *     /empresastimers       → EmpresasEventoTimers
 *     /empresastimersnew    → EmpresasEventoTimersNew
 *     ProtectedRoute:
 *       /salas              → Salas
 *       /empresas           → Empresas
 *       /categorias         → Categorias
 *       /temporizadores     → Temporizadores
 */

import { BrowserRouter, Routes, Route } from 'react-router';
import { useTimerSocket } from './hooks/useTimerSocket';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Login } from './components/auth/Login';
import { TimerView } from './components/timer/TimerView';
import { Horario } from './components/horario/Horario';
import { Salas } from './components/admin/Salas';
import { Empresas } from './components/admin/Empresas';
import { Categorias } from './components/admin/Categorias';
import { Temporizadores } from './components/admin/Temporizadores';
import { EmpresasEventoTimers } from './components/eventos/EmpresasEventoTimers';
import { EmpresasEventoTimersNew } from './components/eventos/EmpresasEventoTimersNew';

export default function App() {
  useTimerSocket();
  return (
    <BrowserRouter>
      <Routes>
        {/* Standalone routes — no AppLayout (no sidebar, full-screen) */}
        <Route index element={<TimerView />} />
        <Route path="login" element={<Login />} />

        {/* Routes with AppLayout — sidebar on desktop, hamburger on mobile */}
        <Route element={<AppLayout />}>
          <Route path="horario" element={<Horario />} />
          <Route path="empresastimers" element={<EmpresasEventoTimers />} />
          <Route path="empresastimersnew" element={<EmpresasEventoTimersNew />} />

          {/* Protected admin routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="salas" element={<Salas />} />
            <Route path="empresas" element={<Empresas />} />
            <Route path="categorias" element={<Categorias />} />
            <Route path="temporizadores" element={<Temporizadores />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
