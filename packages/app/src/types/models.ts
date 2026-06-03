/**
 * Domain types + Zod schemas for all API entities.
 * TypeScript strict — no any allowed.
 *
 * Resolves M-02 downstream: Zod parse throws on unexpected shape
 * so errors surface immediately rather than causing silent undefined access.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Sala
// ---------------------------------------------------------------------------

export const SalaSchema = z.object({
  idSala: z.number().int().positive(),
  nombreSala: z.string().min(1),
});

export type Sala = z.infer<typeof SalaSchema>;

export const SalaArraySchema = z.array(SalaSchema);

// ---------------------------------------------------------------------------
// Empresa
// ---------------------------------------------------------------------------

export const EmpresaSchema = z.object({
  idEmpresa: z.number().int().positive(),
  nombreEmpresa: z.string().min(1),
});

export type Empresa = z.infer<typeof EmpresaSchema>;

export const EmpresaArraySchema = z.array(EmpresaSchema);

// ---------------------------------------------------------------------------
// Categoria
// ---------------------------------------------------------------------------

export const CategoriaSchema = z.object({
  idCategoria: z.number().int().nonnegative(),
  categoria: z.string().min(1),
  /**
   * Duration in minutes (integer).
   * The backend stores and returns minutes as a number.
   * The UI converts to/from HH:mm using utils/time.ts.
   */
  duracion: z.number().int().positive(),
});

export type Categoria = z.infer<typeof CategoriaSchema>;

export const CategoriaArraySchema = z.array(CategoriaSchema);

// Body shapes for mutations
export type CreateCategoriaBody = Omit<Categoria, 'idCategoria'> & {
  idCategoria: 0;
};

export type UpdateCategoriaBody = Categoria;

// ---------------------------------------------------------------------------
// Temporizador
// ---------------------------------------------------------------------------

export const TemporizadorSchema = z.object({
  idTemporizador: z.number().int().nonnegative(),
  /**
   * ISO 8601 datetime string: "YYYY-MM-DDTHH:mm:ss"
   */
  inicio: z.string().min(1),
  /**
   * FK to Categoria. The backend accepts string from <select>.
   * We normalize to number on read, keep as number in the domain model.
   */
  idCategoria: z.coerce.number().int().positive(),
  pausa: z.boolean(),
});

export type Temporizador = z.infer<typeof TemporizadorSchema>;

export const TemporizadorArraySchema = z.array(TemporizadorSchema);

export type CreateTemporizadorBody = {
  idTemporizador: 0;
  inicio: string;
  idCategoria: number;
  pausa: false;
};

export type UpdateTemporizadorBody = {
  idTemporizador: number;
  inicio: string;
  idCategoria: number;
  pausa: false;
};

// ---------------------------------------------------------------------------
// TiempoEmpresaSala (TES) — pivot entity
// ---------------------------------------------------------------------------

export const TESSchema = z.object({
  id: z.number().int().positive(),
  idTimer: z.number().int().positive(),
  idEmpresa: z.number().int().positive(),
  idSala: z.number().int().positive(),
  /**
   * Currently always 1 — M-12 deuda conocida.
   */
  idEvento: z.number().int().positive(),
});

export type TES = z.infer<typeof TESSchema>;

export const TESArraySchema = z.array(TESSchema);

export type CreateTESBody = {
  id: 0;
  idTimer: number;
  idEmpresa: number;
  idSala: number;
  idEvento: 1;
};

// ---------------------------------------------------------------------------
// EventoActual — backend projection (read-only)
// ---------------------------------------------------------------------------

export const EventoActualSchema = z.object({
  empresa: z.string(),
  sala: z.string(),
  inicioTimer: z.string(),
  idCategoria: z.number().int().positive(),
  duracion: z.number().int().positive(),
  imagenEmpresa: z.string().optional(),
});

export type EventoActual = z.infer<typeof EventoActualSchema>;

export const EventoActualArraySchema = z.array(EventoActualSchema);

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const LoginResponseSchema = z.object({
  /** The JWT string is nested under the "response" key. */
  response: z.string().min(1),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// ---------------------------------------------------------------------------
// WebSocket event payloads (typed, not Zod — runtime is socket.io)
// ---------------------------------------------------------------------------

export interface SocketEvents {
  /** Server → client: which timer is currently active */
  timerID: (idTimer: number) => void;
  /** Server → client: remaining seconds for the active timer */
  envio: (seconds: number) => void;
}

export interface SocketEmitEvents {
  /** Notify all clients that timer/category data changed */
  syncData: () => void;
  /** Start event countdown */
  vamos: () => void;
  /** Emergency reset (admin only, guarded in UI) */
  start: () => void;
}
