
import { Request, Response, NextFunction } from 'express';
import Database from './database';
import Configuration from './config';
import { getUserByToken } from '../user/controller';
import { timingSafeEqual } from 'crypto';
import User from '../user';
import logger from './logger';

const configuration = new Configuration();

export type Role = 'admin' | 'superuser' | 'user';

export interface AuthedRequest extends Request {
  configuration?: Configuration
  userToken?: string
  role?: Role
  user?: User
  db?: Database
}

export const configurationMiddleware = (req: AuthedRequest, res: Response, next: NextFunction): void => { 
  req.configuration = configuration;
  next();
};

const compare = (token1: string|undefined, token2: string|undefined): boolean => {
  if (!token1 || !token2) return false;
  return timingSafeEqual(Buffer.from(token1), Buffer.from(token2));
}

// middleware to check for X-User-Token header
export const userTokenMiddleware = async (req: AuthedRequest, res: Response, next: NextFunction): Promise<void> => {
  
  // fisrt check if we have a client id
  if (req.userToken) {
    let valid = (compare(req.userToken, process.env.SUPERUSER_TOKEN) || compare(req.userToken, process.env.AUTHORIZED_CLIENT_ID));
    if (valid) {
      req.role = 'superuser';
    } else {
      const db = await Database.getInstance();
      const user = await getUserByToken(db, req.userToken);
      if (user != null) {
        valid = true;
        req.role = 'user';
        req.user = user;
      }
    }
    if (valid) {
      next();
      return;
    }
  }

  // we need at least one api key
  if (req.body.openaiKey ||
      req.body.anthropicKey ||
      req.body.mistralaiKey ||
      req.body.googleKey ||
      req.body.xaiKey ||
      req.body.huggingfaceKey ||
      req.body.groqKey ||
      req.body.cerebrasKey) {
    next();
    return;
  } 

  // log
  logger.warn(`Unauthorized access. User token: "${req.userToken}". IP address: ${req.ip}`);

  // too bad
  res.status(401).json({ error: 'Authorization header is missing or invalid and no custom API keys provided' });
};

// middleware to check for X-User-Token header
export const adminMiddleware = async (req: AuthedRequest, res: Response, next: NextFunction): Promise<void> => {
  
  // fisrt check user token from auth bearer
  if (compare(req.userToken, process.env.ADMIN_TOKEN)) {
    req.role = 'admin';
    next();
    return;
  }

  // log
  logger.warn(`Unauthorized access to admin endpoint. User token: "${req.userToken}". IP address: ${req.ip}`);

  // too bad
  res.status(401).json({ error: 'Error while authenticating' });
};

export const databaseMiddleware = async (req: AuthedRequest, res: Response, next: NextFunction): Promise<void> => {
  req.db = await Database.getInstance();
  next();
};
