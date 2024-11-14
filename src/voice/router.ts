import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { accessCodeMiddleware } from '../utils/middlewares';
import { Readable } from 'stream';

const router = Router();

// to create a new thread
router.post('/tts', accessCodeMiddleware, async (req: Request, res: Response) => {

  // auth is done so we have one of them
  // prioritize the one provided in the body (user)
  const apiKey = req.body.openaiKey || process.env.OPENAI_API_KEY;
  const client = new OpenAI({ apiKey: apiKey })
  
  // call
  const response = await client.audio.speech.create({
    model: 'tts-1',
    voice: 'alloy',
    response_format: 'mp3',
    input: req.body.text,
  });

  // set streaming headers
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Transfer-Encoding', 'chunked');

  const webStream = response.body as unknown as Iterable<Uint8Array>;
  const nodeStream = Readable.from(webStream);
  nodeStream.pipe(res);

});

export default router;
