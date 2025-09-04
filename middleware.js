import { NextRequest, NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';
import { get } from '@vercel/edge-config';
import { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

// Environment variables - NEVER hardcode sensitive data
const config = {
  BLOB_READ_WRITE_TOKEN: process.env.VERCEL_BLOB_RW_TOKEN,
  WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
  SITE_URL: process.env.SITE_URL || 'https://utils32.vercel.app',
  ADMIN_ID: process.env.ADMIN_DISCORD_ID,
  GUILD_ID: process.env.DISCORD_GUILD_ID,
  BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
  API_SECRET: process.env.API_SECRET || 'your-secure-api-secret',
  PRODUCTION: process.env.NODE_ENV === 'production'
};

// Validate required environment variables
const requiredEnvVars = ['VERCEL_BLOB_RW_TOKEN', 'DISCORD_WEBHOOK_URL', 'ADMIN_DISCORD_ID', 'DISCORD_BOT_TOKEN'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
  }
}

// Discord Bot Setup
let discordClient = null;

const initializeDiscordBot = async () => {
  if (!config.BOT_TOKEN || discordClient) return;

  discordClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
  });

  discordClient.once('ready', async () => {
    console.log(`Discord Bot logged in as ${discordClient.user.tag}`);
    await registerSlashCommands();
  });

  discordClient.on('interactionCreate', handleDiscordInteraction);

  try {
    await discordClient.login(config.BOT_TOKEN);
  } catch (error) {
    console.error('Failed to initialize Discord bot:', error.message);
    await sendWebhookLog(null, `Discord bot initialization failed: ${error.message}`, 'ERROR');
  }
};

// Response helper
const createResponse = (success, data = {}, error = null, statusCode = 200) => {
  return NextResponse.json({
    success,
    timestamp: new Date().toISOString(),
    ...(success ? data : { error })
  }, { status: success ? statusCode : (statusCode === 200 ? 400 : statusCode) });
};

// Security helpers
const validateApiKey = (request) => {
  const apiKey = request.headers.get('x-api-key');
  return apiKey === config.API_SECRET;
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>'"&]/g, '');
};

const rateLimiter = new Map();
const isRateLimited = (ip, limit = config.RATE_LIMIT_MAX, window = config.RATE_LIMIT_WINDOW) => {
  const now = Date.now();
  const userRequests = rateLimiter.get(ip) || [];
  const recentRequests = userRequests.filter(time => now - time < window);
  
  if (recentRequests.length >= limit) {
    return true;
  }
  
  recentRequests.push(now);
  rateLimiter.set(ip, recentRequests);
  return false;
};

// Utility functions
const formatDate = (date) => {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).replace(',', '');
};

const generateSecureKey = (length = 16) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const parseTimeToSeconds = (timeStr) => {
  const match = timeStr.match(/^(\d+)(s|m|h|d|mo|yr)$/);
  if (!match) return null;
  const value = parseInt(match[1]);
  const units = { s: 1, m: 60, h: 3600, d: 86400, mo: 2592000, yr: 31536000 };
  return value * units[match[2]];
};

