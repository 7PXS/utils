const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fetch = require('node-fetch');

// Configuration
const BOT_TOKEN = 'MTM3NzM3ODc2MTgxNjg3MDkyMg.Go77Vn.mzi1-8WG89GKA8hDFOlowyv_MNPHi1jDNVwuFE';
const BASE_URL = 'https://utils32.vercel.app';
const ADMIN_ID = '1272720391462457400';
const GUILD_ID = ''; // Set your guild Id
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1378937855199674508/nHwMtepJ3hKpzKDZErNkMdgIZPWhix80nkqSyMgYlbMMuOrLhHcF0HYsmLcq6CZeJrco';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once('ready', () => {
  console.log(`Bot logged in as ${client.user.tag}`);
  registerCommands();
});

async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('panel')
      .setDescription('Displays the Nebula control panel'),
    new SlashCommandBuilder()
      .setName('register')
      .setDescription('Register a new user')
      .addStringOption(option =>
        option.setName('username')
          .setDescription('Your username (3-20 characters, letters, numbers, underscores)')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('time')
          .setDescription('Subscription duration (e.g., 1d, 1mo)')
          .setRequired(true)),
    new SlashCommandBuilder()
      .setName('login')
      .setDescription('Log in to your Nebula account')
      .addStringOption(option =>
        option.setName('username')
          .setDescription('Your username')
          .setRequired(true)),
    new SlashCommandBuilder()
      .setName('reset-hwid')
      .setDescription('Reset your HWID'),
    new SlashCommandBuilder()
      .setName('stats')
      .setDescription('View your account stats'),
    new SlashCommandBuilder()
      .setName('redeem')
      .setDescription('Redeem a key')
      .addStringOption(option =>
        option.setName('key')
          .setDescription('Your key')
          .setRequired(true)),
    new SlashCommandBuilder()
      .setName('manage')
      .setDescription('Manage users (Admin only)')
      .addStringOption(option =>
        option.setName('action')
          .setDescription('Action to perform')
          .setRequired(true)
          .addChoices(
            { name: 'List', value: 'list' },
            { name: 'Update', value: 'update' },
            { name: 'Delete', value: 'delete' }
          ))
      .addStringOption(option =>
        option.setName('discord_id')
          .setDescription('User Discord ID')
          .setRequired(false))
      .addStringOption(option =>
        option.setName('username')
          .setDescription('New username for update')
          .setRequired(false))
      .addIntegerOption(option =>
        option.setName('end_time')
          .setDescription('New end time (Unix timestamp) for update')
          .setRequired(false)),
  ];

  try {
    await client.application.commands.set(commands, GUILD_ID);
    console.log('Slash commands registered');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}

async function createPanelEmbed(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('Nebula Control Panel')
    .setDescription('Manage your Nebula account with the buttons below.')
    .setColor('#00AAFF')
    .setFooter({ text: 'Nebula Whitelisting Service' })
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('redeem_key')
        .setLabel('Redeem Key')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('get_script')
        .setLabel('Get Script')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('get_role')
        .setLabel('Get Role')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('reset_hwid')
        .setLabel('Reset HWID')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('get_stats')
        .setLabel('Get Stats')
        .setStyle(ButtonStyle.Primary)
    );

  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

async function handleApiRequest(endpoint, params = {}, method = 'GET', headers = {}, data = null) {
  try {
    const url = new URL(`${BASE_URL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: data ? JSON.stringify(data) : null,
    });
    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${error.message}`);
    return { success: false, error: 'API request failed' };
  }
}

async function getExecutionCount() {
  try {
    const response = await handleApiRequest('/manage/v1', { action: 'list' }, 'GET', { Authorization: `Bearer ${ADMIN_ID}` });
    return response.success ? response.users.length : 0;
  } catch (error) {
    console.error('Error fetching execution count:', error);
    return 0;
  }
}

