// meetingInsights.js - Real-time meeting analytics and insights (MongoDB-based)
import MeetingMetrics from './models/MeetingMetrics.js';

export class MeetingInsights {
  constructor(roomId) {
    this.roomId = roomId;
    this.startTime = Date.now();
    this.participantData = new Map();
    this.engagementMetrics = {
      chatMessages: 0,
      reactions: 0,
      screenShares: 0,
      handRaises: 0,
      screenShareDuration: 0,
    };
    this.qualityMetrics = {
      audioDropouts: 0,
      videoDropouts: 0,
      avgLatency: 0,
      avgBitrate: 0,
      packetLossEvents: 0,
    };
  }

  async trackParticipant(userId, username, joinTime) {
    this.participantData.set(userId, {
      username,
      joinTime,
      duration: 0,
      messages: 0,
      reactions: 0,
      screenShareDuration: 0,
      speakingTime: 0,
      audioMutedTime: 0,
      videoOffTime: 0,
      avgBitrate: 0,
      avgLatency: 0,
    });

    await this.persistMetrics();
  }

  async recordChatMessage(userId) {
    this.engagementMetrics.chatMessages++;
    const data = this.participantData.get(userId);
    if (data) data.messages++;
    await this.persistMetrics();
  }

  async recordReaction(userId) {
    this.engagementMetrics.reactions++;
    const data = this.participantData.get(userId);
    if (data) data.reactions++;
    await this.persistMetrics();
  }

  async recordScreenShare(userId, duration) {
    this.engagementMetrics.screenShares++;
    this.engagementMetrics.screenShareDuration += duration;
    const data = this.participantData.get(userId);
    if (data) data.screenShareDuration += duration;
    await this.persistMetrics();
  }

  async recordAudioMetrics(userId, latency, bitrate, packetLoss) {
    const data = this.participantData.get(userId);
    if (data) {
      data.avgLatency = (data.avgLatency + latency) / 2;
      data.avgBitrate = (data.avgBitrate + bitrate) / 2;
    }
    this.qualityMetrics.avgLatency = (this.qualityMetrics.avgLatency + latency) / 2;
    this.qualityMetrics.avgBitrate = (this.qualityMetrics.avgBitrate + bitrate) / 2;
    if (packetLoss > 0) this.qualityMetrics.packetLossEvents++;
    await this.persistMetrics();
  }

  async persistMetrics() {
    try {
      const metricsData = {
        roomId: this.roomId,
        startTime: this.startTime,
        duration: Date.now() - this.startTime,
        engagementMetrics: this.engagementMetrics,
        qualityMetrics: this.qualityMetrics,
        participantCount: this.participantData.size,
      };

      await MeetingMetrics.findOneAndUpdate(
        { roomId: this.roomId },
        metricsData,
        { upsert: true, new: true }
      );
    } catch (err) {
      console.error('Failed to persist metrics:', err);
    }
  }

  async generateSummary() {
    const duration = (Date.now() - this.startTime) / 60000; // minutes
    const totalMessages = this.engagementMetrics.chatMessages;
    const avgMessagesPerMinute = (totalMessages / duration).toFixed(2);
    
    const engagementScore = Math.min(
      100,
      (totalMessages * 5 +
        this.engagementMetrics.reactions * 2 +
        this.engagementMetrics.screenShares * 15 +
        this.engagementMetrics.handRaises * 10) / this.participantData.size
    );

    const qualityScore = Math.min(
      100,
      100 - this.qualityMetrics.packetLossEvents * 5
    );

    return {
      duration: Math.round(duration),
      participantCount: this.participantData.size,
      totalMessages,
      avgMessagesPerMinute: parseFloat(avgMessagesPerMinute),
      totalReactions: this.engagementMetrics.reactions,
      screenShares: this.engagementMetrics.screenShares,
      engagementScore: Math.round(engagementScore),
      qualityScore: Math.round(qualityScore),
      overallScore: Math.round((engagementScore + qualityScore) / 2),
      keyInsights: [
        totalMessages > 10 ? '✨ Highly interactive meeting' : '📊 Standard engagement level',
        this.qualityMetrics.packetLossEvents === 0 ? '⚡ Excellent connection quality' : '⚠️ Some connection issues detected',
        this.engagementMetrics.screenShares > 2 ? '📺 Multiple presentations shared' : '📄 Standard presentation format',
      ],
      recommendedActions: [
        engagementScore < 40 ? 'Consider using breakout rooms to boost participation' : null,
        qualityScore < 70 ? 'Network quality needs improvement - check bandwidth' : null,
        this.participantData.size > 20 ? 'Large meeting - consider using waiting room' : null,
      ].filter(Boolean),
    };
  }
}

export default MeetingInsights;
