const { NextResponse } = require('next/server');
const { get, set } = require('@vercel/edge-config');
const { put, get: getBlob, head, list } = require('@vercel/blob');

// Constants
const USERS_DIR = 'Users/';
const WEBHOOK_URL = "https://discord.com/api/webhooks/1378937855199674508/nHwMtepJ3hKpzKDZErNkMdgIZPWhix80nkqSyMgYlbMMuOrLhHcF0HYsmLcq6CZeJrco";
const COLORS = { SUCCESS: 65280, WARNING: 16776960, ERROR: 16711680 };
const ADMIN_AUTH = 'UserMode-2d93n2002n8';

// Input validation
const validateInput = (str, name, maxLength = 100) => {
    if (!str || typeof str !== 'string' || str.length > maxLength || /[^a-zA-Z0-9_-]/.test(str)) {
        throw new Error(`Invalid ${name}: Must be alphanumeric, underscores, or hyphens`);
    }
    return str;
};

// Date and time utilities
const formatDate = (unixTimestamp) => {
    const date = new Date(unixTimestamp * 1000);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
};

const parseTimeToUnix = (timeString) => {
    const now = Math.floor(Date.now() / 1000);
    if (!timeString) return now + 30 * 24 * 60 * 60;
    const match = timeString.match(/^(\d+)(s|m|h|d|mo|yr)$/);
    if (!match) throw new Error('Invalid time format (e.g., 100s, 100m, 100h, 100d, 100mo, 100yr)');
    const value = parseInt(match[1], 10);
    const multipliers = { s: 1, m: 60, h: 3600, d: 86400, mo: 2592000, yr: 31536000 };
    return now + value * multipliers[match[2]];
};

// Key generation
const generateKey = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const randomChar = () => chars[Math.floor(Math.random() * chars.length)];
    return `${Array(7).fill().map(randomChar).join('')}-${Array(4).fill().map(randomChar).join('')}-${Array(5).fill().map(randomChar).join('')}`;
};

// Webhook logging
const sendWebhookLog = async (embeds) => {
    if (!WEBHOOK_URL) return;
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds })
        });
        if (!response.ok) console.error(`Webhook error (${response.status}): ${await response.text()}`);
    } catch (error) {
        console.error('Webhook error:', error);
    }
};

// IP lookup
const getIPInfo = async (ip) => {
    try {
        const response = await fetch(`https://ipapi.co/${ip}/json`);
        return await response.json();
    } catch (error) {
        console.error('IP lookup failed:', error);
        return null;
    }
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
        if (error.message.includes('User not found') || error.message.includes('not found')) {
            throw new Error('User not found');
        }
        throw new Error(`Failed to read user blob: ${error.message}`);
    }
};

const findUserByKey = async (key) => {
    validateInput(key, 'key');
    const keyPrefix = key.slice(0, 7);
    const { blobs } = await list({ prefix: `${USERS_DIR}user-` });
    for (const blob of blobs) {
        if (!blob.pathname.includes(`-${keyPrefix}.json`)) continue;
        const blobData = await getBlob(blob.pathname, { access: 'public' });
        if (!blobData) continue;
        const userData = JSON.parse(await blobData.text());
        if (userData.Key === key) {
            const discordID = blob.pathname.match(/user-([^-]+)-[^.]+\.json$/)?.[1];
            if (!discordID) continue;
            userData.discordID = discordID;
            return userData;
        }
    }
    throw new Error('User not found for provided key');
};

const findUserByHwid = async (hwid) => {
    validateInput(hwid, 'hwid');
    const { blobs } = await list({ prefix: USERS_DIR });
    for (const blob of blobs) {
        if (!blob.pathname.endsWith('.json')) continue;
        const blobData = await getBlob(blob.pathname, { access: 'public' });
        if (!blobData) continue;
        const userData = JSON.parse(await blobData.text());
        if (userData.Hwid === hwid) {
            const discordID = blob.pathname.match(/user-([^-]+)-[^.]+\.json$/)?.[1];
            if (!discordID) continue;
            userData.discordID = discordID;
            return userData;
        }
    }
    throw new Error('User not found for provided HWID');
};

const writeUserBlob = async (discordID, userData) => {
    const keyPrefix = userData.Key.slice(0, 7);
    const blobName = `${USERS_DIR}user-${discordID}-${keyPrefix}.json`;
    const dataToSave = { ...userData };
    delete dataToSave.discordID;
    await put(blobName, JSON.stringify(dataToSave, null, 2), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
    });
};

