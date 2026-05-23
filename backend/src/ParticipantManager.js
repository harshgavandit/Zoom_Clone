// ParticipantManager.js - Manage participant state and presence
export class ParticipantManager {
  constructor() {
    this.participants = new Map(); // userId -> participantData
    this.listeners = new Set();
  }

  addParticipant(userId, userData) {
    const participant = {
      userId,
      username: userData.username || 'Guest',
      avatar: userData.avatar || null,
      joinedAt: Date.now(),
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
      isSpeaking: false,
      role: userData.role || 'user',
      connectionQuality: 'good',
      lastSeen: Date.now(),
      metadata: {}
    };

    this.participants.set(userId, participant);
    this.notifyListeners('participant-added', participant);
    return participant;
  }

  removeParticipant(userId) {
    const participant = this.participants.get(userId);
    if (participant) {
      this.participants.delete(userId);
      this.notifyListeners('participant-removed', participant);
    }
  }

  updateParticipant(userId, updates) {
    const participant = this.participants.get(userId);
    if (participant) {
      Object.assign(participant, updates);
      participant.lastSeen = Date.now();
      this.notifyListeners('participant-updated', participant);
    }
  }

  getParticipant(userId) {
    return this.participants.get(userId);
  }

  getAllParticipants() {
    return Array.from(this.participants.values());
  }

  getParticipantCount() {
    return this.participants.size;
  }

  setMuted(userId, muted) {
    this.updateParticipant(userId, { isMuted: muted });
  }

  setVideoOff(userId, videoOff) {
    this.updateParticipant(userId, { isVideoOff: videoOff });
  }

  setScreenSharing(userId, sharing) {
    this.updateParticipant(userId, { isScreenSharing: sharing });
  }

  setSpeaking(userId, speaking) {
    this.updateParticipant(userId, { isSpeaking: speaking });
  }

  setConnectionQuality(userId, quality) {
    // quality: 'excellent', 'good', 'fair', 'poor'
    this.updateParticipant(userId, { connectionQuality: quality });
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  clear() {
    this.participants.clear();
    this.listeners.clear();
  }

  // Get participants sorted by criteria
  getSortedParticipants(sortBy = 'joinedAt') {
    const participants = this.getAllParticipants();
    
    switch (sortBy) {
      case 'speaking':
        return participants.sort((a, b) => {
          if (a.isSpeaking !== b.isSpeaking) {
            return a.isSpeaking ? -1 : 1;
          }
          return a.joinedAt - b.joinedAt;
        });
      
      case 'connectionQuality':
        const qualityOrder = { excellent: 0, good: 1, fair: 2, poor: 3 };
        return participants.sort((a, b) => {
          return qualityOrder[a.connectionQuality] - qualityOrder[b.connectionQuality];
        });
      
      case 'username':
        return participants.sort((a, b) => {
          return a.username.localeCompare(b.username);
        });
      
      default: // joinedAt
        return participants.sort((a, b) => a.joinedAt - b.joinedAt);
    }
  }

  // Get statistics
  getStats() {
    const participants = this.getAllParticipants();
    return {
      totalCount: participants.length,
      mutedCount: participants.filter(p => p.isMuted).length,
      videoOffCount: participants.filter(p => p.isVideoOff).length,
      screenSharingCount: participants.filter(p => p.isScreenSharing).length,
      speakingCount: participants.filter(p => p.isSpeaking).length,
      hostCount: participants.filter(p => p.role === 'host').length,
      avgConnectionQuality: this.getAverageConnectionQuality(participants)
    };
  }

  getAverageConnectionQuality(participants) {
    const qualityScores = { excellent: 3, good: 2, fair: 1, poor: 0 };
    const avg = participants.reduce((sum, p) => sum + (qualityScores[p.connectionQuality] || 0), 0) / participants.length;
    
    if (avg >= 2.5) return 'excellent';
    if (avg >= 1.5) return 'good';
    if (avg >= 0.5) return 'fair';
    return 'poor';
  }
}