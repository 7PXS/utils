const { NextResponse } = require('next/server');
const { get } = require('@vercel/edge-config');
const { put, get: getBlob, list } = require('@vercel/blob');

// Constants
const USERS_DIR = 'Users/';
const ADMIN_AUTH = 'UserMode-2d93n2002n8';

// Input validation
const validateInput = (str, name, maxLength = 100) => {
    if (!str || typeof str !== 'string' || str.length > maxLength || /[^a-zA-Z0-9_-]/.test(str)) {
        throw new Error(`Invalid ${name}: Must be alphanumeric, underscores, or hyphens`);
    }
    return str;
};

// Blob storage operations
const readUserBlob = async (discordID, keyPrefix = '') => {
    validateInput(discordID, 'discordID');
    const blobPath = `${USERS_DIR}user-${discordID}-${keyPrefix}.json`;
    try {
        const blob = await getBlob(blobPath, { access: 'public' });
        if (!blob) throw new Error('User not found');
        const data = await blob.text();
        if (!data) throw new Error('Empty blob content');
        const userData = JSON.parse(data);
        userData.discordID = discordID;
        return userData;
    } catch (error) {
        if (error.message.includes('not found')) {
            throw new Error('User not found');
        }
        throw new Error(`Failed to read user blob: ${error.message}`);
    }
};

const writeUserBlob = async (discordID, userData) => {
    const keyPrefix = userData.Key ? userData.Key.slice(0, 7) : '';
    validateInput(discordID, 'discordID');
    const blobName = `${USERS_DIR}user-${discordID}-${keyPrefix}.json`;
    const dataToSave = { ...userData };
    delete dataToSave.discordID;
    try {
        await put(blobName, JSON.stringify(dataToSave, null, 2), {
            access: 'public',
            contentType: 'application/json',
            addRandomSuffix: false,
        });
    } catch (error) {
        throw new Error(`Failed to write user blob: ${error.message}`);
    }
};

const userBlobExists = async (discordID, keyPrefix = '') => {
    const blobName = `${USERS_DIR}user-${discordID}-${keyPrefix}.json`;
    try {
        await getBlob(blobName, { access: 'public' });
        return true;
    } catch (error) {
        if (error.message.includes('not found')) {
            return false;
        }
        throw new Error(`Failed to check user blob existence: ${error.message}`);
    }
};

const listUserBlobs = async () => {
    try {
        const { blobs } = await list({ prefix: USERS_DIR });
        return blobs
            .filter(blob => blob.pathname.endsWith('.json'))
            .map(blob => blob.pathname.match(/user-([^-]+)-[^.]+\.json$/)?.[1])
            .filter(Boolean);
    } catch (error) {
        throw new Error(`Failed to list user blobs: ${error.message}`);
    }
};

// Error response helper
const errorResponse = (message, status) => {
    return new NextResponse(
        JSON.stringify({ success: false, message }),
        { status, headers: { 'Content-Type': 'application/json' } }
    );
};