const listUserBlobs = async () => {
    const { blobs } = await list({ prefix: USERS_DIR });
    return blobs
        .filter(blob => blob.pathname.endsWith('.json'))
        .map(blob => blob.pathname.match(/user-([^-]+)-[^.]+\.json$/)?.[1])
        .filter(Boolean);
};

// Authentication check
const checkAuth = async (user, ipInfo, blacklists, discordID, key = '', hwid = '') => {
    const { blacklistedIPs, blacklistedHwids, blacklistedDiscordIds } = blacklists;
    if (ipInfo && blacklistedIPs.includes(ipInfo.ip)) {
        throw new Error('Access denied: Blacklisted IP');
    }
    if (hwid && blacklistedHwids.includes(hwid)) {
        throw new Error('HWID is blacklisted');
    }
    if (blacklistedDiscordIds.includes(discordID)) {
        throw new Error('Discord ID is blacklisted');
    }
    const now = Math.floor(Date.now() / 1000);
    if (user.EndTime < now) {
        throw new Error('Key has expired');
    }
    if (user.MaxUses && user.Uses >= user.MaxUses) {
        throw new Error(`Key usage limit reached (${user.Uses}/${user.MaxUses})`);
    }
    return true;
};

// Middleware
async function middleware(request) {
    const { pathname, searchParams } = request.nextUrl;
    const ipInfo = await getIPInfo(request.ip);
    const blacklists = {
        blacklistedIPs: (await get('blacklistedIPs')) || [],
        blacklistedHwids: (await get('blacklistedHwids')) || [],
        blacklistedDiscordIds: (await get('blacklistedDiscordIds')) || []
    };

    // Common error response
    const errorResponse = (message, status, logFields = {}) => {
        sendWebhookLog([{
            title: `❌ ${status === 403 ? 'Forbidden' : 'Error'}`,
            description: message,
            fields: Object.entries(logFields).map(([name, value]) => ({ name, value })),
            color: COLORS.ERROR,
            timestamp: new Date().toISOString()
        }]);
        return new NextResponse(
            JSON.stringify({ success: false, message }),
            { status, headers: { 'Content-Type': 'application/json' } }
        );
    };

    // Common success response
    const successResponse = (user, logFields = {}) => {
        sendWebhookLog([{
            title: "✅ Successful Operation",
            fields: Object.entries({
                ...logFields,
                'Expires': formatDate(user.EndTime),
                'IP Info': `IP: ${ipInfo?.ip || 'Unknown'}\nLocation: ${ipInfo?.city || 'Unknown'}, ${ipInfo?.region || 'Unknown'}, ${ipInfo?.country || 'Unknown'}`
            }).map(([name, value]) => ({ name, value })),
            color: COLORS.SUCCESS,
            timestamp: new Date().toISOString()
        }]);
        return new NextResponse(
            JSON.stringify({
                success: true,
                discordID: user.discordID,
                username: user.UserName,
                key: user.Key,
                hwid: user.Hwid || '',
                keytype: user.KeyType || 'free',
                usertag: user.UserTag || 'None',
                createdAt: user.CreatedAt,
                endTime: user.EndTime,
                isExpired: user.EndTime < Math.floor(Date.now() / 1000),
                session: Math.random().toString(36).substring(7),
                uses: user.Uses || 0,
                maxUses: user.MaxUses || null
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    };

    // Authentication endpoints
    const authHandlers = {
        '/auth/id': async () => {
            const discordID = searchParams.get('discordID');
            if (!discordID) return errorResponse('Missing discordID parameter', 400, { Path: pathname });
            validateInput(discordID, 'discordID');
            const user = await readUserBlob(discordID);
            await checkAuth(user, ipInfo, blacklists, discordID);
            if (user.MaxUses) user.Uses = (user.Uses || 0) + 1;
            await writeUserBlob(discordID, user);
            return successResponse(user, { 'Discord ID': discordID, Key: user.Key });
        },
        '/auth/key': async () => {
            const key = searchParams.get('key');
            const hwid = searchParams.get('hwid');
            if (!key) return errorResponse('Missing key parameter', 400, { Path: pathname });
            const user = await findUserByKey(key);
            if (hwid) {
                validateInput(hwid, 'hwid');
                if (!user.Hwid) {
                    user.Hwid = hwid;
                    await writeUserBlob(user.discordID, user);
                    await sendWebhookLog([{
                        title: "🔗 Auto-Linked HWID",
                        fields: [
                            { name: "Key", value: key },
                            { name: "HWID", value: hwid },
                            { name: "Discord ID", value: user.discordID }
                        ],
                        color: COLORS.SUCCESS,
                        timestamp: new Date().toISOString()
                    }]);
                } else if (user.Hwid !== hwid) {
                    return errorResponse('Invalid HWID', 401, {
                        Key: key,
                        'Attempted HWID': hwid,
                        'Linked HWID': user.Hwid
                    });
                }
            }
            await checkAuth(user, ipInfo, blacklists, user.discordID, key, hwid);
            if (user.MaxUses) user.Uses = (user.Uses || 0) + 1;
            await writeUserBlob(user.discordID, user);
            return successResponse(user, { Key: key, 'Discord ID': user.discordID, HWID: user.Hwid || 'None' });
        },
        '/auth/hwid': async () => {
            const hwid = searchParams.get('hwid');
            if (!hwid) return errorResponse('Missing hwid parameter', 400, { Path: pathname });
            const user = await findUserByHwid(hwid);
            await checkAuth(user, ipInfo, blacklists, user.discordID, '', hwid);
            if (user.MaxUses) user.Uses = (user.Uses || 0) + 1;
            await writeUserBlob(user.discordID, user);
            return successResponse(user, { HWID: hwid, 'Discord ID': user.discordID, Key: user.Key });
        }
    };

    // Admin and utility endpoints
    const adminHandlers = {
        '/register': async () => {
            const discordID = searchParams.get('discordID');
            const username = searchParams.get('username');
            const time = searchParams.get('time');
            const keytype = searchParams.get('keytype') || 'free';
            if (!discordID || !username) {
                return errorResponse('Missing discordID or username', 400, {
                    'Discord ID': discordID || 'Not provided',
                    Username: username || 'Not provided'
                });
            }
            validateInput(discordID, 'discordID');
            validateInput(username, 'username');
            if (!['free', 'paid'].includes(keytype)) {
                return errorResponse('Invalid keytype: must be "free" or "paid"', 400, {
                    'Discord ID': discordID,
                    'Key Type': keytype
                });
            }
            if (blacklists.blacklistedDiscordIds.includes(discordID)) {
                return errorResponse('Discord ID is blacklisted', 403, { 'Discord ID': discordID });
            }
            const { blobs } = await list({ prefix: `${USERS_DIR}user-${discordID}-` });
            if (blobs.length > 0) {
                return errorResponse('User already exists', 409, { 'Discord ID': discordID });
            }
            const newUser = {
                UserName: username,
                Key: generateKey(),
                Hwid: '',
                KeyType: keytype,
                UserTag: keytype === 'paid' ? 'Customer' : 'None',
                CreatedAt: Math.floor(Date.now() / 1000),
                EndTime: parseTimeToUnix(time),
                Uses: 0,
                MaxUses: keytype === 'paid' ? 1000 : 100
            };
            await writeUserBlob(discordID, newUser);
            await sendWebhookLog([{
                title: "✅ User Registered",
                fields: [
                    { name: "Discord ID", value: discordID },
                    { name: "Username", value: username },
                    { name: "Key", value: newUser.Key },
                    { name: "Key Type", value: keytype },
                    { name: "Expires", value: formatDate(newUser.EndTime) }
                ],
                color: COLORS.SUCCESS,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({
                    success: true,
                    message: 'User registered successfully',
                    key: newUser.Key,
                    endTime: newUser.EndTime,
                    discordID,
                    session: Math.random().toString(36).substring(7)
                }),
                { status: 201, headers: { 'Content-Type': 'application/json' } }
            );
        },
        '/auth/admin': async () => {
            const discordID = searchParams.get('user');
            const time = searchParams.get('time');
            if (!discordID || !time) {
                return errorResponse('Missing user or time parameter', 400, {
                    'Discord ID': discordID || 'Not provided',
                    Time: time || 'Not provided'
                });
            }
            validateInput(discordID, 'discordID');
            const user = await readUserBlob(discordID);
            const additionalTime = parseTimeToUnix(time) - Math.floor(Date.now() / 1000);
            const newEndTime = user.EndTime + additionalTime;
            if (newEndTime < Math.floor(Date.now() / 1000)) {
                return errorResponse('New end time cannot be in the past', 400, { 'Discord ID': discordID });
            }
            user.EndTime = newEndTime;
            await writeUserBlob(discordID, user);
            await sendWebhookLog([{
                title: "✅ Admin Time Update",
                fields: [
                    { name: "Discord ID", value: discordID },
                    { name: "New End Time", value: formatDate(newEndTime) }
                ],
                color: COLORS.SUCCESS,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: true, message: 'User end time updated', newEndTime }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        },
        '/users-list': async () => {
            const userIDs = await listUserBlobs();
            await sendWebhookLog([{
                title: "✅ Users List Retrieved",
                fields: [{ name: "User Count", value: userIDs.length.toString() }],
                color: COLORS.SUCCESS,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: true, users: userIDs }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        },
        '/files': async () => {
            const filename = searchParams.get('filename');
            if (!filename) return errorResponse('Filename parameter is required', 400, { Path: pathname });
            validateInput(filename, 'filename');
            if (filename.includes('..')) {
                return errorResponse('Invalid filename: Directory traversal not allowed', 400, { Filename: filename });
            }
            const scripts = await get('scripts');
            if (!scripts || !scripts[filename]) {
                return errorResponse(`Script "${filename}" not found`, 404, { Filename: filename });
            }
            const scriptUrl = scripts[filename].Code.endsWith('/') ? scripts[filename].Code : `${scripts[filename].Code}/`;
            await sendWebhookLog([{
                title: "✅ Script Retrieved",
                fields: [
                    { name: "Filename", value: filename },
                    { name: "Script URL", value: scriptUrl }
                ],
                color: COLORS.SUCCESS,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: true, content: scriptUrl }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        },
        '/scripts-list': async () => {
            const scripts = await get('scripts');
            const scriptNames = scripts ? Object.keys(scripts) : [];
            await sendWebhookLog([{
                title: "✅ Scripts List Retrieved",
                fields: [{ name: "Script Count", value: scriptNames.length.toString() }],
                color: COLORS.SUCCESS,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: true, scripts: scriptNames }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        },
        '/scripts-metadata': async () => {
            const scripts = await get('scripts');
            await sendWebhookLog([{
                title: "✅ Scripts Metadata Retrieved",
                fields: [{ name: "Script Count", value: Object.keys(scripts || {}).length.toString() }],
                color: COLORS.SUCCESS,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: true, scripts: scripts || {} }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        },
        '/userinfo/id': async () => {
            const discordID = searchParams.get('discordID');
            if (!discordID) return errorResponse('Missing discordID parameter', 400, { Path: pathname });
            validateInput(discordID, 'discordID');
            const user = await readUserBlob(discordID);
            if (blacklists.blacklistedDiscordIds.includes(discordID)) {
                return errorResponse('Discord ID is blacklisted', 403, { 'Discord ID': discordID });
            }
            return successResponse(user, {
                'Discord ID': discordID,
                Username: user.UserName,
                Key: user.Key
            });
        },
        '/userinfo/key': async () => {
            const key = searchParams.get('key');
            if (!key) return errorResponse('Missing key parameter', 400, { Path: pathname });
            const user = await findUserByKey(key);
            if (blacklists.blacklistedDiscordIds.includes(user.discordID)) {
                return errorResponse('Discord ID is blacklisted', 403, { Key: key, 'Discord ID': user.discordID });
            }
            return successResponse(user, {
                Key: key,
                'Discord ID': user.discordID,
                Username: user.UserName
            });
        },
        '/userinfo/hwid': async () => {
            const hwid = searchParams.get('hwid');
            if (!hwid) return errorResponse('Missing hwid parameter', 400, { Path: pathname });
            validateInput(hwid, 'hwid');
            if (blacklists.blacklistedHwids.includes(hwid)) {
                return errorResponse('HWID is blacklisted', 403, { HWID: hwid });
            }
            const user = await findUserByHwid(hwid);
            if (blacklists.blacklistedDiscordIds.includes(user.discordID)) {
                return errorResponse('Discord ID is blacklisted', 403, { HWID: hwid, 'Discord ID': user.discordID });
            }
            return successResponse(user, {
                HWID: hwid,
                'Discord ID': user.discordID,
                Username: user.UserName
            });
        }
    };

    // Handle requests
    if (Object.keys(authHandlers).includes(pathname) || Object.keys(adminHandlers).includes(pathname)) {
        if (Object.keys(adminHandlers).includes(pathname)) {
            const authHeader = request.headers.get('authorization');
            if (authHeader !== ADMIN_AUTH) {
                return errorResponse('Unauthorized: Invalid authentication header', 401, { Path: pathname });
            }
        }
        try {
            const handler = authHandlers[pathname] || adminHandlers[pathname];
            return await handler();
        } catch (error) {
            const status = error.message.includes('not found') ? 404 : 500;
            return errorResponse(`Operation failed: ${error.message}`, status, { Path: pathname });
        }
    }

    return NextResponse.next();
}

module.exports = {
    middleware,
    config: {
        matcher: ['/files', '/scripts-list', '/scripts-metadata', '/auth/id', '/auth/key', '/auth/hwid', '/register', '/users-list', '/auth/admin', '/userinfo/id', '/userinfo/key', '/userinfo/hwid']
    }
};
