const { createVerifiedTrade } = require('./tradeService');

function text(value, max = 200) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function itemNames(items) {
  if (!Array.isArray(items)) return '';
  return items.map((item) => typeof item === 'string' ? item : item?.name)
    .filter(Boolean).map((name) => text(name, 160)).join(', ').slice(0, 500);
}

function normalizeExternalTrade(input) {
  const buyer = typeof input.buyer === 'object' ? input.buyer : null;
  const seller = typeof input.seller === 'object' ? input.seller : null;
  const itemsGiven = Array.isArray(input.itemsGiven) ? input.itemsGiven : [];
  const itemsReceived = Array.isArray(input.itemsReceived) ? input.itemsReceived : [];
  const value = Number(input.value ?? itemsGiven.concat(itemsReceived)
    .reduce((total, item) => total + Number(item?.value || 0), 0));

  return {
    externalTradeId: text(input.externalTradeId || input.tradeId, 160),
    tradeId: text(input.tradeId || input.externalTradeId, 160),
    discordMessageId: text(input.discordMessageId || input.tradeId, 160) || undefined,
    guildId: text(input.guildId, 100) || undefined,
    channelId: text(input.channelId, 100) || undefined,
    messageUrl: text(input.messageUrl, 500) || undefined,
    buyer: text(buyer?.username || buyer?.displayName || input.buyer),
    seller: text(seller?.username || seller?.displayName || input.seller),
    buyerItem: text(input.buyerItem || itemNames(itemsGiven), 500),
    sellerItem: text(input.sellerItem || itemNames(itemsReceived), 500),
    buyerProfile: buyer || undefined,
    sellerProfile: seller || undefined,
    itemsGiven,
    itemsReceived,
    paymentType: text(input.paymentType, 50) || undefined,
    paymentAmount: input.paymentAmount === undefined ? undefined : Number(input.paymentAmount),
    value: Number.isFinite(value) ? value : 0,
    middleman: typeof input.middleman === 'object'
      ? text(input.middleman.username || input.middleman.displayName, 160)
      : text(input.middleman, 160) || null,
    status: 'Completed',
    verified: true,
    verificationSource: text(input.verificationSource || 'authorized-external-bot', 160),
    verifiedAt: input.verifiedAt || input.completedAt || new Date(),
    completedAt: input.completedAt || input.verifiedAt || new Date(),
    source: 'external',
    isTest: false
  };
}

async function processExternalTrade(tradeData) {
  return createVerifiedTrade(normalizeExternalTrade(tradeData));
}

module.exports = { processExternalTrade, normalizeExternalTrade };