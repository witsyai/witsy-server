
import Message from '../models/message';

export default class Thread {

  private _id:  number;
  private _userId: number;
  private _title: string;
  private _messages: Message[];

  constructor(id: number, userId: number, title: string = '', messages: Message[] = []) {
    this._id = id;
    this._userId = userId;
    this._title = title;
    this._messages = messages
  }

  public get id(): number {
    return this._id;
  }

  public set id(value: number) {
    if (this._id !== 0) {
      throw new Error('Cannot change ID of existing thread');
    }
    this._id = value;
  }

  public get userId(): number {
    return this._userId;
  }

  public get title(): string {
    return this._title;
  }

  public set title(value: string) {
    this._title = value;
  }

  public get messages(): Message[] {
    return this._messages;
  }

  public addMessage(message: Message) {
    this._messages.push(message);
  }

}
