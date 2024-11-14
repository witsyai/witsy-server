import User from './index';
import Database from '../utils/database';
import { LlmUsage, Message } from 'multi-llm-ts';

export const createUser = async (db: Database, userData: { username: string; email: string }): Promise<User> => {
  try {
    const { username, email } = userData;

    // check if username or email is already taken
    const existingUser = await db.getDb()?.get(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existingUser) {
      throw new Error('Username or email is already taken');
    }

    // we can save
    const user = new User(crypto.randomUUID(), username, email);
    await saveUser(db, user);
    return user;

  } catch (error) {
    throw new Error('Unknown error creating user', { cause: error });
  }
};

export const saveUserQuery = async (
  db: Database,
  access_code: string,
  engine: string,
  model: string,
  messages: Message[],
  usage: LlmUsage
) => {

  // get user
  const user = await getUserByAccessCode(db, access_code);
  if (!user) {
    throw new Error('User not found');
  }

  // count attachments
  const attachmentsCount = messages.filter(m => m.attachment).length;

  // extract data from usage
  const inputTokens = usage.prompt_tokens;
  const inputCached = usage.prompt_tokens_details?.cached_tokens || 0;
  const inputAudioTokens = usage.prompt_tokens_details?.audio_tokens || 0;
  const outputTokens = usage.completion_tokens;
  const outputAudioTokens = usage.completion_tokens_details?.audio_tokens || 0;

  // Insert data into queries table
  await db.getDb()?.run(
    `INSERT INTO queries (uuid, user_id, created_at, engine, model, message_count, attachment_count, input_tokens, input_cached_tokens, input_audio_tokens, output_tokens, output_audio_tokens) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [crypto.randomUUID(), user.uuid, new Date(), engine, model, messages.length, attachmentsCount, inputTokens, inputCached, inputAudioTokens, outputTokens, outputAudioTokens]
  );
}

export const getUserByEmail = async (db: Database, email: string): Promise<User | null> => {
  const userData = await db.getDb()?.get('SELECT * FROM users WHERE email = ?', [email]);
  return userData ? User.fromDatabaseRow(userData) : null;
}

export const getUserById = async (db: Database, userId: string): Promise<User | null> => {
  const userData = await db.getDb()?.get('SELECT * FROM users WHERE uuid = ?', [userId]);
  return userData ? User.fromDatabaseRow(userData) : null;
}

export const getUserByAccessCode = async (db: Database, accessCode: string): Promise<User | null> => {
  const userData = await db.getDb()?.get('SELECT * FROM users WHERE access_code = ?', [accessCode]);
  return userData ? User.fromDatabaseRow(userData) : null;
}

const saveUser = async (db: Database, user: User) => {
  await db.getDb()?.run(
    `INSERT OR REPLACE INTO users (uuid, username, email, access_code, created_at, last_login_at, subscription_tier, subscription_expires_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [user.uuid, user.username, user.email, user.accessCode, user.createdAt, user.lastLoginAt, user.subscriptionTier, user.subscriptionExpiresAt]
  );
};
