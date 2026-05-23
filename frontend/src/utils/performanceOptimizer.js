// performanceOptimizer.js - Bandwidth and quality optimization
export class PerformanceOptimizer {
  constructor(mediaConstraints = {}) {
    this.mediaConstraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        ...mediaConstraints.video,
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        ...mediaConstraints.audio,
      },
    };
    this.currentBitrate = 0;
    this.networkQuality = 'good';
  }

  // Adaptive bitrate based on network conditions
  adaptBitrate(stats) {
    const { availableOutgoing, availableIncoming, latency } = stats.connection;
    
    if (!availableOutgoing) return this.mediaConstraints;

    const bitrateMbps = availableOutgoing / 1024 / 1024;
    this.currentBitrate = bitrateMbps;

    // Determine quality based on bitrate and latency
    if (bitrateMbps > 2.5 && latency < 80) {
      this.networkQuality = 'excellent';
      return { ...this.mediaConstraints, video: { ...this.mediaConstraints.video, width: { ideal: 1920 }, height: { ideal: 1080 } } };
    } else if (bitrateMbps > 1.5 && latency < 120) {
      this.networkQuality = 'good';
      return { ...this.mediaConstraints, video: { ...this.mediaConstraints.video, width: { ideal: 1280 }, height: { ideal: 720 } } };
    } else if (bitrateMbps > 0.8 && latency < 200) {
      this.networkQuality = 'fair';
      return { ...this.mediaConstraints, video: { ...this.mediaConstraints.video, width: { ideal: 640 }, height: { ideal: 480 } } };
    } else {
      this.networkQuality = 'poor';
      return { ...this.mediaConstraints, video: { ...this.mediaConstraints.video, width: { ideal: 320 }, height: { ideal: 240 } } };
    }
  }

  // Optimize CPU usage by adjusting frame rate
  optimizeFrameRate(stats) {
    const { latency, availableOutgoing } = stats.connection;
    const bitrateMbps = (availableOutgoing || 0) / 1024 / 1024;

    if (bitrateMbps < 0.5 || latency > 300) {
      return 15; // Low frame rate for poor connections
    } else if (bitrateMbps < 1 || latency > 150) {
      return 24; // Standard frame rate
    } else {
      return 30; // High frame rate for good connections
    }
  }

  // Get optimization recommendations
  getRecommendations(stats) {
    const recommendations = [];

    if (stats.connection.latency > 150) {
      recommendations.push({
        type: 'warning',
        message: 'High latency detected. Consider closing other network applications.',
      });
    }

    if (stats.video.packetsLost > 50) {
      recommendations.push({
        type: 'warning',
        message: 'Packet loss detected. Network quality may be unstable.',
      });
    }

    if (this.currentBitrate < 1) {
      recommendations.push({
        type: 'critical',
        message: 'Limited bandwidth available. Video resolution has been reduced automatically.',
      });
    }

    if (stats.audio.jitter > 100) {
      recommendations.push({
        type: 'warning',
        message: 'Audio jitter detected. Consider using a wired connection.',
      });
    }

    return recommendations;
  }

  // Performance score (0-100)
  calculatePerformanceScore(stats) {
    let score = 100;

    // Deduct for latency
    if (stats.connection.latency > 100) {
      score -= Math.min(30, (stats.connection.latency - 100) / 5);
    }

    // Deduct for packet loss
    score -= (stats.video.packetsLost || 0) * 0.5;

    // Deduct for jitter
    if (stats.audio.jitter > 50) {
      score -= Math.min(20, (stats.audio.jitter - 50) / 5);
    }

    // Bonus for stable connection
    if (stats.connection.latency < 50 && (stats.video.packetsLost || 0) === 0) {
      score = Math.min(100, score + 5);
    }

    return Math.max(0, Math.round(score));
  }
}
