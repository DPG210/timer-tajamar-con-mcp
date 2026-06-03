/**
 * TanStack Query hooks for TiempoEmpresaSala (TES).
 *
 * Key design decision (ADR-004 + M-06):
 *   getTES is called ONCE via this hook. All components that need TES data
 *   share the same cached query result. Filtering happens in memory.
 *   There are NO duplicate network requests per socket timerID event.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { TESArraySchema, type CreateTESBody, type TES } from '../types/models';

export const TES_KEY = ['tes'] as const;

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

export function useTES() {
  return useQuery({
    queryKey: TES_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<unknown>('api/TiempoEmpresaSala');
      return TESArraySchema.parse(data);
    },
    staleTime: 0,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateTES() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: Omit<CreateTESBody, 'id' | 'idEvento'>) => {
      const payload: CreateTESBody = {
        id: 0,
        idEvento: 1, // M-12: hardcoded for now, known debt
        ...body,
      };
      await apiClient.post('api/TiempoEmpresaSala', payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TES_KEY });
    },
  });
}

export function useDeleteTES() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (idTES: number) => {
      await apiClient.delete(`api/TiempoEmpresaSala/${idTES}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TES_KEY });
    },
  });
}

// ---------------------------------------------------------------------------
// In-memory filter helpers (resolves M-06 — no duplicate requests)
// ---------------------------------------------------------------------------

/**
 * Find the TES record for a specific timer in a specific sala.
 */
export function findTESForTimerInSala(
  tesList: TES[],
  idTimer: number,
  idSala: number
): TES | undefined {
  return tesList.find((t) => t.idTimer === idTimer && t.idSala === idSala);
}

/**
 * Find the TES record for the currently active timer (from timerID socket event)
 * in the currently selected sala. Returns the empresa ID or null.
 */
export function getEmpresaForActiveTimer(
  tesList: TES[],
  idTimer: number,
  idSala: number
): number | null {
  return findTESForTimerInSala(tesList, idTimer, idSala)?.idEmpresa ?? null;
}

/**
 * Check whether a (timer, sala) combination already has a TES assignment.
 * Used for the uniqueness check before creating a new TES.
 */
export function hasTESForTimerSala(
  tesList: TES[],
  idTimer: number,
  idSala: number,
  excludeId?: number
): boolean {
  return tesList.some(
    (t) =>
      t.idTimer === idTimer &&
      t.idSala === idSala &&
      (excludeId === undefined || t.id !== excludeId)
  );
}
