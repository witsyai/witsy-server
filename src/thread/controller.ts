import Thread from './index';
import Database from '../utils/database';

export const createThread = (userId: string): Thread => {
  return new Thread(crypto.randomUUID(), userId);
}

export const loadThread = async (db: Database, id: string): Promise<Thread|null> => {
  const threadData = await db.getDb()?.get('SELECT * FROM threads WHERE uuid = ?', [id]);
  if (!threadData) {
    return null;
  }
  const messages = JSON.parse(threadData.messages);
  const thread = new Thread(id, threadData.user_id, messages);
  return thread;
};

export const saveThread = async (db: Database, thread: Thread) => {
  const messagesJson = JSON.stringify(thread.messages);
  await db.getDb()?.run('INSERT OR REPLACE INTO threads (uuid, user_id, messages) VALUES (?, ?, ?)', [
    thread.id, thread.userId, messagesJson
  ]);
};
