/**
 * Horario — schedule view: sala cards with accordion detail.
 * Migrated from Horario.js (class component).
 *
 * Resolves:
 *   M-07: TES operations are atomic (create/delete via hooks)
 *   M-10: functional component
 *   M-12: idEvento = 1 (known debt, documented)
 *
 * Layout: vertical list of sala cards; clicking one expands its timer list.
 */

import { useState } from 'react';
import Swal from 'sweetalert2';
import { useTimers } from '../../hooks/useTimers';
import { useSalas } from '../../hooks/useSalas';
import { useEmpresas } from '../../hooks/useEmpresas';
import { useCategorias, getCategoriaDuracion } from '../../hooks/useCategorias';
import { useTES, useCreateTES, useDeleteTES, findTESForTimerInSala } from '../../hooks/useTES';
import { useAuthStore } from '../../stores/authStore';
import { formatInicio, calcularFin } from '../../utils/time';

export function Horario() {
  const { data: timers = [], isLoading: loadingTimers } = useTimers();
  const { data: salas = [], isLoading: loadingSalas } = useSalas();
  const { data: empresas = [], isLoading: loadingEmpresas } = useEmpresas();
  const { data: categorias = [] } = useCategorias();
  const { data: tesList = [] } = useTES();
  const createTES = useCreateTES();
  const deleteTES = useDeleteTES();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [openSalaId, setOpenSalaId] = useState<number | null>(null);
  const [selectedEmpresaMap, setSelectedEmpresaMap] = useState<Record<string, number>>({});

  const isLoading = loadingTimers || loadingSalas || loadingEmpresas;

  function getCellKey(idTimer: number, idSala: number) {
    return `${idTimer}-${idSala}`;
  }

  function toggleSala(idSala: number) {
    setOpenSalaId((prev) => (prev === idSala ? null : idSala));
  }

  function handleAssign(idTimer: number, idSala: number) {
    const key = getCellKey(idTimer, idSala);
    const idEmpresa = selectedEmpresaMap[key];
    if (!idEmpresa) return;

    const existing = findTESForTimerInSala(tesList, idTimer, idSala);
    if (existing) {
      void Swal.fire('Ya asignado', 'Este slot ya tiene una empresa asignada. Elimínala primero.', 'info');
      return;
    }

    createTES.mutate(
      { idTimer, idEmpresa, idSala },
      { onError: () => void Swal.fire('Error', 'No se pudo crear la asignación.', 'error') }
    );
  }

  async function handleRemove(idTimer: number, idSala: number) {
    const tes = findTESForTimerInSala(tesList, idTimer, idSala);
    if (!tes) return;

    const result = await Swal.fire({
      title: 'Eliminar asignación',
      text: '¿Eliminar esta empresa de este slot?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });
    if (!result.isConfirmed) return;

    deleteTES.mutate(tes.id, {
      onError: () => void Swal.fire('Error', 'No se pudo eliminar la asignación.', 'error'),
    });
  }

  if (isLoading) return <div className="p-6 text-gray-500">Cargando horario…</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Horario</h1>

      {salas.length === 0 && (
        <p className="text-center text-gray-400 text-sm py-8">No hay salas configuradas.</p>
      )}

      <ul className="space-y-2">
        {salas.map((sala) => {
          const isOpen = openSalaId === sala.idSala;

          return (
            <li key={sala.idSala} className="rounded-lg overflow-hidden border border-gray-700">
              <button
                type="button"
                onClick={() => toggleSala(sala.idSala)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 hover:bg-gray-700 transition-colors text-left"
              >
                <span className="font-medium text-gray-100">{sala.nombreSala}</span>
                <span className="text-gray-400 text-sm select-none" aria-hidden="true">
                  {isOpen ? '▲' : '▼'}
                </span>
              </button>

              <div
                className={`grid motion-safe:transition-all motion-safe:duration-300 ease-in-out ${
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
              <div className="overflow-hidden bg-gray-900">
                  {timers.length === 0 ? (
                    <p className="px-4 py-6 text-center text-gray-500 text-sm">
                      No hay temporizadores configurados.
                    </p>
                  ) : (
                    <ul>
                      {timers.map((timer, index) => {
                        const duracion = getCategoriaDuracion(categorias, timer.idCategoria) ?? 0;
                        const fin = calcularFin(timer.inicio, duracion);
                        const categoriaNombre =
                          categorias.find((c) => c.idCategoria === timer.idCategoria)?.categoria ?? '—';
                        const tes = findTESForTimerInSala(tesList, timer.idTemporizador, sala.idSala);
                        const assignedEmpresa = tes
                          ? empresas.find((e) => e.idEmpresa === tes.idEmpresa)
                          : null;
                        const key = getCellKey(timer.idTemporizador, sala.idSala);

                        return (
                          <li
                            key={timer.idTemporizador}
                            className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 px-4 py-3 ${
                              index < timers.length - 1 ? 'border-b border-gray-800' : ''
                            }`}
                          >
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className="text-sm text-gray-100 whitespace-nowrap">
                                {formatInicio(timer.inicio)} – {fin}
                              </span>
                              <span className="text-xs text-gray-500">{categoriaNombre}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {assignedEmpresa ? (
                                <>
                                  <span className="text-sm font-medium text-blue-300">
                                    {assignedEmpresa.nombreEmpresa}
                                  </span>
                                  {isAuthenticated && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void handleRemove(timer.idTemporizador, sala.idSala)
                                      }
                                      className="text-red-400 hover:text-red-500 transition-colors text-xs leading-none"
                                      aria-label={`Quitar ${assignedEmpresa.nombreEmpresa} de ${sala.nombreSala}`}
                                    >
                                      ✕
                                    </button>
                                  )}
                                </>
                              ) : isAuthenticated ? (
                                <>
                                  <select
                                    value={selectedEmpresaMap[key] ?? ''}
                                    onChange={(e) =>
                                      setSelectedEmpresaMap((prev) => ({
                                        ...prev,
                                        [key]: Number(e.target.value),
                                      }))
                                    }
                                    className="text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 focus:outline-none focus:border-blue-500 w-full sm:w-auto"
                                    aria-label={`Seleccionar empresa para ${sala.nombreSala} a las ${formatInicio(timer.inicio)}`}
                                  >
                                    <option value="">— empresa —</option>
                                    {empresas.map((e) => (
                                      <option key={e.idEmpresa} value={e.idEmpresa}>
                                        {e.nombreEmpresa}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleAssign(timer.idTemporizador, sala.idSala)
                                    }
                                    disabled={!selectedEmpresaMap[key]}
                                    className="text-blue-400 hover:text-blue-300 transition-colors text-lg leading-none font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                                    aria-label="Asignar empresa"
                                  >
                                    +
                                  </button>
                                </>
                              ) : (
                                <span className="text-gray-600 text-sm">—</span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
