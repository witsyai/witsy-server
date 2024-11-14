
export default class User {
  private _uuid: string;
  private _username: string;
  private _email: string;
  private _accessCode: string;
  private _createdAt: Date;
  private _lastLoginAt: Date;
  private _subscriptionTier: string;
  private _subscriptionExpiresAt: Date | null;

  constructor(uuid: string, username: string, email: string) {
    this._uuid = uuid;
    this._username = username;
    this._email = email;
    this._accessCode = crypto.randomUUID();
    this._createdAt = new Date();
    this._lastLoginAt = new Date();
    this._subscriptionTier = 'free';
    this._subscriptionExpiresAt = null;
  }

  static fromDatabaseRow(row: any): User {
    const user = new User(row.uuid, row.username, row.email);
    user._accessCode = row.access_code;
    user._createdAt = new Date(row.created_at);
    user._lastLoginAt = new Date(row.last_login_at);
    user._subscriptionTier = row.subscription_tier;
    user._subscriptionExpiresAt = row.subscription_expires_at ? new Date(row.subscription_expires_at) : null;
    return user;
  }

  get uuid(): string {
    return this._uuid;
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

  get subscriptionTier(): string {
    return this._subscriptionTier;
  }

  get subscriptionExpiresAt(): Date | null {
    return this._subscriptionExpiresAt;
  }
}