import { create } from 'zustand';

interface TimerSocketState {
  activeTimerId: number | null;
  isConnected: boolean;
}

export const useTimerSocketStore = create<TimerSocketState>()(() => ({
  activeTimerId: null,
  isConnected: false,
}));
