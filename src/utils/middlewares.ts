
import { Request, Response, NextFunction } from 'express';
import Database from './database';

export interface AuthedRequest extends Request {
  accessCode?: string
  isAdmin?: boolean
  db?: Database
}

// middleware to check for X-Access-Code header
export const accessCodeMiddleware = async (req: AuthedRequest, res: Response, next: NextFunction): Promise<void> => {
  
  // init
  req.isAdmin = false;

  // fisrt check if we have a client id
  const accessCode = req.header('x-access-code') || req.header('x-clientid');
  if (accessCode) {
    let valid = (accessCode == process.env.SUPERUSER_ACCESS_CODE || accessCode == process.env.AUTHORIZED_CLIENT_ID);
    if (!valid) {
      const db = await Database.getInstance();
      valid = await db.isValidAccessCode(accessCode);
    }
    if (valid) {
      req.accessCode = accessCode;
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

  // too bad
  res.status(401).json({ error: 'X-Access-Code header is missing or invalid and no custom API keys provided' });
};

// middleware to check for X-Access-Code header
export const adminMiddleware = async (req: AuthedRequest, res: Response, next: NextFunction): Promise<void> => {
  
  // fisrt check if we have a client id
  const accessCode = req.header('x-access-code');
  if (accessCode === process.env.ADMIN_ACCESS_CODE) {
    req.accessCode = accessCode;
    req.isAdmin = true;
    next();
    return;
  }

  // too bad
  res.status(401).json({ error: 'Error while authenticating' });
};

export const databaseMiddleware = async (req: AuthedRequest, res: Response, next: NextFunction): Promise<void> => {
  req.db = await Database.getInstance();
  next();
};
