const { Server } = require('socket.io');
const { verify } = require('../utils/jwt');

function initWebsocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        socket.user = verify(token);
      } catch {
        // allow anonymous connections for public voting/leaderboard
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    socket.on('chat:join', ({ threadId }) => socket.join(`chat:${threadId}`));
    socket.on('chat:message', ({ threadId, message }) => {
      io.to(`chat:${threadId}`).emit('chat:message', {
        threadId,
        message,
        senderId: socket.user?.id ?? 'anonymous',
        sentAt: new Date().toISOString(),
      });
    });

    socket.on('leaderboard:subscribe', ({ competitionId }) => socket.join(`leaderboard:${competitionId}`));
  });

  return io;
}

function broadcastLeaderboardUpdate(io, competitionId, rows) {
  io.to(`leaderboard:${competitionId}`).emit('leaderboard:update', rows);
}

module.exports = { initWebsocket, broadcastLeaderboardUpdate };
