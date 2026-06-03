/**
 * Salas — CRUD for Sala entities.
 * Migrated from Salas.js (class component).
 *
 * Resolves:
 *   M-04: encodeURIComponent in useCreateSala/useUpdateSala hooks
 *   M-07: cascade delete via useDeleteSala (Promise.all in hook)
 *   M-08: Swal in component, not in service
 *   M-10: functional component
 */

import { useState } from 'react';
import Swal from 'sweetalert2';
import { useSalas, useCreateSala, useUpdateSala, useDeleteSala, isSalaNombreUnique, getTesIdsForSala } from '../../hooks/useSalas';
import { useTES } from '../../hooks/useTES';

export function Salas() {
  const { data: salas = [], isLoading, isError } = useSalas();
  const { data: tesList = [] } = useTES();
  const createSala = useCreateSala();
  const updateSala = useUpdateSala();
  const deleteSala = useDeleteSala();

  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (!isSalaNombreUnique(salas, trimmed)) {
      void Swal.fire('Nombre duplicado', 'Ya existe una sala con ese nombre.', 'warning');
      return;
    }
    createSala.mutate(trimmed, {
      onSuccess: () => setNewName(''),
      onError: () => void Swal.fire('Error', 'No se pudo crear la sala.', 'error'),
    });
  }

  function startEdit(idSala: number, nombre: string) {
    setEditId(idSala);
    setEditName(nombre);
  }

  async function handleUpdate(idSala: number) {
    const trimmed = editName.trim();
    if (!trimmed) return;
    const current = salas.find((s) => s.idSala === idSala);
    if (current?.nombreSala === trimmed) {
      setEditId(null);
      return;
    }
    if (!isSalaNombreUnique(salas, trimmed, idSala)) {
      void Swal.fire('Nombre duplicado', 'Ya existe una sala con ese nombre.', 'warning');
      return;
    }
    updateSala.mutate(
      { idSala, nombreSala: trimmed },
      {
        onSuccess: () => setEditId(null),
        onError: () => void Swal.fire('Error', 'No se pudo actualizar la sala.', 'error'),
      }
    );
  }

  async function handleDelete(idSala: number, nombreSala: string) {
    const tesIds = getTesIdsForSala(tesList, idSala);
    const confirmText =
      tesIds.length > 0
        ? `Esta sala tiene ${tesIds.length} asignación(es). Se eliminarán junto con la sala.`
        : '¿Eliminar esta sala?';

    const result = await Swal.fire({
      title: `Eliminar "${nombreSala}"`,
      text: confirmText,
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

    deleteSala.mutate(
      { idSala, tesIds },
      {
        onError: () => void Swal.fire(
          'Error',
          tesIds.length > 0
            ? 'El proceso falló a mitad. Algunas asignaciones pueden haber sido eliminadas pero la sala permanece. Revisa el estado manualmente antes de reintentar.'
            : 'No se pudo eliminar la sala.',
          'error'
        ),
      }
    );
  }

  if (isLoading) return <div className="p-6 text-gray-500 dark:text-gray-400">Cargando salas…</div>;
  if (isError) return <div className="p-6 text-red-600">Error al cargar las salas.</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Salas</h1>

      {/* Create form */}
      <form onSubmit={(e) => void handleCreate(e)} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre de nueva sala"
          required
          className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
          disabled={createSala.isPending}
        />
        <button
          type="submit"
          disabled={createSala.isPending}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          Añadir
        </button>
      </form>

      {/* List */}
      <ul className="space-y-2">
        {salas.map((sala) => (
          <li
            key={sala.idSala}
            className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            {editId === sala.idSala ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleUpdate(sala.idSala);
                    if (e.key === 'Escape') setEditId(null);
                  }}
                />
                <button
                  type="button"
                  onClick={() => void handleUpdate(sala.idSala)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setEditId(null)}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-200">{sala.nombreSala}</span>
                <button
                  type="button"
                  onClick={() => startEdit(sala.idSala, sala.nombreSala)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                  aria-label={`Editar sala ${sala.nombreSala}`}
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(sala.idSala, sala.nombreSala)}
                  className="text-sm text-red-600 hover:text-red-800"
                  aria-label={`Eliminar sala ${sala.nombreSala}`}
                  disabled={deleteSala.isPending}
                >
                  Eliminar
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      {salas.length === 0 && (
        <p className="text-center text-gray-400 text-sm py-8">No hay salas. Añade la primera.</p>
      )}
    </div>
  );
}
