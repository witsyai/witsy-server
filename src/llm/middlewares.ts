import { Response, NextFunction } from "express";
import { Message } from "multi-llm-ts";
import { AuthedRequest } from "../utils/middlewares";
import { LlmOpts } from "./controller";
import { getUserByAccessCode } from "../user/controller";
import * as usageController from "../usage/controller";

export interface LlmRequest extends AuthedRequest {
  llmOpts?: LlmOpts
  engineId?: string
  modelId?: string
  messages?: Message[]
}

// middleware to add llm options to the request
export const llmOptsMiddleware = (req: LlmRequest, res: Response, next: NextFunction): void => {
  const engineId = req.params.engine || req.body.engine;
  if (engineId === 'ollama') {
    req.llmOpts = { baseURL: '' }
  } else if (engineId) {
    if (req.accessCode != null) {
      const apiKeyEnvVar = `${engineId.toUpperCase()}_API_KEY`;
      const apiKey = process.env[apiKeyEnvVar];
      if (apiKey) {
        req.llmOpts = { apiKey, };
      } else {
        res.status(400).json({ error: `API key for engine ${engineId} not found` });
        return;
      }
    } else {
      const apiKey = req.body[`${engineId}Key`];
      if (apiKey) {
        req.llmOpts = { apiKey, };
      } else {
        res.status(400).json({ error: `API key for engine ${engineId} not found` });
        return;
      }
    }
  }
  next();
};

// middleware to add engine/model options to the request
export const engineModelMiddleware = (req: LlmRequest, res: Response, next: NextFunction): void => {
  const engineId = req.params.engine || req.body.engine;
  const modelId = req.params.model || req.body.model;
  if (engineId && modelId) {
    req.engineId = engineId;
    req.modelId = modelId;
  } else {
    res.status(400).json({ error: `engine and model required` });
    return;
  }
  next();
};

// middleware to add messages to the request
export const engineMessagesMiddleware = (req: LlmRequest, res: Response, next: NextFunction): void => {
  const messages = req.body.messages;
  if (messages && Array.isArray(messages)) {
    req.messages = messages;
  } else {
    res.status(400).json({ error: `messages array required` });
    return;
  }
  next();
};

// rate
export const rateLimitMiddleware = async (req: LlmRequest, res: Response, next: NextFunction): Promise<void> => {

  // only applicable to normal users
  if (req.role !== 'user') {
    next();
  }

  // get the user id
  const user = await getUserByAccessCode(req.db!, req.accessCode!)!;
  if (!user) {
    res.status(401).json({ error: 'Invalid accessCode' });
    return;
  }

  const rateLimitRpm = usageController.rateLimitRpmForUser(req.configuration!, user);
  const rateLimitTokens24 = usageController.rateLimitTokens24ForUser(req.configuration!, user);
  if (rateLimitRpm === 0 && rateLimitTokens24 == 0) {
    next();
    return;
  }
  
  // get last minute requests count
  const lastMinuteRequests = await usageController.userQueriesLastMinutes(req.db!, user.id, 1);
  if (lastMinuteRequests >= rateLimitRpm) {
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  } else {
    res.header('X-RateLimit-Rpm-Limit', `${rateLimitRpm}`);
    res.header('X-RateLimit-Rpm-Remaining', `${rateLimitRpm - lastMinuteRequests}`);
  }

  // get tokens over last 24h
  const tokens24h = await usageController.userTokensLast24Hours(req.db!, user.id);
  if (tokens24h >= rateLimitTokens24) {
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  } else {
    res.header('X-RateLimit-Tokens24h-Limit',`${rateLimitTokens24}`);
    res.header('X-RateLimit-Tokens24h-Remaining', `${rateLimitTokens24 - tokens24h}`);
  }

  // ok
  next();

}