// Enhanced logging with webhook
const sendWebhookLog = async (request, message, level = 'INFO', responseData = {}) => {
  if (!config.WEBHOOK_URL) return;

  const timestamp = formatDate(new Date());
  const url = request ? new URL(request.url) : null;
  const ip = request ? request.headers?.get('x-forwarded-for') || 'unknown' : 'system';

  const embed = {
    title: `Nebula System - ${level}`,
    description: `\`${timestamp}\` **${message.substring(0, 200)}**`,
    color: { INFO: 0x00FF00, SUCCESS: 0x00AAFF, WARN: 0xFFA500, ERROR: 0xFF0000 }[level] || 0x00FF00,
    fields: [
      {
        name: 'System Info',
        value: `\`IP\`: ${ip}\n\`Path\`: ${url?.pathname || 'N/A'}\n\`Method\`: ${request?.method || 'N/A'}`,
        inline: true
      },
      {
        name: 'Response Data',
        value: `\`\`\`json\n${JSON.stringify(responseData, null, 2).substring(0, 800)}\n\`\`\``,
        inline: false
      }
    ],
    footer: { text: 'Nebula Security System' },
    timestamp: new Date().toISOString()
  };

  try {
    await fetch(config.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
  } catch (error) {
    console.error(`Webhook log failed: ${error.message}`);
  }
};

// Fixed database operations
const getUserByKey = async (key) => {
  try {
    const { blobs } = await list({ 
      prefix: `users/`, 
      token: config.BLOB_READ_WRITE_TOKEN 
    });
    
    for (const blob of blobs) {
      try {
        const response = await fetch(blob.url);
        if (!response.ok) continue;
        const userData = await response.json();
        if (userData.key === key) {
          return userData;
        }
      } catch (error) {
        console.warn(`Failed to fetch blob ${blob.pathname}: ${error.message}`);
        continue;
      }
    }
    return null;
  } catch (error) {
    console.error(`Error in getUserByKey: ${error.message}`);
    return null;
  }
};

const getUserByDiscordId = async (discordId) => {
  try {
    const { blobs } = await list({ 
      prefix: `users/`, 
      token: config.BLOB_READ_WRITE_TOKEN 
    });
    
    for (const blob of blobs) {
      try {
        const response = await fetch(blob.url);
        if (!response.ok) continue;
        const userData = await response.json();
        if (userData.discordId === discordId) {
          return userData;
        }
      } catch (error) {
        console.warn(`Failed to fetch blob ${blob.pathname}: ${error.message}`);
        continue;
      }
    }
    return null;
  } catch (error) {
    console.error(`Error in getUserByDiscordId: ${error.message}`);
    return null;
  }
};

const getUserByHwid = async (hwid) => {
  try {
    const { blobs } = await list({ 
      prefix: `users/`, 
      token: config.BLOB_READ_WRITE_TOKEN 
    });
    
    for (const blob of blobs) {
      try {
        const response = await fetch(blob.url);
        if (!response.ok) continue;
        const userData = await response.json();
        if (userData.hwid === hwid) {
          return userData;
        }
      } catch (error) {
        console.warn(`Failed to fetch blob ${blob.pathname}: ${error.message}`);
        continue;
      }
    }
    return null;
  } catch (error) {
    console.error(`Error in getUserByHwid: ${error.message}`);
    return null;
  }
};

const getAllUsers = async () => {
  try {
    const { blobs } = await list({ 
      prefix: `users/`, 
      token: config.BLOB_READ_WRITE_TOKEN 
    });
    
    const users = [];
    for (const blob of blobs) {
      try {
        const response = await fetch(blob.url);
        if (response.ok) {
          users.push(await response.json());
        }
      } catch (error) {
        console.warn(`Failed to fetch user blob: ${error.message}`);
        continue;
      }
    }
    return users;
  } catch (error) {
    console.error(`Error in getAllUsers: ${error.message}`);
    return [];
  }
};

const saveUser = async (userData) => {
  try {
    const blobPath = `users/${userData.discordId}.json`;
    await put(blobPath, JSON.stringify(userData), {
      access: 'public',
      token: config.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
    });
    return true;
  } catch (error) {
    console.error(`Error saving user: ${error.message}`);
    return false;
  }
};

const deleteUser = async (discordId) => {
  try {
    const blobPath = `users/${discordId}.json`;
    const { blobs } = await list({ 
      prefix: blobPath, 
      token: config.BLOB_READ_WRITE_TOKEN 
    });
    
    if (blobs.length > 0) {
      await del(blobs[0].url, { token: config.BLOB_READ_WRITE_TOKEN });
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error deleting user: ${error.message}`);
    return false;
  }
};

// HWID reset management
const getResetData = async (discordId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const resetPath = `resets/${discordId}_${today}.json`;
    const { blobs } = await list({ 
      prefix: resetPath, 
      token: config.BLOB_READ_WRITE_TOKEN 
    });
    
    if (blobs.length === 0) {
      return { count: 0, resets: [] };
    }
    
    const response = await fetch(blobs[0].url);
    if (!response.ok) throw new Error(`Failed to fetch reset data`);
    return await response.json();
  } catch (error) {
    console.error(`Error getting reset data: ${error.message}`);
    return { count: 0, resets: [] };
  }
};

const saveResetData = async (discordId, resetData) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const resetPath = `resets/${discordId}_${today}.json`;
    await put(resetPath, JSON.stringify(resetData), {
      access: 'public',
      token: config.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
    });
    return true;
  } catch (error) {
    console.error(`Error saving reset data: ${error.message}`);
    return false;
  }
};

// Game script validation
const validateGameScript = async (gameId) => {
  try {
    const scripts = await get('scripts');
    return scripts && scripts[gameId] !== undefined;
  } catch (error) {
    console.error(`Error validating game script: ${error.message}`);
    return false;
  }
};

// Discord Bot Functions
const registerSlashCommands = async () => {
  if (!discordClient) return;

  const commands = [
    new SlashCommandBuilder()
      .setName('panel')
      .setDescription('Access the Nebula control panel'),
    new SlashCommandBuilder()
      .setName('register')
      .setDescription('Register a new account')
      .addStringOption(option =>
        option.setName('username')
          .setDescription('Username (3-20 chars, alphanumeric + underscore)')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('duration')
          .setDescription('Subscription duration (e.g., 30d, 1mo)')
          .setRequired(true)),
    new SlashCommandBuilder()
      .setName('login')
      .setDescription('Login to your account')
      .addStringOption(option =>
        option.setName('username')
          .setDescription('Your username')
          .setRequired(true)),
    new SlashCommandBuilder()
      .setName('stats')
      .setDescription('View account statistics'),
    new SlashCommandBuilder()
      .setName('reset-hwid')
      .setDescription('Reset your hardware ID'),
  ];

  try {
    if (config.GUILD_ID) {
      await discordClient.application.commands.set(commands, config.GUILD_ID);
    } else {
      await discordClient.application.commands.set(commands);
    }
    console.log('Discord slash commands registered successfully');
  } catch (error) {
    console.error('Failed to register Discord commands:', error);
  }
};

const createPanelEmbed = () => {
  const embed = new EmbedBuilder()
    .setTitle('🌟 Nebula Control Panel')
    .setDescription('Manage your Nebula account using the buttons below.')
    .setColor(0x00AAFF)
    .addFields(
      { name: '🔑 Key Management', value: 'View and manage your access key', inline: true },
      { name: '📊 Statistics', value: 'Check your account stats', inline: true },
      { name: '🔄 HWID Reset', value: 'Reset your hardware ID', inline: true }
    )
    .setFooter({ text: 'Nebula Security System' })
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('view_stats')
        .setLabel('📊 View Stats')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('reset_hwid')
        .setLabel('🔄 Reset HWID')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('get_key')
        .setLabel('🔑 Get Key')
        .setStyle(ButtonStyle.Success)
    );

  return { embeds: [embed], components: [row] };
};

const handleDiscordInteraction = async (interaction) => {
  try {
    const discordId = interaction.user.id;
    const username = interaction.user.username;

    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction;

      switch (commandName) {
        case 'panel':
          await interaction.reply({ ...createPanelEmbed(), ephemeral: true });
          break;

        case 'register':
          const regUsername = sanitizeInput(interaction.options.getString('username'));
          const duration = sanitizeInput(interaction.options.getString('duration'));
          
          if (!regUsername || regUsername.length < 3 || regUsername.length > 20 || !/^[a-zA-Z0-9_]+$/.test(regUsername)) {
            await interaction.reply({
              embeds: [new EmbedBuilder()
                .setTitle('❌ Invalid Username')
                .setDescription('Username must be 3-20 characters, alphanumeric and underscores only.')
                .setColor(0xFF0000)],
              ephemeral: true
            });
            return;
          }

          const durationSeconds = parseTimeToSeconds(duration);
          if (!durationSeconds) {
            await interaction.reply({
              embeds: [new EmbedBuilder()
                .setTitle('❌ Invalid Duration')
                .setDescription('Use format like: 30d, 1mo, 1yr')
                .setColor(0xFF0000)],
              ephemeral: true
            });
            return;
          }

          const existingUser = await getUserByDiscordId(discordId);
          if (existingUser) {
            await interaction.reply({
              embeds: [new EmbedBuilder()
                .setTitle('❌ Already Registered')
                .setDescription('You already have an account.')
                .setColor(0xFF0000)],
              ephemeral: true
            });
            return;
          }

          const users = await getAllUsers();
          if (users.some(user => user.username === regUsername)) {
            await interaction.reply({
              embeds: [new EmbedBuilder()
                .setTitle('❌ Username Taken')
                .setDescription('This username is already in use.')
                .setColor(0xFF0000)],
              ephemeral: true
            });
            return;
          }

          const newUser = {
            key: generateSecureKey(),
            hwid: '',
            discordId,
            username: regUsername,
            createTime: Math.floor(Date.now() / 1000),
            endTime: Math.floor(Date.now() / 1000) + durationSeconds
          };

          if (await saveUser(newUser)) {
            await interaction.reply({
              embeds: [new EmbedBuilder()
                .setTitle('✅ Registration Successful')
                .setDescription(`Welcome ${regUsername}!\nYour key: \`${newUser.key}\`\nExpires: <t:${newUser.endTime}:R>`)
                .setColor(0x00FF00)],
              ephemeral: true
            });
            await sendWebhookLog(null, `New user registered: ${regUsername} (${discordId})`, 'SUCCESS');
          } else {
            await interaction.reply({
              embeds: [new EmbedBuilder()
                .setTitle('❌ Registration Failed')
                .setDescription('Database error occurred.')
                .setColor(0xFF0000)],
              ephemeral: true
            });
          }
          break;

        case 'login':
        case 'stats':
          const userData = await getUserByDiscordId(discordId);
          if (!userData) {
            await interaction.reply({
              embeds: [new EmbedBuilder()
                .setTitle('❌ Account Not Found')
                .setDescription('No account found. Use `/register` to create one.')
                .setColor(0xFF0000)],
              ephemeral: true
            });
            return;
          }

          const isExpired = userData.endTime < Math.floor(Date.now() / 1000);
          const resetData = await getResetData(discordId);
          
          await interaction.reply({
            embeds: [new EmbedBuilder()
              .setTitle('📊 Account Statistics')
              .addFields(
                { name: '👤 Username', value: userData.username, inline: true },
                { name: '🔑 Key', value: `\`${userData.key}\``, inline: true },
                { name: '⏰ Status', value: isExpired ? '❌ Expired' : '✅ Active', inline: true },
                { name: '📅 Expires', value: `<t:${userData.endTime}:R>`, inline: true },
                { name: '🔄 HWID Resets Today', value: resetData.count.toString(), inline: true },
                { name: '🖥️ HWID', value: userData.hwid || 'Not set', inline: true }
              )
              .setColor(isExpired ? 0xFF0000 : 0x00FF00)],
            ephemeral: true
          });
          break;

        case 'reset-hwid':
          const userForReset = await getUserByDiscordId(discordId);
          if (!userForReset) {
            await interaction.reply({
              embeds: [new EmbedBuilder()
                .setTitle('❌ Account Not Found')
                .setDescription('No account found.')
                .setColor(0xFF0000)],
              ephemeral: true
            });
            return;
          }

          const resetInfo = await getResetData(discordId);
          if (resetInfo.count >= 3) {
            await interaction.reply({
              embeds: [new EmbedBuilder()
                .setTitle('❌ Reset Limit Reached')
                .setDescription('You can only reset HWID 3 times per day.')
                .setColor(0xFF0000)],
              ephemeral: true
            });
            return;
          }

          userForReset.hwid = '';
          if (await saveUser(userForReset)) {
            resetInfo.count += 1;
            resetInfo.resets.push({ timestamp: Math.floor(Date.now() / 1000) });
            await saveResetData(discordId, resetInfo);

            await interaction.reply({
              embeds: [new EmbedBuilder()
                .setTitle('✅ HWID Reset Successful')
                .setDescription(`HWID reset successfully. Resets used today: ${resetInfo.count}/3`)
                .setColor(0x00FF00)],
              ephemeral: true
            });
            await sendWebhookLog(null, `HWID reset for user: ${userForReset.username} (${discordId})`, 'SUCCESS');
          } else {
            await interaction.reply({
              embeds: [new EmbedBuilder()
                .setTitle('❌ Reset Failed')
                .setDescription('Database error occurred.')
                .setColor(0xFF0000)],
              ephemeral: true
            });
          }
          break;
      }
    } else if (interaction.isButton()) {
      // Handle button interactions similarly
      const userData = await getUserByDiscordId(discordId);
      
      switch (interaction.customId) {
        case 'view_stats':
          // Same as stats command logic
          break;
        case 'reset_hwid':
          // Same as reset-hwid command logic
          break;
        case 'get_key':
          if (userData) {
            await interaction.reply({
              embeds: [new EmbedBuilder()
                .setTitle('🔑 Your Access Key')
                .setDescription(`\`${userData.key}\``)
                .setColor(0x00AAFF)],
              ephemeral: true
            });
          } else {
            await interaction.reply({
              embeds: [new EmbedBuilder()
                .setTitle('❌ No Account')
                .setDescription('Use `/register` to create an account first.')
                .setColor(0xFF0000)],
              ephemeral: true
            });
          }
          break;
      }
    }
  } catch (error) {
    console.error('Discord interaction error:', error);
    if (!interaction.replied) {
      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle('❌ System Error')
          .setDescription('An error occurred. Please try again.')
          .setColor(0xFF0000)],
        ephemeral: true
      });
    }
  }
};

