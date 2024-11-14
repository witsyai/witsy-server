
export enum UserTier {
  Free = 'free',
  Basic = 'basic',
  Pro = 'pro',
  Unlimited = 'unlimited'
}

export const isValidUserTier = (tier: string): boolean => {
  return Object.values(UserTier).includes(tier as UserTier);
};

export default class User {
  private _id: number;
  private _username: string;
  private _email: string;
  private _userToken: string;
  private _createdAt: Date;
  private _lastLoginAt: Date;
  private _subscriptionTier: UserTier;
  private _subscriptionExpiresAt: Date | null;
  private _creditsLeft: number;

  constructor(id: number, username: string, email: string, tier: UserTier) {
    this._id = id;
    this._username = username;
    this._email = email;
    this._userToken = crypto.randomUUID();
    this._createdAt = new Date();
    this._lastLoginAt = new Date();
    this._subscriptionTier = tier;
    this._subscriptionExpiresAt = null;
    this._creditsLeft = 0;
  }

  static fromDatabaseRow(row: any): User {
    const user = new User(row.id, row.username, row.email, row.subscription_tier);
    user._userToken = row.user_token;
    user._createdAt = new Date(row.created_at);
    user._lastLoginAt = new Date(row.last_login_at);
    user._subscriptionTier = row.subscription_tier;
    user._subscriptionExpiresAt = row.subscription_expires_at ? new Date(row.subscription_expires_at) : null;
    user._creditsLeft = row.credits
    return user;
  }

  get id(): number {
    return this._id;
  }

  set id(value: number) {
    if (this._id !== 0) {
      throw new Error('Cannot change ID of existing user');
    }
    this._id = value;
  }

  get username(): string {
    return this._username;
  }

  get email(): string {
    return this._email;
  }

  get userToken(): string {
    return this._userToken;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get lastLoginAt(): Date {
    return this._lastLoginAt;
  }

  set lastLoginAt(value: Date) {
    this._lastLoginAt = value;
  }

  get subscriptionTier(): UserTier {
    return this._subscriptionTier;
  }

  set subscriptionTier(value: UserTier) {
    this._subscriptionTier = value;
  }

  get subscriptionExpiresAt(): Date | null {
    return this._subscriptionExpiresAt;
  }

  set subscriptionExpiresAt(value: Date | null) {
    this._subscriptionExpiresAt = value;
  }

  get creditsLeft(): number {
    return this._creditsLeft;
  }

  set creditsLeft(value: number) {
    this._creditsLeft = value;
  }
}
