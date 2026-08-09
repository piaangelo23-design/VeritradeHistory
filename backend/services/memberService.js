const fs = require('fs');
const path = require('path');
const { DiscordMember } = require('../models');

const sourcePath = process.env.MEMBER_LIST_PATH || './backend/data/discord-members.json';

function normalizeMember(member) {
  return {
    discordId: String(member.id || member.discordId || ''),
    guildId: member.guildId || undefined,
    username: String(member.username || '').trim(),
    displayName: String(member.displayName || member.username || '').trim(),
    avatar: member.avatarUrl || member.avatar || null,
    isOnline: Boolean(member.isOnline),
    active: true,
    lastSyncedAt: new Date()
  };
}

function readProvidedMembers() {
  try {
    const parsed = JSON.parse(fs.readFileSync(path.resolve(sourcePath), 'utf8'));
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeMember).filter(member => member.discordId && member.username);
  } catch {
    return [];
  }
}

async function getMembers() {
  const provided = readProvidedMembers();
  if (provided.length) return provided;
  return DiscordMember.find({ active: true }).sort({ displayName: 1, username: 1 }).lean();
}

module.exports = { getMembers, readProvidedMembers };