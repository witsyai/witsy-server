
import { Router, Response } from 'express';
import { databaseMiddleware, AuthedRequest } from '../utils/middlewares';
import { getUserByEmail } from '../user/controller';

const router = Router();
router.use(databaseMiddleware);

// to create a new thread
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
    // temp backwards compatibility
    clientId: user.userToken
  });

});

export default router;
