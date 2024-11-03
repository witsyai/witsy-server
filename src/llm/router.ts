import { Router, Request, Response, NextFunction } from 'express';
import { igniteEngine, Message, loadModels } from 'multi-llm-ts';
import BrowsePlugin from '../plugins/browse';
import TavilyPlugin from '../plugins/tavily';
import ImagePlugin from '../plugins/image';
import PythonPlugin from '../plugins/python';
import Thread from '../model/thread';

interface LlmRequest extends Request {
  llmOpts?: {
    apiKey: string
    models: {
      chat: any[]
      images: any[]
    },
    model: {
      chat: string,
      images: string
    }
  };
}

const router = Router();
const threads: Thread[] = [];

// middleware to check for API_KEY header
const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.header('API_KEY');
  if (!apiKey) {
    res.status(401).json({ error: 'API_KEY header is required' });
  } else {
    next();
  }
};

// middleware to add llm options to the request
const llmOptsMiddleware = (req: LlmRequest, res: Response, next: NextFunction): void => {
  const engineId = req.params.engine || req.body.engine;
  if (engineId) {
    const apiKeyEnvVar = `${engineId.toUpperCase()}_API_KEY`;
    const apiKey = process.env[apiKeyEnvVar];
    if (apiKey) {
      req.llmOpts = {
        apiKey,
        model: { chat: '', images: '' },
        models: { chat: [], images: [] },
      };
    } else {
      res.status(400).json({ error: `API key for engine ${engineId} not found` });
      return;
    }
  }
  next();
};

router.use(apiKeyMiddleware);
router.use(llmOptsMiddleware);

// to create a new thread
router.put('/thread', async (req: Request, res: Response) => {
  const thread = new Thread();
  threads.push(thread);
  await thread.save();
  res.json({ id: thread.id });
});

// to get the messages of a thread
router.get('/thread/:id', async (req: Request, res: Response) => {
  const threadId = req.params.id;
  const thread = await Thread.load(threadId);
  if (!thread) {
    res.status(404).json({ error: `Conversation ${threadId} not found` });
    return;
  }
  res.json(thread.messages);
});

// to get the models of an engine
router.get('/models/:engine', async (req: LlmRequest, res: Response) => {
  const engineId = req.params.engine;
  const opts = req.llmOpts;
  if (!opts) {
    res.status(400).json({ error: `Engine ${engineId} not found` });
    return;
  }
  await loadModels(engineId, opts);
  res.json(opts.models);
});

// to chat in the thread
router.post('/chat', async (req: LlmRequest, res: Response) => {
  const { message, thread: threadId, engine: engineId, model: modelId } = req.body;
  if (!message || !threadId || !engineId || !modelId) {
    res.status(400).json({ error: 'message/thread/engine/model required' });
    return;
  }

  // load the conversation
  const thread = await Thread.load(threadId);
  if (!thread) {
    res.status(404).json({ error: `Conversation ${threadId} not found` });
    return;
  }

  // get and check the opts
  const opts = req.llmOpts;
  if (!opts) {
    res.status(400).json({ error: `API key for engine ${engineId} not found` });
    return;
  }

  // ignite and add plugins
  const engine = igniteEngine(engineId, opts);
  engine.addPlugin(new BrowsePlugin());
  engine.addPlugin(new TavilyPlugin());
  engine.addPlugin(new PythonPlugin());

  // image plugin
  if (process.env.IMAGE_ENGINE && process.env.IMAGE_MODEL) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    engine.addPlugin(new ImagePlugin(baseUrl, process.env.IMAGE_ENGINE, process.env.IMAGE_MODEL));
  }

  // add the new message to the thread
  const userMessage = new Message('user', message);
  thread.addMessage(userMessage);
  await thread.save();

  // generate response from the engine
  const stream = engine.generate(thread.messages, { model: modelId });
  for await (const message of stream) {
    if (message.type === 'content') {
      res.write(message.text);
    }
  }
  res.end();
});

export default router;
