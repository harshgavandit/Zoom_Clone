// chatHandler.js - Socket.IO chat with MongoDB persistence
import { ChatMessage } from './models/Message.js';

const MESSAGE_HISTORY_LIMIT = 50;

export function initializeChatHandlers(io, socket) {
  // Send chat message
  socket.on('chat:message', async (data) => {
    const { roomId, userId, username, message, timestamp } = data;
    
    if (!message || message.trim().length === 0) return;

    const msgData = {
      roomId,
      userId,
      username,
      message: message.substring(0, 500), // Limit to 500 chars
      timestamp: timestamp || Date.now(),
      id: `${userId}-${Date.now()}`
    };

    // Store in MongoDB
    try {
      const chatMsg = new ChatMessage(msgData);
      await chatMsg.save();
      
      // Broadcast to all users in room
      io.to(roomId).emit('chat:new-message', msgData);
    } catch (err) {
      console.error('Chat message error', err);
      socket.emit('chat:error', { message: 'Failed to send message' });
    }
  });

  // Reaction (emoji)
  socket.on('chat:reaction', (data) => {
    const { roomId, userId, username, emoji, timestamp } = data;
    
    if (!['👍', '❤️', '😂', '🎉', '🔥'].includes(emoji)) return;

    const reaction = {
      userId,
      username,
      emoji,
      timestamp: timestamp || Date.now()
    };

    io.to(roomId).emit('chat:reaction', reaction);
  });

  // Get chat history
  socket.on('chat:history', async (roomId) => {
    try {
      const messages = await ChatMessage.find({ roomId })
        .sort({ timestamp: -1 })
        .limit(MESSAGE_HISTORY_LIMIT)
        .exec();
      
      const parsed = messages.map(m => ({
        userId: m.userId,
        username: m.username,
        message: m.message,
        timestamp: m.timestamp,
        id: m.id
      })).reverse();
      
      socket.emit('chat:history', parsed);
    } catch (err) {
      console.error('Chat history error', err);
      socket.emit('chat:history', []);
    }
  });

  // Clear chat (host only)
  socket.on('chat:clear', async (roomId) => {
    try {
      await ChatMessage.deleteMany({ roomId });
      io.to(roomId).emit('chat:cleared');
    } catch (err) {
      console.error('Chat clear error', err);
    }
  });
}
