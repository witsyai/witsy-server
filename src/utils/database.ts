import sqlite3 from 'sqlite3';
import { open, Database as SqliteDatabase } from 'sqlite';
import fs from 'fs';
import User from '../user';

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
    await this.db.migrate({
      migrationsPath: './migrations'
    });
  }

  public getDb() {
    return this.db;
  }

  public async isValidAccessCode(code: string) {
    const result = await this.db?.get('SELECT COUNT(*) AS count FROM users WHERE access_code = ?', [code]);
    return result.count === 1;
  }

}

export default Database;
