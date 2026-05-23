// models/Room.js - MongoDB room schema
import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  roomId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  locked: {
    type: Boolean,
    default: false,
  },
  maxParticipants: {
    type: Number,
    default: null, // null = unlimited
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: null, // null = never expires
  },
});

// Auto-delete expired rooms
roomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Room', roomSchema);
