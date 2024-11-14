
import winston from 'winston'
//import config from 'config'
import fs from 'fs-extra'

fs.ensureDirSync('log/');

export default winston.createLogger({
  transports: [
    new (winston.transports.Console)({
      format: winston.format.combine(
        //winston.format.align(),
        winston.format.colorize(),
        winston.format.simple(),
      ),
      level: 'silly'
    }),
    new (winston.transports.File)({
      filename: 'log/witsy-server.log',//config.get('log.filename'),
      level: 'debug',//config.get('log.level'),
      format: winston.format.combine(
        winston.format.align(),
        winston.format.timestamp(),
        winston.format.simple(),
      ),
      options: {
        flags: 'w'
      },
    }),
  ]
});
