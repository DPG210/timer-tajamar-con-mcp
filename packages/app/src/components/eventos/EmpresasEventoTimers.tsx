/**
 * EmpresasEventoTimers — rehabilitated component (was commented in original Router.js).
 *
 * FIXED BUG (M-11): The original never loaded categorias in componentDidMount,
 * so getFinal() always returned "". Here useCategorias() loads automatically
 * and calcularFin() uses duracion from EventoActual directly (correct approach
 * per data-models.md: HorarioActualEmpresaPopUp used duracion directly, which is correct).
 *
 * Route: /empresastimers (re-enabled per PRD decision)
 */

import { useState } from 'react';
import { useEmpresasTimers, useEventosEmpresa, useEventosActualesEmpresa } from '../../hooks/useTimerEventos';
import { formatInicio, calcularFin } from '../../utils/time';
import type { Empresa } from '../../types/models';

export function EmpresasEventoTimers() {
  const { data: empresas = [], isLoading, isError } = useEmpresasTimers();
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);

  // Fetch all events for the selected empresa (for the detail panel)
  const { data: eventosActuales = [], isLoading: loadingEventos } = useEventosActualesEmpresa(
    selectedEmpresa?.idEmpresa ?? null
  );
  const { data: todosEventos = [] } = useEventosEmpresa(
    selectedEmpresa?.idEmpresa ?? null
  );

  if (isLoading) return <div className="p-6 text-gray-500 dark:text-gray-400">Cargando empresas…</div>;
  if (isError) return <div className="p-6 text-red-600">Error al cargar las empresas.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Empresas en el evento</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Empresa list */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Empresas con timers
          </h2>
          {empresas.length === 0 && (
            <p className="text-gray-400 text-sm">No hay empresas con timers asignados.</p>
          )}
          <ul className="space-y-2">
            {empresas.map((empresa) => (
              <li key={empresa.idEmpresa}>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedEmpresa((prev) =>
                      prev?.idEmpresa === empresa.idEmpresa ? null : empresa
                    )
                  }
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    selectedEmpresa?.idEmpresa === empresa.idEmpresa
                      ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {empresa.nombreEmpresa}
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Evento detail */}
        {selectedEmpresa && (
          <section aria-label={`Detalle de ${selectedEmpresa.nombreEmpresa}`}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {selectedEmpresa.nombreEmpresa}
            </h2>

            {loadingEventos && <p className="text-gray-500 dark:text-gray-400 text-sm">Cargando…</p>}

            {eventosActuales.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-medium text-gray-400 uppercase mb-2">Actuales y próximos</h3>
                <div className="space-y-2">
                  {eventosActuales.map((ev, i) => (
                    <div key={`${ev.sala}-${ev.inicioTimer}-${i}`} className="bg-blue-50 border border-blue-100 rounded-lg p-3 dark:bg-blue-900/20 dark:border-blue-800">
                      <p className="font-medium text-blue-800 dark:text-blue-200 text-sm">{ev.sala}</p>
                      <p className="text-blue-600 dark:text-blue-300 text-xs">
                        {formatInicio(ev.inicioTimer)} – {calcularFin(ev.inicioTimer, ev.duracion)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {todosEventos.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-gray-400 uppercase mb-2">Todos los turnos</h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-1.5 text-gray-500 font-medium">Sala</th>
                      <th className="text-left py-1.5 text-gray-500 font-medium">Inicio</th>
                      {/* Bug fix M-11: use duracion directly, not idCategoria lookup */}
                      <th className="text-left py-1.5 text-gray-500 font-medium">Fin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                    {todosEventos.map((ev, i) => (
                      <tr key={`${ev.sala}-${ev.inicioTimer}-${i}`}>
                        <td className="py-1.5 text-gray-700 dark:text-gray-200">{ev.sala}</td>
                        <td className="py-1.5 text-gray-700 dark:text-gray-200">{formatInicio(ev.inicioTimer)}</td>
                        {/* Fixed: use ev.duracion directly (original used this.state.categorias which was never loaded) */}
                        <td className="py-1.5 text-gray-500 dark:text-gray-400">{calcularFin(ev.inicioTimer, ev.duracion)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loadingEventos && eventosActuales.length === 0 && todosEventos.length === 0 && (
              <p className="text-gray-400 text-sm">No hay eventos registrados para esta empresa.</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
