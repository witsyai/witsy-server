import express from 'express';
import portfinder from 'portfinder';
import path from 'path';
import authRouter from './auth/router';
import userRouter from './user/router';
import threadRouter from './thread/router';
import llmRouter from './llm/router';
import voiceRouter from './voice/router';
import dotenv from 'dotenv';
import Database from './utils/database';
import { logger } from 'multi-llm-ts';

dotenv.config();

logger.set((...args: any[]) => {
  console.log('  - ', ...args);
});

const app = express();
app.use(express.json({ limit: '32mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/images', express.static(path.join(__dirname, '..', 'data', 'images')));

app.use((req, res, next) => {
  console.log(`${req.method.padEnd(4)} ${req.path}`);
  next();
});

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
    console.log('Database initialized');

    // Find an available port and start the server
    const port = await portfinder.getPortPromise({ port: process.env.PORT ? parseInt(process.env.PORT) : 3000 });
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
  }
};

startServer();
