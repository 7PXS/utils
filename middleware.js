import { NextRequest, NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';
import { get } from '@vercel/edge-config';

// Environment variables
const envConfig = {
  BLOB_READ_WRITE_TOKEN: process.env.VERCEL_BLOB_RW_TOKEN,
  WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
  SITE_URL: process.env.SITE_URL || 'https://utils32.vercel.app',
  ADMIN_ID: process.env.ADMIN_DISCORD_ID,
  API_SECRET: process.env.API_SECRET || 'your-secure-api-secret',
  PRODUCTION: process.env.NODE_ENV === 'production'
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

const parseTimeToSeconds = (timeStr) => {
  const match = timeStr.match(/^(\d+)(s|m|h|d|mo|yr)$/);
  if (!match) return null;
  const value = parseInt(match[1]);
  const units = { s: 1, m: 60, h: 3600, d: 86400, mo: 2592000, yr: 31536000 };
  return value * units[match[2]];
};

// Enhanced logging with webhook
const sendWebhookLog = async (request, message, level = 'INFO', responseData = {}) => {
  if (!envConfig.WEBHOOK_URL) return;

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
      prefix: `users/`, 
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
      prefix: `users/${discordId}`, 
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
      prefix: `users/`, 
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
      prefix: `users/`, 
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
    const blobPath = `users/${userData.discordId}.json`;
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
      prefix: `users/${discordId}`, 
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

// API Handlers
const handleAuth = async (request, searchParams) => {
  const key = sanitizeInput(searchParams.get('key'));
  const hwid = sanitizeInput(searchParams.get('hwid'));
  const gameId = sanitizeInput(searchParams.get('gameId'));
  const discordId = sanitizeInput(searchParams.get('discordId'));

  if (discordId) {
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
      createTime: userData.createTime,
      gameValid
    });
  }

  if (!key && hwid) {
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

const handleRegister = async (request, searchParams) => {
  const discordId = sanitizeInput(searchParams.get('discordId') || searchParams.get('ID'));
  const username = sanitizeInput(searchParams.get('username'));
  const duration = sanitizeInput(searchParams.get('time') || searchParams.get('duration'));

  if (!discordId || !username || !duration) {
    return createResponse(false, {}, 'Missing required parameters', 400);
  }

  if (username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    return createResponse(false, {}, 'Invalid username format. Must be 3-20 characters, alphanumeric and underscores only.', 400);
  }

  const durationSeconds = parseTimeToSeconds(duration);
  if (!durationSeconds) {
    return createResponse(false, {}, 'Invalid duration format. Use format like: 30d, 1mo, 1yr', 400);
  }

  const existingUser = await getUserByDiscordId(discordId);
  if (existingUser) {
    return createResponse(false, {}, 'User already registered with this Discord ID', 400);
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
    await sendWebhookLog(request, `New user registered: ${username} (${discordId})`, 'SUCCESS', { username, discordId });
    return createResponse(true, {
      key: newUser.key,
      username: newUser.username,
      discordId: newUser.discordId,
      createTime: newUser.createTime,
      endTime: newUser.endTime
    });
  } else {
    return createResponse(false, {}, 'Registration failed - database error', 500);
  }
};

const handleLogin = async (request, searchParams) => {
  const discordId = sanitizeInput(searchParams.get('discordId') || searchParams.get('ID'));
  const username = sanitizeInput(searchParams.get('username'));

  if (!discordId) {
    return createResponse(false, {}, 'Missing Discord ID', 400);
  }

  if (!username) {
    return createResponse(false, {}, 'Missing username', 400);
  }

  const userData = await getUserByDiscordId(discordId);
  
  // If user doesn't exist, allow login but mark as needing registration
  if (!userData) {
    await sendWebhookLog(request, `Login attempt for unregistered user: ${username} (${discordId})`, 'INFO');
    return createResponse(true, {
      success: true,
      message: 'Login successful',
      discordId,
      username,
      needsRegistration: true,
      createTime: Math.floor(Date.now() / 1000),
      endTime: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
    });
  }

  // Check if subscription is expired
  if (userData.endTime < Math.floor(Date.now() / 1000)) {
    await sendWebhookLog(request, `Login failed - expired subscription: ${userData.username}`, 'WARN');
    return createResponse(false, {}, 'Subscription expired. Please contact support to renew.', 401);
  }

  // Update username if provided and different
  if (username && userData.username !== username) {
    userData.username = username;
    await saveUser(userData);
    await sendWebhookLog(request, `Username updated: ${discordId} -> ${username}`, 'INFO');
  }

  await sendWebhookLog(request, `Successful login: ${userData.username}`, 'SUCCESS');
  return createResponse(true, {
    success: true,
    key: userData.key,
    username: userData.username,
    discordId: userData.discordId,
    hwid: userData.hwid,
    createTime: userData.createTime,
    endTime: userData.endTime
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

    await sendWebhookLog(request, `HWID reset for user: ${userData.username}`, 'SUCCESS');
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
    await sendWebhookLog(request, `Admin added ${timeToAdd} to user: ${userData.username}`, 'SUCCESS');
    return createResponse(true, {
      success: true,
      message: 'Time added successfully',
      newEndTime: userData.endTime,
      username: userData.username
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
        await sendWebhookLog(request, `Admin deleted user: ${userData.username} (${discordId})`, 'SUCCESS');
        return createResponse(true, {
          success: true,
          message: 'User deleted successfully',
          username: userData.username
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
    pathname.startsWith('/profile') ||
    pathname.startsWith('/users') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/docs') ||
    pathname.match(/\.(png|ico|jpg|jpeg|svg|css|js|woff|woff2|ttf|eot|otf)$/)
  ) {
    return NextResponse.next();
  }

  // Rate limiting
  if (isRateLimited(clientIP)) {
    await sendWebhookLog(request, `Rate limit exceeded for IP: ${clientIP}`, 'WARN');
    return createResponse(false, {}, 'Rate limit exceeded. Please try again later.', 429);
  }

  try {
    // Handle different endpoints
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
        message: 'Nebula API operational',
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

// Middleware configuration
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
