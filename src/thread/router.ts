
import { Router, Response } from 'express';
import { userTokenMiddleware, databaseMiddleware, AuthedRequest, maintenanceMiddleware } from '../utils/middlewares';
import { createThread, loadThread, saveThread } from './controller';
import logger from '../utils/logger';

const router = Router();
router.use(maintenanceMiddleware);
router.use(databaseMiddleware);
router.use(userTokenMiddleware);

// to create a new thread
router.put('/', async (req: AuthedRequest, res: Response) => {
  try {
    const thread = createThread(req.user!.id);
    await saveThread(req.db!, thread);
    res.json({ id: thread.id });
  } catch (e) {
    logger.error('Error while creating thread', e);
    res.status(500).json({ error: e });
  }
});

// to get the messages of a thread
router.get('/:id', async (req: AuthedRequest, res: Response) => {
  try {
    const threadId = parseInt(req.params.id);
    const thread = await loadThread(req.db!, threadId);
    if (!thread) {
      res.status(404).json({ error: `Conversation not found` });
      return;
    }
    if (thread.userId !== req.user!.id) {
      res.status(403).json({ error: `Conversation not visible to you` });
      return;
    }
    res.json({
      title: thread.title,
      messages: thread.messages
    });
  } catch (e) {
    logger.error(`Error while gettings thread ${req.params.id}`, e);
    res.status(500).json({ error: e });
  }
});

export default router;
