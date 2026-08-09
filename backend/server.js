const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { Server } = require('socket.io');
const config = require('./config');
const { initSocket } = require('./websocket');
const { setIO, recalculateStats } = require('./services/tradeService');
const { apiLimiter } = require('./middleware/rateLimit');

const botRoutes = require('./routes/bot');
const tradesRoutes = require('./routes/trades');
const middlemenRoutes = require('./routes/middlemen');
const statsRoutes = require('./routes/stats');
const activitiesRoutes = require('./routes/activities');
const neblioRoutes = require('./routes/neblio');
const adminRoutes = require('./routes/admin');
const externalRoutes = require('./routes/external');

async function seedIfNeeded() {
  const seed = require('../database/seed');
  await seed();
}

async function startServer() {
  const missing = ['API_SECRET', 'JWT_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD_HASH']
    .filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const app = express();
  const server = http.createServer(app);

  const corsOptions = config.corsOrigins === '*'
    ? { origin: true, credentials: true }
    : { origin: config.corsOrigins.split(',').map(s => s.trim()), credentials: true };

  const io = new Server(server, { cors: corsOptions });
  setIO(io);
  initSocket(io);

  app.set('trust proxy', 1);
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
  app.use(compression());
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(apiLimiter);


  app.use('/api/external', externalRoutes);
  app.use('/api/bot', botRoutes);
  app.use('/api/trades', tradesRoutes);
  app.use('/api/middlemen', middlemenRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/activities', activitiesRoutes);
  app.use('/api/neblio', neblioRoutes);
  app.use('/api/admin', adminRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', env: config.nodeEnv, time: new Date().toISOString() });
  });

  app.get('/api/config/public', (req, res) => {
    res.json({
      discordInvite: config.discordInvite,
      syncInterval: config.syncInterval,
      trackingEnabled: config.trackingEnabled
    });
  });

  const frontendPath = path.join(__dirname, '../frontend');
  app.use(express.static(frontendPath));

  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found' });
    }
    const reqPath = req.path === '/' ? '/index.html' : (req.path.endsWith('.html') ? req.path : `${req.path}.html`);
    const file = path.join(frontendPath, reqPath);
    res.sendFile(file, (err) => {
      if (err) res.sendFile(path.join(frontendPath, 'index.html'));
    });
  });

  try {
    await mongoose.connect(config.mongoUri);
    console.log('[MongoDB] Connected');
    await seedIfNeeded();
    await recalculateStats();
    console.log('[Stats] Recalculated');
  } catch (error) {
    console.error('[MongoDB] Connection failed:', error.message);
    process.exit(1);
  }

  server.listen(config.port, () => {
    console.log(`[Server] Running on http://localhost:${config.port}`);
  });

  io.on('connection', () => {});
}

startServer().catch(console.error);
