
import { Attachment, igniteEngine, LlmChunk, LlmCompletionOpts, loadModels, ModelsList } from 'multi-llm-ts';
import BrowsePlugin from '../plugins/browse';
import TavilyPlugin from '../plugins/tavily';
import ImagePlugin from '../plugins/image';
import PythonPlugin from '../plugins/python';
import YouTubePlugin from '../plugins/youtube';
import Configuration, { EngineModel } from '../utils/config';
import Message from '../models/message';
import { UserTier } from '../user';

export interface LlmOpts {
  apiKey?: string
  baseURL?: string
}

export interface ChatOpts {
  llmOpts: LlmOpts
  baseUrl: string
  canImage: boolean
}

const _instructions = 'You are a helpful AI assistant. You provide clear, informative, concise, and relevant responses.'
const _titling_instructions = 'You are an assistant whose task is to find the best title for the conversation below. The title should be just a few words.'
const _titling_prompt = 'Provide a title for the conversation above. Do not return anything other than the title. Do not wrap responses in quotes.'
  
const instructions = (): string => {
  let instr = _instructions;
  instr += ` Date/time: ${new Date().toLocaleString()}.`;
  return instr;
}

const messagesPayload = (
  configuration: Configuration,
  systemPrompt: string,
  thread: Message[],
  prompthasAttachment: boolean,
  includeAttachments: boolean
): Message[] => {

  // init with new prompt
  const messages: Message[] = [];

  // conversation length
  let messagesCount = 0;
  let attachmentCount = prompthasAttachment ? 1 : 0;
  const chatConversationLength = configuration.chatConversationLength;
  const chatMaxAttachments = configuration.chatMaxAttachments;
  for (let i=thread.length-1; i>=0; i--) {

    // prep all
    const message = thread[i];
    const attach = includeAttachments && attachmentCount < chatMaxAttachments && message.attachment != null && message.attachment.content?.length;
    const attachment = attach ? new Attachment(message.attachment!.content, message.attachment!.mimeType) : undefined;
    const payload = new Message(message.role, message.content, attachment);
    messages.push(payload);

    // count
    attachmentCount += attach ? 1 : 0;
    if (++messagesCount >= chatConversationLength * 2) {
      break;
    }
  }

  // add system prompt
  messages.push(new Message('system', systemPrompt));

  // done
  return messages.reverse();
}

export const _private = {
  instructions,
  messagesPayload
}

export type LlmEngine = {
  id: string
  name: string
}

const engines = [
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'mistralai', name: 'MistralAI' },
  { id: 'google', name: 'Google' },
  { id: 'xai', name: 'xAI' },
  { id: 'groq', name: 'Groq' },
  { id: 'cerebras', name: 'Cerebras' },
  { id: 'deepseek', name: 'DeepSeek' },
]

const supportsTools = (modelId: string): boolean => {
  return modelId !== 'deepseek-reasoner';
}

export type ApiKeyDict = { [key: string]: string }

export default {

  instructions: instructions,

  engines: (hasUserToken: boolean, apiKeys: ApiKeyDict): LlmEngine[] => {

    // init
    const result: LlmEngine[] = [];

    // these engines require an api key
    for (const engine of engines) {
      if (hasUserToken) {
        const apiKeyEnvVar = `${engine.id.toUpperCase()}_API_KEY`;
        const apiKey = process.env[apiKeyEnvVar];
        if (apiKey) {
          result.push(engine);
        }
      } else {
        const apiKey = apiKeys[`${engine.id}Key`];
        if (apiKey) {
          result.push(engine);
        }
      }
    }

    // ollama is special
    if (hasUserToken && process.env.OLLAMA_ENABLED) {
      result.push({ id: 'ollama', name: 'Ollama' });
    }

    // done
    return result;

  },

  engineModels: async (engineId: string, llmOpts: LlmOpts): Promise<ModelsList> => {
    const models = await loadModels(engineId, llmOpts);
    return models || { chat: [], };
  },

  models: (configuration: Configuration, tier: UserTier, superuser: boolean): EngineModel[] => {
    if (['free', 'basic'].includes(tier)) {
      return configuration!.modelsBasic;
    } else if (superuser || ['pro', 'unlimited'].includes(tier)) {
      return [
        ...configuration!.modelsBasic,
        ...configuration!.modelsPro
      ]//.sort((a, b) => a.engine.localeCompare(b.engine) || a.model.localeCompare(b.model));
    } else {
      throw new Error('Unknown user tier');
    }
  },

  chat: async function*(
    configuration: Configuration, engineId: string, modelId: string,
    userMessages: Message[], prompt: string, attachment: Attachment|null,
    chatOpts: ChatOpts): AsyncIterable<LlmChunk>
  {

    // build the messages
    const messages = messagesPayload(configuration, instructions(), userMessages, attachment != null, true);

    // ignite and add plugins
    const engine = igniteEngine(engineId, chatOpts.llmOpts);
    if (supportsTools(modelId)) {

      // basic plugins
      engine.addPlugin(new BrowsePlugin());
      engine.addPlugin(new TavilyPlugin());
      engine.addPlugin(new PythonPlugin());
      engine.addPlugin(new YouTubePlugin())

      // image plugin
      const imageModel: EngineModel|undefined = configuration.imageModel;
      if (chatOpts.canImage && imageModel) {
        engine.addPlugin(new ImagePlugin(chatOpts.baseUrl, imageModel.engine, imageModel.model));
      }

    }

    // add the new message to the thread
    const userMessage = new Message('user', prompt);
    if (attachment) {
      userMessage.attach(attachment);
    }
    messages.push(userMessage);

    // our options
    const llmOpts: LlmCompletionOpts = {
      autoSwitchVision: true,
      usage: true,
    }

    // we decide model switching here
    if (engineId === 'openai') {
      llmOpts.models = [ { id: 'gpt-4o', name: '', meta: {} } ]
    } else if (engineId === 'anthropic') {
      llmOpts.models = [ { id: 'claude-3-haiku-20240307', name: '', meta: {} } ]
    } else if (engineId === 'google') {
      llmOpts.models = [ { id: 'gemini-1.5-flash-latest', name: '', meta: {} } ]
    }

    // generate response from the engine
    //console.log(messages);
    const stream = engine.generate(modelId, messages, llmOpts);
    for await (const message of stream) {
      yield message;
    }

  },


  title: async (configuration: Configuration, engineId: string, modelId: string, userMessages: Message[], llmOpts: LlmOpts): Promise<string> => {

    // build the messages
    const messages: Message[] = messagesPayload(configuration, _titling_instructions, userMessages, false, false);

    // ignite and add plugins
    const engine = igniteEngine(engineId, llmOpts);

    // add the new message to the thread
    const userMessage = new Message('user', _titling_prompt);
    messages.push(userMessage);

    // generate response from the engine
    //console.log(messages);
    const completion = await engine.complete(modelId, messages, { usage: true });
    return completion.content || '';

  }

}
