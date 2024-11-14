--
CREATE TABLE users (
  uuid TEXT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  access_code VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  subscription_tier VARCHAR(255) NOT NULL DEFAULT 'free',
  subscription_expires_at TIMESTAMP
);

--
CREATE TABLE queries (
  uuid TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  engine VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  message_count INTEGER NOT NULL,
  attachment_count INTEGER NOT NULL,
  input_tokens INTEGER NOT NULL,
  input_cached_tokens INTEGER NOT NULL,
  input_audio_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  output_audio_tokens INTEGER NOT NULL
);

--
CREATE TABLE threads (
  uuid TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  messages TEXT
);
