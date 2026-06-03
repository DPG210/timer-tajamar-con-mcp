/**
 * Empresas — CRUD for Empresa entities.
 * Migrated from Empresas.js (class component).
 * Same patterns as Salas.tsx.
 */

import { useState } from 'react';
import Swal from 'sweetalert2';
import {
  useEmpresas,
  useCreateEmpresa,
  useUpdateEmpresa,
  useDeleteEmpresa,
  isEmpresaNombreUnique,
  getTesIdsForEmpresa,
} from '../../hooks/useEmpresas';
import { useTES } from '../../hooks/useTES';

export function Empresas() {
  const { data: empresas = [], isLoading, isError } = useEmpresas();
  const { data: tesList = [] } = useTES();
  const createEmpresa = useCreateEmpresa();
  const updateEmpresa = useUpdateEmpresa();
  const deleteEmpresa = useDeleteEmpresa();

  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (!isEmpresaNombreUnique(empresas, trimmed)) {
      void Swal.fire('Nombre duplicado', 'Ya existe una empresa con ese nombre.', 'warning');
      return;
    }
    createEmpresa.mutate(trimmed, {
      onSuccess: () => setNewName(''),
      onError: () => void Swal.fire('Error', 'No se pudo crear la empresa.', 'error'),
    });
  }

  async function handleUpdate(idEmpresa: number) {
    const trimmed = editName.trim();
    if (!trimmed) return;
    const current = empresas.find((e) => e.idEmpresa === idEmpresa);
    if (current?.nombreEmpresa === trimmed) {
      setEditId(null);
      return;
    }
    if (!isEmpresaNombreUnique(empresas, trimmed, idEmpresa)) {
      void Swal.fire('Nombre duplicado', 'Ya existe una empresa con ese nombre.', 'warning');
      return;
    }
    updateEmpresa.mutate(
      { idEmpresa, nombreEmpresa: trimmed },
      {
        onSuccess: () => setEditId(null),
        onError: () => void Swal.fire('Error', 'No se pudo actualizar la empresa.', 'error'),
      }
    );
  }

  async function handleDelete(idEmpresa: number, nombreEmpresa: string) {
    const tesIds = getTesIdsForEmpresa(tesList, idEmpresa);
    const confirmText =
      tesIds.length > 0
        ? `Esta empresa tiene ${tesIds.length} asignación(es). Se eliminarán junto con la empresa.`
        : '¿Eliminar esta empresa?';

    const result = await Swal.fire({
      title: `Eliminar "${nombreEmpresa}"`,
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

    deleteEmpresa.mutate(
      { idEmpresa, tesIds },
      {
        onError: () => void Swal.fire(
          'Error',
          tesIds.length > 0
            ? 'El proceso falló a mitad. Algunas asignaciones pueden haber sido eliminadas pero la empresa permanece. Revisa el estado manualmente antes de reintentar.'
            : 'No se pudo eliminar la empresa.',
          'error'
        ),
      }
    );
  }

  if (isLoading) return <div className="p-6 text-gray-500 dark:text-gray-400">Cargando empresas…</div>;
  if (isError) return <div className="p-6 text-red-600">Error al cargar las empresas.</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Empresas</h1>

      <form onSubmit={(e) => void handleCreate(e)} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre de nueva empresa"
          required
          className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
          disabled={createEmpresa.isPending}
        />
        <button
          type="submit"
          disabled={createEmpresa.isPending}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          Añadir
        </button>
      </form>

      <ul className="space-y-2">
        {empresas.map((empresa) => (
          <li
            key={empresa.idEmpresa}
            className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            {editId === empresa.idEmpresa ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleUpdate(empresa.idEmpresa);
                    if (e.key === 'Escape') setEditId(null);
                  }}
                />
                <button type="button" onClick={() => void handleUpdate(empresa.idEmpresa)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Guardar</button>
                <button type="button" onClick={() => setEditId(null)} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Cancelar</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-200">{empresa.nombreEmpresa}</span>
                <button type="button" onClick={() => { setEditId(empresa.idEmpresa); setEditName(empresa.nombreEmpresa); }} className="text-sm text-blue-600 hover:text-blue-800" aria-label={`Editar empresa ${empresa.nombreEmpresa}`}>Editar</button>
                <button type="button" onClick={() => void handleDelete(empresa.idEmpresa, empresa.nombreEmpresa)} className="text-sm text-red-600 hover:text-red-800" aria-label={`Eliminar empresa ${empresa.nombreEmpresa}`} disabled={deleteEmpresa.isPending}>Eliminar</button>
              </>
            )}
          </li>
        ))}
      </ul>

      {empresas.length === 0 && (
        <p className="text-center text-gray-400 text-sm py-8">No hay empresas. Añade la primera.</p>
      )}
    </div>
  );
}
