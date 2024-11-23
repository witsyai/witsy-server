
import { Router, Response } from 'express';
import { databaseMiddleware, AuthedRequest } from '../utils/middlewares';
import { createUser, getUserByEmail } from '../user/controller';
import logger from '../utils/logger';

const router = Router();
router.use(databaseMiddleware);

router.post('/register', async (req: AuthedRequest, res) => {
  try {

    // do it
    const user = await createUser(req.db!);
    res.status(200).json({
      userToken: user.userToken,
    });
  } catch (error) {
    logger.error(`user creation failed: ${error}`);
    const errorMessage = (error instanceof Error && error.cause) ? error.cause : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
});


router.post('/verify', async (req: AuthedRequest, res: Response) => {
  const userToken = req.userToken || req.body.userToken || req.body.clientId;
  const isValid = await req.db!.isValidUserToken(userToken);
  if (!isValid) {
    res.status(401).json({ error: 'Invalid userToken' });
  } else {
    res.sendStatus(200);
  }
});

router.post('/login', async (req: AuthedRequest, res: Response) => {

  // load the user
  const email = req.body.email;
  const user = await getUserByEmail(req.db!, email);
  if (!user) {
    res.status(401).json({ error: 'Invalid email' });
    return;
  }

  // return the user token
  res.json({
    userToken: user.userToken,
    subscriptionTier: user.subscriptionTier,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
    // temp backwards compatibility
    clientId: user.userToken
  });

});

router.post('/admin/login', async (req: AuthedRequest, res: Response) => {
  if (req.body.token === process.env.ADMIN_TOKEN) {
    res.status(200).json({ sucesss: true });
  } else {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
