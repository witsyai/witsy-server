import { Router } from 'express';
import { createUser } from './controller';
import { useDatabaseMiddleware, type AuthedRequest } from '../utils/middlewares';

const router = Router();
router.use(useDatabaseMiddleware);


router.post('/create', async (req: AuthedRequest, res) => {
  try {
    const user = await createUser(req.db!, req.body);
    res.status(200).json(user);
  } catch (error) {
    const errorMessage = (error instanceof Error && error.cause) ? error.cause : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
});

export default router;
