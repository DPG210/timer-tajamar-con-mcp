/**
 * TanStack Query hooks for Temporizador CRUD.
 * Emits syncData after mutations.
 * Cascade delete uses Promise.all (M-07).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { socket } from '../socket';
import {
  TemporizadorArraySchema,
  type CreateTemporizadorBody,
  type UpdateTemporizadorBody,
} from '../types/models';

export const TIMERS_KEY = ['timers'] as const;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useTimers() {
  return useQuery({
    queryKey: TIMERS_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<unknown>('api/timers');
      const timers = TemporizadorArraySchema.parse(data);
      // Sort by inicio ascending (same as original Horario.js and Temporizadores.js)
      return [...timers].sort((a, b) => a.inicio.localeCompare(b.inicio));
    },
    staleTime: 0,
    refetchInterval: 120_000,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateTimer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: Omit<CreateTemporizadorBody, 'idTemporizador' | 'pausa'>) => {
      const payload: CreateTemporizadorBody = {
        idTemporizador: 0,
        pausa: false,
        ...body,
      };
      await apiClient.post('api/timers', payload);
      socket.emit('syncData');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TIMERS_KEY });
    },
  });
}

export function useUpdateTimer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: UpdateTemporizadorBody) => {
      await apiClient.put('api/timers', body);
      socket.emit('syncData');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TIMERS_KEY });
    },
  });
}

/**
 * Delete a Temporizador and all its TES dependencies.
 * Resolves M-07.
 */
export function useDeleteTimer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      idTemporizador,
      tesIds,
    }: {
      idTemporizador: number;
      tesIds: number[];
    }) => {
      await Promise.all(tesIds.map((id) => apiClient.delete(`api/TiempoEmpresaSala/${id}`)));
      await apiClient.delete(`api/timers/${idTemporizador}`);
      socket.emit('syncData');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TIMERS_KEY });
      void queryClient.invalidateQueries({ queryKey: ['tes'] });
    },
  });
}

/**
 * Increase all timers by N minutes.
 */
export function useIncreaseTimers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (minutes: number) => {
      await apiClient.put(`api/timers/increasetimers/${minutes}`);
      socket.emit('syncData');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TIMERS_KEY });
    },
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getTesIdsForTimer(
  tesList: { id: number; idTimer: number }[],
  idTemporizador: number
): number[] {
  return tesList.filter((t) => t.idTimer === idTemporizador).map((t) => t.id);
}
