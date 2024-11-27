
-- no alter table in sqlite
CREATE TABLE queries2 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INT NOT NULL,
  thread_id TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  engine VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  message_count INTEGER NOT NULL,
  attachment_count INTEGER NOT NULL,
  internet_search_count INTEGER NOT NULL,
  image_generation_count INTEGER NOT NULL,
  input_tokens INTEGER NOT NULL,
  input_cached_tokens INTEGER NOT NULL,
  input_audio_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  output_audio_tokens INTEGER NOT NULL,
  cost_credits INTEGER NOT NULL,
  cost_cents INTEGER NOT NULL
);


-- copy queries to queries2
INSERT INTO queries2 (id, user_id, thread_id, created_at, engine, model, message_count, attachment_count, internet_search_count, image_generation_count, input_tokens, input_cached_tokens, input_audio_tokens, output_tokens, output_audio_tokens, cost_credits, cost_cents)
SELECT id, user_id, thread_id, created_at, engine, model, message_count, attachment_count, 0, 0, input_tokens, input_cached_tokens, input_audio_tokens, output_tokens, output_audio_tokens, cost_credits, cost_cents
FROM queries;

-- drop users
DROP TABLE queries;

-- rename users2 to users
ALTER TABLE queries2 RENAME TO queries;
