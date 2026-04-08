import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    const msg = stack ? `${message}\n${stack}` : message;
    return `[${timestamp}] ${level.toUpperCase()}: ${msg}`;
  })
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxFiles: 5,
      maxsize: 10485760, // 10MB
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxFiles: 5,
      maxsize: 10485760,
    }),
  ],
});
