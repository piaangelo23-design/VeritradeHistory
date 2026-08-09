const readyEvent = require('./ready');
const config = require('../config');

function isAdmin(userId) {
  return config.adminDiscordIds.includes(userId);
}

function buildDemoBatch(count) {
  const entries = Array.from({ length: Math.min(count, 10) }, (_, index) => {
    const playerA = `DemoPlayer${String(index * 2 + 1).padStart(3, '0')}`;
    const playerB = `DemoPlayer${String(index * 2 + 2).padStart(3, '0')}`;
    const payment = index % 2 === 0 ? '1,000 Robux' : '$20 money';
    return `${index + 1}. ${playerA} -> ${playerB}: ${payment} -> Demo MM2 Item`;
  });
  return [
    '⚠ **DEMO ONLY — NOT REAL TRADES** ⚠',
    `Requested demo batch: **${count} placeholder entries**. Nothing was saved to the website or database.`,
    'These placeholder entries are for display testing only. They are not Discord members, transactions, vouches, or statistics.',
    ...entries
  ].join('\n').slice(0, 1900);
}

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.content.trim().toLowerCase().startsWith('!post-demo')) {
      if (!isAdmin(message.author.id)) return;
      const requestedCount = Number(message.content.trim().split(/\s+/)[1] || 10);
      const count = Math.min(Math.max(Number.isFinite(requestedCount) ? requestedCount : 10, 1), 100);
      await message.channel.send(buildDemoBatch(count));
      return;
    }
    await readyEvent.handleMessage(message, client);
  }
};
