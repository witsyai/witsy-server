import winston from 'winston'
import fs from 'fs-extra'

fs.ensureDirSync('./log/');

const colorizer = winston.format.colorize();

const logger = winston.createLogger({
  transports: [
    new (winston.transports.Console)({
      format: winston.format.combine(
        winston.format.printf(info => {
          const level = colorizer.colorize(info.level, `[${info.level.toUpperCase().padStart(7)}]`);
          const message = info.message;
          return `${level} ${message}`;
        })
      ),
      level: 'silly'
    }),
    new (winston.transports.File)({
      filename: 'log/witsy-server.log',
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.printf(info => {
          const timestamp = info.timestamp;
          const level = info.level.toUpperCase().padEnd(7);
          const message = info.message;
          return `[${timestamp}][${level}] ${message}`;
        }),
        winston.format.align()
      ),
      options: {
        flags: 'w'
      },
    }),
  ]
});

export const setLogLevel = (level: string) => {
  for (const transport of logger.transports) {
    transport.level = level;
  }
};

export default logger;
