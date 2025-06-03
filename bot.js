const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const fetch = require('node-fetch');

// Bot configuration
const TOKEN = 'MTM3OTM3NzEwOTkwNjEwMDM0NQ.GXh5UU.W59U5PK4EncMrH8GpjoK1H-rJLoNi4xQ82z5ew'; // Replace with your Discord bot token
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1378937855199674508/nHwMtepJ3hKpzKDZErNkMdgIZPWhix80nkqSyMgYlbMMuOrLhHcF0HYsmLcq6CZeJrco';
const BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_utjs6NoOOU3BdeXE_0pNKDMi9ecw5Gh6ls3KB2OSOb2bKxs';
const ROLE_ID = '1356596190837473320'; // Replace with the role ID to assign on key redemption

// HWID reset tracking
const hwidResets = new Map(); // Map<userId, {count: number, date: string}>
const HWID_RESET_LIMIT = 2;
const HWID_RESET_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
  ],
});

// Utility to send webhook logs as embeds
async function sendWebhookLog(title, description, color = 0x00FF00) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();

  await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed.toJSON()] }),
  });
}

// Check HWID reset limit
function canResetHwid(userId) {
  const today = new Date().toISOString().split('T')[0];
  const userReset = hwidResets.get(userId);

  if (!userReset || userReset.date !== today) {
    hwidResets.set(userId, { count: 0, date: today });
    return true;
  }

  if (userReset.count >= HWID_RESET_LIMIT) {
    return false;
  }

  return true;
}

// Register slash commands
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName('sendpanel')
      .setDescription('Sends the Monty Hub control panel (Admin only)')
      .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    new SlashCommandBuilder()
      .setName('whitelist')
      .setDescription('Registers a user for a specified time (Admin only)')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('The user to whitelist')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('time')
          .setDescription('Duration (e.g., 100s, 100m, 100h, 100d, 100mo, 100yr)')
          .setRequired(true))
      .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    new SlashCommandBuilder()
      .setName('unwhitelist')
      .setDescription('Removes a user from the project (Admin only)')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('The user to unwhitelist')
          .setRequired(true))
      .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
  ];

  await client.application.commands.set(commands);
  console.log('Slash commands registered.');
});

