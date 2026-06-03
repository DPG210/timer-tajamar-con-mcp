/**
 * UI store — Zustand.
 * Holds client-side UI state that must survive navigation:
 *   - idSalaActiva: the currently selected sala in TimerView.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  idSalaActiva: number | null;
  setIdSalaActiva: (id: number) => void;
  clearIdSalaActiva: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      idSalaActiva: null,
      setIdSalaActiva: (id: number) => set({ idSalaActiva: id }),
      clearIdSalaActiva: () => set({ idSalaActiva: null }),
    }),
    {
      name: 'ui-store',
      // Only persist sala selection — user should not have to re-select after refresh
      partialize: (state) => ({ idSalaActiva: state.idSalaActiva }),
    }
  )
);
