function initSocket(io) {
  io.on('connection', (socket) => {
    console.log('[Socket.IO] Client connected:', socket.id);
    socket.on('disconnect', () => {
      console.log('[Socket.IO] Client disconnected:', socket.id);
    });
  });
}

module.exports = { initSocket };