// Main middleware function
export async function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

  // Skip middleware for static files and Next.js internals
  if (
    pathname === '/' ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/__next') ||
    pathname.match(/\.(png|ico|jpg|jpeg|svg|css|js|woff|woff2|ttf|eot|otf)$/)
  ) {
    return NextResponse.next();
  }

  // Rate limiting
  if (isRateLimited(clientIP)) {
    await sendWebhookLog(request, `Rate limit exceeded for IP: ${clientIP}`, 'WARN');
    return createResponse(false, {}, 'Rate limit exceeded', 429);
  }

  try {
    // Initialize Discord bot if not already done
    if (!discordClient && config.BOT_TOKEN) {
      initializeDiscordBot().catch(console.error);
    }

    // API Routes
    if (pathname.startsWith('/api/')) {
      // Security check for sensitive endpoints
      if (pathname.includes('/admin/') || pathname.includes('/manage/')) {
        if (!validateApiKey(request)) {
          await sendWebhookLog(request, 'Unauthorized API access attempt', 'ERROR');
          return createResponse(false, {}, 'Unauthorized', 401);
        }
      }

      // Handle different API endpoints
      switch (true) {
        case pathname.startsWith('/api/auth'):
          return await handleAuth(request, searchParams);
        case pathname.startsWith('/api/user'):
          return await handleUserOps(request, searchParams);
        case pathname.startsWith('/api/files'):
          return await handleFiles(request, searchParams);
        case pathname.startsWith('/api/admin'):
          return await handleAdmin(request, searchParams);
        default:
          return createResponse(false, {}, 'Endpoint not found', 404);
      }
    }

    // Legacy endpoints for backward compatibility
    if (pathname.startsWith('/auth/v1')) {
      return await handleAuth(request, searchParams);
    }

    await sendWebhookLog(request, `Unknown route accessed: ${pathname}`, 'WARN');
    return createResponse(false, {}, 'Route not found', 404);

  } catch (error) {
    await sendWebhookLog(request, `Middleware error: ${error.message}`, 'ERROR');
    return createResponse(false, {}, 'Internal server error', 500);
  }
}

