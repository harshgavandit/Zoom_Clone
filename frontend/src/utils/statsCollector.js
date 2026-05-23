// statsCollector.js - Real-time WebRTC stats collection
export class StatsCollector {
  constructor(peerConnection) {
    this.peerConnection = peerConnection;
    this.stats = {
      audio: { bytesReceived: 0, bytesSent: 0, packetsLost: 0, jitter: 0 },
      video: { bytesReceived: 0, bytesSent: 0, packetsLost: 0, framesDecoded: 0 },
      connection: { latency: 0, availableOutgoing: 0, availableIncoming: 0 },
    };
    this.previousStats = {};
  }

  async collectStats() {
    if (!this.peerConnection) return this.stats;

    try {
      const report = await this.peerConnection.getStats();
      const now = Date.now();

      report.forEach(stats => {
        // Inbound RTP (audio)
        if (stats.type === 'inbound-rtp' && stats.mediaType === 'audio') {
          const prevBytes = this.previousStats[stats.id]?.bytesReceived || 0;
          this.stats.audio.bytesReceived = stats.bytesReceived;
          this.stats.audio.packetsLost = stats.packetsLost || 0;
          this.stats.audio.jitter = (stats.jitter * 1000).toFixed(2); // Convert to ms
        }

        // Inbound RTP (video)
        if (stats.type === 'inbound-rtp' && stats.mediaType === 'video') {
          this.stats.video.bytesReceived = stats.bytesReceived;
          this.stats.video.packetsLost = stats.packetsLost || 0;
          this.stats.video.framesDecoded = stats.framesDecoded || 0;
        }

        // Outbound RTP (audio)
        if (stats.type === 'outbound-rtp' && stats.mediaType === 'audio') {
          this.stats.audio.bytesSent = stats.bytesSent;
        }

        // Outbound RTP (video)
        if (stats.type === 'outbound-rtp' && stats.mediaType === 'video') {
          this.stats.video.bytesSent = stats.bytesSent;
        }

        // Connection state
        if (stats.type === 'candidate-pair' && stats.state === 'succeeded') {
          this.stats.connection.latency = stats.currentRoundTripTime * 1000; // Convert to ms
          this.stats.connection.availableOutgoing = stats.availableOutgoingBitrate;
          this.stats.connection.availableIncoming = stats.availableIncomingBitrate;
        }
      });

      this.previousStats = Object.fromEntries(
        Array.from(report).map(s => [s.id, s])
      );

      return this.stats;
    } catch (err) {
      console.error('Stats collection error:', err);
      return this.stats;
    }
  }

  // Calculate bitrate (Kbps)
  calculateBitrate(bytesDelta, timeDelta) {
    if (timeDelta === 0) return 0;
    return (bytesDelta * 8) / (timeDelta / 1000) / 1000;
  }

  reset() {
    this.previousStats = {};
  }
}
