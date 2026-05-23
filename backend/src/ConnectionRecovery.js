// ConnectionRecovery.js - Auto-reconnect with exponential backoff
export class ConnectionRecovery {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 5;
    this.initialDelay = options.initialDelay || 1000; // 1 second
    this.maxDelay = options.maxDelay || 30000; // 30 seconds
    this.backoffMultiplier = options.backoffMultiplier || 2;
    
    this.retryCount = 0;
    this.isAttemptingReconnect = false;
    this.lastError = null;
    this.reconnectCallbacks = [];
  }

  calculateDelay() {
    const delay = Math.min(
      this.initialDelay * Math.pow(this.backoffMultiplier, this.retryCount),
      this.maxDelay
    );
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return delay + jitter;
  }

  async attemptReconnect(reconnectFunction) {
    if (this.retryCount >= this.maxRetries) {
      console.error('Max reconnection attempts reached');
      this.notifyCallbacks('max_retries_reached');
      return false;
    }

    if (this.isAttemptingReconnect) {
      return false;
    }

    this.isAttemptingReconnect = true;
    const delay = this.calculateDelay();

    console.log(`Reconnecting in ${Math.round(delay)}ms (attempt ${this.retryCount + 1}/${this.maxRetries})`);
    this.notifyCallbacks('attempting_reconnect', {
      attempt: this.retryCount + 1,
      maxAttempts: this.maxRetries,
      delayMs: delay
    });

    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          await reconnectFunction();
          console.log('Successfully reconnected');
          this.reset();
          this.notifyCallbacks('reconnected');
          this.isAttemptingReconnect = false;
          resolve(true);
        } catch (error) {
          console.error('Reconnection failed:', error);
          this.lastError = error;
          this.retryCount++;
          this.isAttemptingReconnect = false;
          
          if (this.retryCount < this.maxRetries) {
            this.notifyCallbacks('reconnect_failed', {
              attempt: this.retryCount,
              maxAttempts: this.maxRetries,
              error: error.message
            });
            resolve(false);
          } else {
            this.notifyCallbacks('reconnect_failed_final', {
              error: error.message
            });
            resolve(false);
          }
        }
      }, delay);
    });
  }

  reset() {
    this.retryCount = 0;
    this.isAttemptingReconnect = false;
    this.lastError = null;
  }

  onReconnect(callback) {
    this.reconnectCallbacks.push(callback);
    return () => {
      this.reconnectCallbacks = this.reconnectCallbacks.filter(cb => cb !== callback);
    };
  }

  notifyCallbacks(event, data) {
    this.reconnectCallbacks.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Callback error:', error);
      }
    });
  }

  getStatus() {
    return {
      isAttemptingReconnect: this.isAttemptingReconnect,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      lastError: this.lastError ? this.lastError.message : null,
      nextDelayMs: this.isAttemptingReconnect ? this.calculateDelay() : null
    };
  }
}