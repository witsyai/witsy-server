import { LlmUsage, Message } from "multi-llm-ts";
import Database from "../utils/database";
import { getUserByAccessCode } from "../user/controller";
import logger from "../utils/logger";

export const saveUserQuery = async (
  db: Database,
  access_code: string,
  threadId: string,
  engine: string,
  model: string,
  messages: Message[],
  usage: LlmUsage
) => {

  // get user
  const user = await getUserByAccessCode(db, access_code);
  if (!user) {
    logger.warn('User accessCode not found when saving usage', access_code);
    return;
  }

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
