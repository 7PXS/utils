const { NextResponse } = require('next/server');
const { get } = require('@vercel/edge-config');
const { put, get: getBlob, head, list } = require('@vercel/blob');

// Vercel Blob Storage configuration
const CONTAINER_NAME = 'users'; // Optional: Used for clarity
const USERS_DIR = 'Users/'; // Prefix for user files in blob storage

// Helper to validate input strings
function validateInput(str, name, maxLength = 100) {
  if (!str || typeof str !== 'string' || str.length > maxLength || /[^a-zA-Z0-9_-]/.test(str)) {
    throw new Error(`Invalid ${name}: Must be a valid string with alphanumeric characters, underscores, or hyphens`);
  }
  return str;
}

// Helper to generate random keys in the format 2sfm82n-0jn3-2uhfh
function generateKey() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const getRandomChar = () => chars[Math.floor(Math.random() * chars.length)];
  const part1 = Array(7).fill().map(getRandomChar).join('');
  const part2 = Array(4).fill().map(getRandomChar).join('');
  const part3 = Array(5).fill().map(getRandomChar).join('');
  return `${part1}-${part2}-${part3}`;
}

// Helper to parse time input and calculate end date (UNIX timestamp)
function parseTimeToUnix(timeString) {
  const now = Math.floor(Date.now() / 1000); // Current UNIX timestamp in seconds
  if (!timeString) return now + 30 * 24 * 60 * 60; // Default: 30 days

  const match = timeString.match(/^(\d+)(s|m|h|d|mo|yr)$/);
  if (!match) throw new Error('Invalid time format. Use e.g., 100s, 100m, 100h, 100d, 100mo, 100yr');

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers = {
    s: 1,           // seconds
    m: 60,          // minutes
    h: 60 * 60,     // hours
    d: 24 * 60 * 60, // days
    mo: 30 * 24 * 60 * 60, // months (approx 30 days)
    yr: 365 * 24 * 60 * 60 // years (approx 365 days)
  };

  return now + value * multipliers[unit];
}

// Helper to read user data from Vercel Blob
async function readUserBlob(discordID) {
  validateInput(discordID, 'discordID');
  const blobName = `${USERS_DIR}user-${discordID}.json`;
  try {
    const blob = await getBlob(blobName, { access: 'public' });
    if (!blob) throw new Error('User not found');
    const data = await blob.text();
    return JSON.parse(data);
  } catch (error) {
    if (error.status === 404 || error.message.includes('The requested blob does not exist')) {
      throw new Error('User not found');
    }
    throw new Error(`Failed to read user blob: ${error.message}`);
  }
}

// Helper to find user by key
async function findUserByKey(key) {
  validateInput(key, 'key', 17);
  try {
    const { blobs } = await list({ prefix: USERS_DIR });
    for (const blob of blobs) {
      if (blob.pathname.startsWith(USERS_DIR) && blob.pathname.endsWith('.json')) {
        const blobData = await getBlob(blob.pathname, { access: 'public' });
        if (!blobData) continue;
        const userData = JSON.parse(await blobData.text());
        if (userData.Key === key) {
          return { discordID: blob.pathname.replace(`${USERS_DIR}user-`, '').replace('.json', ''), ...userData };
        }
      }
    }
    throw new Error('User not found for provided key');
  } catch (error) {
    throw new Error(`Failed to find user by key: ${error.message}`);
  }
}

// Helper to write user data to Vercel Blob
async function writeUserBlob(discordID, userData) {
  validateInput(discordID, 'discordID');
  const blobName = `${USERS_DIR}user-${discordID}.json`;
  try {
    await put(blobName, JSON.stringify(userData, null, 2), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    });
  } catch (error) {
    throw new Error(`Failed to write user blob: ${error.message}`);
  }
}

// Helper to check if user blob exists
async function userBlobExists(discordID) {
  validateInput(discordID, 'discordID');
  const blobName = `${USERS_DIR}user-${discordID}.json`;
  try {
    await head(blobName, { access: 'public' });
    return true;
  } catch (error) {
    if (error.status === 404 || error.message.includes('The requested blob does not exist')) {
      return false;
    }
    throw new Error(`Failed to check user blob existence: ${error.message}`);
  }
}

// Helper to list all user blobs
async function listUserBlobs() {
  try {
    const { blobs } = await list({ prefix: USERS_DIR });
    return blobs
      .filter(blob => blob.pathname.startsWith(USERS_DIR) && blob.pathname.endsWith('.json'))
      .map(blob => blob.pathname.replace(`${USERS_DIR}user-`, '').replace('.json', ''));
  } catch (error) {
    throw new Error(`Failed to list user blobs: ${error.message}`);
  }
}

