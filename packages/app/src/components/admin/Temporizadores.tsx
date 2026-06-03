/**
 * Temporizadores — CRUD for Temporizador entities.
 * Migrated from Temporizadores.js (class component).
 *
 * Resolves:
 *   M-05: haySolapamiento from utils/time.ts
 *   M-07: cascade delete via useDeleteTimer hook
 *   M-08: Swal in component
 *   M-10: functional component
 */

import { useState } from 'react';
import Swal from 'sweetalert2';
import { useTimers, useCreateTimer, useUpdateTimer, useDeleteTimer, getTesIdsForTimer } from '../../hooks/useTimers';
import { useCategorias, getCategoriaNombre } from '../../hooks/useCategorias';
import { useTES } from '../../hooks/useTES';
import { formatInicio, calcularFin, haySolapamiento, toTimeRange, buildInicioString } from '../../utils/time';
import { todayMadrid } from '../../utils/timezone';
import type { Temporizador } from '../../types/models';

export function Temporizadores() {
  const { data: timers = [], isLoading, isError } = useTimers();
  const { data: categorias = [] } = useCategorias();
  const { data: tesList = [] } = useTES();
  const createTimer = useCreateTimer();
  const updateTimer = useUpdateTimer();
  const deleteTimer = useDeleteTimer();

  // todayMadrid() returns YYYY-MM-DD in Europe/Madrid wallclock time.
  // Correct across DST transitions and immune to browser OS timezone setting.
  const today = todayMadrid();
  const [newDate, setNewDate] = useState(today);
  const [newTime, setNewTime] = useState('09:00');
  const [newCategoriaId, setNewCategoriaId] = useState<number | null>(null);
  const effectiveCategoriaId = newCategoriaId ?? categorias[0]?.idCategoria ?? null;
  const [editId, setEditId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editCategoriaId, setEditCategoriaId] = useState<number>(0);

  function checkOverlap(inicio: string, duracionMinutos: number, excludeId?: number): boolean {
    const newRange = toTimeRange(inicio, duracionMinutos);
    return timers
      .filter((t) => excludeId === undefined || t.idTemporizador !== excludeId)
      .some((t) => {
        const cat = categorias.find((c) => c.idCategoria === t.idCategoria);
        if (!cat) return false;
        return haySolapamiento(newRange, toTimeRange(t.inicio, cat.duracion));
      });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (effectiveCategoriaId === null) return;
    const cat = categorias.find((c) => c.idCategoria === effectiveCategoriaId);
    if (!cat) return;
    const inicio = buildInicioString(newDate, newTime);
    if (checkOverlap(inicio, cat.duracion)) {
      void Swal.fire('Solapamiento', 'Este temporizador se solapa con otro existente.', 'warning');
      return;
    }
    createTimer.mutate(
      { inicio, idCategoria: effectiveCategoriaId },
      { onError: () => void Swal.fire('Error', 'No se pudo crear el temporizador.', 'error') }
    );
  }

  function startEdit(t: Temporizador) {
    setEditId(t.idTemporizador);
    const parts = t.inicio.includes('T') ? t.inicio.split('T') : ['', t.inicio];
    setEditDate(parts[0] ?? today);
    setEditTime((parts[1] ?? '09:00:00').slice(0, 5));
    setEditCategoriaId(t.idCategoria);
  }

  async function handleUpdate(idTemporizador: number) {
    const catId = Number(editCategoriaId);
    const cat = categorias.find((c) => c.idCategoria === catId);
    if (!cat) return;
    const inicio = buildInicioString(editDate, editTime);
    if (checkOverlap(inicio, cat.duracion, idTemporizador)) {
      void Swal.fire('Solapamiento', 'Este temporizador se solapa con otro existente.', 'warning');
      return;
    }
    updateTimer.mutate(
      { idTemporizador, inicio, idCategoria: catId, pausa: false },
      {
        onSuccess: () => setEditId(null),
        onError: () => void Swal.fire('Error', 'No se pudo actualizar el temporizador.', 'error'),
      }
    );
  }

  async function handleDelete(idTemporizador: number) {
    const tesIds = getTesIdsForTimer(tesList, idTemporizador);
    const result = await Swal.fire({
      title: 'Eliminar temporizador',
      text: tesIds.length > 0
        ? `Se eliminarán ${tesIds.length} asignación(es) dependientes.`
        : '¿Eliminar este temporizador?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      ...(tesIds.length > 0 && {
        footer: '<small>Esta operación no es atómica. Un fallo parcial puede requerir corrección manual.</small>',
      }),
    });
    if (!result.isConfirmed) return;

    deleteTimer.mutate(
      { idTemporizador, tesIds },
      {
        onError: () => void Swal.fire(
          'Error',
          tesIds.length > 0
            ? 'El proceso falló a mitad. Algunas asignaciones pueden haber sido eliminadas pero el temporizador permanece. Revisa el estado manualmente antes de reintentar.'
            : 'No se pudo eliminar el temporizador.',
          'error'
        ),
      }
    );
  }

  if (isLoading) return <div className="p-6 text-gray-500 dark:text-gray-400">Cargando temporizadores…</div>;
  if (isError) return <div className="p-6 text-red-600">Error al cargar los temporizadores.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Temporizadores</h1>

      {/* Create form */}
      <form onSubmit={(e) => void handleCreate(e)} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6 flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fecha</label>
          <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:text-gray-100" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Hora inicio</label>
          <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} required step="60" className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:text-gray-100" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Categoría</label>
          <select
            value={effectiveCategoriaId ?? ''}
            onChange={(e) => setNewCategoriaId(Number(e.target.value))}
            required
            className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:text-gray-100"
          >
            {categorias.map((c) => (
              <option key={c.idCategoria} value={c.idCategoria}>{c.categoria}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={createTimer.isPending || effectiveCategoriaId === null} className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          Añadir
        </button>
      </form>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Inicio</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Fin</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {timers.map((timer) => {
              const cat = categorias.find((c) => c.idCategoria === timer.idCategoria);
              const fin = cat ? calcularFin(timer.inicio, cat.duracion) : '??:??';
              return (
                <tr key={timer.idTemporizador}>
                  {editId === timer.idTemporizador ? (
                    <>
                      <td className="px-4 py-2" colSpan={2}>
                        <div className="flex gap-2">
                          <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs dark:bg-gray-700 dark:text-gray-100" />
                          <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} step="60" className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs dark:bg-gray-700 dark:text-gray-100" />
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <select value={editCategoriaId} onChange={(e) => setEditCategoriaId(Number(e.target.value))} className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs dark:bg-gray-700 dark:text-gray-100">
                          {categorias.map((c) => <option key={c.idCategoria} value={c.idCategoria}>{c.categoria}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2 text-right space-x-2">
                        <button type="button" onClick={() => void handleUpdate(timer.idTemporizador)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Guardar</button>
                        <button type="button" onClick={() => setEditId(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs">Cancelar</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{formatInicio(timer.inicio)}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{fin}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{getCategoriaNombre(categorias, timer.idCategoria)}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button type="button" onClick={() => startEdit(timer)} className="text-blue-600 hover:text-blue-800 text-xs">Editar</button>
                        <button type="button" onClick={() => void handleDelete(timer.idTemporizador)} className="text-red-600 hover:text-red-800 text-xs" disabled={deleteTimer.isPending}>Eliminar</button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {timers.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">No hay temporizadores.</p>
        )}
      </div>
    </div>
  );
}
