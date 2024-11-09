import express from 'express';
import portfinder from 'portfinder';
import path from 'path';
import threadRouter from './thread/router';
import llmRouter from './llm/router';
import dotenv from 'dotenv';
import Database from './utils/database';

dotenv.config();

const app = express();
app.use(express.json({ limit: '32mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/images', express.static(path.join(__dirname, '..', 'data', 'images')));

app.use('/thread', threadRouter);
app.use('/llm', llmRouter);

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
