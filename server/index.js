import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import routes from './src/routes/index.js';
import { initSocket } from './src/config/socket.js';
import { errorMiddleware } from './src/middlewares/error.middleware.js';
import prisma from './src/config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'uploads')));

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ message: 'Odoo Cafe POS API is running!' });
});

app.use(errorMiddleware);

const server = http.createServer(app);
initSocket(server);

// ── Ping DB on startup (handles Neon cold-start / sleep) ──────────────────
async function connectWithRetry(retries = 5, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connected');
      return;
    } catch (err) {
      console.warn(`⚠️  DB connection attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt < retries) {
        console.log(`   Retrying in ${delayMs / 1000}s (Neon may be waking up)...`);
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        console.error('❌ Could not connect to database after multiple attempts.');
      }
    }
  }
}

server.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await connectWithRetry();
});
