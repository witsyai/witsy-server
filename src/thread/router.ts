
import { Router, Response } from 'express';
import { clientIdMiddleware, databaseMiddleware, AuthedRequest } from '../utils/middlewares';
import { getUserByAccessCode } from '../user/controller';
import { createThread, loadThread, saveThread } from './controller';

const router = Router();
router.use(databaseMiddleware);
router.use(clientIdMiddleware);

// to create a new thread
router.put('/', async (req: AuthedRequest, res: Response) => {
  const user = await getUserByAccessCode(req.db!, req.clientId!);
  const thread = createThread(user!.id);
  await saveThread(req.db!, thread);
  res.json({ id: thread.id });
});

// to get the messages of a thread
router.get('/:id', async (req: AuthedRequest, res: Response) => {
  const threadId = parseInt(req.params.id);
  const thread = await loadThread(req.db!, threadId);
  if (!thread) {
    res.status(404).json({ error: `Conversation ${threadId} not found` });
    return;
  }
  res.json({
    title: thread.title,
    messages: thread.messages
  });
});

export default router;
