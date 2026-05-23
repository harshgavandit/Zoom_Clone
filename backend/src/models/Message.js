// models/Message.js - MongoDB chat message schema (optional, if persisting chat long-term)
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
    maxlength: 500,
  },
  messageType: {
    type: String,
    enum: ['text', 'emoji', 'system'],
    default: 'text',
  },
  id: {
    type: String,
  },
  timestamp: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// TTL index: auto-delete messages older than 7 days
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

const Message = mongoose.model('Message', messageSchema);
const ChatMessage = mongoose.model('ChatMessage', messageSchema);

export { Message, ChatMessage };
export default Message;
