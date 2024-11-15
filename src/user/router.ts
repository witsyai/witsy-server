import { Router } from 'express';
import { createUser, editUser, findUsers, getUserById } from './controller';
import { adminMiddleware, databaseMiddleware, type AuthedRequest } from '../utils/middlewares';
import { isValidUserTier } from '.';
import logger from '../utils/logger';

const router = Router();
router.use(databaseMiddleware);

router.get('/search', adminMiddleware, async (req: AuthedRequest, res) => {

  try {
    const query: string = req.query['q'] as string;
    if (!query || !query.trim()) {
      logger.warn(`user search denied: ${query}`);
      res.status(400).json({ error: 'query required' });
      return;
    }

    const users = await findUsers(req.db!, query);
    res.status(200).json(users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
    })));

  } catch (error) {
    logger.error(`user search failed: ${error}`);
    const errorMessage = (error instanceof Error && error.cause) ? error.cause : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
});

router.get('/:id', adminMiddleware, async (req: AuthedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) {
      logger.warn(`user fetch denied: ${id}`);
      res.status(400).json({ error: 'id required' });
      return;
    }

    const user = await getUserById(req.db!, id);
    if (!user) {
      logger.warn(`user fetch denied: user not found`);
      res.status(404).json({ error: 'user not found' });
      return;
    }

    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      userToken: user.userToken,
      subscriptionTier: user.subscriptionTier,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
    });

  } catch (error) {
    logger.error(`user fetch failed: ${error}`);
    const errorMessage = (error instanceof Error && error.cause) ? error.cause : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
});

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

router.post('/edit', adminMiddleware, async (req: AuthedRequest, res) => {
  try {
    const { id, email, userToken, tier, expirationDate } = req.body;
    if (!id || !email || !userToken || !tier) {//} || !expirationDate) {
      logger.warn(`user edit denied: ${id}, ${email}, ${userToken}, ${tier}, ${expirationDate}`);
      res.status(400).json({ error: 'id, email, userToken, tier, and expirationDate required' });
      return;
    }

    if (!isValidUserTier(tier)) {
      logger.warn(`user edit denied: invalid tier ${tier}`);
      res.status(400).json({ error: 'tier is not a valid value' });
      return;
    }

    await editUser(req.db!, id, email, userToken, tier, expirationDate);
    res.status(200).json({
      message: 'User updated successfully',
    });

  } catch (error) {
    logger.error(`user edit failed: ${error}`);
    const errorMessage = (error instanceof Error && error.cause) ? error.cause : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
});


export default router;
