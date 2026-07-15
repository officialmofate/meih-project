import { getSocket } from '../utils/websocket.js';

export function initChat(threadId, onMessage) {
  const socket = getSocket();
  socket.emit('chat:join', { threadId });
  socket.on('chat:message', onMessage);
  return {
    send(message) {
      socket.emit('chat:message', { threadId, message });
    },
    destroy() {
      socket.off('chat:message', onMessage);
    },
  };
}
