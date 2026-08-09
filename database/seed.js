require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const config = require('../backend/config');
const { Middleman, Settings, WebsiteStats } = require('../backend/models');

const MIDDLEMEN = [
  {
    slug: 'nexus',
    name: 'Nexus',
    displayName: 'Nexus',
    avatar: 'https://images-ext-1.discordapp.net/external/0YuLdkrSFKz-YwUpsuSBoHIYUHyPqst1ktVrn5vNfU8/https/cdn.discordapp.com/avatars/1503592341070676132/943a4104c662e1ae3d3c3da649605c8c.webp?format=webp',
    aliases: ['Nexus'],
    sortOrder: 1
  },
  {
    slug: 'sheikh-yazan',
    name: '[MM] Sheikh Yazan',
    displayName: 'Sheikh Yazan',
    avatar: 'https://images-ext-1.discordapp.net/external/TKPwvPdy3ucDh5LY8zJwYN5GkRVknya3bVTZLJ3FjeA/https/cdn.discordapp.com/avatars/1258316275554324512/82b9447ddd71839d5efe87351ca54d67.webp?format=webp',
    aliases: ['Sheikh Yazan', '[MM] Sheikh Yazan'],
    sortOrder: 2
  },
  {
    slug: 'ax-kane',
    name: 'Ax^Kane ❣MM❣:✅',
    displayName: 'Ax^Kane',
    avatar: 'https://images-ext-1.discordapp.net/external/Gvu61eOBzyNhSSGmbrX4WK7DsHVtLmwJ_5jy6VrDBn8/https/cdn.discordapp.com/avatars/1393307310428000286/96504c97e686e1394d3a02c70e71f43a.webp?format=webp',
    aliases: ['Ax^Kane', 'Ax Kane'],
    sortOrder: 3
  },
  {
    slug: 'bka-an-die-macht',
    name: 'BKA AN DIE MACHT',
    displayName: 'BKA AN DIE MACHT',
    avatar: 'https://images-ext-1.discordapp.net/external/ChrUUzz0JrUaa4GoszF7adILMTPM2HN4bmuMVyDYhKY/https/cdn.discordapp.com/avatars/1124258480459616327/6a1a46f22e52730281cc082b1c473617.webp?format=webp',
    aliases: ['BKA AN DIE MACHT', 'BKA'],
    sortOrder: 4
  },
  {
    slug: 'placeholder',
    name: 'Fifth Middleman',
    displayName: 'Coming Soon',
    avatar: 'https://media.discordapp.net/attachments/1474771451554037801/1525567093863616634/image.png?ex=6a74d012&is=6a737e92&hm=037caa22bbae6f0658e1bc9e4c4a998a78454175be77f5e1ef817a1dfcb1b9f3&=&format=webp&quality=lossless',
    isPlaceholder: true,
    sortOrder: 5
  }
];

async function seed() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(config.mongoUri);
  }

  for (const mm of MIDDLEMEN) {
    await Middleman.findOneAndUpdate(
      { slug: mm.slug },
      { $setOnInsert: { vouches: 0, completedTrades: 0, successRate: 100, isTrusted: true, active: true }, $set: mm },
      { upsert: true, new: true }
    );
  }

  await Settings.findOneAndUpdate(
    { key: 'app' },
    {
      $setOnInsert: {
        guildId: config.discordGuildId,
        tradeChannelId: config.tradeChannelId,
        trackingEnabled: config.trackingEnabled,
        syncInterval: config.syncInterval,
        smallTradeMax: 500,
        mediumTradeMax: 5000
      }
    },
    { upsert: true }
  );

  await WebsiteStats.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { totalVisits: 0 } },
    { upsert: true }
  );

  console.log('[Seed] Database initialized');
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
} else {
  module.exports = seed;
}
