
import { Router } from 'express';
import { adminMiddleware, databaseMiddleware, type AuthedRequest } from '../utils/middlewares';

const router = Router();
router.use(databaseMiddleware);
router.use(adminMiddleware);

router.get('/users/top', async (req: AuthedRequest, res) => {
  res.status(200).json({ users: [] });
});

export default router;
