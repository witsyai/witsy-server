import User, { UserTier } from './index';
import Database from '../utils/database';
import logger from '../utils/logger';

export const createUser = async (db: Database, username?: string, email?: string, tier?: string): Promise<User> => {
  try {
    // check if username or email is already taken
    if (username || email) {
      const existingUser = await db.getDb()?.get(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        [username, email]
      );
      if (existingUser) {
        throw new Error('Username or email is already taken');
      }
    }

    // create blank
    const user = new User(0);

    // update with provided values
    if (username) {
      user.username = username;
    }
    if (email) {
      user.email = email;
    }
    if (tier) {
      user.subscriptionTier = UserTier[tier as keyof typeof UserTier];
    } else {
      user.subscriptionTier = UserTier.Free;
      user.subscriptionExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
    }

    // save and done
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

export const getUserBySubscriptionId = async (db: Database, subscriptionId: string): Promise<User | null> => {
  const userData = await db.getDb()?.get('SELECT * FROM users WHERE subscription_id = ?', [subscriptionId]);
  return userData ? User.fromDatabaseRow(userData) : null;
}

export const saveUser = async (db: Database, user: User): Promise<void> => {

  // insert or update?
  if (user.id === 0) {

    const result = await db.getDb()?.run(
      `INSERT INTO users (
        username, email, user_token, created_at, last_login_at,
        subscription_id, subscription_tier, subscription_started_at,
        subscription_expires_at, subscription_last_payload, credits_left
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.username, user.email, user.userToken, user.createdAt, user.lastLoginAt,
        user.subscriptionId, user.subscriptionTier, user.subscriptionStartedAt, 
        user.subscriptionExpiresAt, user.subscriptionLastPayload, user.creditsLeft
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
        subscription_id = ?,
        subscription_tier = ?,
        subscription_started_at = ?,
        subscription_expires_at = ?,
        subscription_last_payload = ?,
        credits_left = ?
      WHERE
        id = ?`,
      [
        user.username, user.email, user.userToken, user.createdAt, user.lastLoginAt,
        user.subscriptionId, user.subscriptionTier, user.subscriptionStartedAt,
        user.subscriptionExpiresAt, JSON.stringify(user.subscriptionLastPayload), user.creditsLeft, user.id
      ]
    );
  }
};
