
import { LlmUsage, Message } from 'multi-llm-ts';
import Database from '../utils/database';
import User from '../user';
import Configuration from '../utils/config';

export const rateLimitRpmForUser = (configuration: Configuration, user: User): number => {

  switch (user.subscriptionTier) {
    case 'free':
      return configuration.rateLimitRpmFree
    case 'basic':
      return configuration.rateLimitRpmBasic;
    case 'pro':
      return configuration.rateLimitRpmPro;
    case 'unlimited':
      return 0;
    default:
      throw new Error('Invalid subscription tier');
  }

};

export const rateLimitTokens24ForUser = (configuration: Configuration, user: User): number => {

  switch (user.subscriptionTier) {
    case 'free':
      return configuration.rateLimitTokens24hFree;
    case 'basic':
      return configuration.rateLimitTokens24hBasic;
    case 'pro':
      return configuration.rateLimitTokens24hPro;
    case 'unlimited':
      return 0;
    default:
      throw new Error('Invalid subscription tier');
  }

}

export const saveUserQuery = async (
  db: Database,
  user: User,
  threadId: string,
  engine: string,
  model: string,
  messages: Message[],
  usage: LlmUsage
) => {

  // count attachments
  const attachmentsCount = messages.filter(m => m.attachment).length;

  // extract data from usage
  const inputTokens = usage.prompt_tokens;
  const inputCachedTokens = usage.prompt_tokens_details?.cached_tokens || 0;
  const inputAudioTokens = usage.prompt_tokens_details?.audio_tokens || 0;
  const outputTokens = usage.completion_tokens;
  const outputAudioTokens = usage.completion_tokens_details?.audio_tokens || 0;

  // calculate costs
  const costCredits = 0;
  const costCents = 0;

  // Insert data into queries table
  await db.getDb()?.run(
    `INSERT INTO queries(
        user_id, thread_id, created_at, engine, model,
        message_count, attachment_count,
        input_tokens, input_cached_tokens, input_audio_tokens, output_tokens, output_audio_tokens,
        cost_credits, cost_cents
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id, threadId, new Date(), engine, model,
        messages.length, attachmentsCount,
        inputTokens, inputCachedTokens, inputAudioTokens, outputTokens, outputAudioTokens,
        costCredits, costCents
      ]
  );
}

// CREATE TABLE queries (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   user_id INT NOT NULL,
//   thread_id TEXT NOT NULL,
//   created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
//   engine VARCHAR(255) NOT NULL,
//   model VARCHAR(255) NOT NULL,
//   message_count INTEGER NOT NULL,
//   attachment_count INTEGER NOT NULL,
//   input_tokens INTEGER NOT NULL,
//   input_cached_tokens INTEGER NOT NULL,
//   input_audio_tokens INTEGER NOT NULL,
//   output_tokens INTEGER NOT NULL,
//   output_audio_tokens INTEGER NOT NULL,
//   cost_credits INTEGER NOT NULL,
//   cost_cents INTEGER NOT NULL
// );

export const userQueriesLastMinutes = async (db: Database, userId: number, minutes: number): Promise<number> => {
  const after = Date.now() - minutes * 60 * 1000;
  const result = await db.getDb()?.get('SELECT COUNT(*) as count FROM queries WHERE user_id = ? AND created_at > ?', [userId, after]);
  return result.count;
}

export const userTokensLast24Hours = async (db: Database, userId: number): Promise<number> => {
  const after = Date.now() - 24 * 60 * 60 * 1000;
  const result = await db.getDb()?.get('SELECT SUM(input_tokens) + SUM(output_tokens) as tokens FROM queries WHERE user_id = ? AND created_at > ?', [userId, after]);
  return result.tokens;
}
