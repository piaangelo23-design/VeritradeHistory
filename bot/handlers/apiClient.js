const axios = require('axios');
const config = require('../config');

const botClient = axios.create({
  baseURL: `${config.backendUrl}/api/bot`,
  timeout: 15000,
  headers: { 'x-api-secret': config.apiSecret, 'Content-Type': 'application/json' }
});

const externalClient = axios.create({
  baseURL: `${config.backendUrl}/api/external`,
  timeout: 15000,
  headers: { Authorization: `Bearer ${config.apiSecret}`, 'Content-Type': 'application/json' }
});

async function submitTrade(trade) {
  const response = await externalClient.post('/trades', trade);
  return response.data;
}

async function reportStatus(status) {
  const response = await botClient.post('/status', status);
  return response.data;
}

async function logSync(message, metadata = {}) {
  const response = await botClient.post('/sync', { message, metadata });
  return response.data;
}

async function checkDuplicate(messageId) {
  const response = await botClient.get(`/trades/check/${messageId}`);
  return response.data;
}

async function fetchSettings() {
  const response = await botClient.get('/settings');
  return response.data;
}

module.exports = { submitTrade, reportStatus, logSync, checkDuplicate, fetchSettings };
