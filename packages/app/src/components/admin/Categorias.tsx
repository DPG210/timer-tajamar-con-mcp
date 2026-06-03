/**
 * Categorias — CRUD for Categoria entities.
 * Migrated from Categorias.js (class component).
 *
 * Resolves:
 *   M-05: overlap validation via haySolapamiento from utils/time.ts
 *   M-07: cascade delete in useDeleteCategoria hook (Promise.all)
 *   M-08: Swal in component
 *   M-10: functional component
 */

import { useState } from 'react';
import Swal from 'sweetalert2';
import {
  useCategorias,
  useCreateCategoria,
  useUpdateCategoria,
  useDeleteCategoria,
  isCategoriaUnique,
} from '../../hooks/useCategorias';
import { useTimers } from '../../hooks/useTimers';
import { useTES } from '../../hooks/useTES';
import {
  transformDuration,
  transformMinutes,
  haySolapamiento,
  toTimeRange,
} from '../../utils/time';
import type { Categoria } from '../../types/models';

export function Categorias() {
  const { data: categorias = [], isLoading, isError } = useCategorias();
  const { data: timers = [] } = useTimers();
  const { data: tesList = [] } = useTES();
  const createCategoria = useCreateCategoria();
  const updateCategoria = useUpdateCategoria();
  const deleteCategoria = useDeleteCategoria();

  const [newNombre, setNewNombre] = useState('');
  const [newDuracion, setNewDuracion] = useState('00:30');
  const [editId, setEditId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDuracion, setEditDuracion] = useState('');

  function checkOverlapForDuration(duracionMinutos: number, excludeCategoriaId?: number): boolean {
    const affectedTimers = timers.filter(
      (t) => excludeCategoriaId === undefined || t.idCategoria !== excludeCategoriaId
    );
    // Check if any timer using this category would overlap with any other timer after duration change
    for (let i = 0; i < affectedTimers.length; i++) {
      for (let j = i + 1; j < affectedTimers.length; j++) {
        const timerA = affectedTimers[i];
        const timerB = affectedTimers[j];
        if (!timerA || !timerB) continue;
        const catA = categorias.find((c) => c.idCategoria === timerA.idCategoria);
        const catB = categorias.find((c) => c.idCategoria === timerB.idCategoria);
        if (!catA || !catB) continue;
        const durA = timerA.idCategoria === excludeCategoriaId ? duracionMinutos : catA.duracion;
        const durB = timerB.idCategoria === excludeCategoriaId ? duracionMinutos : catB.duracion;
        const rangeA = toTimeRange(timerA.inicio, durA);
        const rangeB = toTimeRange(timerB.inicio, durB);
        if (haySolapamiento(rangeA, rangeB)) return true;
      }
    }
    return false;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const nombre = newNombre.trim();
    const duracionMinutos = transformMinutes(newDuracion);
    if (!nombre || duracionMinutos <= 0) return;

    if (!isCategoriaUnique(categorias, nombre)) {
      void Swal.fire('Nombre duplicado', 'Ya existe una categoría con ese nombre.', 'warning');
      return;
    }

    createCategoria.mutate(
      { categoria: nombre, duracion: duracionMinutos },
      {
        onSuccess: () => { setNewNombre(''); setNewDuracion('00:30'); },
        onError: () => void Swal.fire('Error', 'No se pudo crear la categoría.', 'error'),
      }
    );
  }

  function startEdit(cat: Categoria) {
    setEditId(cat.idCategoria);
    setEditNombre(cat.categoria);
    setEditDuracion(transformDuration(cat.duracion));
  }

  async function handleUpdate(idCategoria: number) {
    const nombre = editNombre.trim();
    const duracionMinutos = transformMinutes(editDuracion);
    if (!nombre || duracionMinutos <= 0) return;

    if (!isCategoriaUnique(categorias, nombre, idCategoria)) {
      void Swal.fire('Nombre duplicado', 'Ya existe una categoría con ese nombre.', 'warning');
      return;
    }
    if (checkOverlapForDuration(duracionMinutos, idCategoria)) {
      void Swal.fire('Solapamiento', 'Esta duración causaría solapamiento entre timers.', 'warning');
      return;
    }

    updateCategoria.mutate(
      { idCategoria, categoria: nombre, duracion: duracionMinutos },
      {
        onSuccess: () => setEditId(null),
        onError: () => void Swal.fire('Error', 'No se pudo actualizar la categoría.', 'error'),
      }
    );
  }

  async function handleDelete(idCategoria: number, nombreCategoria: string) {
    const timerIds = timers
      .filter((t) => t.idCategoria === idCategoria)
      .map((t) => t.idTemporizador);
    const tesIds = tesList
      .filter((t) => timerIds.includes(t.idTimer))
      .map((t) => t.id);

    const result = await Swal.fire({
      title: `Eliminar "${nombreCategoria}"`,
      text: `Se eliminarán ${timerIds.length} temporizador(es) y ${tesIds.length} asignación(es) dependientes.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar todo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      footer: '<small>Esta operación no es atómica. Un fallo parcial puede requerir corrección manual.</small>',
    });
    if (!result.isConfirmed) return;

    deleteCategoria.mutate(
      { idCategoria, timerIds, tesIds },
      {
        onError: () => void Swal.fire(
          'Error',
          'El proceso falló a mitad. Algunos temporizadores o asignaciones pueden haber sido eliminados pero la categoría permanece. Revisa el estado manualmente antes de reintentar.',
          'error'
        ),
      }
    );
  }

  if (isLoading) return <div className="p-6 text-gray-500 dark:text-gray-400">Cargando categorías…</div>;
  if (isError) return <div className="p-6 text-red-600">Error al cargar las categorías.</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Categorías</h1>

      <form onSubmit={(e) => void handleCreate(e)} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newNombre}
          onChange={(e) => setNewNombre(e.target.value)}
          placeholder="Nombre de categoría"
          required
          className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
        />
        <input
          type="time"
          value={newDuracion}
          onChange={(e) => setNewDuracion(e.target.value)}
          required
          step="60"
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          aria-label="Duración (HH:MM)"
        />
        <button
          type="submit"
          disabled={createCategoria.isPending}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          Añadir
        </button>
      </form>

      <ul className="space-y-2">
        {categorias.map((cat) => (
          <li key={cat.idCategoria} className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            {editId === cat.idCategoria ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  autoFocus
                />
                <input
                  type="time"
                  value={editDuracion}
                  onChange={(e) => setEditDuracion(e.target.value)}
                  step="60"
                  className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm dark:bg-gray-700 dark:text-gray-100"
                />
                <button type="button" onClick={() => void handleUpdate(cat.idCategoria)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Guardar</button>
                <button type="button" onClick={() => setEditId(null)} className="text-sm text-gray-500 dark:text-gray-400 dark:hover:text-gray-200">Cancelar</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-200 font-medium">{cat.categoria}</span>
                <span className="text-xs text-gray-400">{transformDuration(cat.duracion)}</span>
                <button type="button" onClick={() => startEdit(cat)} className="text-sm text-blue-600 hover:text-blue-800" aria-label={`Editar categoría ${cat.categoria}`}>Editar</button>
                <button type="button" onClick={() => void handleDelete(cat.idCategoria, cat.categoria)} className="text-sm text-red-600 hover:text-red-800" aria-label={`Eliminar categoría ${cat.categoria}`} disabled={deleteCategoria.isPending}>Eliminar</button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {categorias.length === 0 && (
        <p className="text-center text-gray-400 text-sm py-8">No hay categorías.</p>
      )}
    </div>
  );
}