// API Handlers
const handleAuth = async (request, searchParams) => {
  const key = sanitizeInput(searchParams.get('key'));
  const hwid = sanitizeInput(searchParams.get('hwid'));
  const gameId = sanitizeInput(searchParams.get('gameId'));
  const discordId = sanitizeInput(searchParams.get('discordId'));

  if (discordId) {
    // Discord-based auth
    const userData = await getUserByDiscordId(discordId);
    if (!userData) {
      return createResponse(false, {}, 'User not found', 404);
    }

    if (userData.endTime < Math.floor(Date.now() / 1000)) {
      return createResponse(false, {}, 'Subscription expired', 401);
    }

    const gameValid = gameId ? await validateGameScript(gameId) : false;
    return createResponse(true, {
      key: userData.key,
      username: userData.username,
      discordId: userData.discordId,
      hwid: userData.hwid,
      endTime: userData.endTime,
      gameValid
    });
  }

  if (!key && hwid) {
    // HWID-only lookup
    const userData = await getUserByHwid(hwid);
    if (!userData) {
      return createResponse(false, {}, 'No key linked to this HWID', 404);
    }
    return createResponse(true, {
      key: userData.key,
      username: userData.username,
      discordId: userData.discordId
    });
  }

  if (!key) {
    return createResponse(false, {}, 'Missing authentication parameters', 400);
  }

  const userData = await getUserByKey(key);
  if (!userData) {
    return createResponse(false, {}, 'Invalid key', 401);
  }

  if (userData.endTime < Math.floor(Date.now() / 1000)) {
    return createResponse(false, {}, 'Key expired', 401);
  }

  try {
    const scripts = await get('scripts');
    const script = Object.keys(scripts).find(key => key.toLowerCase() === fileName);
    
    if (!script) {
      return createResponse(false, {}, 'File not found', 404);
    }

    await sendWebhookLog(request, `File accessed: ${fileName} by user: ${userData.username}`, 'SUCCESS');
    return createResponse(true, { file: scripts[script] });
  } catch (error) {
    await sendWebhookLog(request, `File access error: ${error.message}`, 'ERROR');
    return createResponse(false, {}, 'File access failed', 500);
  }
};

