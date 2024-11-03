
import { Request, Response, NextFunction } from 'express';

// middleware to check for API_KEY header
export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.header('API_KEY');
  if (!apiKey) {
    res.status(401).json({ error: 'API_KEY header is required' });
  } else {
    next();
  }
};
