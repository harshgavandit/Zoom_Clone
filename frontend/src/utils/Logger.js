// Logger.js - Centralized logging system
export class Logger {
  constructor(name = 'App', isDev = process.env.NODE_ENV === 'development') {
    this.name = name;
    this.isDev = isDev;
    this.logs = [];
    this.maxLogs = 1000;
  }

  // Log levels: DEBUG, INFO, WARN, ERROR, CRITICAL
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      name: this.name,
      message,
      data,
    };

    // Store in memory
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    const prefix = `[${timestamp}] [${this.name}] [${level}]`;
    const style = this.getStyleForLevel(level);

    if (this.isDev) {
      if (data) {
        console.log(`%c${prefix} ${message}`, style, data);
      } else {
        console.log(`%c${prefix} ${message}`, style);
      }
    }

    // Send critical errors to server (optional)
    if (level === 'ERROR' || level === 'CRITICAL') {
      this.reportError(logEntry);
    }
  }

  debug(message, data) {
    this.log('DEBUG', message, data);
  }

  info(message, data) {
    this.log('INFO', message, data);
  }

  warn(message, data) {
    this.log('WARN', message, data);
  }

  error(message, data) {
    this.log('ERROR', message, data);
  }

  critical(message, data) {
    this.log('CRITICAL', message, data);
  }

  getStyleForLevel(level) {
    const styles = {
      DEBUG: 'color: #00d4ff; font-weight: bold;',
      INFO: 'color: #00ff88; font-weight: bold;',
      WARN: 'color: #ff9500; font-weight: bold;',
      ERROR: 'color: #ff6b6b; font-weight: bold;',
      CRITICAL: 'color: #ff1744; font-weight: bold; background: #ff0000; padding: 2px 4px;',
    };
    return styles[level] || 'color: #fff;';
  }

  getLogs(filter = null) {
    if (!filter) return this.logs;

    return this.logs.filter(log => {
      if (filter.level && log.level !== filter.level) return false;
      if (filter.name && log.name !== filter.name) return false;
      if (filter.message && !log.message.includes(filter.message)) return false;
      return true;
    });
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }

  reportError(logEntry) {
    // Send to server for tracking
    if (navigator.sendBeacon) {
      const data = new FormData();
      data.append('log', JSON.stringify(logEntry));
      navigator.sendBeacon('/api/v1/logs', data);
    }
  }
}

// Global logger instance
export const logger = new Logger('Zoom-Clone');