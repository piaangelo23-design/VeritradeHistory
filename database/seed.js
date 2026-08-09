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
    avatar: 'https://media.discordapp.net/attachments/1474771451554037801/1525567093863616634/image.png?ex=6a796d52&is=6a781bd2&hm=106bc29289882c1c7526fb808349dd837e19389093908d771d7189f47c7dd3d2&=&format=webp&quality=lossless',
    isPlaceholder: true,
    sortOrder: 5
  }
];

async function seed() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(config.mongoUri);
  }

  for (const mm of MIDDLEMEN) {
    const existing = await Middleman.findOne({ $or: [{ slug: mm.slug }, { name: mm.name }] });
    if (existing) {
      await Middleman.updateOne(
        { _id: existing._id },
        { $set: mm }
      );
    } else {
      await Middleman.create({
        ...mm,
        vouches: 0,
        completedTrades: 0,
        successRate: 100,
        isTrusted: true,
        active: !mm.isPlaceholder
      });
    }
  }

  const settings = await Settings.findOneAndUpdate(
    { key: 'app' },
    {
      $setOnInsert: {
        guildId: config.discordGuildId,
        tradeChannelId: config.tradeChannelId,
        trackingEnabled: config.trackingEnabled,
        syncInterval: config.syncInterval,
        smallTradeMax: 500,
        mediumTradeMax: 2999
      }
    },
    { upsert: true, new: true }
  );

  if ((settings.seedVersion || 0) < 1) {
    await Middleman.updateMany(
      { slug: { $in: MIDDLEMEN.filter(mm => !mm.isPlaceholder).map(mm => mm.slug) } },
      { $set: { active: true } }
    );
    await Middleman.updateOne({ slug: 'placeholder' }, { $set: { active: false } });
    settings.seedVersion = 1;
    await settings.save();
  }

  if ((settings.seedVersion || 0) < 2) {
    settings.mediumTradeMax = 2999;
    settings.seedVersion = 2;
    await settings.save();
  }

  await WebsiteStats.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { totalVisits: 0, visitBaseline: config.visitBaseline, memberBaseline: config.memberBaseline, smallTradeBaseline: config.smallTradeBaseline, mediumTradeBaseline: config.mediumTradeBaseline, largeTradeBaseline: config.largeTradeBaseline } },
    { upsert: true }
  );

  console.log('[Seed] Database initialized');
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
} else {
  module.exports = seed;
}