// Middleware
async function middleware(request) {
    const { pathname, searchParams } = request.nextUrl;

    // Handle /auth?key=&hwid=&ID=
    if (pathname === '/auth') {
        const key = searchParams.get('key');
        const hwid = searchParams.get('hwid');
        const discordID = searchParams.get('ID');

        if (!key || !discordID) {
            return errorResponse('Missing required parameters: key and ID are required', 400);
        }

        try {
            validateInput(discordID, 'discordID');
            validateInput(key, 'key');
            if (hwid) validateInput(hwid, 'hwid');

            const user = await readUserBlob(discordID, key.slice(0, 7));

            if (user.Key !== key) {
                return errorResponse('Invalid key', 401);
            }

            if (!user.Hwid && hwid) {
                user.Hwid = hwid;
                await writeUserBlob(discordID, user);
            } else if (user.Hwid && hwid && user.Hwid !== hwid) {
                return errorResponse('Invalid HWID', 401);
            }

            return new NextResponse(
                JSON.stringify({ success: true, message: 'Authentication successful', discordID, username: user.UserName, hwid: user.Hwid || '' }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            return errorResponse(
                error.message === 'User not found' ? 'User not found' : `Authentication failed: ${error.message}`,
                error.message === 'User not found' ? 404 : 500
            );
        }
    }

    // Handle /register?key=&discordID=&username=
    if (pathname === '/register') {
        const key = searchParams.get('key');
        const discordID = searchParams.get('discordID');
        const username = searchParams.get('username');

        if (!key || !discordID || !username) {
            return errorResponse('Missing required parameters: key, discordID, and username are required', 400);
        }

        try {
            validateInput(discordID, 'discordID');
            validateInput(key, 'key');
            validateInput(username, 'username');

            if (await userBlobExists(discordID, key.slice(0, 7))) {
                return errorResponse('User with this Discord ID already exists', 409);
            }

            const newUser = {
                discordID,
                UserName: username,
                Key: key,
                Hwid: ''
            };

            await writeUserBlob(discordID, newUser);

            return new NextResponse(
                JSON.stringify({ success: true, message: 'User registered successfully', discordID, username, key }),
                { status: 201, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            return errorResponse(`Registration failed: ${error.message}`, 500);
        }
    }

    // Handle /users-list
    if (pathname === '/users-list') {
        const authHeader = request.headers.get('authorization');

        if (authHeader !== ADMIN_AUTH) {
            return errorResponse('Unauthorized: Invalid authentication header', 401);
        }

        try {
            const userIDs = await listUserBlobs();
            return new NextResponse(
                JSON.stringify({ success: true, users: userIDs }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            return errorResponse(`Failed to fetch user list: ${error.message}`, 500);
        }
    }

    // Handle /files/?filename=scriptname
    if (pathname === '/files') {
        const filename = searchParams.get('filename');
        const authHeader = request.headers.get('authorization');

        if (authHeader !== ADMIN_AUTH) {
            return errorResponse('Unauthorized: Invalid authentication header', 401);
        }

        if (!filename) {
            return errorResponse('Filename parameter is required', 400);
        }

        try {
            validateInput(filename, 'filename');
            if (filename.includes('..')) {
                return errorResponse('Invalid filename: Directory traversal not allowed', 400);
            }

            const scripts = await get('scripts');
            if (!scripts || !scripts[filename]) {
                return errorResponse(`Script "${filename}" not found`, 404);
            }

            const scriptUrl = scripts[filename].Code.endsWith('/')
                ? scripts[filename].Code
                : `${scripts[filename].Code}/`;

            return new NextResponse(
                JSON.stringify({ success: true, content: scriptUrl }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            return errorResponse(`Failed to fetch script "${filename}": ${error.message}`, 500);
        }
    }

    // Handle /scripts-list
    if (pathname === '/scripts-list') {
        const authHeader = request.headers.get('authorization');

        if (authHeader !== ADMIN_AUTH) {
            return errorResponse('Unauthorized: Invalid authentication header', 401);
        }

        try {
            const scripts = await get('scripts');
            const scriptNames = scripts ? Object.keys(scripts) : [];
            return new NextResponse(
                JSON.stringify({ success: true, scripts: scriptNames }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            return errorResponse(`Failed to fetch script list: ${error.message}`, 500);
        }
    }

    // Handle /scripts-metadata
    if (pathname === '/scripts-metadata') {
        const authHeader = request.headers.get('authorization');

        if (authHeader !== ADMIN_AUTH) {
            return errorResponse('Unauthorized: Invalid authentication header', 401);
        }

        try {
            const scripts = await get('scripts');
            return new NextResponse(
                JSON.stringify({ success: true, scripts: scripts || {} }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            return errorResponse(`Failed to fetch scripts metadata: ${error.message}`, 500);
        }
    }

    return NextResponse.next();
}

module.exports = {
    middleware,
    config: {
        matcher: ['/files', '/scripts-list', '/scripts-metadata', '/auth', '/register', '/users-list']
    }
};
