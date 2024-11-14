
import { Router, Response } from 'express';
import { useDatabaseMiddleware, AuthedRequest } from '../utils/middlewares';
import { getUserByEmail } from '../user/controller';

const router = Router();
router.use(useDatabaseMiddleware);

// to create a new thread
router.post('/verify', async (req: AuthedRequest, res: Response) => {
  const clientId = req.body.clientId;
  const isValid = await req.db!.isValidAccessCode(clientId);
  if (!isValid) {
    res.status(401).json({ error: 'Invalid client Id' });
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

  // return the client id
  res.json({ clientId: user.accessCode });

});

export default router;
