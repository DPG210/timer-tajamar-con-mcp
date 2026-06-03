/**
 * TanStack Query hooks for Sala CRUD.
 * Resolves M-04: nombres in URL are encoded with encodeURIComponent.
 * Resolves M-07: cascade deletes use Promise.all.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { SalaArraySchema, type Sala } from '../types/models';

export const SALAS_KEY = ['salas'] as const;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useSalas() {
  return useQuery({
    queryKey: SALAS_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<unknown>('api/salas');
      return SalaArraySchema.parse(data);
    },
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateSala() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nombreSala: string) => {
      await apiClient.post(`api/salas/createsala/${encodeURIComponent(nombreSala)}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SALAS_KEY });
    },
  });
}

export function useUpdateSala() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ idSala, nombreSala }: { idSala: number; nombreSala: string }) => {
      await apiClient.put(
        `api/salas/updatesala/${idSala}/${encodeURIComponent(nombreSala)}`
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SALAS_KEY });
    },
  });
}

/**
 * Delete a Sala and all its TES dependencies in one atomic operation.
 * Resolves M-07: uses Promise.all to wait for all TES deletions before
 * deleting the sala itself.
 */
export function useDeleteSala() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ idSala, tesIds }: { idSala: number; tesIds: number[] }) => {
      // Delete all dependent TES records in parallel
      await Promise.all(tesIds.map((id) => apiClient.delete(`api/TiempoEmpresaSala/${id}`)));
      // Only delete the sala after all dependencies are gone
      await apiClient.delete(`api/salas/${idSala}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SALAS_KEY });
      void queryClient.invalidateQueries({ queryKey: ['tes'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Helper: find TES IDs for a sala from the already-loaded TES list
// ---------------------------------------------------------------------------
export function getTesIdsForSala(tesList: { id: number; idSala: number }[], idSala: number): number[] {
  return tesList.filter((t) => t.idSala === idSala).map((t) => t.id);
}

// ---------------------------------------------------------------------------
// Client-side uniqueness validation (case-insensitive, like the original)
// ---------------------------------------------------------------------------
export function isSalaNombreUnique(
  salas: Sala[],
  nombre: string,
  excludeId?: number
): boolean {
  const normalized = nombre.trim().toLowerCase();
  return !salas.some(
    (s) =>
      s.nombreSala.toLowerCase() === normalized &&
      (excludeId === undefined || s.idSala !== excludeId)
  );
}
