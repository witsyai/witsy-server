import { Router } from 'express';
import { createUser } from './controller';
import { adminMiddleware, databaseMiddleware, type AuthedRequest } from '../utils/middlewares';

const router = Router();
router.use(databaseMiddleware);

router.post('/create', adminMiddleware, async (req: AuthedRequest, res) => {
  try {
    const user = await createUser(req.db!, req.body);
    res.status(200).json({
      accessCode: user.accessCode,
    });
  } catch (error) {
    const errorMessage = (error instanceof Error && error.cause) ? error.cause : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
});

export default router;
