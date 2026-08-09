const { parseTradeMessage } = require('./tradeParser');
const { validateParsedTrade } = require('./tradeValidator');
const { submitTrade, checkDuplicate, logSync } = require('./apiClient');

function profileFromMember(member, fallbackName) {
  if (!member) return { username: fallbackName };
  return {
    id: member.id,
    username: member.user.username,
    displayName: member.displayName,
    avatar: member.displayAvatarURL({ extension: 'png', size: 128 })
  };
}

async function findMember(guild, name) {
  if (!guild || !name) return null;
  const normalized = name.replace(/^<@!?|>$/g, '').trim().toLowerCase();
  const cached = guild.members.cache.find((member) => [
    member.id,
    member.user.username,
    member.displayName,
    member.user.tag
  ].some((value) => String(value).toLowerCase() === normalized));
  if (cached) return cached;

  try {
    const matches = await guild.members.fetch({ query: name, limit: 10 });
    return matches.find((member) => [member.user.username, member.displayName, member.user.tag]
      .some((value) => String(value).toLowerCase() === normalized)) || null;
  } catch {
    return null;
  }
}

async function resolveTraderProfiles(message, parsed, profileDirectory = []) {
  const provided = (name) => {
    const normalized = String(name).toLowerCase();
    return profileDirectory.find(profile => [profile.discordId, profile.username, profile.displayName]
      .some(value => String(value).toLowerCase() === normalized));
  };
  const [buyerMember, sellerMember] = await Promise.all([
    findMember(message.guild, parsed.buyer),
    findMember(message.guild, parsed.seller)
  ]);
  const buyerProvided = provided(parsed.buyer);
  const sellerProvided = provided(parsed.seller);
  return {
    buyer: buyerProvided || profileFromMember(buyerMember, parsed.buyer),
    seller: sellerProvided || profileFromMember(sellerMember, parsed.seller)
  };
}

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

  const profiles = await resolveTraderProfiles(message, parsed, options.profileDirectory);

  const payload = {
    ...parsed,
    buyerProfile: profiles.buyer,
    sellerProfile: profiles.seller,
    tradeId: message.id,
    externalTradeId: message.id,
    discordMessageId: message.id,
    guildId: message.guildId,
    channelId: message.channelId,
    messageUrl: message.url,
    source: 'discord',
    verificationSource: 'discord-bot-verified-format',
    isTest: false,
    verified: true,
    verifiedAt: message.createdAt.toISOString(),
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
