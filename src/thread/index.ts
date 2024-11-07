
import { Message } from 'multi-llm-ts';
import Database from '../utils/database';

export default class Thread {

  private _uuid: string;
  private _messages: Message[];

  constructor(uuid?: string) {
    this._uuid = uuid || crypto.randomUUID();
    this._messages = []
  }

  public get id(): string {
    return this._uuid;
  }

  public get messages(): Message[] {
    return this._messages;
  }

  public addMessage(message: Message) {
    this._messages.push(message);
  }

  public async save() {
    const db = await Database.getInstance();
    const messagesJson = JSON.stringify(this._messages);
    await db.saveThread(this._uuid, messagesJson);
  }

  public static async load(id: string): Promise<Thread | null> {
    const db = await Database.getInstance();
    const threadData = await db.getThread(id);
    if (!threadData) {
      return null;
    }
    const messages = JSON.parse(threadData.messages);
    const thread = new Thread(id);
    thread._messages = messages;
    return thread;
  }
}
