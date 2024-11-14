import Thread from './index';
import Database from '../utils/database';

export const createThread = (userId: number): Thread => {
  return new Thread(0, userId);
}

export const loadThread = async (db: Database, id: number): Promise<Thread|null> => {
  const row = await db.getDb()?.get('SELECT * FROM threads WHERE id = ?', [id]);
  if (!row) {
    return null;
  }
  const thread = new Thread(row.id, row.user_id, row.title, JSON.parse(row.messages));
  return thread;
};

export const saveThread = async (db: Database, thread: Thread) => {

  if (thread.id === 0) {

    const result = await db.getDb()?.run(
      `INSERT INTO threads (id, user_id, title, messages) VALUES (?, ?, ?, ?)`,
      [null, thread.userId, thread.title, JSON.stringify(thread.messages)]
    );

    if (result) {
      const lastId = await db.getDb()?.get('SELECT last_insert_rowid() as id');
      if (lastId) {
        thread.id = lastId.id;
      }
    }

  } else {

    await db.getDb()?.run(
      `UPDATE threads
      SET
        updated_at = ?,
        title = ?,
        messages = ?
      WHERE
        id = ?`,
      [
        new Date(), thread.title, JSON.stringify(thread.messages), thread.id
      ]
    );
  }
};
