// models/Recording.js - MongoDB recording schema
import mongoose from 'mongoose';

const recordingSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true,
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    default: 0, // bytes
  },
  duration: {
    type: Number,
    default: 0, // seconds
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['recording', 'processing', 'completed', 'failed'],
    default: 'recording',
  },
  s3Url: {
    type: String,
    default: null,
  },
  participants: [{
    userId: String,
    username: String,
    duration: Number, // seconds present
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  },
});

// Auto-delete expired recordings
recordingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Recording', recordingSchema);
