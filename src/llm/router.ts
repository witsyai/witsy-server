
import { Router, Request, Response, NextFunction } from 'express';
import { Message, loadModels } from 'multi-llm-ts';
import { apiKeyMiddleware } from '../utils/middlewares';
import Controller, { LlmOpts } from './controller';
import Thread from '../thread';

interface LlmRequest extends Request {
  llmOpts?: LlmOpts
  engineId?: string
  modelId?: string
  messages?: Message[]
}

// middleware to add llm options to the request
const llmOptsMiddleware = (req: LlmRequest, res: Response, next: NextFunction): void => {
  const engineId = req.params.engine || req.body.engine;
  if (engineId) {
    const apiKeyEnvVar = `${engineId.toUpperCase()}_API_KEY`;
    const apiKey = process.env[apiKeyEnvVar];
    if (apiKey) {
      req.llmOpts = { apiKey, };
    } else {
      res.status(400).json({ error: `API key for engine ${engineId} not found` });
      return;
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
router.use(apiKeyMiddleware);
router.use(llmOptsMiddleware);

// to get the engines
router.get('/engines', (req: LlmRequest, res: Response) => {
  res.json(Controller.engines());
});

// to get the models of an engine
router.get('/models/:engine', llmOptsMiddleware, async (req: LlmRequest, res: Response) => {
  const engineId = req.params.engine;
  res.json(await Controller.models(engineId, req.llmOpts!));
});

// to chat in the thread
router.post('/chat', engineModelMiddleware, async (req: LlmRequest, res: Response) => {
  
  // load params
  const { prompt } = req.body;
  if (!prompt) {
    res.status(400).json({ error: 'prompt required' });
    return;
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
  const stream = await Controller.chat(req.engineId!, req.modelId!, thread ? thread.messages : userMessages, prompt, {
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
  res.send(JSON.stringify({ title: title }));
});

export default router;
