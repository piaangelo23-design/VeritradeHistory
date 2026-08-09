const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const config = require('./config');
const commands = require('./commands');
const readyEvent = require('./events/ready');
const messageCreateEvent = require('./events/messageCreate');

if (!config.token) {
  console.error('[Bot] DISCORD_TOKEN is required in .env');
  process.exit(1);
}

if (!config.apiSecret) {
  console.error('[Bot] API_SECRET is required and must match the website backend');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    ...(config.enablePresenceIntent ? [GatewayIntentBits.GuildPresences] : [])
  ]
});

client.commands = new Collection();
for (const command of commands) {
  client.commands.set(command.data.name, command);
}

client.once(readyEvent.name, async (...args) => {
  await readyEvent.execute(...args);
  try {
    const rest = new REST({ version: '10' }).setToken(config.token);
    const body = commands.map(c => c.data.toJSON());
    await rest.put(Routes.applicationCommands(client.application.id), { body });
    console.log('[Bot] Slash commands registered');
  } catch (err) {
    console.warn('[Bot] Command registration warning:', err.message);
  }
});

client.on(messageCreateEvent.name, (...args) => messageCreateEvent.execute(...args));

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  const ctx = {
    client,
    parserConfig: readyEvent.getContext().parserConfig,
    lastTrade: readyEvent.getContext().lastTrade,
    lastSync: readyEvent.getContext().lastSync,
    runSync: client.botContext?.runSync || (async () => {})
  };

  try {
    await command.execute(interaction, ctx);
  } catch (error) {
    console.error('[Bot] Command error:', error);
    const reply = { content: 'Command failed.', ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(reply);
    else await interaction.reply(reply);
  }
});

client.login(config.token).catch((error) => {
  console.error('[Bot] Login failed:', error.message);
  process.exit(1);
});
