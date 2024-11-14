
import { Router, Response } from 'express';
import { clientIdMiddleware, useDatabaseMiddleware, AuthedRequest } from '../utils/middlewares';
import { getUserByAccessCode } from '../user/controller';
import { createThread, loadThread, saveThread } from './controller';

const router = Router();
router.use(useDatabaseMiddleware);
router.use(clientIdMiddleware);

// to create a new thread
router.put('/', async (req: AuthedRequest, res: Response) => {
  const user = await getUserByAccessCode(req.db!, req.clientId!);
  const thread = createThread(user!.uuid);
  await saveThread(req.db!, thread);
  res.json({ id: thread.id });
});

// to get the messages of a thread
router.get('/:id', async (req: AuthedRequest, res: Response) => {
  const threadId = req.params.id;
  const thread = await loadThread(req.db!, threadId);
  if (!thread) {
    res.status(404).json({ error: `Conversation ${threadId} not found` });
    return;
  }
  res.json(thread.messages);
});

export default router;
