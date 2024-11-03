
import { Router, Request, Response, NextFunction } from 'express';
import { igniteEngine, Message, loadModels } from 'multi-llm-ts';
import { apiKeyMiddleware } from '../utils/middlewares';
import BrowsePlugin from '../plugins/browse';
import TavilyPlugin from '../plugins/tavily';
import ImagePlugin from '../plugins/image';
import PythonPlugin from '../plugins/python';
import Thread from '../thread';

interface LlmRequest extends Request {
  llmOpts?: {
    apiKey: string
  };
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

const router = Router();
router.use(apiKeyMiddleware);
router.use(llmOptsMiddleware);

// to get the models of an engine
router.get('/models/:engine', async (req: LlmRequest, res: Response) => {
  const engineId = req.params.engine;
  const opts = req.llmOpts;
  if (!opts) {
    res.status(400).json({ error: `Engine ${engineId} not found` });
    return;
  }
  const models = await loadModels(engineId, opts);
  res.json(models);
});

// to chat in the thread
router.post('/chat', async (req: LlmRequest, res: Response) => {
  
  // load params
  const { prompt, engine: engineId, model: modelId } = req.body;
  if (!prompt || !engineId || !modelId) {
    res.status(400).json({ error: 'prompt/engine/model required' });
    return;
  }

  // load thread or messages
  const { thread: threadId, messages } = req.body;
  if (!threadId && (!messages || !Array.isArray(messages))) {
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

  // make sure messages are ok
  if (messages && messages.length === 0) {
    messages.push(new Message('system', Thread.instructions));
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
  const userMessage = new Message('user', prompt);
  messages?.push(userMessage);
  thread?.addMessage(userMessage);
  await thread?.save();

  // the response
  const response = new Message('assistant');

  // generate response from the engine
  const stream = engine.generate(modelId, thread ? thread.messages : messages);
  for await (const message of stream) {
    if (message.type === 'content') {
      response.appendText(message);
      res.write(message.text);
    }
  }

  // add to the thread
  thread?.addMessage(response);
  await thread?.save();

  // done
  res.end();
});

export default router;
