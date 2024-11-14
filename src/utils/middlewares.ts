
import { Request, Response, NextFunction } from 'express';
import Database from './database';

export interface AuthedRequest extends Request {
  clientId?: string
  db?: Database
}

// middleware to check for API_KEY header
export const clientIdMiddleware = async (req: AuthedRequest, res: Response, next: NextFunction): Promise<void> => {
  
  // fisrt check if we have a client id
  const clientId = req.header('x-clientid');
  if (clientId) {
    const db = await Database.getInstance();
    if (await db.isValidAccessCode(clientId)) {
      req.clientId = clientId;
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
  res.status(401).json({ error: 'X-ClientId header is missing or invalid and no custom API keys provided' });
};

export const useDatabaseMiddleware = async (req: AuthedRequest, res: Response, next: NextFunction): Promise<void> => {
  req.db = await Database.getInstance();
  next();
};
