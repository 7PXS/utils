import { NextRequest, NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';
import { get } from '@vercel/edge-config';

// Configuration
const BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_utjs6NoOOU3BdeXE_0pNKDMi9ecw5Gh6ls3KB2OSOb2bKxs';
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1378937855199674508/nHwMtepJ3hKpzKDZErNkMdgIZPWhix80nkqSyMgYlbMMuOrLhHcF0HYsmLcq6CZeJrco';
const SITE_URL = 'https://utils32.vercel.app';
const ADMIN_ID = '1272720391462457400';
const production = false;

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
  if (!WEBHOOK_URL) return;

  const timestamp = formatDate(new Date());
  const url = new URL(request.url || SITE_URL);
  const fullUrl = `${SITE_URL}${url.pathname}${url.search ? url.search : ''}`;
  const searchParams = Object.fromEntries(url.searchParams.entries());

  const embed = {
    title: `Nebula Middleware - ${level}`,
    description: `\`${timestamp}\` **${message.substring(0, 100)}**`,
    color: { INFO: 0x00FF00, SUCCESS: 0x00AAFF, WARN: 0xFFA500, ERROR: 0xFF0000 }[level] || 0x00FF00,
    fields: [
      {
        name: 'Request',
        value: `\`Path\`: ${url.pathname.substring(0, 50)}\n` +
               `\`Host\`: ${request.headers?.get('host') || 'N/A'}\n` +
               `\`IP\`: ${request.headers?.get('x-forwarded-for') || 'N/A'}`,
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
        value: `\`Request ID\`: ${request.headers?.get('x-vercel-request-id') || 'N/A'}\n` +
               `\`URL\`: ${fullUrl.substring(0, 100)}\n` +
               `\`User Agent\`: ${request.headers?.get('user-agent')?.substring(0, 50) || 'N/A'}`,
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
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
  } catch (error) {
    console.error(`Failed to send webhook log: ${error.message}`);
  }
};

// Database helpers
const getUserByKey = async (key) => {
  try {
    const { blobs } = await list({ prefix: `Users/${key}-`, token: BLOB_READ_WRITE_TOKEN });
    if (blobs.length === 0) return null;
    const response = await fetch(blobs[0].url);
    if (!response.ok) throw new Error(`Failed to fetch blob: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error(`Error in getUserByKey for key ${key}: ${error.message}`);
    return null;
  }
};

const getUserByDiscordId = async (discordId) => {
  try {
    console.log(`Searching blob: Users/-${discordId}.json`);
    const { blobs } = await list({ prefix: `Users/-${discordId}.json`, token: BLOB_READ_WRITE_TOKEN });
    if (blobs.length === 0) {
      console.log(`No user found for Discord ID ${discordId}`);
      return null;
    }
    console.log(`Found blob: ${blobs[0].url}`);
    const response = await fetch(blobs[0].url);
    if (!response.ok) throw new Error(`Failed to fetch blob: ${response.statusText}`);
    const data = await response.json();
    console.log(`Retrieved user for Discord ID ${discordId}:`, JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error(`Error in getUserByDiscordId for ${discordId}: ${error.message}`);
    return null;
  }
};

const getUserByHwid = async (hwid) => {
  try {
    const { blobs } = await list({ prefix: 'Users/', token: BLOB_READ_WRITE_TOKEN });
    for (const blob of blobs) {
      const response = await fetch(blob.url);
      if (!response.ok) continue;
      const userData = await response.json();
      if (userData.hwid === hwid) return userData;
    }
    return null;
  } catch (error) {
    console.error(`Error in getUserByHwid for ${hwid}: ${error.message}`);
    return null;
  }
};

const getAllUsers = async () => {
  try {
    const { blobs } = await list({ prefix: 'Users/', token: BLOB_READ_WRITE_TOKEN });
    const users = [];
    for (const blob of blobs) {
      const response = await fetch(blob.url);
      if (response.ok) users.push(await response.json());
    }
    return users;
  } catch (error) {
    console.error(`Error in getAllUsers: ${error.message}`);
    return [];
  }
};

const updateUser = async (key, discordId, data) => {
  try {
    const blobPath = `Users/${key}-${discordId}.json`;
    await put(blobPath, JSON.stringify(data), {
      access: 'public',
      token: BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
    });
  } catch (error) {
    console.error(`Error updating user ${discordId}: ${error.message}`);
    throw error;
  }
};

const deleteUser = async (discordId) => {
  try {
    const { blobs } = await list({ prefix: `Users/-${discordId}.json`, token: BLOB_READ_WRITE_TOKEN });
    if (blobs.length === 0) return false;
    await del(blobs[0].url, { token: BLOB_READ_WRITE_TOKEN });
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
    if (blobs.length === 0) return { count: 0, resets: [] };
    const response = await fetch(blobs[0].url);
    if (!response.ok) throw new Error(`Failed to fetch reset blob: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error(`Error in getResetData for ${discordId}: ${error.message}`);
    return { count: 0, resets: [] };
  }
};

const updateResetData = async (discordId, today, data) => {
  try {
    const resetKey = `HwidResets/${discordId}/${today}.json`;
    await put(resetKey, JSON.stringify(data), {
      access: 'public',
      token: BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
    });
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
    return blobs.length > 0;
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
      endTime: now + 86400
    });
    await sendWebhookLog({ url: SITE_URL, headers: new Headers() }, `Test user ${testUsername} added`, 'SUCCESS', { message: `Test user ${testUsername} added` });
  } else if (production && existingUser) {
    const deleted = await deleteUser(testDiscordId);
    if (deleted) {
      await sendWebhookLog({ url: SITE_URL, headers: new Headers() }, `Test user ${testUsername} removed`, 'SUCCESS', { message: `Test user ${testUsername} removed` });
    }
  }
};

// Initialize test data
manageTestData().catch(error => {
  sendWebhookLog({ url: SITE_URL, headers: new Headers() }, `Test data init failed: ${error.message}`, 'ERROR', { error: error.message });
});

// Middleware function
export async function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;
  const timestamp = formatDate(new Date());

  if (
    pathname === '/' ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/__next') ||
    pathname.match(/\.(png|ico|jpg|jpeg|svg|css|js|woff|woff2|ttf|eot|otf)$/)
  ) {
    return NextResponse.next();
  }

  try {
    // Handle /scripts-list
    if (pathname.startsWith('/scripts-list')) {
      await sendWebhookLog(request, `Handling /scripts-list`, 'INFO', {});
      if (request.headers.get('authorization') !== 'UserMode-2d93n2002n8') {
        await sendWebhookLog(request, `/scripts-list: Invalid authorization`, 'ERROR', { error: 'Unauthorized' });
        return NextResponse.json(createResponse(false, {}, 'Unauthorized'), { status: 401 });
      }
      const scripts = await get('scripts');
      await sendWebhookLog(request, `/scripts-list: Retrieved ${Object.keys(scripts).length} scripts`, 'SUCCESS', { scripts: Object.keys(scripts) });
      return NextResponse.json(createResponse(true, { scripts: Object.keys(scripts) }));
    }

    // Handle /auth/v1
    if (pathname.startsWith('/auth/v1')) {
      await sendWebhookLog(request, `Handling /auth/v1`, 'INFO', {});
      const key = searchParams.get('key');
      const hwid = searchParams.get('hwid');
      const gameId = searchParams.get('gameId');

      if (!hwid) {
        await sendWebhookLog(request, `/auth/v1: Missing hwid`, 'ERROR', { error: 'Missing hwid' });
        return NextResponse.json(createResponse(false, {}, 'Missing hwid'), { status: 400 });
      }

      if (!key && hwid) {
        const userData = await getUserByHwid(hwid);
        if (!userData) {
          await sendWebhookLog(request, `/auth/v1: No key linked to HWID ${hwid}`, 'ERROR', { error: 'No key linked to this HWID' });
          return NextResponse.json(createResponse(false, {}, 'No key linked to this HWID'), { status: 404 });
        }
        await sendWebhookLog(request, `/auth/v1: HWID ${hwid} linked to key ${userData.key}`, 'SUCCESS', { key: userData.key, discordId: userData.discordId, username: userData.username });
        return NextResponse.json(createResponse(true, {
          key: userData.key,
          discordId: userData.discordId,
          username: userData.username
        }));
      }

      if (!key) {
        await sendWebhookLog(request, `/auth/v1: Missing key`, 'ERROR', { error: 'Missing key' });
        return NextResponse.json(createResponse(false, {}, 'Missing key'), { status: 400 });
      }

      const userData = await getUserByKey(key);
      if (!userData) {
        await sendWebhookLog(request, `/auth/v1: Invalid key ${key}`, 'ERROR', { error: 'Invalid key' });
        return NextResponse.json(createResponse(false, {}, 'Invalid key'), { status: 401 });
      }

      if (userData.hwid === '' && hwid) {
        userData.hwid = hwid;
        await updateUser(key, userData.discordId, userData);
        await sendWebhookLog(request, `/auth/v1: Updated HWID for key ${key}`, 'SUCCESS', { key, hwid });
      } else if (userData.hwid !== hwid) {
        await sendWebhookLog(request, `/auth/v1: Invalid HWID for key ${key}`, 'ERROR', { error: 'Invalid HWID' });
        return NextResponse.json(createResponse(false, {}, 'Invalid HWID'), { status: 401 });
      }

      if (userData.endTime < Math.floor(Date.now() / 1000)) {
        await sendWebhookLog(request, `/auth/v1: Key expired for key ${key}`, 'ERROR', { error: 'Key expired' });
        return NextResponse.json(createResponse(false, {}, 'Key expired'), { status: 401 });
      }

      let gamesData = { ValidGame: false, Code: null };
      if (gameId) {
        const scriptExists = await checkGameScript(gameId);
        gamesData = { ValidGame: scriptExists, Code: null };
        await sendWebhookLog(request, `/auth/v1: Script ${scriptExists ? 'exists' : 'not found'} for gameId ${gameId}`, scriptExists ? 'SUCCESS' : 'ERROR', { gameId, ValidGame: scriptExists });
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
      const discordId = searchParams.get('ID');
      const gameId = searchParams.get('gameId');

      if (!discordId) {
        await sendWebhookLog(request, `/dAuth/v1: Missing Discord ID parameter`, 'ERROR', { error: 'Missing Discord ID' });
        return NextResponse.json(createResponse(false, {}, 'Missing Discord ID'), { status: 400 });
      }

      const userData = await getUserByDiscordId(discordId);
      if (!userData) {
        await sendWebhookLog(request, `/dAuth/v1: No user found with Discord ID ${discordId}`, 'ERROR', { error: 'No user found with this Discord ID' });
        return NextResponse.json(createResponse(false, {}, 'No user found with this Discord ID'), { status: 404 });
      }

      if (userData.endTime < Math.floor(Date.now() / 1000)) {
        await sendWebhookLog(request, `/dAuth/v1: Key expired for Discord ID ${discordId}`, 'ERROR', { error: 'Key expired' });
        return NextResponse.json(createResponse(false, {}, 'Key expired'), { status: 401 });
      }

      let gamesData = { ValidGame: false, Code: null };
      if (gameId) {
        const scriptExists = await checkGameScript(gameId);
        gamesData = { ValidGame: scriptExists, Code: null };
        await sendWebhookLog(request, `/dAuth/v1: Script ${scriptExists ? 'exists' : 'not found'} for gameId ${gameId}`, scriptExists ? 'SUCCESS' : 'ERROR', { gameId, ValidGame: scriptExists });
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
      const fileName = searchParams.get('file')?.toLowerCase();
      const key = request.headers.get('authorization')?.split(' ')[1];

      if (!fileName || !key) {
        await sendWebhookLog(request, `/files/v1: Missing file name or key`, 'ERROR', { error: 'Missing file name or key' });
        return NextResponse.json(createResponse(false, {}, 'Missing file name or key'), { status: 400 });
      }

      const userData = await getUserByKey(key);
      if (!userData) {
        await sendWebhookLog(request, `/files/v1: Invalid key ${key}`, 'ERROR', { error: 'Invalid key' });
        return NextResponse.json(createResponse(false, {}, 'Invalid key'), { status: 401 });
      }

      if (userData.endTime < Math.floor(Date.now() / 1000)) {
        await sendWebhookLog(request, `/files/v1: Key expired for key ${key}`, 'ERROR', { error: 'Key expired' });
        return NextResponse.json(createResponse(false, {}, 'Key expired'), { status: 401 });
      }

      const scripts = await get('scripts');
      const script = Object.keys(scripts).find(key => key.toLowerCase() === fileName);
      if (!script) {
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
      const authHeader = request.headers.get('authorization');
      const discordId = authHeader?.split(' ')[1];

      if (!authHeader || !discordId || discordId !== ADMIN_ID) {
        await sendWebhookLog(request, `/manage/v1: Unauthorized - Admin access required`, 'ERROR', { error: 'Unauthorized - Admin access required' });
        return NextResponse.json(createResponse(false, {}, 'Unauthorized - Admin access required'), { status: 403 });
      }

      const action = searchParams.get('action');
      if (!action) {
        await sendWebhookLog(request, `/manage/v1: Missing action parameter`, 'ERROR', { error: 'Missing action parameter' });
        return NextResponse.json(createResponse(false, {}, 'Missing action parameter'), { status: 400 });
      }

      if (action === 'list') {
        const users = await getAllUsers();
        await sendWebhookLog(request, `/manage/v1: Retrieved ${users.length} users`, 'SUCCESS', { users: users.length });
        return NextResponse.json(createResponse(true, { users }));
      } else if (action === 'update') {
        const body = await request.json();
        if (!body.discordId || !body.username || !body.endTime) {
          await sendWebhookLog(request, `/manage/v1: Missing required fields`, 'ERROR', { error: 'Missing required fields' });
          return NextResponse.json(createResponse(false, {}, 'Missing required fields'), { status: 400 });
        }

        const userData = await getUserByDiscordId(body.discordId);
        if (!userData) {
          await sendWebhookLog(request, `/manage/v1: User not found with Discord ID ${body.discordId}`, 'ERROR', { error: 'User not found' });
          return NextResponse.json(createResponse(false, {}, 'User not found'), { status: 404 });
        }

        userData.username = body.username;
        userData.endTime = body.endTime;
        if (body.hwid !== undefined) userData.hwid = body.hwid;
        await updateUser(userData.key, body.discordId, userData);
        await sendWebhookLog(request, `/manage/v1: Updated user ${body.discordId}`, 'SUCCESS', { user: userData });
        return NextResponse.json(createResponse(true, { user: userData }));
      } else if (action === 'delete') {
        const body = await request.json();
        if (!body.discordId) {
          await sendWebhookLog(request, `/manage/v1: Missing discordId`, 'ERROR', { error: 'Missing discordId' });
          return NextResponse.json(createResponse(false, {}, 'Missing discordId'), { status: 400 });
        }

        const deleted = await deleteUser(body.discordId);
        if (!deleted) {
          await sendWebhookLog(request, `/manage/v1: User not found with Discord ID ${body.discordId}`, 'ERROR', { error: 'User not found' });
          return NextResponse.json(createResponse(false, {}, 'User not found'), { status: 404 });
        }

        await sendWebhookLog(request, `/manage/v1: Deleted user ${body.discordId}`, 'SUCCESS', { discordId: body.discordId });
        return NextResponse.json(createResponse(true));
      } else {
        await sendWebhookLog(request, `/manage/v1: Invalid action ${action}`, 'ERROR', { error: 'Invalid action' });
        return NextResponse.json(createResponse(false, {}, 'Invalid action'), { status: 400 });
      }
    }

    // Handle /register/v1
    if (pathname.startsWith('/register/v1')) {
      await sendWebhookLog(request, `Handling /register/v1`, 'INFO', {});
      const discordId = searchParams.get('ID');
      const timeStr = searchParams.get('time');
      const username = searchParams.get('username');

      if (!discordId || !timeStr || !username) {
        await sendWebhookLog(request, `/register/v1: Missing required parameters`, 'ERROR', { error: 'Missing Discord ID, time, or username' });
        return NextResponse.json(createResponse(false, {}, 'Missing Discord ID, time, or username'), { status: 400 });
      }

      if (username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
        await sendWebhookLog(request, `/register/v1: Invalid username format`, 'ERROR', { error: 'Username must be 3-20 characters, letters, numbers, or underscores' });
        return NextResponse.json(createResponse(false, {}, 'Username must be 3-20 characters, letters, numbers, or underscores'), { status: 400 });
      }

      const durationSeconds = parseTimeToSeconds(timeStr);
      if (durationSeconds === null) {
        await sendWebhookLog(request, `/register/v1: Invalid time format: ${timeStr}`, 'ERROR', { error: 'Invalid time format' });
        return NextResponse.json(createResponse(false, {}, 'Invalid time format. Use 100s, 100m, 100h, 100d, 100mo, or 100yr'), { status: 400 });
      }

      const existingUser = await getUserByDiscordId(discordId);
      if (existingUser) {
        await sendWebhookLog(request, `/register/v1: User already registered with Discord ID ${discordId}`, 'ERROR', { error: 'User already registered' });
        return NextResponse.json(createResponse(false, {}, 'User already registered'), { status: 400 });
      }

      const users = await getAllUsers();
      if (users.some(user => user.username === username)) {
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
      await sendWebhookLog(request, `/register/v1: Registered user ${username} with key ${newKey}`, 'SUCCESS', { user });
      return NextResponse.json(createResponse(true, user));
    }

    // Handle /login/v1
    if (pathname.startsWith('/login/v1')) {
      await sendWebhookLog(request, `Handling /login/v1`, 'INFO', {});
      const discordId = searchParams.get('ID');
      const username = searchParams.get('username');

      if (!discordId || !username) {
        await sendWebhookLog(request, `/login/v1: Missing Discord ID or username`, 'ERROR', { error: 'Missing Discord ID or username' });
        return NextResponse.json(createResponse(false, {}, 'Missing Discord ID or username'), { status: 400 });
      }

      const userData = await getUserByDiscordId(discordId);
      if (!userData) {
        await sendWebhookLog(request, `/login/v1: No user found with Discord ID ${discordId}`, 'ERROR', { error: 'No user found with this Discord ID' });
        return NextResponse.json(createResponse(false, {}, 'No user found with this Discord ID'), { status: 404 });
      }

      if (userData.username !== username) {
        await sendWebhookLog(request, `/login/v1: Invalid username for Discord ID ${discordId}`, 'ERROR', { error: 'Invalid username' });
        return NextResponse.json(createResponse(false, {}, 'Invalid username'), { status: 401 });
      }

      if (userData.endTime < Math.floor(Date.now() / 1000)) {
        await sendWebhookLog(request, `/login/v1: Key expired for Discord ID ${discordId}`, 'ERROR', { error: 'Key expired' });
        return NextResponse.json(createResponse(false, {}, 'Key expired'), { status: 401 });
      }

      await sendWebhookLog(request, `/login/v1: Login successful for Discord ID ${discordId}`, 'SUCCESS', { user: userData });
      return NextResponse.json(createResponse(true, userData));
    }

    // Handle /users/v1
    if (pathname.startsWith('/users/v1')) {
      await sendWebhookLog(request, `Handling /users/v1`, 'INFO', {});
      const users = await getAllUsers();
      await sendWebhookLog(request, `/users/v1: Retrieved ${users.length} users`, 'SUCCESS', { users: users.length });
      return NextResponse.json(createResponse(true, { users }));
    }

    // Handle /reset-hwid/v1
    if (pathname.startsWith('/reset-hwid/v1')) {
      await sendWebhookLog(request, `Handling /reset-hwid/v1`, 'INFO', {});
      const authHeader = request.headers.get('authorization');
      const discordId = authHeader?.split(' ')[1];

      if (!discordId) {
        await sendWebhookLog(request, `/reset-hwid/v1: Missing Discord ID`, 'ERROR', { error: 'Missing Discord ID' });
        return NextResponse.json(createResponse(false, {}, 'Missing Discord ID'), { status: 400 });
      }

      const userData = await getUserByDiscordId(discordId);
      if (!userData) {
        await sendWebhookLog(request, `/reset-hwid/v1: User not found with Discord ID ${discordId}`, 'ERROR', { error: 'User not found' });
        return NextResponse.json(createResponse(false, {}, 'User not found'), { status: 404 });
      }

      const today = formatDate(new Date()).split(' ')[0];
      const resetData = await getResetData(discordId, today);
      if (resetData.count >= 3) {
        await sendWebhookLog(request, `/reset-hwid/v1: HWID reset limit reached for ${discordId}`, 'ERROR', { error: 'HWID reset limit reached' });
        return NextResponse.json(createResponse(false, {}, 'HWID reset limit reached'), { status: 429 });
      }

      userData.hwid = '';
      await updateUser(userData.key, discordId, userData);

      resetData.count += 1;
      resetData.resets.push({ timestamp: Math.floor(Date.now() / 1000) });
      await updateResetData(discordId, today, resetData);

      await sendWebhookLog(request, `/reset-hwid/v1: HWID reset successful for ${discordId}`, 'SUCCESS', { user: userData });
      return NextResponse.json(createResponse(true, { message: 'HWID reset successful' }));
    }

    // Handle unknown routes
    await sendWebhookLog(request, `Unknown route: ${pathname}`, 'ERROR', { error: 'Route not found' });
    return NextResponse.json(createResponse(false, {}, 'Route not found'), { status: 404 });

  } catch (error) {
    await sendWebhookLog(request, `Error handling ${pathname}: ${error.message}`, 'ERROR', { error: error.message });
    return NextResponse.json(createResponse(false, {}, `Internal server error: ${error.message}`), { status: 500 });
  }
}
