
import { Router, Request, Response } from 'express';
import { clientIdMiddleware } from '../utils/middlewares';
import Thread from '../thread';

const router = Router();
router.use(clientIdMiddleware);

// to create a new thread
router.put('/', async (req: Request, res: Response) => {
  const thread = new Thread();
  await thread.save();
  res.json({ id: thread.id });
});

// to get the messages of a thread
router.get('/:id', async (req: Request, res: Response) => {
  const threadId = req.params.id;
  const thread = await Thread.load(threadId);
  if (!thread) {
    res.status(404).json({ error: `Conversation ${threadId} not found` });
    return;
  }
  res.json(thread.messages);
});

export default router;
