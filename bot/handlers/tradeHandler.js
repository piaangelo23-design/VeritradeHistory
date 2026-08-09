const { parseTradeMessage } = require('./tradeParser');
const { validateParsedTrade } = require('./tradeValidator');
const { submitTrade, checkDuplicate, logSync } = require('./apiClient');

async function processTradeMessage(message, parserConfig, options = {}) {
  if (options.isTest) {
    const trade = {
      ...options.testPayload,
      discordMessageId: message?.id || `test-${Date.now()}`,
      guildId: message?.guildId,
      channelId: message?.channelId,
      messageUrl: message?.url,
      source: 'discord-test',
      isTest: true,
      verified: false,
      completedAt: new Date().toISOString()
    };
    return submitTrade(trade);
  }

  const parsed = parseTradeMessage(message.content, parserConfig);
  const validation = validateParsedTrade(parsed);
  if (!validation.valid) {
    return { skipped: true, reason: validation.reason };
  }

  const duplicateCheck = await checkDuplicate(message.id);
  if (duplicateCheck.exists) {
    return { duplicate: true, trade: duplicateCheck.trade };
  }

  const payload = {
    ...parsed,
    discordMessageId: message.id,
    guildId: message.guildId,
    channelId: message.channelId,
    messageUrl: message.url,
    source: 'discord',
    isTest: false,
    verified: true,
    completedAt: message.createdAt.toISOString()
  };

  try {
    const result = await submitTrade(payload);
    await logSync('Verified trade processed', { messageId: message.id, tradeId: result.trade?.tradeId });
    return result;
  } catch (error) {
    await logSync('Trade submission failed', { messageId: message.id, error: error.message, success: false });
    throw error;
  }
}

module.exports = { processTradeMessage };
