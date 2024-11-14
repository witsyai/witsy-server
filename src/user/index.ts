
export default class User {
  private _id: number;
  private _username: string;
  private _email: string;
  private _accessCode: string;
  private _createdAt: Date;
  private _lastLoginAt: Date;
  private _subscriptionTier: string;
  private _subscriptionExpiresAt: Date | null;
  private _creditsLeft: number;

  constructor(id: number, username: string, email: string) {
    this._id = id;
    this._username = username;
    this._email = email;
    this._accessCode = crypto.randomUUID();
    this._createdAt = new Date();
    this._lastLoginAt = new Date();
    this._subscriptionTier = 'free';
    this._subscriptionExpiresAt = null;
    this._creditsLeft = 0;
  }

  static fromDatabaseRow(row: any): User {
    const user = new User(row.id, row.username, row.email);
    user._accessCode = row.access_code;
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

  get accessCode(): string {
    return this._accessCode;
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

  get subscriptionTier(): string {
    return this._subscriptionTier;
  }

  set subscriptionTier(value: string) {
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
