const axios = require('axios');
const config = require('../config');
const { Item, ValueChange, Activity, WebsiteStats } = require('../models');
const { getSettings } = require('./tradeService');

const NEBLIO_PAGES = {
  home: 'https://neblio.com/mm2',
  calculator: 'https://neblio.com/mm2/values-calculator',
  valueChanges: 'https://neblio.com/mm2/value-changes',
  valueList: 'https://neblio.com/mm2/value-list',
  mostTraded: 'https://neblio.com/mm2/most-traded',
  marketActivity: 'https://neblio.com/mm2/market-activity',
  tradingServers: 'https://neblio.com/mm2/trading-servers',
  leaderboard: 'https://neblio.com/mm2/experience-leaderboard',
  contributors: 'https://neblio.com/mm2/contributors'
};

let cachedData = {
  valueList: [],
  valueChanges: [],
  mostTraded: [],
  marketActivity: [],
  tradingServers: [],
  leaderboard: [],
  contributors: [],
  lastUpdate: null,
  source: 'local',
  message: 'Configure NEBLIO_API_BASE with an authorized API endpoint to enable live data.'
};

async function fetchAuthorized(endpoint) {
  if (!config.neblioApiBase) return null;
  try {
    const response = await axios.get(`${config.neblioApiBase.replace(/\/$/, '')}/${endpoint}`, {
      timeout: 15000,
      headers: { Accept: 'application/json' }
    });
    return response.data;
  } catch (error) {
    console.error('[Neblio] Authorized fetch failed:', error.message);
    return null;
  }
}

async function syncFromProvider() {
  if (!config.neblioEnabled || !config.neblioApiBase) {
    return { success: false, message: cachedData.message, data: cachedData };
  }

  const endpoints = [
    ['value-list', 'valueList'],
    ['value-changes', 'valueChanges'],
    ['most-traded', 'mostTraded'],
    ['market-activity', 'marketActivity'],
    ['trading-servers', 'tradingServers'],
    ['experience-leaderboard', 'leaderboard'],
    ['contributors', 'contributors']
  ];

  let updated = false;
  for (const [endpoint, key] of endpoints) {
    const data = await fetchAuthorized(endpoint);
    if (data) {
      cachedData[key] = Array.isArray(data) ? data : (data.items || data.data || []);
      updated = true;
    }
  }

  if (updated) {
    cachedData.lastUpdate = new Date();
    cachedData.source = 'neblio-api';
    cachedData.message = 'Data synced from authorized provider';

    const settings = await getSettings();
    settings.neblioLastUpdate = cachedData.lastUpdate;
    await settings.save();

    const stats = await WebsiteStats.findOne({ key: 'global' });
    if (stats) {
      stats.valueChanges = cachedData.valueChanges.length;
      stats.updatedAt = new Date();
      await stats.save();
    }

    await Activity.create({
      type: 'market_update',
      title: 'MM2 market data updated',
      message: 'Value data refreshed from authorized provider',
      metadata: { source: 'neblio-api', lastUpdate: cachedData.lastUpdate }
    });
  }

  return { success: updated, data: cachedData };
}

function getCachedData() {
  return {
    ...cachedData,
    pages: NEBLIO_PAGES,
    enabled: config.neblioEnabled,
    apiConfigured: Boolean(config.neblioApiBase)
  };
}

async function getItemsFromDb() {
  return Item.find({ status: { $in: ['active', 'new'] } }).sort({ dateAdded: -1 }).limit(100);
}

async function getValueChangesFromDb() {
  return ValueChange.find().sort({ detectedAt: -1 }).limit(100);
}

module.exports = {
  NEBLIO_PAGES,
  syncFromProvider,
  getCachedData,
  getItemsFromDb,
  getValueChangesFromDb
};
