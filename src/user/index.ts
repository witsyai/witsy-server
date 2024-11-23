
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
  private _userToken: string;
  private _username: string | null;
  private _email: string | null;
  private _createdAt: Date;
  private _lastLoginAt: Date;
  private _subscriptionId: string | null;
  private _subscriptionTier: UserTier;
  private _subscriptionStartedAt: number | null;
  private _subscriptionExpiresAt: number | null;
  private _subscriptionLastPayload: object | null;
  private _creditsLeft: number;

  constructor(id: number) {
    this._id = id;
    this._userToken = crypto.randomUUID();
    this._username = null;
    this._email = null;
    this._createdAt = new Date();
    this._lastLoginAt = new Date();
    this._subscriptionId = null;
    this._subscriptionTier = UserTier.Free;
    this._subscriptionStartedAt = null;
    this._subscriptionExpiresAt = null;
    this._subscriptionLastPayload = null;
    this._creditsLeft = 0;
  }

  static fromDatabaseRow(row: any): User {
    const user = new User(row.id);
    user._userToken = row.user_token;
    user._username = row.username;
    user._email = row.email;
    user._createdAt = new Date(row.created_at);
    user._lastLoginAt = new Date(row.last_login_at);
    user._subscriptionId = row.subscription_id;
    user._subscriptionTier = row.subscription_tier;
    user._subscriptionStartedAt = row.subscription_started_at;
    user._subscriptionExpiresAt = row.subscription_expires_at;
    user._subscriptionLastPayload = row.subscription_last_payload ? JSON.parse(row.subscription_last_payload) : null;
    user._creditsLeft = row.credits_left
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

  get username(): string | null {
    return this._username;
  }

  set username(value: string) {
    this._username = value;
  }

  get email(): string | null {
    return this._email;
  }

  set email(value: string) {
    this._email = value;
  }

  get userToken(): string {
    return this._userToken;
  }

  set userToken(value: string) {
    this._userToken = value;
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

  get subscriptionId(): string | null {
    return this._subscriptionId;
  }

  set subscriptionId(value: string | null) {
    this._subscriptionId = value;
  }

  get subscriptionTier(): UserTier {
    return this._subscriptionTier;
  }

  set subscriptionTier(value: UserTier) {
    this._subscriptionTier = value;
  }

  get subscriptionStartedAt(): number | null {
    return this._subscriptionStartedAt;
  }

  set subscriptionStartedAt(value: number | null) {
    this._subscriptionStartedAt = value;
  }
  
  get subscriptionExpiresAt(): number | null {
    return this._subscriptionExpiresAt;
  }

  set subscriptionExpiresAt(value: number | null) {
    this._subscriptionExpiresAt = value;
  }

  get subscriptionLastPayload(): object | null {
    return this._subscriptionLastPayload;
  }

  set subscriptionLastPayload(value: object | null) {
    this._subscriptionLastPayload = value;
  }

  get creditsLeft(): number {
    return this._creditsLeft;
  }

  set creditsLeft(value: number) {
    this._creditsLeft = value;
  }
}
