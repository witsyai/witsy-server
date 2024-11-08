
import { Request, Response, NextFunction } from 'express';

// middleware to check for API_KEY header
export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.header('API-KEY');
  if (apiKey !== process.env.AUTHORIZED_API_KEY) {
    res.status(401).json({ error: 'API_KEY header is missing or invalid' });
  } else {
    next();
  }
};
