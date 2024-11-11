
import { Router, Request, Response } from 'express';

const router = Router();

// to create a new thread
router.post('/verify', async (req: Request, res: Response) => {
  const clientId = req.body.clientId;
  if (clientId !== process.env.AUTHORIZED_CLIENT_ID) {
    res.status(401).json({ error: 'Invalid client Id' });
  } else {
    res.sendStatus(200);
  }
});

export default router;