const handleAdmin = async (request, searchParams) => {
  const authHeader = request.headers.get('authorization');
  const adminId = authHeader?.split(' ')[1];

  if (adminId !== config.ADMIN_ID) {
    await sendWebhookLog(request, `Unauthorized admin access attempt by: ${adminId}`, 'ERROR');
    return createResponse(false, {}, 'Admin access required', 403);
  }

  const action = searchParams.get('action');
  
  try {
    switch (action) {
      case 'list':
        const users = await getAllUsers();
        return createResponse(true, { 
          users,
          totalUsers: users.length,
          activeUsers: users.filter(u => u.endTime > Math.floor(Date.now() / 1000)).length
        });

      case 'update':
        const updateBody = await request.json();
        const { discordId, username, endTime, hwid } = updateBody;
        
        if (!discordId) {
          return createResponse(false, {}, 'Missing Discord ID', 400);
        }

        const userToUpdate = await getUserByDiscordId(discordId);
        if (!userToUpdate) {
          return createResponse(false, {}, 'User not found', 404);
        }

        if (username) userToUpdate.username = sanitizeInput(username);
        if (endTime) userToUpdate.endTime = endTime;
        if (hwid !== undefined) userToUpdate.hwid = sanitizeInput(hwid);

        if (await saveUser(userToUpdate)) {
          await sendWebhookLog(request, `User updated: ${userToUpdate.username} by admin`, 'SUCCESS');
          return createResponse(true, { user: userToUpdate });
        } else {
          return createResponse(false, {}, 'Update failed', 500);
        }

      case 'delete':
        const deleteBody = await request.json();
        if (!deleteBody.discordId) {
          return createResponse(false, {}, 'Missing Discord ID', 400);
        }

        const deleted = await deleteUser(deleteBody.discordId);
        if (deleted) {
          await sendWebhookLog(request, `User deleted: ${deleteBody.discordId} by admin`, 'SUCCESS');
          return createResponse(true, { message: 'User deleted successfully' });
        } else {
          return createResponse(false, {}, 'User not found or delete failed', 404);
        }

      case 'stats':
        const allUsers = await getAllUsers();
        const now = Math.floor(Date.now() / 1000);
        const activeUsers = allUsers.filter(u => u.endTime > now);
        const expiredUsers = allUsers.filter(u => u.endTime <= now);
        
        return createResponse(true, {
          totalUsers: allUsers.length,
          activeUsers: activeUsers.length,
          expiredUsers: expiredUsers.length,
          usersWithHwid: allUsers.filter(u => u.hwid).length,
          recentRegistrations: allUsers.filter(u => (now - u.createTime) < 86400).length // Last 24h
        });

      case 'create':
        const createBody = await request.json();
        const { newDiscordId, newUsername, duration } = createBody;
        
        if (!newDiscordId || !newUsername || !duration) {
          return createResponse(false, {}, 'Missing required fields', 400);
        }

        const existingUser = await getUserByDiscordId(newDiscordId);
        if (existingUser) {
          return createResponse(false, {}, 'User already exists', 400);
        }

        const durationSeconds = parseTimeToSeconds(duration);
        if (!durationSeconds) {
          return createResponse(false, {}, 'Invalid duration format', 400);
        }

        const newUser = {
          key: generateSecureKey(),
          hwid: '',
          discordId: newDiscordId,
          username: sanitizeInput(newUsername),
          createTime: Math.floor(Date.now() / 1000),
          endTime: Math.floor(Date.now() / 1000) + durationSeconds
        };

        if (await saveUser(newUser)) {
          await sendWebhookLog(request, `User created: ${newUser.username} by admin`, 'SUCCESS');
          return createResponse(true, { user: newUser });
        } else {
          return createResponse(false, {}, 'User creation failed', 500);
        }

      default:
        return createResponse(false, {}, 'Invalid admin action', 400);
    }
  } catch (error) {
    await sendWebhookLog(request, `Admin action error: ${error.message}`, 'ERROR');
    return createResponse(false, {}, `Admin action failed: ${error.message}`, 500);
  }
};

