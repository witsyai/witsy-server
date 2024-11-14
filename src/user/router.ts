import { Router } from 'express';
import { createUser } from './controller';
import { adminMiddleware, databaseMiddleware, type AuthedRequest } from '../utils/middlewares';
import { isValidUserTier } from '.';
import logger from '../utils/logger';

const router = Router();
router.use(databaseMiddleware);

router.post('/create', adminMiddleware, async (req: AuthedRequest, res) => {
  try {

    // check
    const { username, email, tier } = req.body;
    if (!username || !email || !tier) {
      logger.warn(`user creation denied: ${username}, ${email}, ${tier}`);
      res.status(400).json({ error: 'username, email, and tier required' });
      return;
    }

    // check if tier is a valid UserTier value
    if (!isValidUserTier(tier)) {
      logger.warn(`user creation denied: invalid tier ${tier}`);
      res.status(400).json({ error: 'tier is not a valid value' });
      return;
    }

    // do it
    const user = await createUser(req.db!, username, email, tier);
    res.status(200).json({
      userToken: user.userToken,
    });
  } catch (error) {
    logger.error(`user creation failed: ${error}`);
    const errorMessage = (error instanceof Error && error.cause) ? error.cause : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
});

export default router;
