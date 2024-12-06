
import { LlmUsage } from 'multi-llm-ts';
import Database from '../utils/database';
import User from '../user';
import Configuration from '../utils/config';
import Message from '../models/message';

// CREATE TABLE queries (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   user_id INT NOT NULL,
//   thread_id TEXT NOT NULL,
//   created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
//   engine VARCHAR(255) NOT NULL,
//   model VARCHAR(255) NOT NULL,
//   message_count INTEGER NOT NULL,
//   attachment_count INTEGER NOT NULL,
//   internet_search_count INTEGER NOT NULL,
//   image_generation_count INTEGER NOT NULL,
//   input_tokens INTEGER NOT NULL,
//   input_cached_tokens INTEGER NOT NULL,
//   input_audio_tokens INTEGER NOT NULL,
//   output_tokens INTEGER NOT NULL,
//   output_audio_tokens INTEGER NOT NULL,
//   cost_credits INTEGER NOT NULL,
//   cost_cents INTEGER NOT NULL
// );

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

export const imageLimitForUser = (configuration: Configuration, user: User): number => {

  switch (user.subscriptionTier) {
    case 'free':
      return configuration.imageLimitFree;
    case 'basic':
      return configuration.imageLimitBasic;
    case 'pro':
      return configuration.imageLimitPro;
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

  // count tool calls
  const lastMessage = messages[messages.length - 1];
  const internetSearches = lastMessage.toolCalls.filter(tc => tc.name === 'search_tavily').length;
  const imageGenerations = lastMessage.toolCalls.filter(tc => tc.name === 'image_generation').length;

  // calculate costs
  const costCredits = 0;
  const costCents = 0;

  // Insert data into queries table
  await db.getDb()?.run(
    `INSERT INTO queries(
        user_id, thread_id, created_at, engine, model,
        message_count, attachment_count, internet_search_count, image_generation_count,
        input_tokens, input_cached_tokens, input_audio_tokens, output_tokens, output_audio_tokens,
        cost_credits, cost_cents
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id, threadId, new Date(), engine, model,
        messages.length, attachmentsCount, internetSearches, imageGenerations,
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

export const userTotalQueries = async (db: Database, userId: number): Promise<number> => {
  const result = await db.getDb()?.get('SELECT COUNT(*) as count FROM queries WHERE user_id = ?', [userId]);
  return result.count;
}

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

// need sum of input_tokens and output_tokens for a user for last 7 days grouped by day
export const userUsageLastDays = async (db: Database, userId: number, days: number = 7): Promise<unknown[]> => {

  const after = Date.now() - days * 24 * 60 * 60 * 1000;
  const result = await db.getDb()?.all(`
    SELECT DATE(ROUND(created_at/1000), "unixepoch") as day, COUNT(DISTINCT id) as queries, COUNT(DISTINCT thread_id) as threads,
    SUM(input_tokens) as it, SUM(output_tokens) as ot, SUM(image_generation_count) as ig
    FROM queries
    WHERE user_id = ? AND created_at > ?
    GROUP BY day
    ORDER BY day DESC
  `, [userId, after]);

  const usages = [];
  for (let i=1; i<=days; i++) {
    const date = new Date(after + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const usage = result?.find(r => r.day === date);
    if (usage) {
      usages.push({
        date: date,
        queries: usage.queries,
        threads: usage.threads,
        inputTokens: usage.it,
        outputTokens: usage.ot,
        totalTokens: usage.it + usage.ot,
        imageGenerations: usage.ig
      });
    } else {
      usages.push({
        date: date,
        queries: 0,
        threads: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        imageGenerations: 0
      });
    }
  }

  return usages.reverse();

}

// top 10 users by usage in last hours
export const topUsersLastHours = async (db: Database, hours: number, top: number = 10): Promise<unknown[]> => {
  const after = Date.now() - hours * 60 * 60 * 1000;
  const result = await db.getDb()?.all(`
    SELECT u.id as user_id, u.username, u.subscription_tier as tier,
    SUM(q.input_tokens) as it, SUM(q.output_tokens) as ot, SUM(q.image_generation_count) as ig
    FROM queries q
    JOIN users u ON q.user_id = u.id
    WHERE q.created_at > ?
    GROUP BY u.id, u.username
    ORDER BY it + ot DESC
    LIMIT ?
  `, [after, top]);
  return result?.map(r => ({
    id: r.user_id,
    username: r.username,
    subscriptionTier: r.tier,
    inputTokens: r.it,
    outputTokens: r.ot,
    totalTokens: r.it + r.ot,
    imageGenerations: r.ig,
    dailyAverage: Math.round((r.it + r.ot) / (hours/24))
  })) || [];
}

// provide total tokens over last hours. whatever the number of hours we provide numMeasures values total  
export const totalTokensLastHours = async (db: Database, hours: number = 24): Promise<unknown[]> => {
  
  // needed
  const numMeasures = 20;
  const after = Date.now() - hours * 60 * 60 * 1000;

  const bounds = await db.getDb()?.get(`
    SELECT MIN(created_at) as min, MAX(created_at)-MIN(created_at) as size
    FROM queries
    WHERE created_at > ?`,
    [after]);

  // we are mapping the min(created_at):max(created_at) interval to 0:99
  // 1st line is: created_at - min / ((max-min) / 100)
  
  const result = await db.getDb()?.all(`
    SELECT FLOOR((created_at - ?) / (? / ?)) as instant,
    SUM(input_tokens) as it, SUM(output_tokens) as ot, SUM(image_generation_count) as ig
    FROM queries
    WHERE created_at > ?
    GROUP BY instant
    ORDER BY instant
    LIMIT 100
  `, [bounds.min, bounds.size, numMeasures, after]);
  
  // now we need to build a final array with 100 values even there is no data
  const usages = [];
  for (let i=0; i<numMeasures; i++) {
    // first we need to date in string
    const instant = bounds.min + i * bounds.size / numMeasures;
    const date = new Date(instant).toISOString();

    // then we need to find the value
    const usage = result?.find(r => r.instant === i);
    if (usage) {
      usages.push({
        date: date,
        inputTokens: usage.it,
        outputTokens: usage.ot,
        totalTokens: usage.it + usage.ot,
        imageGenerations: usage.ig
      });
    } else {
      usages.push({
        date: date,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        imageGenerations: 0
      });
    }
  }

  // done
  return usages;

}

// number of images generated for one user in last month
export const imageCountLastMonth = async (db: Database, userId: number): Promise<number> => {
  const after = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const result = await db.getDb()?.get('SELECT SUM(image_generation_count) as count FROM queries WHERE user_id = ? AND created_at > ?', [userId, after]);
  return result.count;
}