// Handle reset HWID functionality
const handleResetHwid = async (request, searchParams) => {
  const authHeader = request.headers.get('authorization');
  const discordId = authHeader?.split(' ')[1];

  if (!discordId) {
    return createResponse(false, {}, 'Missing Discord ID in authorization', 400);
  }

  const userData = await getUserByDiscordId(discordId);
  if (!userData) {
    return createResponse(false, {}, 'User not found', 404);
  }

  const resetData = await getResetData(discordId);
  if (resetData.count >= 3) {
    return createResponse(false, {}, 'Daily reset limit reached (3/day)', 429);
  }

  userData.hwid = '';
  if (await saveUser(userData)) {
    resetData.count += 1;
    resetData.resets.push({ timestamp: Math.floor(Date.now() / 1000) });
    await saveResetData(discordId, resetData);

    await sendWebhookLog(request, `HWID reset for user: ${userData.username}`, 'SUCCESS');
    return createResponse(true, { 
      message: 'HWID reset successful',
      resetsUsed: resetData.count,
      resetsRemaining: 3 - resetData.count
    });
  } else {
    return createResponse(false, {}, 'Reset failed - database error', 500);
  }
};

// Handle user registration
const handleRegister = async (request, searchParams) => {
  const discordId = sanitizeInput(searchParams.get('discordId') || searchParams.get('ID'));
  const username = sanitizeInput(searchParams.get('username'));
  const duration = sanitizeInput(searchParams.get('time') || searchParams.get('duration'));

  if (!discordId || !username || !duration) {
    return createResponse(false, {}, 'Missing required parameters', 400);
  }

  if (username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    return createResponse(false, {}, 'Invalid username format', 400);
  }

  const durationSeconds = parseTimeToSeconds(duration);
  if (!durationSeconds) {
    return createResponse(false, {}, 'Invalid duration format', 400);
  }

  const existingUser = await getUserByDiscordId(discordId);
  if (existingUser) {
    return createResponse(false, {}, 'User already registered', 400);
  }

  const users = await getAllUsers();
  if (users.some(user => user.username === username)) {
    return createResponse(false, {}, 'Username already taken', 400);
  }

  const newUser = {
    key: generateSecureKey(),
    hwid: '',
    discordId,
    username,
    createTime: Math.floor(Date.now() / 1000),
    endTime: Math.floor(Date.now() / 1000) + durationSeconds
  };

  if (await saveUser(newUser)) {
    await sendWebhookLog(request, `New user registered: ${username}`, 'SUCCESS');
    return createResponse(true, newUser);
  } else {
    return createResponse(false, {}, 'Registration failed', 500);
  }
};

