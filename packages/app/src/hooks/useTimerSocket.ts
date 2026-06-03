/**
 * Hook that wires the socket singleton to TanStack Query cache invalidation
 * and the timerSocketStore. Mount once at app root (App.tsx) — mounting in
 * multiple components simultaneously would register duplicate listeners.
 *
 * State is exposed via useTimerSocketStore, not returned from this hook.
 *
 * NOTE: the "envio" event (backend countdown) is intentionally NOT handled here.
 * The backend counts from when "vamos" was pressed, not from the scheduled inicio,
 * making it unreliable as a display source. Remaining time is calculated
 * client-side in useCalculatedRemainingSeconds from inicio + duracion.
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socket } from '../socket';
import { TES_KEY } from './useTES';
import { useTimerSocketStore } from '../stores/timerSocketStore';

export function useTimerSocket(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    useTimerSocketStore.setState({ isConnected: socket.connected });

    function onConnect() {
      useTimerSocketStore.setState({ isConnected: true });
    }
    function onDisconnect() {
      useTimerSocketStore.setState({ isConnected: false });
    }
    function onTimerId(idTimer: number) {
      useTimerSocketStore.setState({ activeTimerId: idTimer });
      void queryClient.invalidateQueries({ queryKey: TES_KEY });
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('timerID', onTimerId);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('timerID', onTimerId);
    };
  }, [queryClient]);
}
