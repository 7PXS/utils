import { NextRequest, NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';
import { get } from '@vercel/edge-config';

// Environment variables - NEVER hardcode sensitive data
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
      prefix: `users/`, 
      token: envConfig.BLOB_READ_WRITE_TOKEN 
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
    const blobPath = `users/${discordId}.json`;
    const { blobs } = await list({ 
      prefix: blobPath, 
      token: envConfig.BLOB_READ_WRITE_TOKEN 
    });
    
    if (blobs.length > 0) {
      await del(blobs[0].url, { token: envConfig.BLOB_READ_WRITE_TOKEN });
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

    if (pathname.startsWith('/status')) {
      return createResponse(true, { status: 'API is running' });
    }

    await sendWebhookLog(request, `Unknown route accessed: ${pathname}`, 'WARN');
    return createResponse(false, {}, 'Route not found', 404);

  } catch (error) {
    await sendWebhookLog(request, `Middleware error: ${error.message}`, 'ERROR');
    return createResponse(false, {}, 'Internal server error', 500);
  }
}

// Middleware configuration
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
