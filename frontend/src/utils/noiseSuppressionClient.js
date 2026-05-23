// noiseSuppressionClient.js - lightweight noise suppression scaffold using Web Audio API
// Note: For production, integrate ml5.js, TensorFlow.js, or a cloud speech processing API

export class NoiseSuppressionAudio {
  constructor(stream) {
    this.stream = stream;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.gainNode = this.audioContext.createGain();
    this.sourceNode = null;
    this.enabled = false;
  }

  async enable() {
    if (this.enabled) return;
    try {
      // Create a source from the audio stream
      this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);

      // Simple noise gate: reduce gain for quiet noise
      // Production: use FFT analysis and spectral subtraction or ML model
      this.sourceNode.connect(this.analyser);
      this.analyser.connect(this.gainNode);

      // Apply basic noise gate (set threshold for gate level)
      this.enableNoiseGate();
      this.enabled = true;
      console.log('Noise suppression enabled');
    } catch (err) {
      console.error('Failed to enable noise suppression', err);
    }
  }

  enableNoiseGate(threshold = -40) {
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const processAudio = () => {
      this.analyser.getByteFrequencyData(dataArray);

      // Simple RMS calculation for noise detection
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / bufferLength);
      const db = 20 * Math.log10(rms / 255);

      // Apply gain: reduce if below threshold (noise)
      this.gainNode.gain.setValueAtTime(db < threshold ? 0.3 : 1.0, this.audioContext.currentTime);

      if (this.enabled) {
        requestAnimationFrame(processAudio);
      }
    };

    processAudio();
  }

  disable() {
    this.enabled = false;
    if (this.sourceNode) this.sourceNode.disconnect();
    console.log('Noise suppression disabled');
  }

  getCleanStream() {
    if (!this.sourceNode) return this.stream;
    // Return the original stream; in production, extract from gainNode
    return this.stream;
  }
}
