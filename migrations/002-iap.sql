
-- no alter table in sqlite
CREATE TABLE users2 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_token VARCHAR(255) NOT NULL,
  username VARCHAR(255) NULL,
  email VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP NULL,
  subscription_id VARCHAR(255) NULL,
  subscription_tier VARCHAR(255) NOT NULL DEFAULT 'free',
  subscription_started_at TIMESTAMP NULL,
  subscription_expires_at TIMESTAMP NULL,
  subscription_last_payload TEXT NULL,
  credits_left INTEGER NOT NULL DEFAULT 0
);

-- copy users to users2
INSERT INTO users2 (id, user_token, username, email, created_at, last_login_at, subscription_tier, subscription_expires_at, credits_left)
SELECT id, user_token, username, email, created_at, last_login_at, subscription_tier, subscription_expires_at, credits_left FROM users;

-- drop users
DROP TABLE users;

-- rename users2 to users
ALTER TABLE users2 RENAME TO users;
