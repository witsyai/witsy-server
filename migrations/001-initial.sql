--
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  access_code VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  subscription_tier VARCHAR(255) NOT NULL DEFAULT 'free',
  subscription_expires_at TIMESTAMP,
  credits_left INTEGER NOT NULL DEFAULT 0
);

--
CREATE TABLE queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INT NOT NULL,
  thread_id TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  engine VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  message_count INTEGER NOT NULL,
  attachment_count INTEGER NOT NULL,
  input_tokens INTEGER NOT NULL,
  input_cached_tokens INTEGER NOT NULL,
  input_audio_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  output_audio_tokens INTEGER NOT NULL,
  cost_credits INTEGER NOT NULL,
  cost_cents INTEGER NOT NULL
);

--
CREATE TABLE threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  title TEXT NOT NULL,
  messages TEXT
);
