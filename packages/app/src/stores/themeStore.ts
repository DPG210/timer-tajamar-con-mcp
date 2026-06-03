import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const THEME_STORAGE_KEY = 'theme';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: false,
      toggle: () => {
        const next = !get().isDark;
        set({ isDark: next });
        document.documentElement.classList.toggle('dark', next);
      },
    }),
    { name: THEME_STORAGE_KEY }
  )
);

export function initTheme() {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw) {
      const { state } = JSON.parse(raw) as { state: { isDark: boolean } };
      document.documentElement.classList.toggle('dark', state.isDark);
    }
  } catch {
    // ignore parse errors
  }
}
