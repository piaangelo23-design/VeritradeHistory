const { SlashCommandBuilder } = require('discord.js');
const config = require('../config');
const { reportStatus, logSync } = require('../handlers/apiClient');

function isAdmin(userId) {
  return config.adminDiscordIds.includes(userId);
}

const statusCommand = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Show bot tracking status (admin only)'),
  async execute(interaction, ctx) {
    if (!isAdmin(interaction.user.id)) {
      return interaction.reply({ content: 'Administrator access required.', ephemeral: true });
    }

    const { client, parserConfig, lastTrade, lastSync } = ctx;
    const guild = client.guilds.cache.get(config.guildId);
    const channel = guild?.channels.cache.get(config.tradeChannelId);
    const permissions = channel ? channel.permissionsFor(client.user) : null;

    const lines = [
      `**Bot status:** ${client.isReady() ? '🟢 Connected' : '🔴 Offline'}`,
      `**Guild status:** ${guild ? '🟢 Connected' : '🔴 Not Found'}`,
      `**Trade channel:** ${channel && permissions?.has('ViewChannel') && permissions?.has('ReadMessageHistory') ? '🟢 Accessible' : '🔴 No Access'}`,
      `**Tracking:** ${config.trackingEnabled ? '🟢 Active' : '🔴 Disabled'}`,
      `**Last trade:** ${lastTrade ? `<t:${Math.floor(new Date(lastTrade).getTime() / 1000)}:R>` : 'None'}`,
      `**Last sync:** ${lastSync ? `<t:${Math.floor(new Date(lastSync).getTime() / 1000)}:R>` : 'None'}`
    ];

    return interaction.reply({ content: lines.join('\n'), ephemeral: true });
  }
};

const testTradeCommand = {
  data: new SlashCommandBuilder()
    .setName('testtrade')
    .setDescription('Create a labeled TEST trade (admin only)'),
  async execute(interaction, ctx) {
    if (!isAdmin(interaction.user.id)) {
      return interaction.reply({ content: 'Administrator access required.', ephemeral: true });
    }

    const { processTradeMessage } = require('../handlers/tradeHandler');
    const fakeMessage = {
      id: `test-${Date.now()}`,
      guildId: config.guildId,
      channelId: config.tradeChannelId,
      url: `https://discord.com/channels/${config.guildId}/${config.tradeChannelId}/test`,
      content: 'TEST',
      createdAt: new Date()
    };

    await processTradeMessage(fakeMessage, ctx.parserConfig, {
      isTest: true,
      testPayload: {
        buyer: 'TestBuyer',
        seller: 'TestSeller',
        buyerItem: '⚠ TEST ITEM A',
        sellerItem: '⚠ TEST ITEM B',
        value: 1,
        status: 'Completed',
        middleman: null
      }
    });

    return interaction.reply({
      content: '⚠ **TEST TRADE — NOT A REAL TRANSACTION** created and sent to backend.',
      ephemeral: true
    });
  }
};

const syncCommand = {
  data: new SlashCommandBuilder()
    .setName('sync')
    .setDescription('Manually trigger synchronization (admin only)'),
  async execute(interaction, ctx) {
    if (!isAdmin(interaction.user.id)) {
      return interaction.reply({ content: 'Administrator access required.', ephemeral: true });
    }

    await ctx.runSync('manual');
    return interaction.reply({ content: 'Manual synchronization completed.', ephemeral: true });
  }
};

module.exports = [statusCommand, testTradeCommand, syncCommand];
