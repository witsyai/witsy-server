
import { Router, Response } from 'express';
import { userTokenMiddleware, databaseMiddleware } from '../utils/middlewares';
import { engineMessagesMiddleware, engineModelMiddleware, llmOptsMiddleware, LlmRequest, rateLimitMiddleware } from './middlewares';
import { loadThread, saveThread } from '../thread/controller';
import { Attachment, Message } from 'multi-llm-ts';
import { saveUserQuery } from '../usage/controller';
import Controller from './controller';
import logger from '../utils/logger';

const router = Router();
router.use(userTokenMiddleware);
router.use(databaseMiddleware);
router.use(llmOptsMiddleware);

// router to get accessible models
router.post('/models', (req: LlmRequest, res: Response) => {

  // depends on a lot of things
  try {
    const models = Controller.models(req.configuration!, req.user!.subscriptionTier, req.role === 'superuser');
    res.json({ models: models });
  } catch(e) {
    logger.error('Error while getting models', e);
    res.status(403).json({ error: 'Unauthorized' });
  }
});

// to get the engines
router.post('/engines', (req: LlmRequest, res: Response) => {
  const engines = Controller.engines(req.userToken != null, req.body);
  if (engines.length > 0) {
    res.json({ engines: engines });
  } else {
    res.status(403).json({ error: 'Unauthorized' });
  }
});

// to get the models of an engine
router.post('/models/:engine', llmOptsMiddleware, async (req: LlmRequest, res: Response) => {
  const engineId = req.params.engine;
  const models = await Controller.engineModels(engineId, req.llmOpts!);
  if (models.chat.length > 0) {
    res.json({ models: models });
  } else {
    res.status(403).json({ error: 'Unauthorized' });
  }
});

// to chat in the thread
router.post('/chat', rateLimitMiddleware, engineModelMiddleware, async (req: LlmRequest, res: Response) => {
  
  // load params
  const { prompt, attachment: attachInfo } = req.body;
  if (!prompt) {
    res.status(400).json({ error: 'prompt required' });
    return;
  }

  // check attachInfo
  let attachment: Attachment|null = null;
  if (attachInfo) {
     if (attachInfo.mimeType == null || attachInfo.contents == null) {
      res.status(400).json({ error: 'attachment.mimeType and attachment.contents required' });
      return;
    }
    attachment = new Attachment(attachInfo.contents, attachInfo.mimeType);
  }

  // load thread or messages
  const { thread: threadId, messages: userMessages } = req.body;
  if (!threadId) {
    logger.warn('chat denied: no thread id provided');
    res.status(400).json({ error: 'thread id required' });
    return;
  }

  // load the conversation
  let thread = null
  if (threadId && !userMessages) {
    thread = await loadThread(req.db!, threadId);
    if (!thread) {
      logger.warn(`chat denied: thread ${threadId} not found`);
      res.status(404).json({ error: `Conversation ${threadId} not found` });
      return;
    }
  }

  try {

    // the messages
    const userMessage = new Message('user', prompt, attachment || undefined); 
    const llmMessage = new Message('assistant');

    // f*ing nginx
    const delay = (ms: number) => {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    // now prompt
    let lastSent = null;
    const minDelayMs = 5;
    const stream = await Controller.chat(
      req.configuration!, req.engineId!, req.modelId!,
      thread ? thread.messages : userMessages, prompt, attachment, {
      llmOpts: req.llmOpts!,
      baseUrl: `${req.protocol}://${req.get('host')}`
    })
    for await (const message of stream) {

      // headers
      if (lastSent == null) {
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Transfer-Encoding': 'chunked'
        });
      }

      // throttling for nginx
      if (lastSent != null) {
        const elapsed = Date.now() - lastSent;
        if (elapsed < minDelayMs) {
          await delay(minDelayMs-elapsed);
        }
      }
      res.write(JSON.stringify(message));
      if (message.type === 'content') {
        llmMessage.appendText(message);
      }

      // usage
      if (message.type === 'usage') {
        if (req.user) {
          saveUserQuery(req.db!, req.user, threadId || 'unknown',
            req.engineId!, req.modelId!,
            [
              ...(thread ? thread.messages : userMessages),
              userMessage, llmMessage,
            ],
            message.usage
          );
        }
      }

      // record
      lastSent = Date.now();
    }

    // update the thread
    if (thread) {
      thread.addMessage(userMessage);
      thread.addMessage(llmMessage);
      if (thread.title.length === 0) {
        try {
          thread.title = await Controller.title(req.configuration!, req.engineId!, req.modelId!, thread.messages, req.llmOpts!);
        } catch (e) {
          logger.warn('Error while titling thread', e);
        }
      }
      await saveThread(req.db!, thread);
    }

    // done
    res.end();

  } catch (e) {
    logger.error('Error in chat', e);
    res.status(500).json({ error: 'Error in chat' });
  }

});

// to chat in the thread
router.post('/title', engineModelMiddleware, engineMessagesMiddleware, async (req: LlmRequest, res: Response) => {
  try {
    const title = await Controller.title(req.configuration!, req.engineId!, req.modelId!, req.messages!, req.llmOpts!);
    res.json({ title: title });
  } catch (e) {
    logger.error('Error in title', e);
    res.status(500).json({ error: 'Error in title' });
  }
});

export default router;
