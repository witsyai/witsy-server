
import { Router, Request, Response, NextFunction } from 'express';
import { clientIdMiddleware } from '../utils/middlewares';
import Controller, { LlmOpts } from './controller';
import { Attachment, Message } from 'multi-llm-ts';
import Thread from '../thread';

interface LlmRequest extends Request {
  hasClientId?: boolean
  llmOpts?: LlmOpts
  engineId?: string
  modelId?: string
  messages?: Message[]
}

// middleware to check if the client id is present
const hasClientIdMiddleware = (req: LlmRequest, res: Response, next: NextFunction): void => {
  const header = req.header('x-clientid');
  req.hasClientId = (header != null && header.length > 0);
  next();
};

// middleware to add llm options to the request
const llmOptsMiddleware = (req: LlmRequest, res: Response, next: NextFunction): void => {
  const engineId = req.params.engine || req.body.engine;
  if (engineId === 'ollama') {
    req.llmOpts = { baseURL: '' }
  } else if (engineId) {
    if (req.hasClientId) {
      const apiKeyEnvVar = `${engineId.toUpperCase()}_API_KEY`;
      const apiKey = process.env[apiKeyEnvVar];
      if (apiKey) {
        req.llmOpts = { apiKey, };
      } else {
        res.status(400).json({ error: `API key for engine ${engineId} not found` });
        return;
      }
    } else {
      const apiKey = req.body[`${engineId}Key`];
      if (apiKey) {
        req.llmOpts = { apiKey, };
      } else {
        res.status(400).json({ error: `API key for engine ${engineId} not found` });
        return;
      }
    }
  }
  next();
};

// middleware to add engine/model options to the request
const engineModelMiddleware = (req: LlmRequest, res: Response, next: NextFunction): void => {
  const engineId = req.params.engine || req.body.engine;
  const modelId = req.params.model || req.body.model;
  if (engineId && modelId) {
    req.engineId = engineId;
    req.modelId = modelId;
  } else {
    res.status(400).json({ error: `engine and model required` });
    return;
  }
  next();
};

// middleware to add messages to the request
const engineMessagesMiddleware = (req: LlmRequest, res: Response, next: NextFunction): void => {
  const messages = req.body.messages;
  if (messages && Array.isArray(messages)) {
    req.messages = messages;
  } else {
    res.status(400).json({ error: `messages array required` });
    return;
  }
  next();
};

const router = Router();
router.use(clientIdMiddleware);
router.use(hasClientIdMiddleware);
router.use(llmOptsMiddleware);

// to get the engines
router.post('/engines', (req: LlmRequest, res: Response) => {
  res.json({ engines: Controller.engines(req.hasClientId!, req.body) });
});

// to get the models of an engine
router.post('/models/:engine', llmOptsMiddleware, async (req: LlmRequest, res: Response) => {
  const engineId = req.params.engine;
  res.json({ models: await Controller.models(engineId, req.llmOpts!) });
});

// to chat in the thread
router.post('/chat', engineModelMiddleware, async (req: LlmRequest, res: Response) => {
  
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
  if (!threadId && (!userMessages || !Array.isArray(userMessages))) {
    res.status(400).json({ error: 'thread or messages required' });
    return;
  }

  // load the conversation
  let thread = null
  if (threadId) {
    thread = await Thread.load(threadId);
    if (!thread) {
      res.status(404).json({ error: `Conversation ${threadId} not found` });
      return;
    }
  }

  // add headers
	res.writeHead(200, {
		'Content-Type': 'application/json',
		'Transfer-Encoding': 'chunked'
	});

  // the response
  const response = new Message('assistant');

	// f*ing nginx
	const delay = (ms: number) => {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

  // now prompt
	let lastSent = null;
	const minDelayMs = 5;
  const stream = await Controller.chat(req.engineId!, req.modelId!, thread ? thread.messages : userMessages, prompt, attachment, {
    llmOpts: req.llmOpts!,
    baseUrl: `${req.protocol}://${req.get('host')}`
  })
  for await (const message of stream) {
		if (lastSent != null) {
			const elapsed = Date.now() - lastSent;
			if (elapsed < minDelayMs) {
				await delay(minDelayMs-elapsed);
			}
		}
    res.write(JSON.stringify(message));
    if (message.type === 'content') {
      response.appendText(message);
    }
		lastSent = Date.now();
  }

  // update the thread
  if (thread) {
    thread.addMessage(new Message('user', prompt));
    thread.addMessage(response);
    await thread.save();
  }

  // done
  res.end();

});

// to chat in the thread
router.post('/title', engineModelMiddleware, engineMessagesMiddleware, async (req: LlmRequest, res: Response) => {
  const title = await Controller.title(req.engineId!, req.modelId!, req.messages!, req.llmOpts!);
  res.json({ title: title });
});

export default router;
