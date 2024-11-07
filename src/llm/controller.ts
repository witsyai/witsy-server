
import { igniteEngine, LlmChunk, Message } from 'multi-llm-ts';
import BrowsePlugin from '../plugins/browse';
import TavilyPlugin from '../plugins/tavily';
import ImagePlugin from '../plugins/image';
import PythonPlugin from '../plugins/python';

export interface LlmOpts {
  apiKey: string
}

export interface ChatOpts {
  llmOpts: LlmOpts
  baseUrl: string
}

const _instructions = 'You are an AI assistant designed to assist users by providing accurate information, answering questions, and offering helpful suggestions. Your main objectives are to understand the user\'s needs, communicate clearly, and provide responses that are informative, concise, and relevant.'
const _titling_instructions = 'You are an assistant whose task is to find the best title for the conversation below. The title should be just a few words.'
const _titling_prompt = 'Provide a title for the conversation above. Do not return anything other than the title. Do not wrap responses in quotes.'
  
const instructions = (): string => {
  let instr = _instructions;
  instr += ` Current date and time are ${new Date().toLocaleString()}.`;
  return instr;
}

export default {

  instructions: instructions,

  chat: async function*(engineId: string, modelId: string, userMessages: Message[], prompt: string, chatOpts: ChatOpts): AsyncIterable<LlmChunk> {

    // else build the messages
    const messages: Message[] = [
      new Message('system', instructions()),
      ...userMessages.map((m: any) => new Message(m.role, m.content))
    ];

    // ignite and add plugins
    const engine = igniteEngine(engineId, chatOpts.llmOpts);
    engine.addPlugin(new BrowsePlugin());
    engine.addPlugin(new TavilyPlugin());
    engine.addPlugin(new PythonPlugin());

    // image plugin
    if (process.env.IMAGE_ENGINE && process.env.IMAGE_MODEL) {
      engine.addPlugin(new ImagePlugin(chatOpts.baseUrl, process.env.IMAGE_ENGINE, process.env.IMAGE_MODEL));
    }

    // add the new message to the thread
    const userMessage = new Message('user', prompt);
    messages.push(userMessage);

    // generate response from the engine
    //console.log(messages);
    const stream = engine.generate(modelId, messages);
    for await (const message of stream) {
      yield message;
    }

  },


  title: async (engineId: string, modelId: string, userMessages: Message[], llmOpts: LlmOpts): Promise<string> => {

    // else build the messages
    const messages: Message[] = []
    if (userMessages) {
      messages.push(new Message('system', _titling_instructions))
      messages.push(...userMessages.map((m: any) => new Message(m.role, m.content)));
    }

    // ignite and add plugins
    const engine = igniteEngine(engineId, {});

    // add the new message to the thread
    const userMessage = new Message('user', _titling_prompt);
    messages.push(userMessage);

    // generate response from the engine
    console.log(messages);
    const completion = await engine.complete(modelId, messages);
    return completion.content;

  }

}
