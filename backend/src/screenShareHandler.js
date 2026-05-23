// screenShareHandler.js - Screen sharing signaling
export function initializeScreenShareHandlers(io, socket) {
  // Request screen capture
  socket.on('screen-share:start', async (data) => {
    const { roomId, userId, username } = data;
    
    // Notify peers that user started screen sharing
    socket.broadcast.to(roomId).emit('screen-share:user-started', {
      userId,
      username,
    });
  });

  // Stop screen sharing
  socket.on('screen-share:stop', (data) => {
    const { roomId, userId } = data;
    
    socket.broadcast.to(roomId).emit('screen-share:user-stopped', {
      userId,
    });
  });

  // Send screen share offer
  socket.on('screen-share:offer', (data) => {
    const { roomId, targetUserId, offer } = data;
    
    socket.to(targetUserId).emit('screen-share:offer', {
      from: socket.id,
      offer,
    });
  });

  // Send screen share answer
  socket.on('screen-share:answer', (data) => {
    const { targetUserId, answer } = data;
    
    socket.to(targetUserId).emit('screen-share:answer', {
      from: socket.id,
      answer,
    });
  });

  // ICE candidates
  socket.on('screen-share:ice-candidate', (data) => {
    const { targetUserId, candidate } = data;
    
    socket.to(targetUserId).emit('screen-share:ice-candidate', {
      from: socket.id,
      candidate,
    });
  });
}
