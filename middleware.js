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
const sendWebhookLog = async (request, message, level = 'INFO', responseData = {}) => {
  if (!WEBHOOK_URL) {
    console.warn('WEBHOOK_URL not set, skipping webhook log');
    return;
  }

  const timestamp = formatDate(new Date());
  const url = new URL(request.url);
  const fullUrl = `${SITE_URL}${url.pathname}${url.search ? url.search : ''}`;
  const searchParams = Object.fromEntries(url.searchParams.entries());

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
  try {
    const { blobs } = await list({ prefix: `Users/${key}-`, token: BLOB_READ_WRITE_TOKEN });
    if (blobs.length === 0) {
      console.log(`No blobs found for key prefix: Users/${key}-`);
      return null;
    }
    const response = await fetch(blobs[0].url);
    if (!response.ok) {
      console.error(`Failed to fetch blob ${blobs[0].url}: ${response.statusText}`);
      throw new Error(`Failed to fetch blob: ${response.statusText}`);
    }
    const data = await response.json();
    console.log(`Retrieved user data for key ${key}:`, JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error(`Error in getUserByKey for key ${key}: ${error.message}`);
    return null;
  }
};

const getUserByDiscordId = async (discordId) => {
  try {
    console.log(`Searching for user with Discord ID: ${discordId}, blob prefix: Users/-${discordId}.json`);
    const { blobs } = await list({ prefix: `Users/-${discordId}.json`, token: BLOB_READ_WRITE_TOKEN });
    if (blobs.length === 0) {
      console.log(`No blobs found for Discord ID: Users/-${discordId}.json`);
      return null;
    }
    console.log(`Found blob: ${blobs[0].url}`);
    const response = await fetch(blobs[0].url);
    if (!response.ok) {
      console.error(`Failed to fetch blob ${blobs[0].url}: ${response.statusText}`);
      throw new Error(`Failed to fetch blob: ${response.statusText}`);
    }
    const data = await response.json();
    console.log(`Retrieved user data for Discord ID ${discordId}:`, JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error(`Error in getUserByDiscordId for Discord ID ${discordId}: ${error.message}`);
    return null;
  }
};

const getUserByHwid = async (hwid) => {
  try {
    const { blobs } = await list({ prefix: 'Users/', token: BLOB_READ_WRITE_TOKEN });
    for (const blob of blobs) {
      try {
        const response = await fetch(blob.url);
        if (!response.ok) continue;
        const userData = await response.json();
        if (userData.hwid === hwid) {
          console.log(`Found user with HWID ${hwid}:`, JSON.stringify(userData, null, 2));
          return userData;
        }
      } catch (error) {
        console.error(`Error reading blob ${blob.pathname}: ${error.message}`);
      }
    }
    console.log(`No user found with HWID ${hwid}`);
    return null;
  } catch (error) {
    console.error(`Error in getUserByHwid for HWID ${hwid}: ${error.message}`);
    return null;
  }
};

const getAllUsers = async () => {
  try {
    const { blobs } = await list({ prefix: 'Users/', token: BLOB_READ_WRITE_TOKEN });
    const users = [];
    for (const blob of blobs) {
      try {
        const response = await fetch(blob.url);
        if (response.ok) {
          const userData = await response.json();
          users.push(userData);
          console.log(`Retrieved user from blob ${blob.pathname}:`, JSON.stringify(userData, null, 2));
        }
      } catch (error) {
        console.error(`Error reading blob ${blob.pathname}: ${error.message}`);
      }
    }
    console.log(`Retrieved ${users.length} users`);
    return users;
  } catch (error) {
    console.error(`Error in getAllUsers: ${error.message}`);
    return [];
  }
};

const updateUser = async (key, discordId, data) => {
  try {
    const blobPath = `Users/${key}-${discordId}.json`;
    console.log(`Updating user at ${blobPath}:`, JSON.stringify(data, null, 2));
    await put(blobPath, JSON.stringify(data), {
      access: 'public',
      token: BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
    });
    console.log(`Successfully updated user ${discordId} at ${blobPath}`);
  } catch (error) {
    console.error(`Error updating user ${discordId}: ${error.message}`);
    throw error;
  }
};

const deleteUser = async (discordId) => {
  try {
    const { blobs } = await list({ prefix: `Users/-${discordId}.json`, token: BLOB_READ_WRITE_TOKEN });
    if (blobs.length === 0) {
      console.log(`No user found to delete for Discord ID ${discordId}`);
      return false;
    }
    await del(blobs[0].url, { token: BLOB_READ_WRITE_TOKEN });
    console.log(`Deleted user with Discord ID ${discordId} at ${blobs[0].url}`);
    return true;
  } catch (error) {
    console.error(`Error deleting user ${discordId}: ${error.message}`);
    return false;
  }
};

const getResetData = async (discordId, today) => {
  try {
    const resetKey = `HwidResets/${discordId}/${today}.json`;
    const { blobs } = await list({ prefix: resetKey, token: BLOB_READ_WRITE_TOKEN });
    if (blobs.length === 0) {
      console.log(`No reset data found for ${discordId} on ${today}`);
      return { count: 0, resets: [] };
    }
    const response = await fetch(blobs[0].url);
    if (!response.ok) {
      console.error(`Failed to fetch reset blob ${blobs[0].url}: ${response.statusText}`);
      throw new Error(`Failed to fetch reset blob: ${response.statusText}`);
    }
    const data = await response.json();
    console.log(`Retrieved reset data for ${discordId} on ${today}:`, JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error(`Error in getResetData for ${discordId}: ${error.message}`);
    return { count: 0, resets: [] };
  }
};

const updateResetData = async (discordId, today, data) => {
  try {
    const resetKey = `HwidResets/${discordId}/${today}.json`;
    console.log(`Updating reset data at ${resetKey}:`, JSON.stringify(data, null, 2));
    await put(resetKey, JSON.stringify(data), {
      access: 'public',
      token: BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
    });
    console.log(`Successfully updated reset data for ${discordId} on ${today}`);
  } catch (error) {
    console.error(`Error updating reset data for ${discordId}: ${error.message}`);
    throw error;
  }
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

// Helper: Check if script exists for gameId
const checkGameScript = async (gameId) => {
  try {
    const scriptPath = `Scripts/${gameId}.json`;
    const { blobs } = await list({ prefix: scriptPath, token: BLOB_READ_WRITE_TOKEN });
    const exists = blobs.length > 0;
    console.log(`Script check for gameId ${gameId}: ${exists ? 'Script exists' : 'No script found'}`);
    return exists;
  } catch (error) {
    console.error(`Error checking script for gameId ${gameId}: ${error.message}`);
    return false;
  }
};

// Test user management
const manageTestData = async () => {
  const testDiscordId = 'test-123456789';
  const testUsername = 'TestUser';
  const testKey = 'test-key-123456';
  const now = Math.floor(Date.now() / 1000);

  const existingUser = await getUserByDiscordId(testDiscordId);
  if (!production && !existingUser) {
    await updateUser(testKey, testDiscordId, {
      key: testKey,
      hwid: '',
      discordId: testDiscordId,
      username: testUsername,
      createTime: now,
      endTime: now + 86400 // 1 day
    });
    console.log(`Test user ${testUsername} added`);
    await sendWebhookLog({ url: SITE_URL, headers: new Headers() }, `Test user ${testUsername} added`, 'SUCCESS', { message: `Test user ${testUsername} added` });
  } else if (production && existingUser) {
    const deleted = await deleteUser(testDiscordId);
    if (deleted) {
      console.log(`Test user ${testUsername} removed`);
      await sendWebhookLog({ url: SITE_URL, headers: new Headers() }, `Test user ${testUsername} removed`, 'SUCCESS', { message: `Test user ${testUsername} removed` });
    }
  }
};

// Initialize test data
manageTestData().catch(error => {
  console.error(`Test data init failed: ${error.message}`);
  sendWebhookLog({ url: SITE_URL, headers: new Headers() }, `Test data init failed: ${error.message}`, 'ERROR', { error: error.message });
});

// Middleware function
export async function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;
  const timestamp = formatDate(new Date());

  try {
    // Handle /scripts-list
    if (pathname.startsWith('/scripts-list')) {
      await sendWebhookLog(request, `Handling /scripts-list`, 'INFO', {});
      console.log(`[${timestamp}] Handling /scripts-list`);
      if (request.headers.get('authorization') !== 'UserMode-2d93n2002n8') {
        console.error(`[${timestamp}] /scripts-list: Invalid authorization header`);
        await sendWebhookLog(request, `/scripts-list: Invalid authorization header`, 'ERROR', { error: 'Unauthorized' });
        return NextResponse.json(createResponse(false, {}, 'Unauthorized'), { status: 401 });
      }

      const scripts = await get('scripts');
      console.log(`[${timestamp}] /scripts-list: Retrieved ${Object.keys(scripts).length} scripts`);
      await sendWebhookLog(request, `/scripts-list: Retrieved ${Object.keys(scripts).length} scripts`, 'SUCCESS', { scripts: Object.keys(scripts) });
      return NextResponse.json(createResponse(true, { scripts: Object.keys(scripts) }));
    }

    // Handle /auth/v1
    if (pathname.startsWith('/auth/v1')) {
      await sendWebhookLog(request, `Handling /auth/v1`, 'INFO', {});
      console.log(`[${timestamp}] Handling /auth/v1`);
      const key = searchParams.get('key');
      const hwid = searchParams.get('hwid');
      const gameId = searchParams.get('gameId');

      if (!hwid) {
        console.error(`[${timestamp}] /auth/v1: Missing hwid`);
        await sendWebhookLog(request, `/auth/v1: Missing hwid`, 'ERROR', { error: 'Missing hwid' });
        return NextResponse.json(createResponse(false, {}, 'Missing hwid'), { status: 400 });
      }

      // HWID-only check
      if (!key && hwid) {
        const userData = await getUserByHwid(hwid);
        if (!userData) {
          console.error(`[${timestamp}] /auth/v1: No key linked to HWID ${hwid}`);
          await sendWebhookLog(request, `/auth/v1: No key linked to HWID ${hwid}`, 'ERROR', { error: 'No key linked to this HWID' });
          return NextResponse.json(createResponse(false, {}, 'No key linked to this HWID'), { status: 404 });
        }

        console.log(`[${timestamp}] /auth/v1: HWID ${hwid} linked to key ${userData.key}`);
        await sendWebhookLog(request, `/auth/v1: HWID ${hwid} linked to key ${userData.key}`, 'SUCCESS', { key: userData.key, discordId: userData.discordId, username: userData.username });
        return NextResponse.json(createResponse(true, {
          key: userData.key,
          discordId: userData.discordId,
          username: userData.username
        }));
      }

      // Key and HWID check
      if (!key) {
        console.error(`[${timestamp}] /auth/v1: Missing key`);
        await sendWebhookLog(request, `/auth/v1: Missing key`, 'ERROR', { error: 'Missing key' });
        return NextResponse.json(createResponse(false, {}, 'Missing key'), { status: 400 });
      }

      const userData = await getUserByKey(key);
      if (!userData) {
        console.error(`[${timestamp}] /auth/v1: Invalid key ${key}`);
        await sendWebhookLog(request, `/auth/v1: Invalid key ${key}`, 'ERROR', { error: 'Invalid key' });
        return NextResponse.json(createResponse(false, {}, 'Invalid key'), { status: 401 });
      }

      if (userData.hwid === '' && hwid) {
        userData.hwid = hwid;
        await updateUser(key, userData.discordId, userData);
        console.log(`[${timestamp}] /auth/v1: Updated HWID for key ${key}`);
        await sendWebhookLog(request, `/auth/v1: Updated HWID for key ${key}`, 'SUCCESS', { key, hwid });
      } else if (userData.hwid !== hwid) {
        console.error(`[${timestamp}] /auth/v1: Invalid HWID for key ${key}`);
        await sendWebhookLog(request, `/auth/v1: Invalid HWID for key ${key}`, 'ERROR', { error: 'Invalid HWID' });
        return NextResponse.json(createResponse(false, {}, 'Invalid HWID'), { status: 401 });
      }

      if (userData.endTime < Math.floor(Date.now() / 1000)) {
        console.error(`[${timestamp}] /auth/v1: Key expired for key ${key}`);
        await sendWebhookLog(request, `/auth/v1: Key expired for key ${key}`, 'ERROR', { error: 'Key expired' });
        return NextResponse.json(createResponse(false, {}, 'Key expired'), { status: 401 });
      }

      let gamesData = { ValidGame: false, Code: null };
      if (gameId) {
        const scriptExists = await checkGameScript(gameId);
        if (scriptExists) {
          console.log(`[${timestamp}] /auth/v1: Script exists for gameId ${gameId}`);
          await sendWebhookLog(request, `/auth/v1: Script exists for gameId ${gameId}`, 'SUCCESS', { gameId, ValidGame: true });
        } else {
          console.error(`[${timestamp}] /auth/v1: No script found for gameId ${gameId}`);
          await sendWebhookLog(request, `/auth/v1: No script found for gameId ${gameId}`, 'ERROR', { gameId, ValidGame: false });
        }
        gamesData = { ValidGame: scriptExists, Code: null };
      }

      const response = createResponse(true, {
        key: userData.key,
        hwid: userData.hwid,
        discordId: userData.discordId,
        username: userData.username,
        createTime: userData.createTime,
        endTime: userData.endTime,
        Games: gamesData
      });
      await sendWebhookLog(request, `/auth/v1: Successful`, 'SUCCESS', response);
      return NextResponse.json(response);
    }

    // Handle /dAuth/v1
    if (pathname.startsWith('/dAuth/v1')) {
      await sendWebhookLog(request, `Handling /dAuth/v1`, 'INFO', {});
      console.log(`[${timestamp}] Handling /dAuth/v1`);
      const discordId = searchParams.get('ID');
      const gameId = searchParams.get('gameId');

      if (!discordId) {
        console.error(`[${timestamp}] /dAuth/v1: Missing Discord ID parameter`);
        await sendWebhookLog(request, `/dAuth/v1: Missing Discord ID parameter`, 'ERROR', { error: 'Missing Discord ID' });
        return NextResponse.json(createResponse(false, {}, 'Missing Discord ID'), { status: 400 });
      }

      const discordIdHeader = request.headers.get('discordId');
      if (discordIdHeader) {
        console.warn(`[${timestamp}] /dAuth/v1: Discord ID found in header (${discordIdHeader}), ignoring in favor of query parameter ID=${discordId}`);
        await sendWebhookLog(request, `/dAuth/v1: Discord ID in header ignored`, 'WARN', { warning: 'Using query parameter ID instead of header' });
      }

      const userData = await getUserByDiscordId(discordId);
      if (!userData) {
        console.error(`[${timestamp}] /dAuth/v1: No user found with Discord ID ${discordId}`);
        await sendWebhookLog(request, `/dAuth/v1: No user found with Discord ID ${discordId}`, 'ERROR', { error: 'No user found with this Discord ID' });
        return NextResponse.json(createResponse(false, {}, 'No user found with this Discord ID'), { status: 404 });
      }

      if (userData.endTime < Math.floor(Date.now() / 1000)) {
        console.error(`[${timestamp}] /dAuth/v1: Key expired for Discord ID ${discordId}`);
        await sendWebhookLog(request, `/dAuth/v1: Key expired for Discord ID ${discordId}`, 'ERROR', { error: 'Key expired' });
        return NextResponse.json(createResponse(false, {}, 'Key expired'), { status: 401 });
      }

      let gamesData = { ValidGame: false, Code: null };
      if (gameId) {
        const scriptExists = await checkGameScript(gameId);
        if (scriptExists) {
          console.log(`[${timestamp}] /dAuth/v1: Script exists for gameId ${gameId}`);
          await sendWebhookLog(request, `/auth/v1: Script exists for gameId ${gameId}`, 'SUCCESS', { gameId, ValidGame: true });
        } else {
          console.error(`[${timestamp}] /dAuth/v1: No script found for gameId ${gameId}`);
          await sendWebhookLog(request, `/auth/v1: No script found for gameId ${gameId}`, 'ERROR', { gameId, ValidGame: false });
        }
        gamesData = { ValidGame: scriptExists, Code: null };
      }

      const response = createResponse(true, {
        key: userData.key,
        hwid: userData.hwid,
        discordId: userData.discordId,
        username: userData.username,
        createTime: userData.createTime,
        endTime: userData.endTime,
        Games: gamesData
      });
      await sendWebhookLog(request, `/dAuth/v1: Successful`, 'SUCCESS', response);
      return NextResponse.json(response);
    }

    // Handle /files/v1
    if (pathname.startsWith('/files/v1')) {
      await sendWebhookLog(request, `Handling /files/v1`, 'INFO', {});
      console.log(`[${timestamp}] Handling /files/v1`);
      const fileName = searchParams.get('file')?.toLowerCase();
      const key = request.headers.get('authorization')?.split(' ')[1];

      if (!fileName || !key) {
        console.error(`[${timestamp}] /files/v1: Missing file name or key`);
        await sendWebhookLog(request, `/files/v1: Missing file name or key`, 'ERROR', { error: 'Missing file name or key' });
        return NextResponse.json(createResponse(false, {}, 'Missing file name or key'), { status: 400 });
      }

      const userData = await getUserByKey(key);
      if (!userData) {
        console.error(`[${timestamp}] /files/v1: Invalid key ${key}`);
        await sendWebhookLog(request, `/files/v1: Invalid key ${key}`, 'ERROR', { error: 'Invalid key' });
        return NextResponse.json(createResponse(false, {}, 'Invalid key'), { status: 401 });
      }

      if (userData.endTime < Math.floor(Date.now() / 1000)) {
        console.error(`[${timestamp}] /files/v1: Key expired for key ${key}`);
        await sendWebhookLog(request, `/files/v1: Key expired for key ${key}`, 'ERROR', { error: 'Key expired' });
        return NextResponse.json(createResponse(false, {}, 'Key expired'), { status: 401 });
      }

      const scripts = await get('scripts');
      const script = Object.keys(scripts).find(key => key.toLowerCase() === fileName);
      if (!script) {
        console.error(`[${timestamp}] /files/v1: File not found: ${fileName}`);
        await sendWebhookLog(request, `/files/v1: File not found: ${fileName}`, 'ERROR', { error: 'File not found' });
        return NextResponse.json(createResponse(false, {}, 'File not found'), { status: 404 });
      }

      const response = createResponse(true, scripts[script]);
      await sendWebhookLog(request, `/files/v1: Retrieved script ${fileName}`, 'SUCCESS', response);
      return NextResponse.json(response);
    }

    // Handle /manage/v1
    if (pathname.startsWith('/manage/v1')) {
      await sendWebhookLog(request, `Handling /manage/v1`, 'INFO', {});
      console.log(`[${timestamp}] Handling /manage/v1`);
      const authHeader = request.headers.get('authorization');
      const discordId = authHeader?.split(' ')[1];

      if (!authHeader || !discordId || discordId !== '1272720391462457400') {
        console.error(`[${timestamp}] /manage/v1: Unauthorized - Admin access required`);
        await sendWebhookLog(request, `/manage/v1: Unauthorized - Admin access required`, 'ERROR', { error: 'Unauthorized - Admin access required' });
        return NextResponse.json(createResponse(false, {}, 'Unauthorized - Admin access required'), { status: 403 });
      }

      const action = searchParams.get('action');
      if (!action) {
        console.error(`[${timestamp}] /manage/v1: Missing action parameter`);
        await sendWebhookLog(request, `/manage/v1: Missing action parameter`, 'ERROR', { error: 'Missing action parameter' });
        return NextResponse.json(createResponse(false, {}, 'Missing action parameter'), { status: 400 });
      }

      if (action === 'list') {
        const users = await getAllUsers();
        console.log(`[${timestamp}] /manage/v1: Retrieved ${users.length} users`);
        await sendWebhookLog(request, `/manage/v1: Retrieved ${users.length} users`, 'SUCCESS', { users: users.length });
        return NextResponse.json(createResponse(true, { users }));
      } else if (action === 'update') {
        const body = await request.json();
        if (!body.discordId || !body.username || !body.endTime) {
          console.error(`[${timestamp}] /manage/v1: Missing required fields`);
          await sendWebhookLog(request, `/manage/v1: Missing required fields`, 'ERROR', { error: 'Missing required fields' });
          return NextResponse.json(createResponse(false, {}, 'Missing required fields'), { status: 400 });
        }

        const userData = await getUserByDiscordId(body.discordId);
        if (!userData) {
          console.error(`[${timestamp}] /manage/v1: User not found with Discord ID ${body.discordId}`);
          await sendWebhookLog(request, `/manage/v1: User not found with Discord ID ${body.discordId}`, 'ERROR', { error: 'User not found' });
          return NextResponse.json(createResponse(false, {}, 'User not found'), { status: 404 });
        }

        userData.username = body.username;
        userData.endTime = body.endTime;
        if (body.hwid !== undefined) userData.hwid = body.hwid;
        await updateUser(userData.key, body.discordId, userData);
        console.log(`[${timestamp}] /manage/v1: Updated user ${body.discordId}`);
        await sendWebhookLog(request, `/manage/v1: Updated user ${body.discordId}`, 'SUCCESS', { user: userData });
        return NextResponse.json(createResponse(true, { user: userData }));
      } else if (action === 'delete') {
        const body = await request.json();
        if (!body.discordId) {
          console.error(`[${timestamp}] /manage/v1: Missing discordId`);
          await sendWebhookLog(request, `/manage/v1: Missing discordId`, 'ERROR', { error: 'Missing discordId' });
          return NextResponse.json(createResponse(false, {}, 'Missing discordId'), { status: 400 });
        }

        const deleted = await deleteUser(body.discordId);
        if (!deleted) {
          console.error(`[${timestamp}] /manage/v1: User not found with Discord ID ${body.discordId}`);
          await sendWebhookLog(request, `/manage/v1: User not found with Discord ID ${body.discordId}`, 'ERROR', { error: 'User not found' });
          return NextResponse.json(createResponse(false, {}, 'User not found'), { status: 404 });
        }

        console.log(`[${timestamp}] /manage/v1: Deleted user ${body.discordId}`);
        await sendWebhookLog(request, `/manage/v1: Deleted user ${body.discordId}`, 'SUCCESS', { discordId: body.discordId });
        return NextResponse.json(createResponse(true));
      } else {
        console.error(`[${timestamp}] /manage/v1: Invalid action ${action}`);
        await sendWebhookLog(request, `/manage/v1: Invalid action ${action}`, 'ERROR', { error: 'Invalid action' });
        return NextResponse.json(createResponse(false, {}, 'Invalid action'), { status: 400 });
      }
    }

    // Handle /register/v1
    if (pathname.startsWith('/register/v1')) {
      await sendWebhookLog(request, `Handling /register/v1`, 'INFO', {});
      console.log(`[${timestamp}] Handling /register/v1`);
      const discordId = searchParams.get('ID');
      const timeStr = searchParams.get('time');
      const username = searchParams.get('username');

      if (!discordId || !timeStr || !username) {
        console.error(`[${timestamp}] /register/v1: Missing required parameters (ID: ${discordId}, time: ${timeStr}, username: ${username})`);
        await sendWebhookLog(request, `/register/v1: Missing required parameters`, 'ERROR', { error: 'Missing Discord ID, time, or username' });
        return NextResponse.json(createResponse(false, {}, 'Missing Discord ID, time, or username'), { status: 400 });
      }

      if (username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
        console.error(`[${timestamp}] /register/v1: Invalid username format: ${username}`);
        await sendWebhookLog(request, `/register/v1: Invalid username format`, 'ERROR', { error: 'Username must be 3-20 characters, letters, numbers, or underscores' });
        return NextResponse.json(createResponse(false, {}, 'Username must be 3-20 characters, letters, numbers, or underscores'), { status: 400 });
      }

      const durationSeconds = parseTimeToSeconds(timeStr);
      if (durationSeconds === null) {
        console.error(`[${timestamp}] /register/v1: Invalid time format: ${timeStr}`);
        await sendWebhookLog(request, `/register/v1: Invalid time format: ${timeStr}`, 'ERROR', { error: 'Invalid time format' });
        return NextResponse.json(createResponse(false, {}, 'Invalid time format. Use 100s, 100m, 100h, 100d, 100mo, or 100yr'), { status: 400 });
      }

      const existingUser = await getUserByDiscordId(discordId);
      if (existingUser) {
        console.error(`[${timestamp}] /register/v1: User already registered with Discord ID ${discordId}`);
        await sendWebhookLog(request, `/register/v1: User already registered with Discord ID ${discordId}`, 'ERROR', { error: 'User already registered' });
        return NextResponse.json(createResponse(false, {}, 'User already registered'), { status: 400 });
      }

      const users = await getAllUsers();
      if (users.some(user => user.username === username)) {
        console.error(`[${timestamp}] /register/v1: Username ${username} already taken`);
        await sendWebhookLog(request, `/register/v1: Username ${username} already taken`, 'ERROR', { error: 'Username already taken' });
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
      console.log(`[${timestamp}] /register/v1: Registered user ${username} with key ${newKey} and Discord ID ${discordId}`);
      await sendWebhookLog(request, `/register/v1: Registered user ${username} with key ${newKey}`, 'SUCCESS', { user });
      return NextResponse.json(createResponse(true, user));
    }

    // Handle /login/v1
    if (pathname.startsWith('/login/v1')) {
      await sendWebhookLog(request, `Handling /login/v1`, 'INFO', {});
      console.log(`[${timestamp}] Handling /login/v1`);
      const discordId = searchParams.get('ID');
      const username = searchParams.get('username');

      if (!discordId || !username) {
        console.error(`[${timestamp}] /login/v1: Missing Discord ID or username (ID: ${discordId}, username: ${username})`);
        await sendWebhookLog(request, `/login/v1: Missing Discord ID or username`, 'ERROR', { error: 'Missing Discord ID or username' });
        return NextResponse.json(createResponse(false, {}, 'Missing Discord ID or username'), { status: 400 });
      }

      const discordIdHeader = request.headers.get('discordId');
      if (discordIdHeader) {
        console.warn(`[${timestamp}] /login/v1: Discord ID found in header (${discordIdHeader}), ignoring in favor of query parameter ID=${discordId}`);
        await sendWebhookLog(request, `/login/v1: Discord ID in header ignored`, 'WARN', { warning: 'Using query parameter ID instead of header' });
      }

      const userData = await getUserByDiscordId(discordId);
      if (!userData) {
        console.error(`[${timestamp}] /login/v1: No user found with Discord ID ${discordId}`);
        await sendWebhookLog(request, `/login/v1: No user found with Discord ID ${discordId}`, 'ERROR', { error: 'No user found with this Discord ID' });
        return NextResponse.json(createResponse(false, {}, 'No user found with this Discord ID'), { status: 404 });
      }

      if (userData.username !== username) {
        console.error(`[${timestamp}] /login/v1: Invalid username ${username} for Discord ID ${discordId}. Expected: ${userData.username}`);
        await sendWebhookLog(request, `/login/v1: Invalid username for Discord ID ${discordId}`, 'ERROR', { error: 'Invalid username' });
        return NextResponse.json(createResponse(false, {}, 'Invalid username'), { status: 401 });
      }

      if (userData.endTime < Math.floor(Date.now() / 1000)) {
        console.error(`[${timestamp}] /login/v1: Key expired for Discord ID ${discordId}`);
        await sendWebhookLog(request, `/login/v1: Key expired for Discord ID ${discordId}`, 'ERROR', { error: 'Key expired' });
        return NextResponse.json(createResponse(false, {}, 'Key expired'), { status: 401 });
      }

      console.log(`[${timestamp}] /login/v1: Login successful for Discord ID ${discordId}, username ${username}`);
      await sendWebhookLog(request, `/login/v1: Login successful for Discord ID ${discordId}`, 'SUCCESS', { user: userData });
      return NextResponse.json(createResponse(true, userData));
    }

    // Handle /users/v1
    if (pathname.startsWith('/users/v1')) {
      await sendWebhookLog(request, `Handling /users/v1`, 'INFO', {});
      console.log(`[${timestamp}] Handling /users/v1`);
      const users = await getAllUsers();
      console.log(`[${timestamp}] /users/v1: Retrieved ${users.length} users`);
      await sendWebhookLog(request, `/users/v1: Retrieved ${users.length} users`, 'SUCCESS', { users: users.length });
      return NextResponse.json(createResponse(true, { users }));
    }

    // Handle /reset-hwid/v1
    if (pathname.startsWith('/reset-hwid/v1')) {
      await sendWebhookLog(request, `Handling /reset-hwid/v1`, 'INFO', {});
      console.log(`[${timestamp}] Handling /reset-hwid/v1`);
      const authHeader = request.headers.get('authorization');
      const discordId = authHeader?.split(' ')[1];

      if (!discordId) {
        console.error(`[${timestamp}] /reset-hwid/v1: Missing Discord ID`);
        await sendWebhookLog(request, `/reset-hwid/v1: Missing Discord ID`, 'ERROR', { error: 'Missing Discord ID' });
        return NextResponse.json(createResponse(false, {}, 'Missing Discord ID'), { status: 400 });
      }

      const userData = await getUserByDiscordId(discordId);
      if (!userData) {
        console.error(`[${timestamp}] /reset-hwid/v1: User not found with Discord ID ${discordId}`);
        await sendWebhookLog(request, `/reset-hwid/v1: User not found with Discord ID ${discordId}`, 'ERROR', { error: 'User not found' });
        return NextResponse.json(createResponse(false, {}, 'User not found'), { status: 404 });
      }

      if (!userData.hwid) {
        console.error(`[${timestamp}] /reset-hwid/v1: No HWID set for Discord ID ${discordId}`);
        await sendWebhookLog(request, `/reset-hwid/v1: No HWID set for Discord ID ${discordId}`, 'ERROR', { error: 'No HWID set' });
        return NextResponse.json(createResponse(false, {}, 'No HWID set'), { status: 400 });
      }

      const today = new Date().toISOString().split('T')[0];
      const resetData = await getResetData(discordId, today);

      if (resetData.count >= 2 && discordId !== '1272720391462457400') {
        console.error(`[${timestamp}] /reset-hwid/v1: HWID reset limit reached for Discord ID ${discordId}`);
        await sendWebhookLog(request, `/reset-hwid/v1: HWID reset limit reached for Discord ID ${discordId}`, 'ERROR', { error: 'HWID reset limit reached (2/day)' });
        return NextResponse.json(createResponse(false, {}, 'HWID reset limit reached (2/day)'), { status: 429 });
      }

      userData.hwid = '';
      await updateUser(userData.key, discordId, userData);
      resetData.count += 1;
      resetData.resets.push({ timestamp });
      await updateResetData(discordId, today, resetData);
      console.log(`[${timestamp}] /reset-hwid/v1: HWID reset for Discord ID ${discordId} (${resetData.count}/2 today)`);
      await sendWebhookLog(request, `/reset-hwid/v1: HWID reset for Discord ID ${discordId} (${resetData.count}/2 today)`, 'SUCCESS', { message: 'HWID reset successfully' });
      return NextResponse.json(createResponse(true, { message: 'HWID reset successfully' }));
    }

    console.log(`[${timestamp}] No matching route for ${pathname}, passing to Next.js`);
    await sendWebhookLog(request, `No matching route for ${pathname}, passing to Next.js`, 'INFO', {});
    return NextResponse.next();
  } catch (error) {
    console.error(`[${timestamp}] Middleware error: ${error.message}`);
    await sendWebhookLog(request, `Middleware error: ${error.message}`, 'ERROR', { error: error.message });
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
