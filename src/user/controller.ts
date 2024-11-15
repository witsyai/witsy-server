import User, { UserTier } from './index';
import Database from '../utils/database';
import logger from '../utils/logger';

export const createUser = async (db: Database, username: string, email: string, tier: UserTier): Promise<User> => {
  try {
    // check if username or email is already taken
    const existingUser = await db.getDb()?.get(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existingUser) {
      throw new Error('Username or email is already taken');
    }

    // we can save
    const user = new User(0, username, email, tier);
    await saveUser(db, user);
    return user;

  } catch (error) {
    logger.error('Error creating user', error);
    throw new Error('Unknown error creating user', { cause: error });
  }
};

  export const editUser = async (
  db: Database,
  userId: number,
  email: string,
  userToken: string,
  subscriptionTier: UserTier,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  subscriptionExpiresAt: Date
): Promise<void> => {
  try {
    const user = await getUserById(db, userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.email = email;
    user.userToken = userToken;
    user.subscriptionTier = subscriptionTier;
    //user.subscriptionExpiresAt = subscriptionExpiresAt;

    await saveUser(db, user);
  } catch (error) {
    logger.error('Error updating user', error);
    throw new Error('Unknown error updating user', { cause: error });
  }
};

export const getUserById = async (db: Database, id: number): Promise<User | null> => {
  const userData = await db.getDb()?.get('SELECT * FROM users WHERE id = ?', [id]);
  return userData ? User.fromDatabaseRow(userData) : null;
}

export const findUsers = async (db: Database, query: string): Promise<User[]> => {
  const usersData = await db.getDb()?.all(
    'SELECT * FROM users WHERE username LIKE ? OR email LIKE ?',
    [`%${query}%`, `%${query}%`]
  );
  return usersData ? usersData.map(User.fromDatabaseRow) : [];
}

export const getUserByEmail = async (db: Database, email: string): Promise<User | null> => {
  const userData = await db.getDb()?.get('SELECT * FROM users WHERE email = ?', [email]);
  return userData ? User.fromDatabaseRow(userData) : null;
}

export const getUserByToken = async (db: Database, userToken: string): Promise<User | null> => {
  const userData = await db.getDb()?.get('SELECT * FROM users WHERE user_token = ?', [userToken]);
  return userData ? User.fromDatabaseRow(userData) : null;
}

const saveUser = async (db: Database, user: User): Promise<void> => {

  // insert or update?
  if (user.id === 0) {

    const result = await db.getDb()?.run(
      `INSERT INTO users (
        username, email, user_token, created_at, last_login_at,
        subscription_tier, subscription_expires_at, credits_left
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.username, user.email, user.userToken, user.createdAt, user.lastLoginAt,
        user.subscriptionTier, user.subscriptionExpiresAt, user.creditsLeft
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
        user_token = ?,
        created_at = ?,
        last_login_at = ?,
        subscription_tier = ?,
        subscription_expires_at = ?,
        credits_left = ?
      WHERE
        id = ?`,
      [
        user.username, user.email, user.userToken, user.createdAt, user.lastLoginAt,
        user.subscriptionTier, user.subscriptionExpiresAt, user.creditsLeft, user.id
      ]
    );
  }
};
