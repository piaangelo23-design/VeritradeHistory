const config = require('../config');
const { parseTradeMessage } = require('../handlers/tradeParser');
const { processTradeMessage } = require('../handlers/tradeHandler');
const { reportStatus, fetchSettings, logSync } = require('../handlers/apiClient');

let parserConfig = null;
let lastTrade = null;
let lastSync = null;

async function loadParserConfig() {
  try {
    const settings = await fetchSettings();
    parserConfig = settings.tradeParser;
    return settings;
  } catch (error) {
    console.error('[Bot] Failed to fetch parser settings:', error.message);
    return null;
  }
}

async function updateStatus(client, extra = {}) {
  const guild = client.guilds.cache.get(config.guildId);
  const channel = guild?.channels.cache.get(config.tradeChannelId);
  const permissions = channel ? channel.permissionsFor(client.user) : null;

  const status = {
    connected: client.isReady(),
    guildConnected: Boolean(guild),
    channelAccessible: Boolean(channel && permissions?.has('ViewChannel') && permissions?.has('ReadMessageHistory')),
    memberCount: guild?.memberCount || 0,
    trackingActive: config.trackingEnabled,
    lastTrade,
    lastSync,
    ...extra
  };

  try {
    await reportStatus(status);
  } catch (error) {
    console.error('[Bot] Status report failed:', error.message);
  }
}

async function runSync(client, source = 'scheduled') {
  const previousSync = lastSync
    ? new Date(lastSync)
    : new Date(Date.now() - config.syncInterval * 1000);
  lastSync = new Date().toISOString();
  await loadParserConfig();
  if (config.autoTradesEnabled) {
    try {
      await syncRecentTradeMessages(client, previousSync);
    } catch (error) {
      console.error('[Bot] Trade sync failed:', error.message);
    }
  }
  await updateStatus(client);
  try {
    await logSync(`Synchronization completed (${source})`, { source, type: 'sync' });
  } catch (error) {
    console.error('[Bot] Sync log failed:', error.message);
  }
}

async function syncRecentTradeMessages(client, since) {
  const guild = client.guilds.cache.get(config.guildId);
  const channel = guild?.channels.cache.get(config.tradeChannelId);
  if (!channel?.messages?.fetch) return;
  const messages = await channel.messages.fetch({ limit: 100 });
  const recent = [...messages.values()]
    .filter(message => message.createdAt > since)
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp);
  for (const message of recent) await handleMessage(message, client);
}

async function handleMessage(message, client) {
  if (message.guildId !== config.guildId) return;
  if (message.channelId !== config.tradeChannelId) return;
  if (!config.trackingEnabled) return;

  if (!parserConfig) await loadParserConfig();

  try {
    const result = await processTradeMessage(message, parserConfig);
    if (result?.trade && !result.duplicate && !result.skipped) {
      lastTrade = result.trade.completedAt || new Date().toISOString();
      console.log('[Bot] Verified trade saved:', result.trade.tradeId);
    }
  } catch (error) {
    console.error('[Bot] Trade processing error:', error.message);
  }
}

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`[Bot] Logged in as ${client.user.tag}`);
    client.botContext = {
      get parserConfig() { return parserConfig; },
      get lastTrade() { return lastTrade; },
      get lastSync() { return lastSync; },
      runSync: (s) => runSync(client, s)
    };

    await loadParserConfig();
    await updateStatus(client);

    setInterval(() => runSync(client, 'interval'), config.syncInterval * 1000);
    setInterval(() => updateStatus(client), config.tradeFeedInterval * 1000);
  },
  handleMessage,
  getContext: () => ({ parserConfig, lastTrade, lastSync })
};
