
import { Request, Response, NextFunction } from 'express';

// middleware to check for API_KEY header
export const clientIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  
  // fisrt check if we have a client id
  const clientId = req.header('x-clientid');
  if (clientId === process.env.AUTHORIZED_CLIENT_ID) {
    next();
    return;
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
