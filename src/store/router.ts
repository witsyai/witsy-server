
import { Router, Request, Response } from 'express';
import appleReceiptVerify, { EmptyError, ServiceUnavailableError } from 'node-apple-receipt-verify';
import { createUser, getUserBySubscriptionId, saveUser } from '../user/controller';
import { AuthedRequest, databaseMiddleware } from '../utils/middlewares';
import logger from '../utils/logger';
import User, { UserTier } from '../user';

const router = Router();
router.use(databaseMiddleware);

router.post('/verify/apple', async (req: Request, res: Response) => {
  
  const { receipt } = req.body;
  if (!receipt) {
    res.status(400).json({ error: 'receipt is required' });
    return;
  }

  if (!process.env.APPLE_SHARED_SECRET) {
    res.status(500).json({ error: 'APPLE_SHARED_SECRET not set' });
    return;
  }
  
  appleReceiptVerify.config({
    //verbose: true,
    extended: true,
    ignoreExpiredError: true,
    excludeOldTransactions: true,
    secret: process.env.APPLE_SHARED_SECRET,
    environment: process.env.NODE_ENV == 'production' ?
      [ 'production', 'sandbox' ] :
      [ 'sandbox', 'production' ]
  });

  try {
    const products = await appleReceiptVerify.validate({ receipt });
    res.status(200).json({ products: products });
  } catch (e) {
    if (e instanceof EmptyError) {
      res.status(400).json({ success: false, message: "Receipt data is empty" });
    } else if (e instanceof ServiceUnavailableError) {
      res.status(503).json({ error : 'Service unavailable, try again later' });
    } else {
      console.log(e);
      res.status(500).json({ error: (e as Error).message });
    }
  }

});

router.put('/transaction/apple', async (req: AuthedRequest, res: Response) => {
  
  const { transaction } = req.body;
  if (!transaction) {
    res.status(400).json({ error: 'transacrtion is required' });
    return;
  }

  // log
  logger.info('Processing apple transaction', transaction);

  // find the user
  const subscriptionId = transaction.originalTransactionId;
  let user: User|null = await getUserBySubscriptionId(req.db!, subscriptionId);
  if (!user) {
    user = await createUser(req.db!);
  }

  // check if this is a new payload
  if (JSON.stringify(user.subscriptionLastPayload) == JSON.stringify(transaction)) {
    logger.debug(`Transaction already processed for ${user.id}/${user.username}`);
    res.status(200).json({ userToken: user.userToken });
    return;
  }
  
  try {

    // get the tier
    let tier: UserTier = UserTier.Free;
    if (transaction.productId == 'witsy_basic') {
      tier = UserTier.Basic;
    } else if (transaction.productId == 'witsy_pro') {
      tier = UserTier.Pro;
    }

    // update user
    user.subscriptionTier = tier;
    user.subscriptionId = transaction.originalTransactionId;
    user.subscriptionExpiresAt = transaction.expirationDate;
    user.subscriptionLastPayload = transaction;

    // started at only once
    if (!user.subscriptionStartedAt) {
      user.subscriptionStartedAt = transaction.purchaseDate
    }

    // done
    logger.debug(`Updating user ${user.id}/${user.username} with ${tier} subscription, expires at ${user.subscriptionExpiresAt}`);
    await saveUser(req.db!, user);
    res.status(200).json({ userToken: user.userToken });
  
  } catch (error) {
    logger.error('Error updating user', error);
    res.status(500).json({ error: 'Error updating user' });
  }

});

export default router;