// Middleware function
async function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;

  // Handle /auth?key=&hwid= or /auth?ID=
  if (pathname === '/auth') {
    const key = searchParams.get('key');
    const hwid = searchParams.get('hwid');
    const id = searchParams.get('ID');

    if (!id && !key) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required parameter: ID or key is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      let user;
      if (id) {
        // Authenticate with ID only
        validateInput(id, 'ID');
        user = await readUserBlob(id);

        // Check if key has expired
        const now = Math.floor(Date.now() / 1000);
        if (user.EndTime < now) {
          return new NextResponse(
            JSON.stringify({ error: 'Key has expired' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Return only the requested fields
        return new NextResponse(
          JSON.stringify({
            success: true,
            User: user.UserTag || 'None',
            Hwid: user.Hwid || '',
            Username: user.UserName
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } else {
        // Authenticate with key and optional hwid
        validateInput(key, 'key', 17);
        if (hwid) validateInput(hwid, 'hwid');
        user = await findUserByKey(key);

        // Handle HWID verification or assignment
        if (hwid && !user.Hwid) {
          user.Hwid = hwid;
          await writeUserBlob(user.discordID, user);
        } else if (hwid && user.Hwid && user.Hwid !== hwid) {
          return new NextResponse(
            JSON.stringify({ error: 'Invalid HWID' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Check if key has expired
        const now = Math.floor(Date.now() / 1000);
        if (user.EndTime < now) {
          return new NextResponse(
            JSON.stringify({ error: 'Key has expired' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }

        return new NextResponse(
          JSON.stringify({
            success: true,
            keytype: user.KeyType || 'free',
            User: user.UserTag || 'None',
            EndTime: user.EndTime,
            discordID: user.discordID
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      if (error.message === 'User not found' || error.message.includes('User not found for provided key')) {
        return new NextResponse(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new NextResponse(
        JSON.stringify({ error: `Authentication failed: ${error.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Handle /register?discordID=&username=&time=&keytype=
  if (pathname === '/register') {
    const discordID = searchParams.get('discordID');
    const username = searchParams.get('username');
    const time = searchParams.get('time');
    const keytype = searchParams.get('keytype') || 'free';

    if (!discordID || !username) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required parameters: discordID and username are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      validateInput(discordID, 'discordID');
      validateInput(username, 'username');
      if (!['free', 'paid'].includes(keytype)) {
        return new NextResponse(
          JSON.stringify({ error: 'Invalid keytype: must be "free" or "paid"' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (await userBlobExists(discordID)) {
        return new NextResponse(
          JSON.stringify({ error: 'User with this Discord ID already exists' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const endTime = parseTimeToUnix(time);
      const newUser = {
        discordID,
        UserName: username,
        Key: generateKey(),
        Hwid: '',
        KeyType: keytype,
        UserTag: keytype === 'paid' ? 'Customer' : 'None',
        CreatedAt: Math.floor(Date.now() / 1000),
        EndTime: endTime
      };

      await writeUserBlob(discordID, newUser);

      return new NextResponse(
        JSON.stringify({ success: true, message: 'User registered successfully', key: newUser.Key, endTime: newUser.EndTime }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new NextResponse(
        JSON.stringify({ error: `Registration failed: ${error.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Handle /auth/admin?user=&time=
  if (pathname === '/auth/admin') {
    const discordID = searchParams.get('user');
    const time = searchParams.get('time');
    const authHeader = request.headers.get('authorization');

    if (authHeader !== 'UserMode-2d93n2002n8') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized: Invalid authentication header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!discordID || !time) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required parameters: user and time are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      validateInput(discordID, 'discordID');
      const user = await readUserBlob(discordID);
      const additionalTime = parseTimeToUnix(time) - Math.floor(Date.now() / 1000);
      const newEndTime = user.EndTime + additionalTime;

      if (newEndTime < Math.floor(Date.now() / 1000)) {
        return new NextResponse(
          JSON.stringify({ error: 'New end time cannot be in the past' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      user.EndTime = newEndTime;
      await writeUserBlob(discordID, user);

      return new NextResponse(
        JSON.stringify({ success: true, message: 'User end time updated', newEndTime }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      if (error.message === 'User not found') {
        return new NextResponse(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new NextResponse(
        JSON.stringify({ error: `Failed to update user: ${error.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Handle /users-list
  if (pathname === '/users-list') {
    const authHeader = request.headers.get('authorization');

    if (authHeader !== 'UserMode-2d93n2002n8') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized: Invalid authentication header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      const userIDs = await listUserBlobs();
      return new NextResponse(
        JSON.stringify(userIDs),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new NextResponse(
        JSON.stringify({ error: `Failed to fetch user list: ${error.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Handle /files/?filename=scriptname
  if (pathname === '/files') {
    const filename = searchParams.get('filename');
    const authHeader = request.headers.get('authorization');

    if (authHeader !== 'UserMode-2d93n2002n8') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized: Invalid authentication header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!filename) {
      return new NextResponse(
        JSON.stringify({ error: 'Filename parameter is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      validateInput(filename, 'filename');
      if (filename.includes('..')) {
        return new NextResponse(
          JSON.stringify({ error: 'Invalid filename: Directory traversal not allowed' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const scripts = await get('scripts');
      if (!scripts || !scripts[filename]) {
        return new NextResponse(
          JSON.stringify({ error: `Script "${filename}" not found` }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const scriptUrl = scripts[filename].Code.endsWith('/')
        ? scripts[filename].Code
        : `${scripts[filename].Code}/`;

      return new NextResponse(
        JSON.stringify({ content: scriptUrl }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new NextResponse(
        JSON.stringify({ error: `Failed to fetch script "${filename}": ${error.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Handle /scripts-list
  if (pathname === '/scripts-list') {
    const authHeader = request.headers.get('authorization');

    if (authHeader !== 'UserMode-2d93n2002n8') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized: Invalid authentication header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      const scripts = await get('scripts');
      const scriptNames = scripts ? Object.keys(scripts) : [];
      return new NextResponse(
        JSON.stringify(scriptNames),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new NextResponse(
        JSON.stringify({ error: `Failed to fetch script list: ${error.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Handle /scripts-metadata
  if (pathname === '/scripts-metadata') {
    const authHeader = request.headers.get('authorization');

    if (authHeader !== 'UserMode-2d93n2002n8') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized: Invalid authentication header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      const scripts = await get('scripts');
      return new NextResponse(
        JSON.stringify({ scripts: scripts || {} }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new NextResponse(
        JSON.stringify({ error: `Failed to fetch scripts metadata: ${error.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return NextResponse.next();
}

module.exports = {
  middleware,
  config: {
    matcher: ['/files', '/scripts-list', '/scripts-metadata', '/auth', '/register', '/users-list', '/auth/admin'],
  },
};
