// General purpose logging utility
// Provides structured logging with debug levels

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  VERBOSE = 4,
}

interface LogConfig {
  level: LogLevel
  prefix: string
  enableTimestamp: boolean
}

class Logger {
  private config: LogConfig

  constructor(config: Partial<LogConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      prefix: "[Tovo]",
      enableTimestamp: true,
      ...config,
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.level
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    data?: any
  ): [string, any?] {
    const timestamp = this.config.enableTimestamp
      ? new Date().toISOString().slice(11, 23)
      : ""

    const levelStr = LogLevel[level]
    const prefix = `${this.config.prefix}${timestamp ? ` [${timestamp}]` : ""} [${levelStr}]`

    return data !== undefined
      ? [`${prefix} ${message}`, data]
      : [`${prefix} ${message}`]
  }

  error(message: string, data?: any) {
    if (this.shouldLog(LogLevel.ERROR)) {
      const [msg, logData] = this.formatMessage(LogLevel.ERROR, message, data)
      logData !== undefined ? console.error(msg, logData) : console.error(msg)
    }
  }

  warn(message: string, data?: any) {
    if (this.shouldLog(LogLevel.WARN)) {
      const [msg, logData] = this.formatMessage(LogLevel.WARN, message, data)
      logData !== undefined ? console.warn(msg, logData) : console.warn(msg)
    }
  }

  info(message: string, data?: any) {
    if (this.shouldLog(LogLevel.INFO)) {
      const [msg, logData] = this.formatMessage(LogLevel.INFO, message, data)
      logData !== undefined ? console.log(msg, logData) : console.log(msg)
    }
  }

  debug(message: string, data?: any) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const [msg, logData] = this.formatMessage(LogLevel.DEBUG, message, data)
      logData !== undefined ? console.log(msg, logData) : console.log(msg)
    }
  }

  verbose(message: string, data?: any) {
    if (this.shouldLog(LogLevel.VERBOSE)) {
      const [msg, logData] = this.formatMessage(LogLevel.VERBOSE, message, data)
      logData !== undefined ? console.log(msg, logData) : console.log(msg)
    }
  }

  setLevel(level: LogLevel) {
    this.config.level = level
  }

  getLevel(): LogLevel {
    return this.config.level
  }
}

// Create default logger instances
export const wasmLogger = new Logger({
  prefix: "[TOVO WASM]",
  level:
    process.env.NODE_ENV === "development" ? LogLevel.DEBUG : LogLevel.INFO,
})

export const audioLogger = new Logger({
  prefix: "[TOVO Audio]",
  level:
    process.env.NODE_ENV === "development" ? LogLevel.DEBUG : LogLevel.INFO,
})

export const modelLogger = new Logger({
  prefix: "[TOVO Model]",
  level:
    process.env.NODE_ENV === "development" ? LogLevel.DEBUG : LogLevel.INFO,
})

// Default logger instance
export const logger = new Logger({
  prefix: "[Tovo]",
  level:
    process.env.NODE_ENV === "development" ? LogLevel.DEBUG : LogLevel.INFO,
})

// Export the Logger class as well
export { Logger }
