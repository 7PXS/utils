const { NextResponse } = require('next/server');
const { get } = require('@vercel/edge-config');
const { put, get: getBlob, head } = require('@vercel/blob');

// Vercel Blob Storage configuration
const CONTAINER_NAME = 'users';
const USERS_DIR = 'Users/';

// Generate random key in format xxxxxxx-xxxx-xxxxx
function generateRandomKey() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const getRandomChar = () => chars[Math.floor(Math.random() * chars.length)];
  const part1 = Array(7).fill().map(getRandomChar).join('');
  const part2 = Array(4).fill().map(getRandomChar).join('');
  const part3 = Array(5).fill().map(getRandomChar).join('');
  return `${part1}-${part2}-${part3}`;
}

// Parse time duration (e.g., 100s, 100m, 100h, 100d, 100mo, 100yr) to milliseconds
function parseDuration(duration) {
  const match = duration.match(/^(\d+)(s|m|h|d|mo|yr)$/);
  if (!match) {
    throw new Error('Invalid duration format. Use format like 100s, 100m, 100h, 100d, 100mo, 100yr');
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 3600 * 1000;
    case 'd': return value * 86400 * 1000;
    case 'mo': return value * 30 * 86400 * 1000; // Approximate 30 days
    case 'yr': return value * 365 * 86400 * 1000; // Approximate 365 days
    default: throw new Error('Unknown duration unit');
  }
}

// Helper to read user data from Vercel Blob
async function readUserBlob(discordID) {
  const blobName = `${USERS_DIR}user-${discordID}.json`;
  try {
    const blob = await getBlob(blobName, { access: 'public' });
    if (!blob) {
      throw new Error('User not found');
    }
    const data = await blob.text();
    return JSON.parse(data);
  } catch (error) {
    if (error.status === 404 || error.message.includes('The requested blob does not exist')) {
      throw new Error('User not found');
    }
    throw new Error(`Failed to read user blob: ${error.message}`);
  }
}

// Helper to write user data to Vercel Blob
async function writeUserBlob(discordID, userData) {
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

async function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;

  // Handle /auth?key=&hwid=&ID=
  if (pathname === '/auth') {
    const key = searchParams.get('key');
    const hwid = searchParams.get('hwid');
    const id = searchParams.get('ID');

    if (!key || !id) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required parameters: key and ID are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    try {
      const user = await readUserBlob(id);

      // Verify key and Discord ID
      if (user.Key !== key || user.discordID !== id) {
        return new NextResponse(
          JSON.stringify({ error: 'Invalid key or Discord ID' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Check if key is expired
      if (user.ExpiresAt < Date.now()) {
        return new NextResponse(
          JSON.stringify({ error: 'Key has expired' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // If HWID is provided, verify it; if not provided and user has no HWID, assign it
      if (!user.Hwid && hwid) {
        user.Hwid = hwid;
        await writeUserBlob(id, user);
      } else if (user.Hwid && user.Hwid !== hwid) {
        return new NextResponse(
          JSON.stringify({ error: 'Invalid HWID' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return new NextResponse(
        JSON.stringify({ success: true, message: 'Authentication successful' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      if (error.message === 'User not found') {
        return new NextResponse(
          JSON.stringify({ error: 'User not found' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      return new NextResponse(
        JSON.stringify({ error: `Authentication failed: ${error.message}` }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // Handle /auth/admin?user=&time=
  if (pathname === '/auth/admin') {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== 'UserMode-2d93n2002n8') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized: Invalid authentication header' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const userId = searchParams.get('user');
    const time = searchParams.get('time');

    if (!userId || !time) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required parameters: user and time are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    try {
      const user = await readUserBlob(userId);
      const durationMs = parseDuration(time);
      const newExpiresAt = user.ExpiresAt ? user.ExpiresAt + durationMs : Date.now() + durationMs;

      user.ExpiresAt = newExpiresAt;
      await writeUserBlob(userId, user);

      return new NextResponse(
        JSON.stringify({ success: true, message: 'Key expiration updated', expiresAt: newExpiresAt }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      if (error.message === 'User not found') {
        return new NextResponse(
          JSON.stringify({ error: 'User not found' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
        }
      );
      return new NextResponse(
        JSON.stringify({ error: `Failed to update key expiration: ${error.message}` }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // Handle /register?discordID=&username=&time=
  if (pathname === '/register') {
    const discordID = searchParams.get('discordID');
    const username = searchParams.get('username');
    const time = searchParams.get('time') || '30d';

    if (!discordID || !username) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required parameters: discordID and username are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    try {
      if (await userBlobExists(discordID)) {
        return new NextResponse(
          JSON.stringify({ error: 'User with this Discord ID already exists' }),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
        }
      );

      const durationMs = parseDuration(time);
      const createdAt = Date.now();
      const expiresAt = createdAt + durationMs;

      // Create new user with random key
      const newUser = {
        discordID,
        UserName: username,
        Key: generateRandomKey(),
        Hwid: '',
        CreatedAt: createdAt,
        ExpiresAt: expiresAt,
      };

      await writeUserBlob(discordID, newUser);

      return new NextResponse(
        JSON.stringify({ success: true, message: 'User registered successfully', key: newUser.Key }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      return new NextResponse(
        JSON.stringify({ error: `Registration failed: ${error.message}` }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
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
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!filename) {
      return new NextResponse(
        JSON.stringify({ error: 'Filename parameter is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (filename.includes('..')) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid filename: Directory traversal not allowed' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    try {
      const scripts = await get('scripts');
      
      if (!scripts || !scripts[filename]) {
        return new NextResponse(
          JSON.stringify({ error: `Script "${filename}" not found` }),
          {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const scriptUrl = scripts[filename].Code.endsWith('/')
        ? scripts[filename].Code
        : `${scripts[filename].Code}/`;

      return new NextResponse(
        JSON.stringify({ content: `"${scriptUrl}"` }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      return new NextResponse(
        JSON.stringify({ error: `Failed to fetch script "${filename}": ${error.message}` }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // Handle /scripts-list
  if (pathname === '/scripts-list') {
    const authHeader = request.headers.get('authorization');

    if (authHeader !== 'UserMode-2d93n2002n8') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized: Invalid authentication header' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    try {
      const scripts = await get('scripts');
      const scriptNames = Object.keys(scripts || {});
      
      return new NextResponse(
        JSON.stringify(scriptNames),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      return new NextResponse(
        JSON.stringify({ error: `Failed to fetch script list: ${error.message}` }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // Handle /scripts-metadata
  if (pathname === '/scripts-metadata') {
    const authHeader = request.headers.get('authorization');

    if (authHeader !== 'UserMode-2d93n2002n8') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized: Invalid authentication header' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    try {
      const scripts = await get('scripts');
      
      return new NextResponse(
        JSON.stringify({ scripts: scripts || {} }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      return new NextResponse(
        JSON.stringify({ error: `Failed to fetch scripts metadata: ${error.message}` }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  return NextResponse.next();
}

module.exports = {
  middleware,
  config: {
    matcher: ['/files', '/scripts-list', '/scripts-metadata', '/auth', '/register', '/auth/admin'],
  },
};
