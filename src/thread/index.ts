
import { Message } from 'multi-llm-ts';

export default class Thread {

  private _uuid: string;
  private _userId: string;
  private _messages: Message[];

  constructor(uuid: string, userId: string, messages: Message[] = []) {
    this._uuid = uuid;
    this._userId = userId;
    this._messages = messages
  }

  public get id(): string {
    return this._uuid;
  }

  public get userId(): string {
    return this._userId;
  }

  public get messages(): Message[] {
    return this._messages;
  }

  public addMessage(message: Message) {
    this._messages.push(message);
  }

}
