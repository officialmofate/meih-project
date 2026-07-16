const { Server } = require('socket.io');

let io = null;

function initWebsocket(server) {
  io = new Server(server, {
    cors: { origin: '*', credentials: true },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join', (room) => {
      socket.join(room);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  console.log('WebSocket initialized');
}

function getIO() {
  return io;
}

module.exports = { initWebsocket, getIO };
