import express from 'express';
import portfinder from 'portfinder';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import authRouter from './auth/router';
import userRouter from './user/router';
import threadRouter from './thread/router';
import llmRouter from './llm/router';
import voiceRouter from './voice/router';
import dotenv from 'dotenv';
import Database from './utils/database';
import { configurationMiddleware } from './utils/middlewares';
import { logger as llmLogger } from 'multi-llm-ts';
import logger from './utils/logger';
import path from 'path';

dotenv.config();

// init app
const app = express();
app.use(express.json({ limit: '32mb' }));

// logging
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', {
  stream: { write: (message: string) => logger.http(message.trim()), }
}))
llmLogger.set(logger.debug);

// security
if (process.env.NODE_ENV === 'production') {
  app.use(helmet())
}
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ['https://www.witsyai.com', 'https://console.witsyai.com'] : '*'
}))

// we need a configuration
app.use(configurationMiddleware);

// static access
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/images', express.static(path.join(__dirname, '..', 'data', 'images')));

app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/thread', threadRouter);
app.use('/llm', llmRouter);
app.use('/voice', voiceRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const startServer = async () => {
  try {
    // initialize the database
    await Database.getInstance();
    logger.info('Database initialized');

    // Find an available port and start the server
    const port = await portfinder.getPortPromise({ port: process.env.PORT ? parseInt(process.env.PORT) : 3000 });
    app.listen(port, () => {
      logger.info(`Server is running on http://localhost:${port}`);
    });
  } catch (err) {
    logger.error('Failed to start server', err);
  }
};

startServer();
