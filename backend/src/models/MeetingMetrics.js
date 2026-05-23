// models/MeetingMetrics.js - MongoDB meeting metrics schema
import mongoose from 'mongoose';

const meetingMetricsSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
  },
  duration: {
    type: Number, // milliseconds
    default: 0,
  },
  engagementMetrics: {
    chatMessages: {
      type: Number,
      default: 0,
    },
    reactions: {
      type: Number,
      default: 0,
    },
    screenShares: {
      type: Number,
      default: 0,
    },
    handRaises: {
      type: Number,
      default: 0,
    },
    screenShareDuration: {
      type: Number,
      default: 0,
    },
  },
  qualityMetrics: {
    audioDropouts: {
      type: Number,
      default: 0,
    },
    videoDropouts: {
      type: Number,
      default: 0,
    },
    avgLatency: {
      type: Number,
      default: 0,
    },
    avgBitrate: {
      type: Number,
      default: 0,
    },
    packetLossEvents: {
      type: Number,
      default: 0,
    },
  },
  participantCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// TTL index: auto-delete metrics older than 30 days
meetingMetricsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model('MeetingMetrics', meetingMetricsSchema);
