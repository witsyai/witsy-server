import User from './index';
import Database from '../utils/database';
import logger from '../utils/logger';

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
    const user = new User(0, username, email);
    await saveUser(db, user);
    return user;

  } catch (error) {
    logger.error('Error creating user', error);
    throw new Error('Unknown error creating user', { cause: error });
  }
};

export const getUserById = async (db: Database, id: number): Promise<User | null> => {
  const userData = await db.getDb()?.get('SELECT * FROM users WHERE id = ?', [id]);
  return userData ? User.fromDatabaseRow(userData) : null;
}

export const getUserByEmail = async (db: Database, email: string): Promise<User | null> => {
  const userData = await db.getDb()?.get('SELECT * FROM users WHERE email = ?', [email]);
  return userData ? User.fromDatabaseRow(userData) : null;
}

export const getUserByAccessCode = async (db: Database, accessCode: string): Promise<User | null> => {
  const userData = await db.getDb()?.get('SELECT * FROM users WHERE access_code = ?', [accessCode]);
  return userData ? User.fromDatabaseRow(userData) : null;
}

const saveUser = async (db: Database, user: User): Promise<void> => {

  // insert or update?
  if (user.id === 0) {

    const result = await db.getDb()?.run(
      `INSERT INTO users (
        username, email, access_code, created_at, last_login_at,
        subscription_tier, subscription_expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user.username, user.email, user.accessCode, user.createdAt, user.lastLoginAt,
        user.subscriptionTier, user.subscriptionExpiresAt
      ]
    );

    if (result) {
      const lastId = await db.getDb()?.get('SELECT last_insert_rowid() as id');
      if (lastId) {
        user.id = lastId.id;
      }
    }

  } else {
    
    await db.getDb()?.run(
      `UPDATE users
      SET
        username = ?,
        email = ?,
        access_code = ?,
        created_at = ?,
        last_login_at = ?,
        subscription_tier = ?,
        subscription_expires_at = ?,
        credits_left = ?
      WHERE
        id = ?`,
      [
        user.username, user.email, user.accessCode, user.createdAt, user.lastLoginAt,
        user.subscriptionTier, user.subscriptionExpiresAt, user.creditsLeft, user.id
      ]
    );
  }
};
