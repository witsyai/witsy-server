
import { Router } from 'express';
import { adminMiddleware, databaseMiddleware, type AuthedRequest } from '../utils/middlewares';
import { topUsersLastDays, userTokensLastDays } from './controller';

const router = Router();
router.use(databaseMiddleware);
router.use(adminMiddleware);

router.get('/users/top/:top?', async (req: AuthedRequest, res) => {
  res.status(200).json({ users: await topUsersLastDays(req.db!, parseInt(req.params.top) || 10) });
});

router.get('/:userId', async (req: AuthedRequest, res) => {
  res.status(200).json({ usage: await userTokensLastDays(req.db!, parseInt(req.params.userId)) });
});

export default router;
