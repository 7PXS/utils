import { NextRequest, NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';

// Configuration
const BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_utjs6NoOOU3BdeXE_0pNKDMi9ecw5Gh6ls3KB2OSOb2bKxs';
const SITE_URL = 'https://utils32.vercel.app';
const production = false; // Set to true for production, false for testing

// Helper: Create response object
const createResponse = (success, data = {}, error = null) => ({
  success,
  ...(success ? data : { error })
});

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
    }
  } else {
    await deleteUser(testDiscordId);
    console.log('Test user removed');
  }
};

// Initialize test data
manageTestData().catch(console.error);

// Middleware function
export async function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;
  const timestamp = new Date().toISOString();

  try {
    // Handle /scripts-list
    if (pathname.startsWith('/scripts-list')) {
      console.log(`[${timestamp}] Handling /scripts-list`);
      if (request.headers.get('authorization') !== 'UserMode-2d93n2002n8') {
        console.error(`[${timestamp}] /scripts-list: Invalid authorization header`);
        return NextResponse.json(createResponse(false, {}, 'Unauthorized'), { status: 401 });
      }

      const scripts = await get('scripts', { edgeConfig: process.env.EDGE_CONFIG_URL });
      console.log(`[${timestamp}] /scripts-list: Retrieved ${Object.keys(scripts).length} scripts`);
      return NextResponse.json(Object.keys(scripts));
    }

    // Handle /auth/v1
    if (pathname.startsWith('/auth/v1')) {
      console.log(`[${timestamp}] Handling /auth/v1`);
      const key = searchParams.get('key');
      const hwid = searchParams.get('hwid');
      const gameId = searchParams.get('gameId');

      if (!key || !hwid) {
        console.error(`[${timestamp}] /auth/v1: Missing key or hwid`);
        return NextResponse.json(createResponse(false, {}, 'Missing key or hwid'), { status: 400 });
      }

      const userData = await getUserByKey(key);
      if (!userData) {
        console.error(`[${timestamp}] /auth/v1: Invalid key ${key}`);
        return NextResponse.json(createResponse(false, {}, 'Invalid key'), { status: 401 });
      }

      if (userData.hwid === '' && hwid) {
        userData.hwid = hwid;
        await updateUser(key, userData.discordId, userData);
        console.log(`[${timestamp}] /auth/v1: Updated HWID for key ${key}`);
      } else if (userData.hwid !== hwid) {
        console.error(`[${timestamp}] /auth/v1: Invalid HWID for key ${key}`);
        return NextResponse.json(createResponse(false, {}, 'Invalid HWID'), { status: 401 });
      }

      if (userData.endTime < Math.floor(Date.now() / 1000)) {
        console.error(`[${timestamp}] /auth/v1: Key expired for key ${key}`);
        return NextResponse.json(createResponse(false, {}, 'Key expired'), { status: 401 });
      }

      let gamesData = { ValidGame: false, Code: null };
      if (gameId) {
        const scripts = await get('scripts', { edgeConfig: process.env.EDGE_CONFIG_URL });
        const matchingScriptEntry = Object.entries(scripts).find(([_, script]) => script.GameID === gameId);
        if (matchingScriptEntry) {
          const [scriptName, scriptData] = matchingScriptEntry;
          gamesData = { ValidGame: true, Code: scriptData.Code };
          console.log(`[${timestamp}] /auth/v1: Valid game found for gameId ${gameId}, script: ${scriptName}`);
        } else {
          console.error(`[${timestamp}] /auth/v1: No game found for gameId ${gameId}`);
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
      console.log(`[${timestamp}] Handling /dAuth/v1`);
      const discordId = searchParams.get('ID');
      const gameId = searchParams.get('gameId');

      if (!discordId) {
        console.error(`[${timestamp}] /dAuth/v1: Missing Discord ID`);
        return NextResponse.json(createResponse(false, {}, 'Missing Discord ID'), { status: 400 });
      }

      const userData = await getUserByDiscordId(discordId);
      if (!userData) {
        console.error(`[${timestamp}] /dAuth/v1: No user found with Discord ID ${discordId}`);
        return NextResponse.json(createResponse(false, {}, 'No user found with this Discord ID'), { status: 404 });
      }

      if (userData.endTime < Math.floor(Date.now() / 1000)) {
        console.error(`[${timestamp}] /dAuth/v1: Key expired for Discord ID ${discordId}`);
        return NextResponse.json(createResponse(false, {}, 'Key expired'), { status: 401 });
      }

      let gamesData = { ValidGame: false, Code: null };
      if (gameId) {
        const scripts = await get('scripts', { edgeConfig: process.env.EDGE_CONFIG_URL });
        const matchingScriptEntry = Object.entries(scripts).find(([_, script]) => script.GameID === gameId);
        if (matchingScriptEntry) {
          const [scriptName, scriptData] = matchingScriptEntry;
          gamesData = { ValidGame: true, Code: scriptData.Code };
          console.log(`[${timestamp}] /dAuth/v1: Valid game found for gameId ${gameId}, script: ${scriptName}`);
        } else {
          console.error(`[${timestamp}] /dAuth/v1: No game found for gameId ${gameId}`);
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
      console.log(`[${timestamp}] Handling /files/v1`);
      const fileName = searchParams.get('file')?.toLowerCase();
      const key = request.headers.get('authorization')?.split(' ')[1];

      if (!fileName || !key) {
        console.error(`[${timestamp}] /files/v1: Missing file name or key`);
        return NextResponse.json(createResponse(false, {}, 'Missing file name or key'), { status: 400 });
      }

      const userData = await getUserByKey(key);
      if (!userData) {
        console.error(`[${timestamp}] /files/v1: Invalid key ${key}`);
        return NextResponse.json(createResponse(false, {}, 'Invalid key'), { status: 401 });
      }

      if (userData.endTime < Math.floor(Date.now() / 1000)) {
        console.error(`[${timestamp}] /files/v1: Key expired for key ${key}`);
        return NextResponse.json(createResponse(false, {}, 'Key expired'), { status: 401 });
      }

      const scripts = await get('scripts', { edgeConfig: process.env.EDGE_CONFIG_URL });
      const script = Object.keys(scripts).find(key => key.toLowerCase() === fileName);
      if (!script) {
        console.error(`[${timestamp}] /files/v1: File not found: ${fileName}`);
        return NextResponse.json(createResponse(false, {}, 'File not found'), { status: 404 });
      }

      return NextResponse.json(scripts[script]);
    }

    // Handle /manage/v1
    if (pathname.startsWith('/manage/v1')) {
      console.log(`[${timestamp}] Handling /manage/v1`);
      const authHeader = request.headers.get('authorization');
      const discordId = authHeader?.split(' ')[1];

      if (!authHeader || !discordId || discordId !== '1272720391462457400') {
        console.error(`[${timestamp}] /manage/v1: Unauthorized - Admin access required`);
        return NextResponse.json(createResponse(false, {}, 'Unauthorized - Admin access required'), { status: 403 });
      }

      const action = searchParams.get('action');
      if (!action) {
        console.error(`[${timestamp}] /manage/v1: Missing action parameter`);
        return NextResponse.json(createResponse(false, {}, 'Missing action parameter'), { status: 400 });
      }

      if (action === 'list') {
        const users = await getAllUsers();
        console.log(`[${timestamp}] /manage/v1: Retrieved ${users.length} users`);
        return NextResponse.json(createResponse(true, { users }));
      } else if (action === 'update') {
        const body = await request.json();
        if (!body.discordId || !body.username || !body.endTime) {
          console.error(`[${timestamp}] /manage/v1: Missing required fields`);
          return NextResponse.json(createResponse(false, {}, 'Missing required fields'), { status: 400 });
        }

        const userData = await getUserByDiscordId(body.discordId);
        if (!userData) {
          console.error(`[${timestamp}] /manage/v1: User not found with Discord ID ${body.discordId}`);
          return NextResponse.json(createResponse(false, {}, 'User not found'), { status: 404 });
        }

        userData.username = body.username;
        userData.endTime = body.endTime;
        if (body.hwid !== undefined) userData.hwid = body.hwid;
        await updateUser(userData.key, body.discordId, userData);
        console.log(`[${timestamp}] /manage/v1: Updated user ${body.discordId}`);
        return NextResponse.json(createResponse(true, { user: userData }));
      } else if (action === 'delete') {
        const body = await request.json();
        if (!body.discordId) {
          console.error(`[${timestamp}] /manage/v1: Missing discordId`);
          return NextResponse.json(createResponse(false, {}, 'Missing discordId'), { status: 400 });
        }

        const deleted = await deleteUser(body.discordId);
        if (!deleted) {
          console.error(`[${timestamp}] /manage/v1: User not found with Discord ID ${body.discordId}`);
          return NextResponse.json(createResponse(false, {}, 'User not found'), { status: 404 });
        }

        console.log(`[${timestamp}] /manage/v1: Deleted user ${body.discordId}`);
        return NextResponse.json(createResponse(true));
      } else {
        console.error(`[${timestamp}] /manage/v1: Invalid action ${action}`);
        return NextResponse.json(createResponse(false, {}, 'Invalid action'), { status: 400 });
      }
    }

    // Handle /register/v1
    if (pathname.startsWith('/register/v1')) {
      console.log(`[${timestamp}] Handling /register/v1`);
      const discordId = searchParams.get('ID');
      const timeStr = searchParams.get('time');
      const username = searchParams.get('username');

      if (!discordId || !timeStr || !username) {
        console.error(`[${timestamp}] /register/v1: Missing required parameters`);
        return NextResponse.json(createResponse(false, {}, 'Missing Discord ID, time, or username'), { status: 400 });
      }

      if (username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
        console.error(`[${timestamp}] /register/v1: Invalid username format`);
        return NextResponse.json(createResponse(false, {}, 'Username must be 3-20 characters, letters, numbers, or underscores'), { status: 400 });
      }

      const durationSeconds = parseTimeToSeconds(timeStr);
      if (durationSeconds === null) {
        console.error(`[${timestamp}] /register/v1: Invalid time format: ${timeStr}`);
        return NextResponse.json(createResponse(false, {}, 'Invalid time format. Use 100s, 100m, 100h, 100d, 100mo, or 100yr'), { status: 400 });
      }

      const existingUser = await getUserByDiscordId(discordId);
      if (existingUser) {
        console.error(`[${timestamp}] /register/v1: User already registered with Discord ID ${discordId}`);
        return NextResponse.json(createResponse(false, {}, 'User already registered'), { status: 400 });
      }

      const users = await getAllUsers();
      if (users.some(user => user.username === username)) {
        console.error(`[${timestamp}] /register/v1: Username ${username} already taken`);
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
      return NextResponse.json(createResponse(true, user));
    }

    // Handle /login/v1
    if (pathname.startsWith('/login/v1')) {
      console.log(`[${timestamp}] Handling /login/v1`);
      const discordId = searchParams.get('ID');
      const username = searchParams.get('username');

      if (!discordId || !username) {
        console.error(`[${timestamp}] /login/v1: Missing Discord ID or username`);
        return NextResponse.json(createResponse(false, {}, 'Missing Discord ID or username'), { status: 400 });
      }

      const userData = await getUserByDiscordId(discordId);
      if (!userData) {
        console.error(`[${timestamp}] /login/v1: No user found with Discord ID ${discordId}`);
        return NextResponse.json(createResponse(false, {}, 'No user found with this Discord ID'), { status: 404 });
      }

      if (userData.username !== username) {
        console.error(`[${timestamp}] /login/v1: Invalid username for Discord ID ${discordId}`);
        return NextResponse.json(createResponse(false, {}, 'Invalid username'), { status: 401 });
      }

      if (userData.endTime < Math.floor(Date.now() / 1000)) {
        console.error(`[${timestamp}] /login/v1: Key expired for Discord ID ${discordId}`);
        return NextResponse.json(createResponse(false, {}, 'Key expired'), { status: 401 });
      }

      return NextResponse.json(createResponse(true, userData));
    }

    // Handle /users/v1
    if (pathname.startsWith('/users/v1')) {
      console.log(`[${timestamp}] Handling /users/v1`);
      const users = await getAllUsers();
      console.log(`[${timestamp}] /users/v1: Retrieved ${users.length} users`);
      return NextResponse.json(createResponse(true, { users }));
    }

    // Handle /reset-hwid/v1
    if (pathname.startsWith('/reset-hwid/v1')) {
      console.log(`[${timestamp}] Handling /reset-hwid/v1`);
      const authHeader = request.headers.get('authorization');
      const discordId = authHeader?.split(' ')[1];

      if (!discordId) {
        console.error(`[${timestamp}] /reset-hwid/v1: Missing Discord ID`);
        return NextResponse.json(createResponse(false, {}, 'Missing Discord ID'), { status: 400 });
      }

      const userData = await getUserByDiscordId(discordId);
      if (!userData) {
        console.error(`[${timestamp}] /reset-hwid/v1: User not found with Discord ID ${discordId}`);
        return NextResponse.json(createResponse(false, {}, 'User not found'), { status: 404 });
      }

      if (!userData.hwid) {
        console.error(`[${timestamp}] /reset-hwid/v1: No HWID set for Discord ID ${discordId}`);
        return NextResponse.json(createResponse(false, {}, 'No HWID set'), { status: 400 });
      }

      const today = new Date().toISOString().split('T')[0];
      const resetData = await getResetData(discordId, today);

      if (resetData.count >= 2 && discordId !== '1272720391462457400') {
        console.error(`[${timestamp}] /reset-hwid/v1: HWID reset limit reached for Discord ID ${discordId}`);
        return NextResponse.json(createResponse(false, {}, 'HWID reset limit reached (2/day)'), { status: 429 });
      }

      userData.hwid = '';
      await updateUser(userData.key, discordId, userData);
      resetData.count += 1;
      resetData.resets.push({ timestamp });
      await updateResetData(discordId, today, resetData);
      console.log(`[${timestamp}] /reset-hwid/v1: HWID reset for Discord ID ${discordId} (${resetData.count}/2 today)`);
      return NextResponse.json(createResponse(true, { message: 'HWID reset successfully' }));
    }

    console.log(`[${timestamp}] No matching route for ${pathname}, passing to Next.js`);
    return NextResponse.next();
  } catch (error) {
    console.error(`[${timestamp}] Middleware error: ${error.message}`);
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
