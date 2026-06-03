/**
 * TimerView — main timer display page.
 * Migrated from TimerView.js (class component).
 *
 * Resolves:
 *   M-03: socket singleton via useTimerSocket
 *   M-06: TES fetched once, filtered in memory
 *   M-10: functional component with hooks
 *
 * Fix — activeTimerId priority:
 *   calculatedTimerId (from REST timers+categorias, uses idTemporizador) takes priority
 *   because TES records use idTimer = FK(idTemporizador). socketTimerId is used only
 *   as last resort on initial mount before the time-based calculation resolves.
 *
 * Accessible:
 *   - Landmark regions (main, header)
 *   - Live region for timer updates
 *   - Keyboard-accessible sala selector button
 */

import { useState } from 'react';
import { useTimerSocketStore } from '../../stores/timerSocketStore';
import { useCurrentActiveTimer } from '../../hooks/useCurrentActiveTimer';
import { useCalculatedRemainingSeconds } from '../../hooks/useCalculatedRemainingSeconds';
import { useTES, getEmpresaForActiveTimer } from '../../hooks/useTES';
import { useTimers } from '../../hooks/useTimers';
import { useEmpresas, getEmpresaNombre } from '../../hooks/useEmpresas';
import { useCategorias, getCategoriaNombre } from '../../hooks/useCategorias';
import { useSalas } from '../../hooks/useSalas';
import { useUiStore } from '../../stores/uiStore';
import { Tiempo } from './Tiempo';
import { SalaPopUp } from './SalaPopUp';
import { TimerMenu } from './TimerMenu';
import type { Sala } from '../../types/models';
import { formatInicio, calcularFin, parseInicio } from '../../utils/time';
import logoTajamarTech from '../../assets/logo-tajamar-tech.png';

