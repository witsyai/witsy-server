
import { Router, Response } from 'express';
import { databaseMiddleware, AuthedRequest } from '../utils/middlewares';
import { getUserByEmail } from '../user/controller';

const router = Router();
router.use(databaseMiddleware);

// to create a new thread
router.post('/verify', async (req: AuthedRequest, res: Response) => {
  const accessCode = req.body.accessCode || req.body.clientId;
  const isValid = await req.db!.isValidAccessCode(accessCode);
  if (!isValid) {
    res.status(401).json({ error: 'Invalid accessCode' });
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

  // return the access code
  res.json({
    accessCode: user.accessCode,
    // temp backwards compatibility
    clientId: user.accessCode
  });

});

export default router;
