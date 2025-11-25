/**
 * Logger utility for the SYMBI Symphony platform
 */

import { createLogger, format, transports } from 'winston';

export interface LogContext {
  [key: string]: any;
}

export class Logger {
  private logger: any;

  constructor(service: string, context?: LogContext) {
    this.logger = createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      defaultMeta: { service, ...context },
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple()
          )
        })
      ]
    });
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.logger.error(message, { error: error?.stack, ...context });
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, context);
  }
}

export const logger = new Logger('SYMBI-Symphony');