// Handle user login/info
const handleLogin = async (request, searchParams) => {
  const discordId = sanitizeInput(searchParams.get('discordId') || searchParams.get('ID'));
  const username = sanitizeInput(searchParams.get('username'));

  if (!discordId) {
    return createResponse(false, {}, 'Missing Discord ID', 400);
  }

  const userData = await getUserByDiscordId(discordId);
  if (!userData) {
    return createResponse(false, {}, 'User not found', 404);
  }

  if (username && userData.username !== username) {
    return createResponse(false, {}, 'Username mismatch', 401);
  }

  if (userData.endTime < Math.floor(Date.now() / 1000)) {
    return createResponse(false, {}, 'Subscription expired', 401);
  }

  await sendWebhookLog(request, `User login: ${userData.username}`, 'SUCCESS');
  return createResponse(true, userData);
};

// Enhanced security middleware configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes in pages/api (if using pages router)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};

// Initialize Discord bot on module load (server-side only)
if (typeof window === 'undefined' && config.BOT_TOKEN) {
  initializeDiscordBot().catch(error => {
    console.error('Failed to initialize Discord bot:', error.message);
  });
});
  }

  // Update HWID if empty
  if (!userData.hwid && hwid) {
    userData.hwid = hwid;
    await saveUser(userData);
  } else if (userData.hwid && userData.hwid !== hwid) {
    return createResponse(false, {}, 'HWID mismatch', 401);
  }

  const gameValid = gameId ? await validateGameScript(gameId) : false;
  
  await sendWebhookLog(request, `Successful auth for user: ${userData.username}`, 'SUCCESS');
  
  return createResponse(true, {
    key: userData.key,
    username: userData.username,
    discordId: userData.discordId,
    hwid: userData.hwid,
    endTime: userData.endTime,
    createTime: userData.createTime,
    gameValid
  });
};

