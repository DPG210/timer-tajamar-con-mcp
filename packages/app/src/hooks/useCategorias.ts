/**
 * TanStack Query hooks for Categoria CRUD.
 * After each mutation, emits socket syncData so all clients refresh.
 * Cascade delete uses Promise.all (M-07).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { socket } from '../socket';
import {
  CategoriaArraySchema,
  type Categoria,
  type CreateCategoriaBody,
  type UpdateCategoriaBody,
} from '../types/models';

export const CATEGORIAS_KEY = ['categorias'] as const;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useCategorias() {
  return useQuery({
    queryKey: CATEGORIAS_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<unknown>('api/categoriastimer');
      return CategoriaArraySchema.parse(data);
    },
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: Omit<CreateCategoriaBody, 'idCategoria'>) => {
      const payload: CreateCategoriaBody = { idCategoria: 0, ...body };
      await apiClient.post('api/categoriastimer', payload);
      socket.emit('syncData');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORIAS_KEY });
    },
  });
}

export function useUpdateCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: UpdateCategoriaBody) => {
      await apiClient.put('api/categoriastimer', body);
      socket.emit('syncData');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORIAS_KEY });
    },
  });
}

/**
 * Delete a Categoria and cascade: delete all TES and Timers that use it.
 * Resolves M-07: Promise.all for parallel TES deletions, then serial timer deletions.
 */
export function useDeleteCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      idCategoria,
      timerIds,
      tesIds,
    }: {
      idCategoria: number;
      timerIds: number[];
      tesIds: number[];
    }) => {
      // 1. Delete all TES in parallel
      await Promise.all(tesIds.map((id) => apiClient.delete(`api/TiempoEmpresaSala/${id}`)));
      // 2. Delete all timers that belong to this category (also in parallel)
      await Promise.all(
        timerIds.map((id) => apiClient.delete(`api/timers/${id}`))
      );
      // 3. Delete the category itself
      await apiClient.delete(`api/categoriastimer/${idCategoria}`);
      socket.emit('syncData');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORIAS_KEY });
      void queryClient.invalidateQueries({ queryKey: ['timers'] });
      void queryClient.invalidateQueries({ queryKey: ['tes'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Client-side helpers
// ---------------------------------------------------------------------------

export function getCategoriaNombre(categorias: Categoria[], idCategoria: number): string {
  return categorias.find((c) => c.idCategoria === idCategoria)?.categoria ?? '';
}

export function getCategoriaDuracion(
  categorias: Categoria[],
  idCategoria: number
): number | null {
  return categorias.find((c) => c.idCategoria === idCategoria)?.duracion ?? null;
}

export function isCategoriaUnique(
  categorias: Categoria[],
  nombre: string,
  excludeId?: number
): boolean {
  const normalized = nombre.trim().toLowerCase();
  return !categorias.some(
    (c) =>
      c.categoria.toLowerCase() === normalized &&
      (excludeId === undefined || c.idCategoria !== excludeId)
  );
}
