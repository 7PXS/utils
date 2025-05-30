const { NextResponse } = require('next/server');
const { get } = require('@vercel/edge-config');
const { put, get: getBlob, head } = require('@vercel/blob');

// Vercel Blob Storage configuration
const CONTAINER_NAME = 'users'; // Optional: Vercel Blob doesn't require a container name, but used for clarity
const USERS_DIR = 'Users/'; // Prefix for user files in blob storage

// Helper to read user data from Vercel Blob
async function readUserBlob(discordID) {
  const blobName = `${USERS_DIR}user-${discordID}.json`;
  try {
    const blob = await getBlob(blobName, { access: 'public' });
    if (!blob) {
      throw new Error('User not found');
    }
    const data = await blob.text(); // Get the blob content as text
    return JSON.parse(data);
  } catch (error) {
    if (error.status === 404) {
      throw new Error('User not found');
    }
    throw error;
  }
}

// Helper to write user data to Vercel Blob
async function writeUserBlob(discordID, userData) {
  const blobName = `${USERS_DIR}user-${discordID}.json`;
  try {
    await put(blobName, JSON.stringify(userData, null, 2), {
      access: 'public',
      contentType: 'application/json',
    });
  } catch (error) {
    throw new Error(`Failed to write user blob: ${error.message}`);
  }
}

// Helper to check if user blob exists
async function userBlobExists(discordID) {
  const blobName = `${USERS_DIR}user-${discordID}.json`;
  try {
    await head(blobName);
    return true;
  } catch (error) {
    if (error.status === 404) {
      return false;
    }
    throw error;
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

      // Verify key
      if (user.Key !== key) {
        return new NextResponse(
          JSON.stringify({ error: 'Invalid key' }),
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

  // Handle /register?key=&discordID=&username=
  if (pathname === '/register') {
    const key = searchParams.get('key');
    const discordID = searchParams.get('discordID');
    const username = searchParams.get('username');

    if (!key || !discordID || !username) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required parameters: key, discordID, and username are required' }),
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
      }

      // Create new user
      const newUser = {
        discordID,
        UserName: username,
        Key: key,
        Hwid: ''
      };

      await writeUserBlob(discordID, newUser);

      return new NextResponse(
        JSON.stringify({ success: true, message: 'User registered successfully' }),
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

    // Validate authorization header
    if (authHeader !== 'UserMode-2d93n2002n8') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized: Invalid authentication header' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate filename
    if (!filename) {
      return new NextResponse(
        JSON.stringify({ error: 'Filename parameter is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Prevent directory traversal
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
      // Get scripts from Edge Config
      const scripts = await get('scripts');
      
      if (!scripts || !scripts[filename]) {
        return new NextResponse(
          JSON.stringify({ error: `Script "${filename}" not found` }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Ensure the URL has a trailing slash
      const scriptUrl = scripts[filename].Code.endsWith('/')
        ? scripts[filename].Code
        : `${scripts[filename].Code}/`;

      // Return script content as JSON with URL wrapped in quotes
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

  // Handle /scripts-list to return available script names
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

  // Handle /scripts-metadata to return full scripts object
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

  // Pass through other requests
  return NextResponse.next();
}

module.exports = {
  middleware,
  config: {
    matcher: ['/files', '/scripts-list', '/scripts-metadata', '/auth', '/register'],
  },
};