// Handle interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand() && !interaction.isButton()) return;

  const timestamp = new Date().toISOString();

  // Slash Commands
  if (interaction.isCommand()) {
    const { commandName, options } = interaction;

    // /sendpanel
    if (commandName === 'sendpanel') {
      await interaction.deferReply();

      const embed = new EmbedBuilder()
        .setTitle('Monty Hub Control Panel')
        .setDescription("This control panel is for the project: **Monty Hub**\nIf you're a buyer, click on the buttons below to redeem your key, get the script, or get your role.")
        .setColor(0xFFD700)
        .setTimestamp()
        .setFooter({ text: `Sent by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

      await interaction.editReply({
        embeds: [embed],
        components: [
          {
            type: 1,
            components: [
              { type: 2, style: 3, label: 'Redeem Key', custom_id: 'redeem_key' },
              { type: 2, style: 1, label: 'Get Script', custom_id: 'get_script' },
              { type: 2, style: 1, label: 'Get Role', custom_id: 'get_role' },
              { type: 2, style: 2, label: 'Reset HWID', custom_id: 'reset_hwid' },
            ],
          },
        ],
      });

      await sendWebhookLog('Panel Sent', `Admin ${interaction.user.tag} sent the Monty Hub control panel.`, 0x00FF00);
    }

    // /whitelist @user <time>
    if (commandName === 'whitelist') {
      await interaction.deferReply();

      const user = options.getUser('user');
      const time = options.getString('time');

      const response = await fetch(`http://your-middleware-url/register/v1?ID=${user.id}&time=${time}`, {
        headers: { '2fn839-24fn3-jf83': 'true' },
      });
      const data = await response.json();

      if (!data.success) {
        await interaction.editReply(`Failed to whitelist ${user.tag}: ${data.error}`);
        await sendWebhookLog('Whitelist Failed', `Failed to whitelist ${user.tag} by ${interaction.user.tag}: ${data.error}`, 0xFF0000);
        return;
      }

      await user.send(`You have been whitelisted for Monty Hub! Your key is: \`${data.key}\``);
      await interaction.editReply(`Successfully whitelisted ${user.tag} for ${time}. They have been sent their key.`);

      await sendWebhookLog('User Whitelisted', `${interaction.user.tag} whitelisted ${user.tag} for ${time}. Key: ${data.key}`, 0x00FF00);
    }

    // /unwhitelist @user
    if (commandName === 'unwhitelist') {
      await interaction.deferReply();

      const user = options.getUser('user');

      const response = await fetch(`http://your-middleware-url/dAuth/v1?ID=${user.id}`, {
        headers: { '2fn839-24fn3-jf83': 'true' },
      });
      const data = await response.json();

      if (!data.success) {
        await interaction.editReply(`${user.tag} is not a registered user.`);
        await sendWebhookLog('Unwhitelist Failed', `${user.tag} is not a registered user. Attempt by ${interaction.user.tag}.`, 0xFF0000);
        return;
      }

      // Note: Your middleware doesn't have an endpoint to delete users, so this is a placeholder.
      // You might need to add a delete endpoint in your middleware.
      await interaction.editReply(`Unwhitelisted ${user.tag}. (Note: Deletion not implemented in middleware.)`);
      await sendWebhookLog('User Unwhitelisted', `${interaction.user.tag} unwhitelisted ${user.tag}.`, 0x00FF00);
    }
  }

  // Button Interactions
  if (interaction.isButton()) {
    const { customId, user } = interaction;

    // Redeem Key
    if (customId === 'redeem_key') {
      await interaction.deferReply({ ephemeral: true });

      const userDataResponse = await fetch(`http://your-middleware-url/dAuth/v1?ID=${user.id}`, {
        headers: { '2fn839-24fn3-jf83': 'true' },
      });
      const userData = await userDataResponse.json();

      if (!userData.success) {
        await interaction.editReply({ content: 'You are not a registered user.', ephemeral: true });
        await sendWebhookLog('Redeem Key Failed', `${user.tag} attempted to redeem a key but is not registered.`, 0xFF0000);
        return;
      }

      const modal = {
        title: 'Redeem Key',
        custom_id: 'redeem_key_modal',
        components: [
          {
            type: 1,
            components: [
              {
                type: 4,
                custom_id: 'key_input',
                label: 'Enter Your Key',
                style: 1,
                min_length: 14,
                max_length: 14,
                required: true,
              },
            ],
          },
        ],
      };

      await interaction.showModal(modal);
    }

    // Handle Modal Submission for Redeem Key
    if (interaction.isModalSubmit() && interaction.customId === 'redeem_key_modal') {
      await interaction.deferReply({ ephemeral: true });

      const inputKey = interaction.fields.getTextInputValue('key_input');
      const userDataResponse = await fetch(`http://your-middleware-url/dAuth/v1?ID=${user.id}`, {
        headers: { '2fn839-24fn3-jf83': 'true' },
      });
      const userData = await userDataResponse.json();

      if (!userData.success || userData.key !== inputKey) {
        await interaction.editReply({ content: 'Invalid key.', ephemeral: true });
        await sendWebhookLog('Key Redemption Failed', `${user.tag} entered an invalid key: ${inputKey}`, 0xFF0000);
        return;
      }

      const member = await interaction.guild.members.fetch(user.id);
      await member.roles.add(ROLE_ID);
      await interaction.editReply({ content: 'Key redeemed successfully! You have been given the role.', ephemeral: true });

      await sendWebhookLog('Key Redeemed', `${user.tag} redeemed their key: ${inputKey} and received the role.`, 0x00FF00);
    }

    // Get Script
    if (customId === 'get_script') {
      await interaction.reply({ content: 'Placehold Text', ephemeral: true });
      await sendWebhookLog('Script Requested', `${user.tag} requested the script.`, 0x00FF00);
    }

    // Get Role
    if (customId === 'get_role') {
      await interaction.deferReply({ ephemeral: true });

      const userDataResponse = await fetch(`http://your-middleware-url/dAuth/v1?ID=${user.id}`, {
        headers: { '2fn839-24fn3-jf83': 'true' },
      });
      const userData = await userDataResponse.json();

      if (!userData.success) {
        await interaction.editReply({ content: 'You are not a registered user.', ephemeral: true });
        await sendWebhookLog('Get Role Failed', `${user.tag} attempted to get a role but is not registered.`, 0xFF0000);
        return;
      }

      const member = await interaction.guild.members.fetch(user.id);
      if (member.roles.cache.has(ROLE_ID)) {
        await interaction.editReply({ content: 'You already have the role!', ephemeral: true });
        return;
      }

      await member.roles.add(ROLE_ID);
      await interaction.editReply({ content: 'Role assigned successfully!', ephemeral: true });

      await sendWebhookLog('Role Assigned', `${user.tag} received the role.`, 0x00FF00);
    }

    // Reset HWID
    if (customId === 'reset_hwid') {
      await interaction.deferReply({ ephemeral: true });

      const userDataResponse = await fetch(`http://your-middleware-url/dAuth/v1?ID=${user.id}`, {
        headers: { '2fn839-24fn3-jf83': 'true' },
      });
      const userData = await userDataResponse.json();

      if (!userData.success) {
        await interaction.editReply({ content: 'You are not a registered user.', ephemeral: true });
        await sendWebhookLog('HWID Reset Failed', `${user.tag} attempted to reset HWID but is not registered.`, 0xFF0000);
        return;
      }

      if (!canResetHwid(user.id)) {
        await interaction.editReply({ content: `You have reached the HWID reset limit (${HWID_RESET_LIMIT} per day). Try again tomorrow.`, ephemeral: true });
        await sendWebhookLog('HWID Reset Limit Reached', `${user.tag} attempted to reset HWID but reached the daily limit.`, 0xFF0000);
        return;
      }

      const newHwid = ''; // Reset to empty as per your middleware logic
      const response = await fetch(`http://your-middleware-url/manage/v1?ID=${user.id}&action=resetHwid&value=${newHwid}`, {
        headers: { '2fn839-24fn3-jf83': 'true' },
      });
      const data = await response.json();

      if (!data.success) {
        await interaction.editReply({ content: 'Failed to reset HWID: ' + data.error, ephemeral: true });
        await sendWebhookLog('HWID Reset Failed', `Failed to reset HWID for ${user.tag}: ${data.error}`, 0xFF0000);
        return;
      }

      const userReset = hwidResets.get(user.id);
      userReset.count += 1;
      hwidResets.set(user.id, userReset);

      await interaction.editReply({ content: 'HWID reset successfully!', ephemeral: true });
      await sendWebhookLog('HWID Reset', `${user.tag} reset their HWID. Resets today: ${userReset.count}/${HWID_RESET_LIMIT}`, 0x00FF00);
    }
  }
});

client.login(TOKEN);
