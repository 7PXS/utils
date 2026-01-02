import { NextRequest, NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';
import { get } from '@vercel/edge-config';

// Environment variables
const envConfig = {
  BLOB_READ_WRITE_TOKEN: process.env.VERCEL_BLOB_RW_TOKEN,
  WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1449525733503271023/pSgwXDVwjC8L7FaIq9Z0-45V16kUbSHpKewJojxvF3WXVXdvmikWQTNR7ObJK6aUtWG0',
  SITE_URL: process.env.SITE_URL || 'https://utils32.vercel.app',
  ADMIN_ID: process.env.ADMIN_DISCORD_ID,
  API_SECRET: process.env.API_SECRET || 'your-secure-api-secret',
  PRODUCTION: process.env.NODE_ENV === 'production',
  AVATAR_URL: 'https://cdn.discordapp.com/avatars/1449525733503271023/66c696a10553077e0878dd8c134c634c.webp?size=1024',
  WEBHOOK_USERNAME: '__Avoura Security__',
  DISCORD_LOOKUP_API: 'https://discord-lookup-api-ecru.vercel.app/v1/user'
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
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>'"&]/g, '');
};

// Simple password hashing (use bcrypt in production)
const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

const verifyPassword = async (password, hashedPassword) => {
  const hash = await hashPassword(password);
  return hash === hashedPassword;
};

const rateLimiter = new Map();
const isRateLimited = (ip, limit = 100, window = 3600000) => {
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

// Token generation
const generateToken = (gameId, playerName, hwid) => {
  const input = String(gameId) + playerName + hwid;
  let hashVal = 0;
  
  for (let i = 0; i < input.length; i++) {
    const byte = input.charCodeAt(i);
    hashVal = ((hashVal * 31) + byte) >>> 0;
  }
  
  return hashVal.toString(16);
};

const parseTimeToSeconds = (timeStr) => {
  const match = timeStr.match(/^(\d+)(s|m|h|d|mo|yr)$/);
  if (!match) return null;
  const value = parseInt(match[1]);
  const units = { s: 1, m: 60, h: 3600, d: 86400, mo: 2592000, yr: 31536000 };
  return value * units[match[2]];
};

// Discord API helper
const fetchDiscordUser = async (discordId) => {
  try {
    const response = await fetch(`${envConfig.DISCORD_LOOKUP_API}/${discordId}`);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (data.code === 10013 || data.message === 'Unknown User') {
      return null;
    }
    return {
      id: data.id,
      username: data.username,
      global_name: data.global_name || data.username,
      avatar: data.avatar?.link || null,
      created_at: data.created_at
    };
  } catch (error) {
    console.error(`Error fetching Discord user: ${error.message}`);
    return null;
  }
};

// Enhanced logging with webhook
const sendWebhookLog = async (request, message, level = 'INFO', responseData = {}) => {
  if (!envConfig.WEBHOOK_URL) return;

  const timestamp = formatDate(new Date());
  const url = request ? new URL(request.url) : null;
  const ip = request ? request.headers?.get('x-forwarded-for') || 'unknown' : 'system';

  const embed = {
    title: `Avoura Auth - ${level}`,
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
    footer: { text: 'Avoura Security System' },
    timestamp: new Date().toISOString()
  };

  try {
    await fetch(envConfig.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
  } catch (error) {
    console.error(`Webhook log failed: ${error.message}`);
  }
};

// Database operations
const getUserByKey = async (key) => {
  try {
    const { blobs } = await list({ 
      prefix: `Users/`, 
      token: envConfig.BLOB_READ_WRITE_TOKEN 
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
      prefix: `Users/${discordId}`, 
      token: envConfig.BLOB_READ_WRITE_TOKEN 
    });
    
    if (blobs.length === 0) {
      return null;
    }
    
    const response = await fetch(blobs[0].url);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Error in getUserByDiscordId: ${error.message}`);
    return null;
  }
};

const getUserByHwid = async (hwid) => {
  try {
    const { blobs } = await list({ 
      prefix: `Users/`, 
      token: envConfig.BLOB_READ_WRITE_TOKEN 
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
      prefix: `Users/`, 
      token: envConfig.BLOB_READ_WRITE_TOKEN 
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
    const blobPath = `Users/${userData.discordId}.json`;
    await put(blobPath, JSON.stringify(userData), {
      access: 'public',
      token: envConfig.BLOB_READ_WRITE_TOKEN,
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
    const { blobs } = await list({ 
      prefix: `Users/${discordId}`, 
      token: envConfig.BLOB_READ_WRITE_TOKEN 
    });
    
    for (const blob of blobs) {
      await del(blob.url, { token: envConfig.BLOB_READ_WRITE_TOKEN });
    }
    return true;
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
      token: envConfig.BLOB_READ_WRITE_TOKEN 
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
      token: envConfig.BLOB_READ_WRITE_TOKEN,
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

// Stats endpoint handler
const handleStats = async (request, searchParams) => {
  try {
    const users = await getAllUsers();
    const now = Math.floor(Date.now() / 1000);
    const day24hAgo = now - (24 * 60 * 60);
    const day7Ago = now - (7 * 24 * 60 * 60);
    
    const stats = {
      total: users.length,
      active: users.filter(u => u.endTime > now).length,
      expired: users.filter(u => u.endTime <= now).length,
      joined24h: users.filter(u => u.createTime > day24hAgo).length,
      joined7d: users.filter(u => u.createTime > day7Ago).length,
      expiring7d: users.filter(u => {
        const daysUntilExpiry = (u.endTime - now) / (24 * 60 * 60);
        return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
      }).length,
      withHwid: users.filter(u => u.hwid && u.hwid.length > 0).length,
    };
    
    await sendWebhookLog(request, 'Stats requested', 'INFO');
    return createResponse(true, { success: true, stats });
  } catch (error) {
    return createResponse(false, {}, 'Failed to fetch stats', 500);
  }
};

// Token validation endpoint
const handleValidateToken = async (request, searchParams) => {
  const token = sanitizeInput(searchParams.get('token'));
  const gameId = sanitizeInput(searchParams.get('gameId'));
  const playerName = sanitizeInput(searchParams.get('playerName'));
  const hwid = sanitizeInput(searchParams.get('hwid'));

  if (!token || !gameId || !playerName || !hwid) {
    await sendWebhookLog(
      request, 
      'Token validation - missing parameters', 
      'WARN',
      { token: token?.substring(0, 12), gameId, playerName, hwid: hwid?.substring(0, 12) }
    );
    
    return createResponse(true, {
      success: true,
      tokenValid: false,
      error: 'Missing required parameters'
    });
  }

  const expectedToken = generateToken(gameId, playerName, hwid);
  const tokensMatch = token === expectedToken;

  await sendWebhookLog(
    request,
    `Token validation: ${tokensMatch ? 'VALID' : 'INVALID'}`,
    tokensMatch ? 'SUCCESS' : 'WARN',
    {
      providedToken: token.substring(0, 12) + '...',
      expectedToken: expectedToken.substring(0, 12) + '...',
      match: tokensMatch,
      gameId,
      playerName,
      hwid: hwid.substring(0, 12) + '...'
    }
  );

  return createResponse(true, {
    success: true,
    tokenValid: tokensMatch,
    ...(tokensMatch ? {} : { error: 'Token mismatch' })
  });
};

// API Handlers
const handleAuth = async (request, searchParams) => {
  const key = sanitizeInput(searchParams.get('key'));
  const hwid = sanitizeInput(searchParams.get('hwid'));
  const gameId = sanitizeInput(searchParams.get('gameId'));
  const playerName = sanitizeInput(searchParams.get('playerName'));
  const discordId = sanitizeInput(searchParams.get('discordId'));

  if (discordId) {
    const userData = await getUserByDiscordId(discordId);
    if (!userData) {
      return createResponse(false, {}, 'User not found', 404);
    }

    if (userData.endTime < Math.floor(Date.now() / 1000)) {
      return createResponse(false, {}, 'Subscription expired', 401);
    }

    const discordData = await fetchDiscordUser(discordId);
    const token = playerName && hwid && gameId 
      ? generateToken(gameId, playerName, hwid || userData.hwid)
      : null;

    const gameValid = gameId ? await validateGameScript(gameId) : false;
    
    return createResponse(true, {
      key: userData.key,
      discordId: userData.discordId,
      hwid: userData.hwid || '',
      endTime: userData.endTime,
      createTime: userData.createTime,
      discordData: discordData,
      gameValid,
      ...(token ? { token } : {})
    });
  }

  if (!key && hwid) {
    const userData = await getUserByHwid(hwid);
    if (!userData) {
      return createResponse(false, {}, 'No key linked to this HWID', 404);
    }
    
    const discordData = await fetchDiscordUser(userData.discordId);
    const token = playerName && gameId 
      ? generateToken(gameId, playerName, hwid)
      : null;
    
    return createResponse(true, {
      key: userData.key,
      discordId: userData.discordId,
      hwid: userData.hwid || '',
      createTime: userData.createTime,
      endTime: userData.endTime,
      discordData: discordData,
      ...(token ? { token } : {})
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

  if (!userData.hwid && hwid) {
    userData.hwid = hwid;
    await saveUser(userData);
  } else if (userData.hwid && userData.hwid !== hwid) {
    return createResponse(false, {}, 'HWID mismatch', 401);
  }

  const discordData = await fetchDiscordUser(userData.discordId);
  const token = playerName && hwid && gameId 
    ? generateToken(gameId, playerName, hwid)
    : null;

  const gameValid = gameId ? await validateGameScript(gameId) : false;
  
  await sendWebhookLog(
    request, 
    `Successful auth for user: ${discordData?.global_name || userData.discordId}`, 
    'SUCCESS',
    {
      discordId: userData.discordId,
      gameId,
      playerName,
      tokenGenerated: !!token
    }
  );
  
  return createResponse(true, {
    key: userData.key,
    discordId: userData.discordId,
    hwid: userData.hwid || '',
    endTime: userData.endTime,
    createTime: userData.createTime,
    discordData: discordData,
    gameValid,
    ...(token ? { token } : {})
  });
};

const handleRegister = async (request, searchParams) => {
  const discordId = sanitizeInput(searchParams.get('discordId') || searchParams.get('ID'));
  const password = sanitizeInput(searchParams.get('password'));
  const duration = sanitizeInput(searchParams.get('time') || searchParams.get('duration')) || '30d';

  if (!discordId || !password) {
    return createResponse(false, {}, 'Missing Discord ID or password', 400);
  }

  if (password.length < 6) {
    return createResponse(false, {}, 'Password must be at least 6 characters', 400);
  }

  // Validate Discord ID
  const discordData = await fetchDiscordUser(discordId);
  if (!discordData) {
    return createResponse(false, {}, 'Invalid Discord ID. User not found on Discord.', 400);
  }

  const existingUser = await getUserByDiscordId(discordId);
  if (existingUser) {
    return createResponse(false, {}, 'User already registered with this Discord ID', 400);
  }

  const durationSeconds = parseTimeToSeconds(duration);
  if (!durationSeconds) {
    return createResponse(false, {}, 'Invalid duration format. Use format like: 30d, 1mo, 1yr', 400);
  }

  const hashedPassword = await hashPassword(password);

  const newUser = {
    key: generateSecureKey(),
    hwid: '',
    discordId,
    password: hashedPassword,
    createTime: Math.floor(Date.now() / 1000),
    endTime: Math.floor(Date.now() / 1000) + durationSeconds
  };

  if (await saveUser(newUser)) {
    await sendWebhookLog(request, `New user registered: ${discordData.global_name} (${discordId})`, 'SUCCESS', { discordId });
    return createResponse(true, {
      key: newUser.key,
      discordId: newUser.discordId,
      createTime: newUser.createTime,
      endTime: newUser.endTime,
      discordData: discordData
    });
  } else {
    return createResponse(false, {}, 'Registration failed - database error', 500);
  }
};

const handleLogin = async (request, searchParams) => {
  const discordId = sanitizeInput(searchParams.get('discordId') || searchParams.get('ID'));
  const password = sanitizeInput(searchParams.get('password'));

  if (!discordId) {
    return createResponse(false, {}, 'Missing Discord ID', 400);
  }

  if (!password) {
    return createResponse(false, {}, 'Missing password', 400);
  }

  const userData = await getUserByDiscordId(discordId);
  
  if (!userData) {
    await sendWebhookLog(request, `Login attempt for unregistered user: ${discordId}`, 'WARN');
    return createResponse(false, {}, 'User not found. Please register first.', 404);
  }

  const passwordValid = await verifyPassword(password, userData.password);
  if (!passwordValid) {
    await sendWebhookLog(request, `Failed login attempt - invalid password: ${discordId}`, 'WARN');
    return createResponse(false, {}, 'Invalid password', 401);
  }

  if (userData.endTime < Math.floor(Date.now() / 1000)) {
    await sendWebhookLog(request, `Login failed - expired subscription: ${discordId}`, 'WARN');
    return createResponse(false, {}, 'Subscription expired. Please contact support to renew.', 401);
  }

  const discordData = await fetchDiscordUser(discordId);

  await sendWebhookLog(request, `Successful login: ${discordData?.global_name || discordId}`, 'SUCCESS');
  return createResponse(true, {
    success: true,
    key: userData.key,
    discordId: userData.discordId,
    hwid: userData.hwid || '',
    createTime: userData.createTime,
    endTime: userData.endTime,
    discordData: discordData
  });
};

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
  if (resetData.count >= 3 && discordId !== envConfig.ADMIN_ID) {
    return createResponse(false, {}, 'Daily reset limit reached (3/day)', 429);
  }

  userData.hwid = '';
  if (await saveUser(userData)) {
    resetData.count += 1;
    resetData.resets.push({ timestamp: Math.floor(Date.now() / 1000) });
    await saveResetData(discordId, resetData);

    const discordData = await fetchDiscordUser(discordId);
    await sendWebhookLog(request, `HWID reset for user: ${discordData?.global_name || discordId}`, 'SUCCESS');
    return createResponse(true, { 
      success: true,
      message: 'HWID reset successful',
      resetsUsed: resetData.count,
      resetsRemaining: discordId === envConfig.ADMIN_ID ? 'unlimited' : 3 - resetData.count
    });
  } else {
    return createResponse(false, {}, 'Reset failed - database error', 500);
  }
};

const handleUsersV1 = async (request, searchParams) => {
  const authHeader = request.headers.get('authorization');
  
  if (authHeader !== 'UserMode-2d93n2002n8') {
    return createResponse(false, {}, 'Unauthorized', 401);
  }

  try {
    const users = await getAllUsers();
    const userIds = users.map(user => user.discordId);
    
    await sendWebhookLog(request, `Users list requested - ${users.length} users`, 'INFO');
    return createResponse(true, {
      success: true,
      users: userIds,
      count: userIds.length
    });
  } catch (error) {
    return createResponse(false, {}, 'Failed to fetch users', 500);
  }
};

const handleAdminAddTime = async (request, searchParams) => {
  const authHeader = request.headers.get('authorization');
  
  if (authHeader !== 'UserMode-2d93n2002n8') {
    return createResponse(false, {}, 'Unauthorized - Admin access required', 401);
  }

  const userId = sanitizeInput(searchParams.get('user'));
  const timeToAdd = sanitizeInput(searchParams.get('time'));

  if (!userId || !timeToAdd) {
    return createResponse(false, {}, 'Missing user ID or time parameter', 400);
  }

  const userData = await getUserByDiscordId(userId);
  if (!userData) {
    return createResponse(false, {}, 'User not found', 404);
  }

  const additionalSeconds = parseTimeToSeconds(timeToAdd);
  if (!additionalSeconds) {
    return createResponse(false, {}, 'Invalid time format', 400);
  }

  userData.endTime += additionalSeconds;
  
  if (await saveUser(userData)) {
    const discordData = await fetchDiscordUser(userId);
    await sendWebhookLog(request, `Admin added ${timeToAdd} to user: ${discordData?.global_name || userId}`, 'SUCCESS');
    return createResponse(true, {
      success: true,
      message: 'Time added successfully',
      newEndTime: userData.endTime,
      discordId: userData.discordId
    });
  } else {
    return createResponse(false, {}, 'Failed to update user', 500);
  }
};

const handleManageUsers = async (request) => {
  const authHeader = request.headers.get('authorization');
  
  if (authHeader !== 'UserMode-2d93n2002n8') {
    return createResponse(false, {}, 'Unauthorized - Admin access required', 401);
  }

  if (request.method === 'DELETE') {
    try {
      const body = await request.json();
      const discordId = body.discordId;

      if (!discordId) {
        return createResponse(false, {}, 'Missing Discord ID', 400);
      }

      const userData = await getUserByDiscordId(discordId);
      if (!userData) {
        return createResponse(false, {}, 'User not found', 404);
      }

      if (await deleteUser(discordId)) {
        const discordData = await fetchDiscordUser(discordId);
        await sendWebhookLog(request, `Admin deleted user: ${discordData?.global_name || discordId}`, 'SUCCESS');
        return createResponse(true, {
          success: true,
          message: 'User deleted successfully',
          discordId: discordId
        });
      } else {
        return createResponse(false, {}, 'Failed to delete user', 500);
      }
    } catch (error) {
      return createResponse(false, {}, 'Invalid request body', 400);
    }
  }

  return createResponse(false, {}, 'Method not allowed', 405);
};

const handleScriptFetch = async (request, pathname, searchParams) => {
  try {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length < 4) {
      return createResponse(false, {}, 'Invalid script path', 400);
    }
    const version = parts[2];
    const gameId = parts[3].replace('.lua', '');
    const token = searchParams.get('token');

    const GAME_ID_MAPPINGS = {
      '8282828': ['829293948', '8272727272', '2882282', '2929829'],
      '76558904092080': ['129009554587176'],
    };

    let searchGameId = gameId;
    for (const [targetId, aliases] of Object.entries(GAME_ID_MAPPINGS)) {
      if (aliases.includes(gameId)) {
        searchGameId = targetId;
        break;
      }
    }

    await sendWebhookLog(request, `Script requested`, 'INFO', {
      version,
      originalGameId: gameId,
      searchGameId,
      token: token ? token.substring(0, 12) + '...' : 'none'
    });

    const { blobs } = await list({
      prefix: `scripts/${version}/`,
      token: envConfig.BLOB_READ_WRITE_TOKEN
    });

    if (blobs.length === 0) {
      await sendWebhookLog(request, `No scripts found in version: ${version}`, 'WARN');
      return createResponse(false, {}, 'No scripts available for this version', 404);
    }

    const matchingBlobs = blobs.filter(blob =>
      blob.pathname.toLowerCase().includes(searchGameId.toLowerCase())
    );

    if (matchingBlobs.length === 0) {
      await sendWebhookLog(
        request,
        `No script containing gameId: ${searchGameId}`,
        'WARN',
        { version, searchGameId, availableScripts: blobs.map(b => b.pathname) }
      );
      return createResponse(false, {}, 'Script not found for this game', 404);
    }

    matchingBlobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    const selectedBlob = matchingBlobs[0];

    const response = await fetch(selectedBlob.url);
    if (!response.ok) {
      return createResponse(false, {}, 'Failed to fetch script', 500);
    }

    const scriptContent = await response.text();

    await sendWebhookLog(
      request,
      `Script served: ${selectedBlob.pathname}`,
      'SUCCESS',
      {
        version,
        originalGameId: gameId,
        matchedScript: selectedBlob.pathname,
        uploadedAt: selectedBlob.uploadedAt.toISOString(),
        totalMatches: matchingBlobs.length,
        size: scriptContent.length
      }
    );

    return new Response(scriptContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    await sendWebhookLog(
      request,
      `Script fetch error: ${error.message}`,
      'ERROR',
      { error: error.message, stack: error.stack }
    );
    return createResponse(false, {}, 'Internal server error', 500);
  }
};

// Main middleware function
export async function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

  if (
    pathname === '/' ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/__next') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/users') ||
    pathname.startsWith('/docs') ||
    pathname.match(/\.(png|ico|jpg|jpeg|svg|css|js|woff|woff2|ttf|eot|otf)$/)
  ) {
    return NextResponse.next();
  }

  if (isRateLimited(clientIP)) {
    await sendWebhookLog(request, `Rate limit exceeded for IP: ${clientIP}`, 'WARN');
    return createResponse(false, {}, 'Rate limit exceeded. Please try again later.', 429);
  }

  try {
    if (pathname.startsWith('/validate-token/v1')) {
      return await handleValidateToken(request, searchParams);
    }

    if (pathname.startsWith('/api/script/')) {
      return await handleScriptFetch(request, pathname, searchParams);
    }
    
    if (pathname.startsWith('/auth/v1') || pathname.startsWith('/dAuth/v1')) {
      return await handleAuth(request, searchParams);
    }
    
    if (pathname.startsWith('/register/v1')) {
      return await handleRegister(request, searchParams);
    }
    
    if (pathname.startsWith('/login/v1')) {
      return await handleLogin(request, searchParams);
    }
    
    if (pathname.startsWith('/reset-hwid/v1')) {
      return await handleResetHwid(request, searchParams);
    }

    if (pathname.startsWith('/users/v1')) {
      return await handleUsersV1(request, searchParams);
    }

    if (pathname.startsWith('/auth/admin')) {
      return await handleAdminAddTime(request, searchParams);
    }

    if (pathname.startsWith('/manage/v1')) {
      return await handleManageUsers(request);
    }

    if (pathname.startsWith('/stats/v1')) {
      return await handleStats(request, searchParams);
    }

    if (pathname.startsWith('/status')) {
      return createResponse(true, { 
        success: true,
        status: 'API is running',
        message: 'Avoura Auth operational',
        timestamp: new Date().toISOString()
      });
    }

    await sendWebhookLog(request, `Unknown route accessed: ${pathname}`, 'WARN');
    return createResponse(false, {}, 'Route not found', 404);

  } catch (error) {
    await sendWebhookLog(request, `Middleware error: ${error.message}`, 'ERROR', { error: error.message, stack: error.stack });
    return createResponse(false, {}, 'Internal server error', 500);
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
