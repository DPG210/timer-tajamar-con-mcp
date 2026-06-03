/**
 * WebSocket singleton — resolves M-03.
 *
 * ES modules are evaluated once per JS runtime. This file exports a single
 * socket.io-client instance. Every import across the app receives the same
 * reference — there is exactly ONE WebSocket connection open.
 *
 * Import pattern in consumers:
 *   import { socket } from '@/socket';
 *   socket.on('timerID', handler);
 *   socket.emit('syncData');
 */

import { io, Socket } from 'socket.io-client';
import type { SocketEvents, SocketEmitEvents } from '../types/models';
import { ENV } from '../config/env';

/**
 * Typed socket instance.
 * The generic parameters enforce type safety for both emit and listen events.
 */
export const socket: Socket<SocketEvents, SocketEmitEvents> = io(ENV.SOCKET_URL, {
  withCredentials: true,
  /**
   * Reconnection is handled automatically by socket.io-client.
   * Default: reconnectionAttempts = Infinity, reconnectionDelay = 1000 ms.
   */
  autoConnect: true,
});

// Debug helpers — only active in development
if (import.meta.env.DEV) {
  socket.on('connect', () => {
    console.debug('[socket] connected', socket.id);
  });
  socket.on('disconnect', (reason) => {
    console.debug('[socket] disconnected', reason);
  });
  socket.on('connect_error', (err) => {
    console.debug('[socket] connection error', err.message);
  });
}
