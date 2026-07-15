let socket;

export function getSocket() {
  if (typeof io === 'undefined') {
    return {
      on() { return this; },
      off() { return this; },
      emit() { return this; },
    };
  }
  if (!socket) {
    socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}
