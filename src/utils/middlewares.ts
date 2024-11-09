
import { Request, Response, NextFunction } from 'express';

// middleware to check for API_KEY header
export const clientIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const clientId = req.header('x-clientid');
  if (clientId !== process.env.AUTHORIZED_CLIENT_ID) {
    res.status(401).json({ error: 'X-ClientId header is missing or invalid' });
  } else {
    next();
  }
};
