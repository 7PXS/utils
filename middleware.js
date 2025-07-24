import { NextRequest, NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';
import { get } from '@vercel/edge-config';

// Configuration
const BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_utjs6NoOOU3BdeXE_0pNKDMi9ecw5Gh6ls3KB2OSOb2bKxs';
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1378937855199674508/nHwMtepJ3hKpzKDZErNkMdgIZPWhix80nkqSyMgYlbMMuOrLhHcF0HYsmLcq6CZeJrco';
const SITE_URL = 'https://utils32.vercel.app';
const production = false; // Set to true for production, false for testing

// Helper: Create response object
const createResponse = (success, data = {}, error = null) => ({
  success,
  ...(success ? data : { error })
});

// Helper: Format date to readable format
const formatDate = (date) => {
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  };
  return date.toLocaleString('en-US', options).replace(',', '');
};

// Helper: Send webhook log
const sendWebhookLog = async (request, message, level = 'INFO') => {
  if (!WEBHOOK_URL) {
    console.warn('WEBHOOK_URL not set, skipping webhook log');
    return;
  }

  const timestamp = formatDate(new Date());
  const url = new URL(request.url);
  const fullUrl = `${SITE_URL}${url.pathname}${url.search ? url.search : ''}`;
  const searchParams = Object.fromEntries(url.searchParams.entries());
  const responseData = request.nextUrl.pathname.includes('/auth/v1') || 
                      request.nextUrl.pathname.includes('/dAuth/v1') ||
                      request.nextUrl.pathname.includes('/files/v1') ||
                      request.nextUrl.pathname.includes('/manage/v1') ||
                      request.nextUrl.pathname.includes('/register/v1') ||
                      request.nextUrl.pathname.includes('/login/v1') ||
                      request.nextUrl.pathname.includes('/users/v1') ||
                      request.nextUrl.pathname.includes('/reset-hwid/v1') 
                      ? await request.clone().json().catch(() => ({})) 
                      : {};

  const embedColors = {
    INFO: 0x00FF00,    // Green
    SUCCESS: 0x00AAFF, // Blue
    WARN: 0xFFA500,    // Orange
    ERROR: 0xFF0000    // Red
  };

  const embed = {
    title: `Nebula Middleware - ${level}`,
    description: `\`${timestamp}\` **${message.substring(0, 100)}**`,
    color: embedColors[level] || embedColors.INFO,
    fields: [
      {
        name: 'Request',
        value: `\`Path\`: ${url.pathname.substring(0, 50)}\n` +
               `\`Host\`: ${request.headers.get('host') || 'N/A'}\n` +
               `\`IP\`: ${request.headers.get('x-forwarded-for') || 'N/A'}`,
        inline: true
      },
      {
        name: 'Parameters',
        value: `\`\`\`json\n${JSON.stringify(searchParams, null, 2).substring(0, 100)}\n\`\`\``,
        inline: true
      },
      {
        name: 'Response',
        value: `\`\`\`json\n${JSON.stringify(responseData, null, 2).substring(0, 100)}\n\`\`\``,
        inline: true
      },
      {
        name: 'Metadata',
        value: `\`Request ID\`: ${request.headers.get('x-vercel-request-id') || 'N/A'}\n` +
               `\`URL\`: ${fullUrl.substring(0, 100)}\n` +
               `\`User Agent\`: ${request.headers.get('user-agent')?.substring(0, 50) || 'N/A'}`,
        inline: false
      },
      {
        name: 'Location',
        value: `${request.geo?.city || 'N/A'}, ${request.geo?.country || 'N/A'} (${request.geo?.region || 'N/A'})`,
        inline: false
      }
    ],
    footer: { text: 'Nebula Middleware Logs' },
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Failed to send webhook log: ${error.message}`);
    if (error.message.includes('401')) {
      console.warn('Invalid webhook token. Consider updating WEBHOOK_URL.');
    }
  }
};

// Database helpers
const getUserByKey = async (key) => {
  const { blobs } = await list({ prefix: `Users/${key}-`, token: BLOB_READ_WRITE_TOKEN });
  if (blobs.length === 0) return null;
  const response = await fetch(blobs[0].url);
  if (!response.ok) throw new Error(`Failed to fetch blob: ${response.statusText}`);
  return response.json();
};

const getUserByDiscordId = async (discordId) => {
  const { blobs } = await list({ prefix: `Users/-${discordId}.json`, token: BLOB_READ_WRITE_TOKEN });
  if (blobs.length === 0) return null;
  const response = await fetch(blobs[0].url);
  if (!response.ok) throw new Error(`Failed to fetch blob: ${response.statusText}`);
  return response.json();
};

const getUserByHwid = async (hwid) => {
  const { blobs } = await list({ prefix: 'Users/', token: BLOB_READ_WRITE_TOKEN });
  for (const blob of blobs) {
    try {
      const response = await fetch(blob.url);
      if (!response.ok) continue;
      const userData = await response.json();
      if (userData.hwid === hwid) return userData;
    } catch (error) {
      console.error(`Error reading blob ${blob.pathname}: ${error.message}`);
    }
  }
  return null;
};

const getAllUsers = async () => {
  const { blobs } = await list({ prefix: 'Users/', token: BLOB_READ_WRITE_TOKEN });
  const users = [];
  for (const blob of blobs) {
    try {
      const response = await fetch(blob.url);
      if (response.ok) users.push(await response.json());
    } catch (error) {
      console.error(`Error reading blob ${blob.pathname}: ${error.message}`);
    }
  }
  return users;
};

const updateUser = async (key, discordId, data) => {
  await put(`Users/${key}-${discordId}.json`, JSON.stringify(data), {
    access: 'public',
    token: BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
  });
};

const deleteUser = async (discordId) => {
  const { blobs } = await list({ prefix: `Users/-${discordId}.json`, token: BLOB_READ_WRITE_TOKEN });
  if (blobs.length === 0) return false;
  await del(blobs[0].url, { token: BLOB_READ_WRITE_TOKEN });
  return true;
};

const getResetData = async (discordId, today) => {
  const resetKey = `HwidResets/${discordId}/${today}.json`;
  const { blobs } = await list({ prefix: resetKey, token: BLOB_READ_WRITE_TOKEN });
  if (blobs.length === 0) return { count: 0, resets: [] };
  const response = await fetch(blobs[0].url);
  if (!response.ok) throw new Error(`Failed to fetch reset blob: ${response.statusText}`);
  return response.json();
};

const updateResetData = async (discordId, today, data) => {
  await put(`HwidResets/${discordId}/${today}.json`, JSON.stringify(data), {
    access: 'public',
    token: BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
  });
};

// Helper: Generate 14-character key
const generateKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 14; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
};

// Helper: Parse time string to seconds
const parseTimeToSeconds = (timeStr) => {
  const match = timeStr.match(/^(\d+)(s|m|h|d|mo|yr)$/);
  if (!match) return null;
  const value = parseInt(match[1]);
  const secondsInUnit = { s: 1, m: 60, h: 3600, d: 86400, mo: 2592000, yr: 31536000 };
  return value * secondsInUnit[match[2]];
};

// Test user management
const manageTestData = async () => {
  const testDiscordId = 'test-123456789';
  const testUsername = 'TestUser';
  const testKey = 'test-key-123456';
  const now = Math.floor(Date.now() / 1000);

  if (!production) {
    const existingUser = await getUserByDiscordId(testDiscordId);
    if (!existingUser) {
      await updateUser(testKey, testDiscordId, {
        key: testKey,
        hwid: '',
        discordId: testDiscordId,
        username: testUsername,
        createTime: now,
        endTime: now + 86400, // 1 day
        games: [{ gameId: '12345', script: 'print("Test script loaded")' }]
      });
      console.log(`Test user ${testUsername} added`);
      await sendWebhookLog({ url: SITE_URL, headers: new Headers() }, `Test user ${testUsername} added`, 'SUCCESS');
    }
  } else {
    const deleted = await deleteUser(testDiscordId);
    if (deleted) {
      console.log('Test user removed');
      await sendWebhookLog({ url: SITE_URL, headers: new Headers() }, 'Test user removed', 'SUCCESS');
    }
  }
};

// Initialize test data
manageTestData().catch(error => {
  console.error(`Test data init failed: ${error.message}`);
  sendWebhookLog({ url: SITE_URL, headers: new Headers() }, `Test data init failed: ${error.message}`, 'ERROR');
});

// Middleware function
export async function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;
  const timestamp = formatDate(new Date());

  try {
    // Handle /scripts-list
    if (pathname.startsWith('/scripts-list')) {
      await sendWebhookLog(request, `Handling /scripts-list`, 'INFO');
      console.log(`[${timestamp}] Handling /scripts-list`);
      if (request.headers.get('authorization') !== 'UserMode-2d93n2002n8') {
        console.error(`[${timestamp}] /scripts-list: Invalid authorization header`);
        await sendWebhookLog(request, `/scripts-list: Invalid authorization header`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'Unauthorized'), { status: 401 });
      }

      const scripts = await get('scripts');
      console.log(`[${timestamp}] /scripts-list: Retrieved ${Object.keys(scripts).length} scripts`);
      await sendWebhookLog(request, `/scripts-list: Retrieved ${Object.keys(scripts).length} scripts`, 'SUCCESS');
      return NextResponse.json(Object.keys(scripts));
    }

    // Handle /auth/v1
    if (pathname.startsWith('/auth/v1')) {
      await sendWebhookLog(request, `Handling /auth/v1`, 'INFO');
      console.log(`[${timestamp}] Handling /auth/v1`);
      const key = searchParams.get('key');
      const hwid = searchParams.get('hwid');
      const gameId = searchParams.get('gameId');

      if (!hwid) {
        console.error(`[${timestamp}] /auth/v1: Missing hwid`);
        await sendWebhookLog(request, `/auth/v1: Missing hwid`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'Missing hwid'), { status: 400 });
      }

      // HWID-only check
      if (!key && hwid) {
        const userData = await getUserByHwid(hwid);
        if (!userData) {
          console.error(`[${timestamp}] /auth/v1: No key linked to HWID ${hwid}`);
          await sendWebhookLog(request, `/auth/v1: No key linked to HWID ${hwid}`, 'ERROR');
          return NextResponse.json(createResponse(false, {}, 'No key linked to this HWID'), { status: 404 });
        }

        console.log(`[${timestamp}] /auth/v1: HWID ${hwid} linked to key ${userData.key}`);
        await sendWebhookLog(request, `/auth/v1: HWID ${hwid} linked to key ${userData.key}`, 'SUCCESS');
        return NextResponse.json(createResponse(true, {
          key: userData.key,
          discordId: userData.discordId,
          username: userData.username
        }));
      }

      // Key and HWID check
      if (!key) {
        console.error(`[${timestamp}] /auth/v1: Missing key`);
        await sendWebhookLog(request, `/auth/v1: Missing key`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'Missing key'), { status: 400 });
      }

      const userData = await getUserByKey(key);
      if (!userData) {
        console.error(`[${timestamp}] /auth/v1: Invalid key ${key}`);
        await sendWebhookLog(request, `/auth/v1: Invalid key ${key}`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'Invalid key'), { status: 401 });
      }

      if (userData.hwid === '' && hwid) {
        userData.hwid = hwid;
        await updateUser(key, userData.discordId, userData);
        console.log(`[${timestamp}] /auth/v1: Updated HWID for key ${key}`);
        await sendWebhookLog(request, `/auth/v1: Updated HWID for key ${key}`, 'SUCCESS');
      } else if (userData.hwid !== hwid) {
        console.error(`[${timestamp}] /auth/v1: Invalid HWID for key ${key}`);
        await sendWebhookLog(request, `/auth/v1: Invalid HWID for key ${key}`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'Invalid HWID'), { status: 401 });
      }

      if (userData.endTime < Math.floor(Date.now() / 1000)) {
        console.error(`[${timestamp}] /auth/v1: Key expired for key ${key}`);
        await sendWebhookLog(request, `/auth/v1: Key expired for key ${key}`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'Key expired'), { status: 401 });
      }

      let gamesData = { ValidGame: false, Code: null };
      if (gameId) {
        const scripts = await get('scripts');
        const matchingScriptEntry = Object.entries(scripts).find(([_, script]) => script.GameID === gameId);
        if (matchingScriptEntry) {
          const [scriptName, scriptData] = matchingScriptEntry;
          gamesData = { ValidGame: true, Code: scriptData.Code };
          console.log(`[${timestamp}] /auth/v1: Valid game found for gameId ${gameId}, script: ${scriptName}`);
          await sendWebhookLog(request, `/auth/v1: Valid game found for gameId ${gameId}, script: ${scriptName}`, 'SUCCESS');
        } else {
          console.error(`[${timestamp}] /auth/v1: No game found for gameId ${gameId}`);
          await sendWebhookLog(request, `/auth/v1: No game found for gameId ${gameId}`, 'ERROR');
        }
      }

      return NextResponse.json(createResponse(true, {
        key: userData.key,
        hwid: userData.hwid,
        discordId: userData.discordId,
        username: userData.username,
        createTime: userData.createTime,
        endTime: userData.endTime,
        Games: gamesData
      }));
    }

    // Handle /dAuth/v1
    if (pathname.startsWith('/dAuth/v1')) {
      await sendWebhookLog(request, `Handling /dAuth/v1`, 'INFO');
      console.log(`[${timestamp}] Handling /dAuth/v1`);
      const discordId = searchParams.get('ID');
      const gameId = searchParams.get('gameId');

      if (!discordId) {
        console.error(`[${timestamp}] /dAuth/v1: Missing Discord ID`);
        await sendWebhookLog(request, `/dAuth/v1: Missing Discord ID`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'Missing Discord ID'), { status: 400 });
      }

      const userData = await getUserByDiscordId(discordId);
      if (!userData) {
        console.error(`[${timestamp}] /dAuth/v1: No user found with Discord ID ${discordId}`);
        await sendWebhookLog(request, `/dAuth/v1: No user found with Discord ID ${discordId}`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'No user found with this Discord ID'), { status: 404 });
      }

      if (userData.endTime < Math.floor(Date.now() / 1000)) {
        console.error(`[${timestamp}] /dAuth/v1: Key expired for Discord ID ${discordId}`);
        await sendWebhookLog(request, `/dAuth/v1: Key expired for Discord ID ${discordId}`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'Key expired'), { status: 401 });
      }

      let gamesData = { ValidGame: false, Code: null };
      if (gameId) {
        const scripts = await get('scripts');
        const matchingScriptEntry = Object.entries(scripts).find(([_, script]) => script.GameID === gameId);
        if (matchingScriptEntry) {
          const [scriptName, scriptData] = matchingScriptEntry;
          gamesData = { ValidGame: true, Code: scriptData.Code };
          console.log(`[${timestamp}] /dAuth/v1: Valid game found for gameId ${gameId}, script: ${scriptName}`);
          await sendWebhookLog(request, `/dAuth/v1: Valid game found for gameId ${gameId}, script: ${scriptName}`, 'SUCCESS');
        } else {
          console.error(`[${timestamp}] /dAuth/v1: No game found for gameId ${gameId}`);
          await sendWebhookLog(request, `/dAuth/v1: No game found for gameId ${gameId}`, 'ERROR');
        }
      }

      return NextResponse.json(createResponse(true, {
        key: userData.key,
        hwid: userData.hwid,
        discordId: userData.discordId,
        username: userData.username,
        createTime: userData.createTime,
        endTime: userData.endTime,
        Games: gamesData
      }));
    }

    // Handle /files/v1
    if (pathname.startsWith('/files/v1')) {
      await sendWebhookLog(request, `Handling /files/v1`, 'INFO');
      console.log(`[${timestamp}] Handling /files/v1`);
      const fileName = searchParams.get('file')?.toLowerCase();
      const key = request.headers.get('authorization')?.split(' ')[1];

      if (!fileName || !key) {
        console.error(`[${timestamp}] /files/v1: Missing file name or key`);
        await sendWebhookLog(request, `/files/v1: Missing file name or key`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'Missing file name or key'), { status: 400 });
      }

      const userData = await getUserByKey(key);
      if (!userData) {
        console.error(`[${timestamp}] /files/v1: Invalid key ${key}`);
        await sendWebhookLog(request, `/files/v1: Invalid key ${key}`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'Invalid key'), { status: 401 });
      }

      if (userData.endTime < Math.floor(Date.now() / 1000)) {
        console.error(`[${timestamp}] /files/v1: Key expired for key ${key}`);
        await sendWebhookLog(request, `/files/v1: Key expired for key ${key}`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'Key expired'), { status: 401 });
      }

      const scripts = await get('scripts');
      const script = Object.keys(scripts).find(key => key.toLowerCase() === fileName);
      if (!script) {
        console.error(`[${timestamp}] /files/v1: File not found: ${fileName}`);
        await sendWebhookLog(request, `/files/v1: File not found: ${fileName}`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'File not found'), { status: 404 });
      }

      return NextResponse.json(scripts[script]);
    }

    // Handle /manage/v1
    if (pathname.startsWith('/manage/v1')) {
      await sendWebhookLog(request, `Handling /manage/v1`, 'INFO');
      console.log(`[${timestamp}] Handling /manage/v1`);
      const authHeader = request.headers.get('authorization');
      const discordId = authHeader?.split(' ')[1];

      if (!authHeader || !discordId || discordId !== '1272720391462457400') {
        console.error(`[${timestamp}] /manage/v1: Unauthorized - Admin access required`);
        await sendWebhookLog(request, `/manage/v1: Unauthorized - Admin access required`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'Unauthorized - Admin access required'), { status: 403 });
      }

      const action = searchParams.get('action');
      if (!action) {
        console.error(`[${timestamp}] /manage/v1: Missing action parameter`);
        await sendWebhookLog(request, `/manage/v1: Missing action parameter`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'Missing action parameter'), { status: 400 });
      }

      if (action === 'list') {
        const users = await getAllUsers();
        console.log(`[${timestamp}] /manage/v1: Retrieved ${users.length} users`);
        await sendWebhookLog(request, `/manage/v1: Retrieved ${users.length} users`, 'SUCCESS');
        return NextResponse.json(createResponse(true, { users }));
      } else if (action === 'update') {
        const body = await request.json();
        if (!body.discordId || !body.username || !body.endTime) {
          console.error(`[${timestamp}] /manage/v1: Missing required fields`);
          await sendWebhookLog(request, `/manage/v1: Missing required fields`, 'ERROR');
          return NextResponse.json(createResponse(false, {}, 'Missing required fields'), { status: 400 });
        }

        const userData = await getUserByDiscordId(body.discordId);
        if (!userData) {
          console.error(`[${timestamp}] /manage/v1: User not found with Discord ID ${body.discordId}`);
          await sendWebhookLog(request, `/manage/v1: User not found with Discord ID ${body.discordId}`, 'ERROR');
          return NextResponse.json(createResponse(false, {}, 'User not found'), { status: 404 });
        }

        userData.username = body.username;
        userData.endTime = body.endTime;
        if (body.hwid !== undefined) userData.hwid = body.hwid;
        await updateUser(userData.key, body.discordId, userData);
        console.log(`[${timestamp}] /manage/v1: Updated user ${body.discordId}`);
        await sendWebhookLog(request, `/manage/v1: Updated user ${body.discordId}`, 'SUCCESS');
        return NextResponse.json(createResponse(true, { user: userData }));
      } else if (action === 'delete') {
        const body = await request.json();
        if (!body.discordId) {
          console.error(`[${timestamp}] /manage/v1: Missing discordId`);
          await sendWebhookLog(request, `/manage/v1: Missing discordId`, 'ERROR');
          return NextResponse.json(createResponse(false, {}, 'Missing discordId'), { status: 400 });
        }

        const deleted = await deleteUser(body.discordId);
        if (!deleted) {
          console.error(`[${timestamp}] /manage/v1: User not found with Discord ID ${body.discordId}`);
          await sendWebhookLog(request, `/manage/v1: User not found with Discord ID ${body.discordId}`, 'ERROR');
          return NextResponse.json(createResponse(false, {}, 'User not found'), { status: 404 });
        }

        console.log(`[${timestamp}] /manage/v1: Deleted user ${body.discordId}`);
        await sendWebhookLog(request, `/manage/v1: Deleted user ${body.discordId}`, 'SUCCESS');
        return NextResponse.json(createResponse(true));
      } else {
        console.error(`[${timestamp}] /manage/v1: Invalid action ${action}`);
        await sendWebhookLog(request, `/manage/v1: Invalid action ${action}`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'Invalid action'), { status: 400 });
      }
    }

    // Handle /register/v1
    if (pathname.startsWith('/register/v1')) {
      await sendWebhookLog(request, `Handling /register/v1`, 'INFO');
      console.log(`[${timestamp}] Handling /register/v1`);
      const discordId = searchParams.get('ID');
      const timeStr = searchParams.get('time');
      const username = searchParams.get('username');

      if (!discordId || !timeStr || !username) {
        console.error(`[${timestamp}] /register/v1: Missing required parameters`);
        await sendWebhookLog(request, `/register/v1: Missing required parameters`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'Missing Discord ID, time, or username'), { status: 400 });
      }

      if (username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
        console.error(`[${timestamp}] /register/v1: Invalid username format`);
        await sendWebhookLog(request, `/register/v1: Invalid username format`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'Username must be 3-20 characters, letters, numbers, or underscores'), { status: 400 });
      }

      const durationSeconds = parseTimeToSeconds(timeStr);
      if (durationSeconds === null) {
        console.error(`[${timestamp}] /register/v1: Invalid time format: ${timeStr}`);
        await sendWebhookLog(request, `/register/v1: Invalid time format: ${timeStr}`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'Invalid time format. Use 100s, 100m, 100h, 100d, 100mo, or 100yr'), { status: 400 });
      }

      const existingUser = await getUserByDiscordId(discordId);
      if (existingUser) {
        console.error(`[${timestamp}] /register/v1: User already registered with Discord ID ${discordId}`);
        await sendWebhookLog(request, `/register/v1: User already registered with Discord ID ${discordId}`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'User already registered'), { status: 400 });
      }

      const users = await getAllUsers();
      if (users.some(user => user.username === username)) {
        console.error(`[${timestamp}] /register/v1: Username ${username} already taken`);
        await sendWebhookLog(request, `/register/v1: Username ${username} already taken`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'Username already taken'), { status: 400 });
      }

      const newKey = generateKey();
      const now = Math.floor(Date.now() / 1000);
      const user = {
        key: newKey,
        hwid: '',
        discordId,
        username,
        createTime: now,
        endTime: now + durationSeconds
      };

      await updateUser(newKey, discordId, user);
      console.log(`[${timestamp}] /register/v1: Registered user ${username} with key ${newKey}`);
      await sendWebhookLog(request, `/register/v1: Registered user ${username} with key ${newKey}`, 'SUCCESS');
      return NextResponse.json(createResponse(true, user));
    }

    // Handle /login/v1
    if (pathname.startsWith('/login/v1')) {
      await sendWebhookLog(request, `Handling /login/v1`, 'INFO');
      console.log(`[${timestamp}] Handling /login/v1`);
      const discordId = searchParams.get('ID');
      const username = searchParams.get('username');

      if (!discordId || !username) {
        console.error(`[${timestamp}] /login/v1: Missing Discord ID or username`);
        await sendWebhookLog(request, `/login/v1: Missing Discord ID or username`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'Missing Discord ID or username'), { status: 400 });
      }

      const userData = await getUserByDiscordId(discordId);
      if (!userData) {
        console.error(`[${timestamp}] /login/v1: No user found with Discord ID ${discordId}`);
        await sendWebhookLog(request, `/login/v1: No user found with Discord ID ${discordId}`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'No user found with this Discord ID'), { status: 404 });
      }

      if (userData.username !== username) {
        console.error(`[${timestamp}] /login/v1: Invalid username for Discord ID ${discordId}`);
        await sendWebhookLog(request, `/login/v1: Invalid username for Discord ID ${discordId}`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'Invalid username'), { status: 401 });
      }

      if (userData.endTime < Math.floor(Date.now() / 1000)) {
        console.error(`[${timestamp}] /login/v1: Key expired for Discord ID ${discordId}`);
        await sendWebhookLog(request, `/login/v1: Key expired for Discord ID ${discordId}`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'Key expired'), { status: 401 });
      }

      return NextResponse.json(createResponse(true, userData));
    }

    // Handle /users/v1
    if (pathname.startsWith('/users/v1')) {
      await sendWebhookLog(request, `Handling /users/v1`, 'INFO');
      console.log(`[${timestamp}] Handling /users/v1`);
      const users = await getAllUsers();
      console.log(`[${timestamp}] /users/v1: Retrieved ${users.length} users`);
      await sendWebhookLog(request, `/users/v1: Retrieved ${users.length} users`, 'SUCCESS');
      return NextResponse.json(createResponse(true, { users }));
    }

    // Handle /reset-hwid/v1
    if (pathname.startsWith('/reset-hwid/v1')) {
      await sendWebhookLog(request, `Handling /reset-hwid/v1`, 'INFO');
      console.log(`[${timestamp}] Handling /reset-hwid/v1`);
      const authHeader = request.headers.get('authorization');
      const discordId = authHeader?.split(' ')[1];

      if (!discordId) {
        console.error(`[${timestamp}] /reset-hwid/v1: Missing Discord ID`);
        await sendWebhookLog(request, `/reset-hwid/v1: Missing Discord ID`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'Missing Discord ID'), { status: 400 });
      }

      const userData = await getUserByDiscordId(discordId);
      if (!userData) {
        console.error(`[${timestamp}] /reset-hwid/v1: User not found with Discord ID ${discordId}`);
        await sendWebhookLog(request, `/reset-hwid/v1: User not found with Discord ID ${discordId}`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'User not found'), { status: 404 });
      }

      if (!userData.hwid) {
        console.error(`[${timestamp}] /reset-hwid/v1: No HWID set for Discord ID ${discordId}`);
        await sendWebhookLog(request, `/reset-hwid/v1: No HWID set for Discord ID ${discordId}`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'No HWID set'), { status: 400 });
      }

      const today = new Date().toISOString().split('T')[0];
      const resetData = await getResetData(discordId, today);

      if (resetData.count >= 2 && discordId !== '1272720391462457400') {
        console.error(`[${timestamp}] /reset-hwid/v1: HWID reset limit reached for Discord ID ${discordId}`);
        await sendWebhookLog(request, `/reset-hwid/v1: HWID reset limit reached for Discord ID ${discordId}`, 'ERROR');
        return NextResponse.json(createResponse(false, {}, 'HWID reset limit reached (2/day)'), { status: 429 });
      }

      userData.hwid = '';
      await updateUser(userData.key, discordId, userData);
      resetData.count += 1;
      resetData.resets.push({ timestamp });
      await updateResetData(discordId, today, resetData);
      console.log(`[${timestamp}] /reset-hwid/v1: HWID reset for Discord ID ${discordId} (${resetData.count}/2 today)`);
      await sendWebhookLog(request, `/reset-hwid/v1: HWID reset for Discord ID ${diskey
      return NextResponse.json(createResponse(true, { message: 'HWID reset successfully' }));
    }

    console.log(`[${timestamp}] No matching route for ${pathname}, passing to Next.js`);
    await sendWebhookLog(request, `No matching route for ${pathname}, passing to Next.js`, 'INFO');
    return NextResponse.next();
  } catch (error) {
    console.error(`[${timestamp}] Middleware error: ${error.message}`);
    await sendWebhookLog(request, `Middleware error: ${error.message}`, 'ERROR');
    return NextResponse.json(createResponse(false, {}, 'Internal server error'), { status: 500 });
  }
}

export const config = {
  matcher: [
    '/scripts-list(.*)',
    '/auth/v1(.*)',
    '/dAuth/v1(.*)',
    '/files/v1(.*)',
    '/manage/v1(.*)',
    '/register/v1(.*)',
    '/login/v1(.*)',
    '/users/v1(.*)',
    '/reset-hwid/v1(.*)',
  ],
};