async function getResetData(discordId) {
  try {
    const response = await handleApiRequest('/reset-hwid/v1', {}, 'GET', { Authorization: `Bearer ${discordId}` });
    if (response.success) {
      const resets = response.resets || [];
      return {
        totalResets: resets.length,
        lastReset: resets.length > 0 ? new Date(resets[resets.length - 1].timestamp).toLocaleString() : 'Never',
      };
    }
    return { totalResets: 0, lastReset: 'Never' };
  } catch (error) {
    console.error('Error fetching reset data:', error);
    return { totalResets: 0, lastReset: 'Never' };
  }
}

async function sendWebhookLog(message, level = 'INFO', responseData = {}) {
  if (!WEBHOOK_URL) return;

  const timestamp = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const embed = {
    title: `Nebula Bot - ${level}`,
    description: `\`${timestamp}\` **${message.substring(0, 100)}**`,
    color: { INFO: 0x00FF00, SUCCESS: 0x00AAFF, ERROR: 0xFF0000 }[level] || 0x00FF00,
    fields: [
      {
        name: 'Response',
        value: `\`\`\`json\n${JSON.stringify(responseData, null, 2).substring(0, 100)}\n\`\`\``,
        inline: true,
      },
    ],
    footer: { text: 'Nebula Bot Logs' },
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch (error) {
    console.error(`Failed to send webhook log: ${error.message}`);
  }
}

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand() && !interaction.isButton()) return;

  const discordId = interaction.user.id;
  const username = interaction.member?.nickname || interaction.user.username;

  if (interaction.isCommand()) {
    const { commandName } = interaction;

    if (commandName === 'panel') {
      await createPanelEmbed(interaction);
      await sendWebhookLog(`Bot: /panel executed by ${discordId}`, 'SUCCESS', { command: 'panel' });
    } else if (commandName === 'register') {
      const inputUsername = interaction.options.getString('username');
      const time = interaction.options.getString('time');
      const response = await handleApiRequest(`/register/v1`, { ID: discordId, username: inputUsername, time });
      const embed = new EmbedBuilder()
        .setTitle(response.success ? 'Registration Successful' : 'Registration Failed')
        .setDescription(response.success ? `Key: ${response.key}\nUsername: ${response.username}\nExpires: <t:${response.endTime}:R>` : response.error)
        .setColor(response.success ? '#00FF00' : '#FF0000');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      await sendWebhookLog(`Bot: /register by ${discordId}`, response.success ? 'SUCCESS' : 'ERROR', response);
    } else if (commandName === 'login') {
      const inputUsername = interaction.options.getString('username');
      const response = await handleApiRequest(`/login/v1`, { ID: discordId, username: inputUsername });
      const embed = new EmbedBuilder()
        .setTitle(response.success ? 'Login Successful' : 'Login Failed')
        .setDescription(response.success ? `Key: ${response.key}\nUsername: ${response.username}\nExpires: <t:${response.endTime}:R>` : response.error)
        .setColor(response.success ? '#00FF00' : '#FF0000');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      await sendWebhookLog(`Bot: /login by ${discordId}`, response.success ? 'SUCCESS' : 'ERROR', response);
    } else if (commandName === 'reset-hwid') {
      const response = await handleApiRequest(`/reset-hwid/v1`, {}, 'GET', { Authorization: `Bearer ${discordId}` });
      const embed = new EmbedBuilder()
        .setTitle(response.success ? 'HWID Reset Successful' : 'HWID Reset Failed')
        .setDescription(response.success ? 'Your HWID has been reset.' : response.error)
        .setColor(response.success ? '#00FF00' : '#FF0000');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      await sendWebhookLog(`Bot: /reset-hwid by ${discordId}`, response.success ? 'SUCCESS' : 'ERROR', response);
    } else if (commandName === 'stats') {
      const response = await handleApiRequest(`/login/v1`, { ID: discordId, username });
      const resetData = await getResetData(discordId);
      const executionCount = await getExecutionCount();
      const embed = new EmbedBuilder()
        .setTitle(response.success ? 'Account Stats' : 'Stats Failed')
        .setDescription(response.success ?
          `**Key**: ${response.key}\n**Username**: ${response.username}\n**Total Executions**: ${executionCount}\n**Last HWID Reset**: ${resetData.lastReset}\n**Total HWID Resets**: ${resetData.totalResets}\n**Expire Date**: <t:${response.endTime}:R>\n**Blacklisted**: Not implemented` :
          response.error)
        .setColor(response.success ? '#00FF00' : '#FF0000');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      await sendWebhookLog(`Bot: /stats by ${discordId}`, response.success ? 'SUCCESS' : 'ERROR', response);
    } else if (commandName === 'redeem') {
      const key = interaction.options.getString('key');
      const response = await handleApiRequest(`/auth/v1`, { key, hwid: discordId });
      const embed = new EmbedBuilder()
        .setTitle(response.success ? 'Key Redeemed' : 'Redemption Failed')
        .setDescription(response.success ? `Key: ${response.key}\nUsername: ${response.username}\nExpires: <t:${response.endTime}:R>` : response.error)
        .setColor(response.success ? '#00FF00' : '#FF0000');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      await sendWebhookLog(`Bot: /redeem by ${discordId}`, response.success ? 'SUCCESS' : 'ERROR', response);
    } else if (commandName === 'manage') {
      if (discordId !== ADMIN_ID) {
        const embed = new EmbedBuilder()
          .setTitle('Access Denied')
          .setDescription('Admin access required.')
          .setColor('#FF0000');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        await sendWebhookLog(`Bot: /manage denied for ${discordId}`, 'ERROR', { error: 'Admin access required' });
        return;
      }

      const action = interaction.options.getString('action');
      if (action === 'list') {
        const response = await handleApiRequest(`/manage/v1`, { action }, 'GET', { Authorization: `Bearer ${ADMIN_ID}` });
        const embed = new EmbedBuilder()
          .setTitle(response.success ? 'User List' : 'List Failed')
          .setDescription(response.success ? response.users.map(u => `ID: ${u.discordId}, Username: ${u.username}, Expires: <t:${u.endTime}:R>`).join('\n') || 'No users found' : response.error)
          .setColor(response.success ? '#00FF00' : '#FF0000');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        await sendWebhookLog(`Bot: /manage list by ${discordId}`, response.success ? 'SUCCESS' : 'ERROR', response);
      } else if (action === 'update') {
        const targetDiscordId = interaction.options.getString('discord_id');
        const newUsername = interaction.options.getString('username');
        const endTime = interaction.options.getInteger('end_time');
        const response = await handleApiRequest(`/manage/v1`, { action }, 'POST', { Authorization: `Bearer ${ADMIN_ID}` }, {
          discordId: targetDiscordId,
          username: newUsername,
          endTime,
        });
        const embed = new EmbedBuilder()
          .setTitle(response.success ? 'User Updated' : 'Update Failed')
          .setDescription(response.success ? `Updated ${response.user.username} (ID: ${response.user.discordId})` : response.error)
          .setColor(response.success ? '#00FF00' : '#FF0000');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        await sendWebhookLog(`Bot: /manage update by ${discordId}`, response.success ? 'SUCCESS' : 'ERROR', response);
      } else if (action === 'delete') {
        const targetDiscordId = interaction.options.getString('discord_id');
        const response = await handleApiRequest(`/manage/v1`, { action }, 'POST', { Authorization: `Bearer ${ADMIN_ID}` }, { discordId: targetDiscordId });
        const embed = new EmbedBuilder()
          .setTitle(response.success ? 'User Deleted' : 'Deletion Failed')
          .setDescription(response.success ? `Deleted user ID: ${targetDiscordId}` : response.error)
          .setColor(response.success ? '#00FF00' : '#FF0000');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        await sendWebhookLog(`Bot: /manage delete by ${discordId}`, response.success ? 'SUCCESS' : 'ERROR', response);
      }
    }
  } else if (interaction.isButton()) {
    const customId = interaction.customId;
    if (customId === 'redeem_key') {
      const response = await handleApiRequest(`/auth/v1`, { key: discordId, hwid: discordId });
      const embed = new EmbedBuilder()
        .setTitle(response.success ? 'Key Redeemed' : 'Redemption Failed')
        .setDescription(response.success ? `Key: ${response.key}\nUsername: ${response.username}\nExpires: <t:${response.endTime}:R>` : response.error)
        .setColor(response.success ? '#00FF00' : '#FF0000');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      await sendWebhookLog(`Bot: redeem_key button by ${discordId}`, response.success ? 'SUCCESS' : 'ERROR', response);
    } else if (customId === 'get_script') {
      const embed = new EmbedBuilder()
        .setTitle('Get Script')
        .setDescription('This feature is not implemented yet.')
        .setColor('#FFA500');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      await sendWebhookLog(`Bot: get_script button by ${discordId}`, 'INFO', { message: 'Not implemented' });
    } else if (customId === 'get_role') {
      const roleId = ''; // Set your role ID here
      if (!roleId) {
        const embed = new EmbedBuilder()
          .setTitle('Role Assignment Failed')
          .setDescription('Role ID not configured.')
          .setColor('#FF0000');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        await sendWebhookLog(`Bot: get_role button failed for ${discordId}`, 'ERROR', { error: 'Role ID not configured' });
        return;
      }
      try {
        await interaction.member.roles.add(roleId);
        const embed = new EmbedBuilder()
          .setTitle('Role Assigned')
          .setDescription('Role successfully assigned!')
          .setColor('#00FF00');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        await sendWebhookLog(`Bot: get_role button by ${discordId}`, 'SUCCESS', { message: 'Role assigned' });
      } catch (error) {
        const embed = new EmbedBuilder()
          .setTitle('Role Assignment Failed')
          .setDescription(`Error: ${error.message}`)
          .setColor('#FF0000');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        await sendWebhookLog(`Bot: get_role button failed for ${discordId}`, 'ERROR', { error: error.message });
      }
    } else if (customId === 'reset_hwid') {
      const response = await handleApiRequest(`/reset-hwid/v1`, {}, 'GET', { Authorization: `Bearer ${discordId}` });
      const embed = new EmbedBuilder()
        .setTitle(response.success ? 'HWID Reset Successful' : 'HWID Reset Failed')
        .setDescription(response.success ? 'Your HWID has been reset.' : response.error)
        .setColor(response.success ? '#00FF00' : '#FF0000');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      await sendWebhookLog(`Bot: reset_hwid button by ${discordId}`, response.success ? 'SUCCESS' : 'ERROR', response);
    } else if (customId === 'get_stats') {
      const response = await handleApiRequest(`/login/v1`, { ID: discordId, username });
      const resetData = await getResetData(discordId);
      const executionCount = await getExecutionCount();
      const embed = new EmbedBuilder()
        .setTitle(response.success ? 'Account Stats' : 'Stats Failed')
        .setDescription(response.success ?
          `**Key**: ${response.key}\n**Username**: ${response.username}\n**Total Executions**: ${executionCount}\n**Last HWID Reset**: ${resetData.lastReset}\n**Total HWID Resets**: ${resetData.totalResets}\n**Expire Date**: <t:${response.endTime}:R>\n**Blacklisted**: Not implemented` :
          response.error)
        .setColor(response.success ? '#00FF00' : '#FF0000');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      await sendWebhookLog(`Bot: get_stats button by ${discordId}`, response.success ? 'SUCCESS' : 'ERROR', response);
    }
  }
});

client.login(BOT_TOKEN).catch(error => {
  console.error(`Bot login failed: ${error.message}`);
  sendWebhookLog(`Bot login failed: ${error.message}`, 'ERROR', { error: error.message });
});
