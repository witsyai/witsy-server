
import { Router } from 'express';
import { adminMiddleware, databaseMiddleware, type AuthedRequest } from '../utils/middlewares';
import { topUsersLastHours, totalTokensLastHours, userTokensLastDays } from './controller';
import logger from '../utils/logger';

const router = Router();
router.use(databaseMiddleware);
router.use(adminMiddleware);

router.get('/tokens/:hours', async (req: AuthedRequest, res) => {
  try {
    res.status(200).json({ usage: await totalTokensLastHours(req.db!, parseInt(req.params.hours)) });
  } catch (e) {
    logger.error('Error while getting total tokens', e);
    res.status(500).json({ error: e });
  }
});

router.get('/users/top/:hours/:top?', async (req: AuthedRequest, res) => {
  try {
    res.status(200).json({ users: await topUsersLastHours(req.db!, parseInt(req.params.hours), parseInt(req.params.top) || 10) });
  } catch (e) {
    logger.error('Error while getting top users', e);
    res.status(500).json({ error: e });
  }
});

router.get('/users/:userId', async (req: AuthedRequest, res) => {
  try {
    res.status(200).json({ usage: await userTokensLastDays(req.db!, parseInt(req.params.userId)) });
  } catch (e) {
    logger.error('Error while getting user usage', e);
    res.status(500).json({ error: e });
  }
});

export default router;
