/**
 * TanStack Query hooks for Empresa CRUD.
 * Same patterns as useSalas — M-04, M-07 fixes applied.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { EmpresaArraySchema, type Empresa } from '../types/models';

export const EMPRESAS_KEY = ['empresas'] as const;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useEmpresas() {
  return useQuery({
    queryKey: EMPRESAS_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<unknown>('api/empresas');
      return EmpresaArraySchema.parse(data);
    },
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateEmpresa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nombreEmpresa: string) => {
      await apiClient.post(`api/empresas/createempresa/${encodeURIComponent(nombreEmpresa)}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: EMPRESAS_KEY });
    },
  });
}

export function useUpdateEmpresa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      idEmpresa,
      nombreEmpresa,
    }: {
      idEmpresa: number;
      nombreEmpresa: string;
    }) => {
      await apiClient.put(
        `api/empresas/updateempresa/${idEmpresa}/${encodeURIComponent(nombreEmpresa)}`
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: EMPRESAS_KEY });
    },
  });
}

export function useDeleteEmpresa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ idEmpresa, tesIds }: { idEmpresa: number; tesIds: number[] }) => {
      await Promise.all(tesIds.map((id) => apiClient.delete(`api/TiempoEmpresaSala/${id}`)));
      await apiClient.delete(`api/empresas/${idEmpresa}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: EMPRESAS_KEY });
      void queryClient.invalidateQueries({ queryKey: ['tes'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Client-side helpers
// ---------------------------------------------------------------------------

export function getEmpresaNombre(empresas: Empresa[], idEmpresa: number): string {
  return empresas.find((e) => e.idEmpresa === idEmpresa)?.nombreEmpresa ?? '';
}

export function isEmpresaNombreUnique(
  empresas: Empresa[],
  nombre: string,
  excludeId?: number
): boolean {
  const normalized = nombre.trim().toLowerCase();
  return !empresas.some(
    (e) =>
      e.nombreEmpresa.toLowerCase() === normalized &&
      (excludeId === undefined || e.idEmpresa !== excludeId)
  );
}

export function getTesIdsForEmpresa(
  tesList: { id: number; idEmpresa: number }[],
  idEmpresa: number
): number[] {
  return tesList.filter((t) => t.idEmpresa === idEmpresa).map((t) => t.id);
}