export function TimerView() {
  // calculatedTimerId is derived from idTemporizador (the same key TES uses as idTimer).
  // socketTimerId may carry a different ID scheme from the backend — use it only as
  // a last resort when calculatedTimerId hasn't resolved yet (initial mount, no timers).
  const { activeTimerId: socketTimerId, isConnected } = useTimerSocketStore();
  const calculatedTimerId = useCurrentActiveTimer();
  const activeTimerId = calculatedTimerId ?? socketTimerId;

  const { data: tesList = [] } = useTES();
  const { data: timers = [], isLoading: timersLoading } = useTimers();
  const { data: empresas = [] } = useEmpresas();
  const { data: categorias = [], isLoading: categoriasLoading } = useCategorias();
  const { data: salas = [] } = useSalas();
  const { idSalaActiva, setIdSalaActiva } = useUiStore();

  const isTimerDataLoading = timersLoading || categoriasLoading;

  // Remaining seconds derived from scheduled inicio + duracion, recalculated
  // every second client-side. Replaces the unreliable socket "envio" countdown
  // which counted from "vamos" (operator action) rather than the scheduled start.
  const remainingSeconds = useCalculatedRemainingSeconds({
    activeTimerId,
    timers,
    categorias,
  });
  const activeTimer = activeTimerId !== null ? timers.find(t => t.idTemporizador === activeTimerId) ?? null : null;
  const activeCategoria = activeTimer ? categorias.find(c => c.idCategoria === activeTimer.idCategoria) ?? null : null;
  const totalSeconds = activeCategoria ? activeCategoria.duracion * 60 : 0;
  const salaName = salas.find(s => s.idSala === idSalaActiva)?.nombreSala ?? '';
  const [showSalaPopup, setShowSalaPopup] = useState(idSalaActiva === null);
  const [showMenu, setShowMenu] = useState(false);

  function handleSalaSelect(sala: Sala) {
    setIdSalaActiva(sala.idSala);
    setShowSalaPopup(false);
  }

  // M-06: single TES list, filter in memory — no duplicate requests
  // Guard uses calculatedTimerId (not activeTimerId) so a stale socketTimerId
  // between events does not keep the last empresa visible.
  const currentEmpresaId =
    calculatedTimerId !== null && idSalaActiva !== null
      ? getEmpresaForActiveTimer(tesList, calculatedTimerId, idSalaActiva)
      : null;

  // getEmpresaNombre returns '' when empresas hasn't loaded yet — convert to null
  // so the conditional render doesn't treat a loading state as "no empresa".
  const currentEmpresaNombre =
    currentEmpresaId != null
      ? (getEmpresaNombre(empresas, currentEmpresaId) || null)
      : null;

  // Find next and after-next timers in this sala
  // sortedByTime: all timers ordered by their scheduled inicio (ascending).
  const sortedByTime = [...timers].sort((a, b) => {
    const pa = parseInicio(a.inicio);
    const pb = parseInicio(b.inicio);
    return (pa.hours * 60 + pa.minutes) - (pb.hours * 60 + pb.minutes);
  });

  const currentTimerIndex = activeTimerId
    ? sortedByTime.findIndex((t) => t.idTemporizador === activeTimerId)
    : -1;

  let nextTimer: typeof timers[number] | null = null;
  let afterNextTimer: typeof timers[number] | null = null;

  if (currentTimerIndex >= 0) {
    // Active timer exists — take the two immediately following it.
    nextTimer = sortedByTime[currentTimerIndex + 1] ?? null;
    afterNextTimer = sortedByTime[currentTimerIndex + 2] ?? null;
  } else {
    // No active timer right now — show the next two future events.
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    const futureTimers = sortedByTime.filter(t => {
      const { hours, minutes } = parseInicio(t.inicio);
      return hours * 60 + minutes > nowMinutes;
    });
    nextTimer = futureTimers[0] ?? null;
    afterNextTimer = futureTimers[1] ?? null;
  }

  function getLineInfo(timer: { idTemporizador: number; inicio: string; idCategoria: number } | undefined) {
    if (!timer || idSalaActiva === null) return null;
    const empresaId = getEmpresaForActiveTimer(tesList, timer.idTemporizador, idSalaActiva);
    const nombre = empresaId ? getEmpresaNombre(empresas, empresaId) : '—';
    const categoriaNombre = getCategoriaNombre(categorias, timer.idCategoria);
    const categoria = categorias.find((c) => c.idCategoria === timer.idCategoria);
    const fin = categoria ? calcularFin(timer.inicio, categoria.duracion) : '??:??';
    return { nombre, categoriaNombre, inicio: formatInicio(timer.inicio), fin };
  }

  const nextLine = getLineInfo(nextTimer ?? undefined);
  const afterNextLine = getLineInfo(afterNextTimer ?? undefined);

  return (
    <main className="relative isolate min-h-screen bg-gray-900 text-white flex flex-col">
      <div
        className="absolute inset-0 -z-10 bg-center bg-no-repeat bg-contain opacity-[0.35] pointer-events-none"
        style={{ backgroundImage: `url(${logoTajamarTech})` }}
        aria-hidden="true"
      />
      {/* Header: [sala selector] | [connection status] | [menu ≡] */}
      <header className="flex items-center justify-between px-6 py-4 bg-gray-800">
        {/* Left: sala selector */}
        <button
          type="button"
          onClick={() => setShowSalaPopup(true)}
          className="text-sm font-medium text-blue-300 hover:text-blue-100 transition-colors"
          aria-label={`Sala activa: ${salaName || 'Sin sala seleccionada'}. Pulsa para cambiar.`}
        >
          {salaName || 'Seleccionar sala'}
        </button>

        {/* Center: connection status */}
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            isConnected ? 'bg-green-700 text-green-100' : 'bg-red-700 text-red-100'
          }`}
          aria-live="polite"
        >
          {isConnected ? 'Conectado' : 'Desconectado'}
        </span>

        {/* Right: hamburger menu — visible for all users */}
        <button
          type="button"
          onClick={() => setShowMenu(true)}
          className="rounded p-1 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          aria-label="Abrir menú de navegación"
          aria-haspopup="dialog"
          aria-controls="timer-view-menu"
          aria-expanded={showMenu}
        >
          {/* Hamburger icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Navigation drawer — all users */}
      <TimerMenu id="timer-view-menu" isOpen={showMenu} onClose={() => setShowMenu(false)} />

      {/* Main timer display */}
      <section className="flex-1 flex flex-col items-center justify-center gap-8 px-4">
        {calculatedTimerId !== null && currentEmpresaNombre && (
          <p className="text-3xl md:text-4xl font-semibold text-center text-gray-100">
            {currentEmpresaNombre}
          </p>
        )}

        <Tiempo remainingSeconds={remainingSeconds} totalSeconds={totalSeconds} />

        {isTimerDataLoading && idSalaActiva !== null && (
          <div className="h-4 w-40 bg-gray-700 animate-pulse rounded" aria-hidden="true" />
        )}
        {!isTimerDataLoading && calculatedTimerId === null && idSalaActiva !== null && (
          <p className="text-white text-xl">Sin eventos en este momento</p>
        )}
        {!isTimerDataLoading && calculatedTimerId !== null && !currentEmpresaNombre && idSalaActiva !== null && (
          <p className="text-white text-xl">Sin empresa activa en esta sala</p>
        )}
      </section>

      {/* Upcoming timers */}
      {(nextLine || afterNextLine) && (
        <section
          aria-label="Próximos turnos"
          className="bg-gray-800 px-6 py-4 space-y-2"
        >
          <h2 className="text-xs uppercase tracking-wider text-gray-400 mb-3">
            Próximos turnos
          </h2>
          {nextLine && (
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-gray-100">{nextLine.nombre}</span>
              <span className="text-gray-400">
                {nextLine.inicio} – {nextLine.fin} · {nextLine.categoriaNombre}
              </span>
            </div>
          )}
          {afterNextLine && (
            <div className="flex justify-between items-center text-sm text-gray-400">
              <span>{afterNextLine.nombre}</span>
              <span>
                {afterNextLine.inicio} – {afterNextLine.fin} · {afterNextLine.categoriaNombre}
              </span>
            </div>
          )}
        </section>
      )}

      {/* Sala selector modal */}
      {showSalaPopup && (
        <SalaPopUp
          onSelect={handleSalaSelect}
          onClose={() => {
            if (idSalaActiva !== null) setShowSalaPopup(false);
          }}
        />
      )}
    </main>
  );
}
