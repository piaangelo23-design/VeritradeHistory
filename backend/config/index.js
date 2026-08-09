require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mm2_tracker',
  apiSecret: process.env.API_SECRET || '',
  corsOrigins: process.env.CORS_ORIGINS || 'http://localhost:3000',
  adminUsername: process.env.ADMIN_USERNAME || '',
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || '',
  discordGuildId: process.env.DISCORD_GUILD_ID || '',
  tradeChannelId: process.env.TRADE_CHANNEL_ID || '',
  syncInterval: parseInt(process.env.SYNC_INTERVAL, 10) || 60,
  trackingEnabled: process.env.TRACKING_ENABLED !== 'false',
  discordInvite: process.env.DISCORD_INVITE || 'https://discord.gg/HpPSfvjmmT',
  neblioApiBase: process.env.NEBLIO_API_BASE || '',
  neblioEnabled: process.env.NEBLIO_ENABLED !== 'false',
  jwtSecret: process.env.JWT_SECRET || ''
};