const handleUserOps = async (request, searchParams) => {
  const action = searchParams.get('action');
  
  switch (action) {
    case 'list':
      const users = await getAllUsers();
      return createResponse(true, { 
        users: users.map(u => ({ 
          username: u.username, 
          discordId: u.discordId, 
          endTime: u.endTime,
          active: u.endTime > Math.floor(Date.now() / 1000)
        })) 
      });
    
    case 'register':
      // Handle user registration
      break;
    
    default:
      return createResponse(false, {}, 'Invalid action', 400);
  }
};

// ... (previous code remains unchanged until handleAuth)

// API Handlers
const handleAuth = async (request, searchParams) => {
  const key = sanitizeInput(searchParams.get('key'));
  const hwid = sanitizeInput(searchParams.get('hwid'));
  const gameId = sanitizeInput(searchParams.get('gameId'));
  const discordId = sanitizeInput(searchParams.get('discordId'));

  if (discordId) {
    // Discord-based auth
    const userData = await getUserByDiscordId(discordId);
    if (!userData) {
      return createResponse(false, {}, 'User not found', 404);
    }

    if (userData.endTime < Math.floor(Date.now() / 1000)) {
      return createResponse(false, {}, 'Subscription expired', 401);
    }

    const gameValid = gameId ? await validateGameScript(gameId) : false;
    return createResponse(true, {
      key: userData.key,
      username: userData.username,
      discordId: userData.discordId,
      hwid: userData.hwid,
      endTime: userData.endTime,
      gameValid
    });
  }

  if (!key && hwid) {
    // HWID-only lookup
    const userData = await getUserByHwid(hwid);
    if (!userData) {
      return createResponse(false, {}, 'No key linked to this HWID', 404);
    }
    return createResponse(true, {
      key: userData.key,
      username: userData.username,
      discordId: userData.discordId
    });
  }

  if (!key) {
    return createResponse(false, {}, 'Missing authentication parameters', 400);
  }

  const userData = await getUserByKey(key);
  if (!userData) {
    return createResponse(false, {}, 'Invalid key', 401);
  }

  if (userData.endTime < Math.floor(Date.now() / 1000)) {
    return createResponse(false, {}, 'Key expired', 401);
  }

  // Update HWID if empty
  if (!userData.hwid && hwid) {
    userData.hwid = hwid;
    await saveUser(userData);
  } else if (userData.hwid && userData.hwid !== hwid) {
    return createResponse(false, {}, 'HWID mismatch', 401);
  }

  const gameValid = gameId ? await validateGameScript(gameId) : false;
  
  await sendWebhookLog(request, `Successful auth for user: ${userData.username}`, 'SUCCESS');
  
  return createResponse(true, {
    key: userData.key,
    username: userData.username,
    discordId: userData.discordId,
    hwid: userData.hwid,
    endTime: userData.endTime,
    createTime: userData.createTime,
    gameValid
  });
};

const handleUserOps = async (request, searchParams) => {
  const action = searchParams.get('action');
  
  switch (action) {
    case 'list':
      const users = await getAllUsers();
      return createResponse(true, { 
        users: users.map(u => ({ 
          username: u.username, 
          discordId: u.discordId, 
          endTime: u.endTime,
          active: u.endTime > Math.floor(Date.now() / 1000)
        })) 
      });
    
    case 'register':
      // Reuse the handleRegister function for consistency
      return await handleRegister(request, searchParams);
    
    default:
      return createResponse(false, {}, 'Invalid action', 400);
  }
};

const handleFiles = async (request, searchParams) => {
  const fileName = sanitizeInput(searchParams.get('file'))?.toLowerCase();
  const authHeader = request.headers.get('authorization');
  const key = authHeader?.split(' ')[1];

  if (!fileName || !key) {
    return createResponse(false, {}, 'Missing file name or key', 400);
  }

  const userData = await getUserByKey(key);
  if (!userData) {
    return createResponse(false, {}, 'Invalid key', 401);
  }

  if (userData.endTime < Math.floor(Date.now() / 1000)) {
    return createResponse(false, {}, 'Key expired', 401);
  }

  try {
    const scripts = await get('scripts');
    const script = Object.keys(scripts).find(key => key.toLowerCase() === fileName);
    
    if (!script) {
      return createResponse(false, {}, 'File not found', 404);
    }

    await sendWebhookLog(request, `File accessed: ${fileName} by user: ${userData.username}`, 'SUCCESS');
    return createResponse(true, { file: scripts[script] });
  } catch (error) {
    await sendWebhookLog(request, `File access error: ${error.message}`, 'ERROR');
    return createResponse(false, {}, 'File access failed', 500);
  }
};
