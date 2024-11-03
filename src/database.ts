
import sqlite3 from 'sqlite3';
import { open, Database as SqliteDatabase } from 'sqlite';
import fs from 'fs';

class Database {
  private static instance: Database;
  private db?: SqliteDatabase<sqlite3.Database, sqlite3.Statement>;

  private constructor() {}

  public static async getInstance(): Promise<Database> {
    if (!Database.instance) {
      Database.instance = new Database();
      await Database.instance.initialize();
    }
    return Database.instance;
  }

  private async initialize() {
    fs.mkdirSync('data', { recursive: true });
    this.db = await open({
      filename: './data/database.sqlite',
      driver: sqlite3.Database
    });
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS threads (
        id TEXT PRIMARY KEY,
        messages TEXT
      )
    `);
  }

  public async saveThread(id: string, messages: string) {
    await this.db?.run('INSERT OR REPLACE INTO threads (id, messages) VALUES (?, ?)', [id, messages]);
  }

  public async getThread(id: string) {
    return this.db?.get('SELECT * FROM threads WHERE id = ?', [id]);
  }
}

export default Database;
