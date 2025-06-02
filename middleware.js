const { NextResponse } = require('next/server');
const { get, set } = require('@vercel/edge-config');
const { put, get: getBlob, head, list } = require('@vercel/blob');

// Vercel Blob Storage configuration
const CONTAINER_NAME = 'users';
const USERS_DIR = 'Users/';
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// Webhook colors
const COLORS = {
    SUCCESS: 65280,
    WARNING: 16776960,
    ERROR: 16711680
};

// Helper to format UNIX timestamp to MM/DD/YY
function formatDate(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
}

// Helper to validate input strings
function validateInput(str, name, maxLength = 100) {
    if (!str || typeof str !== 'string' || str.length > maxLength || /[^a-zA-Z0-9_-]/.test(str)) {
        throw new Error(`Invalid ${name}: Must be a valid string with alphanumeric characters, underscores, or hyphens`);
    }
    return str;
}

// Helper to generate random keys
function generateKey() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const getRandomChar = () => chars[Math.floor(Math.random() * chars.length)];
    const part1 = Array(7).fill().map(getRandomChar).join('');
    const part2 = Array(4).fill().map(getRandomChar).join('');
    const part3 = Array(5).fill().map(getRandomChar).join('');
    return `${part1}-${part2}-${part3}`;
}

// Helper to parse time input and calculate end date
function parseTimeToUnix(timeString) {
    const now = Math.floor(Date.now() / 1000);
    if (!timeString) return now + 30 * 24 * 60 * 60;

    const match = timeString.match(/^(\d+)(s|m|h|d|mo|yr)$/);
    if (!match) throw new Error('Invalid time format. Use e.g., 100s, 100m, 100h, 100d, 100mo, 100yr');

    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers = {
        s: 1,
        m: 60,
        h: 60 * 60,
        d: 24 * 60 * 60,
        mo: 30 * 24 * 60 * 60,
        yr: 365 * 24 * 60 * 60
    };
    return now + value * multipliers[unit];
}

// Helper to get IP information
async function getIPInfo(ip) {
    try {
        const response = await fetch(`https://ipapi.co/${ip}/json`);
        return await response.json();
    } catch (error) {
        console.error('IP lookup failed:', error);
        return null;
    }
}

// Helper to send webhook logs
async function sendWebhookLog(embeds) {
    if (!WEBHOOK_URL) {
        console.warn('No webhook URL configured');
        return;
    }
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds })
        });
        if (!response.ok) {
            console.error(`Webhook error (${response.status}): ${await response.text()}`);
        }
    } catch (error) {
        console.error('Webhook error:', error);
    }
}

// Helper to read user data from Vercel Blob
async function readUserBlobByDiscordID(discordID) {
    validateInput(discordID, 'discordID');
    try {
        const { blobs } = await list({ prefix: `${USERS_DIR}user-${discordID}-` });
        if (blobs.length === 0) {
            throw new Error('User not found');
        }
        const blob = await getBlob(blobs[0].pathname, { access: 'public' });
        if (!blob) {
            throw new Error('User not found');
        }
        const data = await blob.text();
        const userData = JSON.parse(data);
        userData.discordID = discordID;
        return userData;
    } catch (error) {
        if (error.status === 404 || error.message.includes('The requested blob does not exist')) {
            throw new Error('User not found');
        }
        throw new Error(`Failed to read user blob: ${error.message}`);
    }
}

// Helper to find user by key
async function findUserByKey(key) {
    validateInput(key, 'key');
    try {
        const keyPrefix = key.slice(0, 7);
        const { blobs } = await list({ prefix: `${USERS_DIR}user-` });
        for (const blob of blobs) {
            if (blob.pathname.includes(`-${keyPrefix}.json`)) {
                const blobData = await getBlob(blob.pathname, { access: 'public' });
                if (!blobData) continue;
                const userData = JSON.parse(await blobData.text());
                if (userData.Key === key) {
                    const discordID = blob.pathname
                        .replace(`${USERS_DIR}user-`, '')
                        .replace(`-${keyPrefix}.json`, '');
                    userData.discordID = discordID;
                    return userData;
                }
            }
        }
        throw new Error('User not found for provided key');
    } catch (error) {
        if (error.message === 'User not found for provided key') {
            throw error;
        }
        throw new Error(`Failed to find user by key: ${error.message}`);
    }
}

// Helper to write user data to Vercel Blob
async function writeUserBlob(discordID, userData) {
    validateInput(discordID, 'discordID');
    const keyPrefix = userData.Key.slice(0, 7);
    validateInput(keyPrefix, 'keyPrefix', 7);
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
}

// Helper to check if user blob exists
async function userBlobExists(discordID, keyPrefix) {
    validateInput(discordID, 'discordID');
    validateInput(keyPrefix, 'keyPrefix', 7);
    const blobName = `${USERS_DIR}user-${discordID}-${keyPrefix}.json`;
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
            .map(blob => {
                const match = blob.pathname.match(/user-([^-]+)-[^.]+\.json$/);
                return match ? match[1] : null;
            })
            .filter(id => id !== null);
    } catch (error) {
        throw new Error(`Failed to list user blobs: ${error.message}`);
    }
}

// Middleware function
async function middleware(request) {
    const { pathname, searchParams } = request.nextUrl;
    const ipInfo = await getIPInfo(request.ip);
    const blacklistedIPs = (await get('blacklistedIPs')) || [];
    const blacklistedHwids = (await get('blacklistedHwids')) || [];
    const blacklistedDiscordIds = (await get('blacklistedDiscordIds')) || [];

    // Check for blacklisted IP
    if (ipInfo && blacklistedIPs.includes(ipInfo.ip)) {
        await sendWebhookLog([{
            title: "🚫 Blocked Request",
            description: "Request from blacklisted IP",
            fields: [
                {
                    name: "IP Details",
                    value: `IP: ${ipInfo?.ip || 'Unknown'}\nLocation: ${ipInfo?.city || 'Unknown'}, ${ipInfo?.region || 'Unknown'}, ${ipInfo?.country || 'Unknown'}\nISP: ${ipInfo?.org || 'Unknown'}`
                },
                {
                    name: "Request Info",
                    value: `Path: ${pathname}\nParams: ${[...searchParams.entries()].map(([k, v]) => `${k}: ${v}`).join('\n')}`
                }
            ],
            color: COLORS.ERROR,
            timestamp: new Date().toISOString()
        }]);
        return new NextResponse(
            JSON.stringify({ success: false, message: 'Access denied: Blacklisted IP' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // Handle /auth/id?discordID=
    if (pathname === '/auth/id') {
        const discordID = searchParams.get('discordID');
        if (!discordID) {
            await sendWebhookLog([{
                title: "❌ Invalid Request",
                description: "Missing discordID parameter",
                fields: [{ name: "Path", value: pathname }],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: 'Missing required parameter: discordID is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        try {
            validateInput(discordID, 'discordID');
            if (blacklistedDiscordIds.includes(discordID)) {
                await sendWebhookLog([{
                    title: "🚫 Blacklisted Discord ID",
                    fields: [{ name: "Discord ID", value: discordID }],
                    color: COLORS.ERROR,
                    timestamp: new Date().toISOString()
                }]);
                return new NextResponse(
                    JSON.stringify({ success: false, message: 'Discord ID is blacklisted' }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );
            }

            const user = await readUserBlobByDiscordID(discordID);
            const now = Math.floor(Date.now() / 1000);
            if (user.EndTime < now) {
                await sendWebhookLog([{
                    title: "⏱️ Expired Key",
                    fields: [
                        { name: "Discord ID", value: discordID },
                        { name: "Key", value: user.Key },
                        { name: "Expires", value: formatDate(user.EndTime) }
                    ],
                    color: COLORS.WARNING,
                    timestamp: new Date().toISOString()
                }]);
                return new NextResponse(
                    JSON.stringify({ success: false, message: 'Key has expired' }),
                    { status: 401, headers: { 'Content-Type': 'application/json' } }
                );
            }

            await sendWebhookLog([{
                title: "✅ Successful Auth by Discord ID",
                fields: [
                    { name: "Discord ID", value: discordID },
                    { name: "Key", value: user.Key },
                    { name: "Expires", value: formatDate(user.EndTime) },
                    { name: "IP Info", value: `IP: ${ipInfo?.ip || 'Unknown'}\nLocation: ${ipInfo?.city || 'Unknown'}, ${ipInfo?.region || 'Unknown'}, ${ipInfo?.country || 'Unknown'}` }
                ],
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
                    isExpired: false,
                    session: Math.random().toString(36).substring(7)
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            await sendWebhookLog([{
                title: "❌ Auth Failed",
                description: error.message,
                fields: [
                    { name: "Discord ID", value: discordID },
                    { name: "Path", value: pathname }
                ],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: `Authentication failed: ${error.message}` }),
                { status: error.message === 'User not found' ? 404 : 500, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }

    // Handle /auth/key?key=&hwid=
    if (pathname === '/auth/key') {
        const key = searchParams.get('key');
        const hwid = searchParams.get('hwid');
        if (!key) {
            await sendWebhookLog([{
                title: "❌ Invalid Request",
                description: "Missing key parameter",
                fields: [{ name: "Path", value: pathname }],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: 'Missing required parameter: key is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        try {
            if (hwid && blacklistedHwids.includes(hwid)) {
                await sendWebhookLog([{
                    title: "🚫 Blacklisted HWID",
                    fields: [
                        { name: "Key", value: key },
                        { name: "HWID", value: hwid }
                    ],
                    color: COLORS.ERROR,
                    timestamp: new Date().toISOString()
                }]);
                return new NextResponse(
                    JSON.stringify({ success: false, message: 'HWID is blacklisted' }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );
            }

            const user = await findUserByKey(key);
            if (blacklistedDiscordIds.includes(user.discordID)) {
                await sendWebhookLog([{
                    title: "🚫 Blacklisted Discord ID",
                    fields: [
                        { name: "Key", value: key },
                        { name: "Discord ID", value: user.discordID }
                    ],
                    color: COLORS.ERROR,
                    timestamp: new Date().toISOString()
                }]);
                return new NextResponse(
                    JSON.stringify({ success: false, message: 'Discord ID is blacklisted' }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );
            }

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
                    await sendWebhookLog([{
                        title: "⚠️ HWID Mismatch",
                        fields: [
                            { name: "Key", value: key },
                            { name: "Attempted HWID", value: hwid },
                            { name: "Linked HWID", value: user.Hwid }
                        ],
                        color: COLORS.ERROR,
                        timestamp: new Date().toISOString()
                    }]);
                    return new NextResponse(
                        JSON.stringify({ success: false, message: 'Invalid HWID' }),
                        { status: 401, headers: { 'Content-Type': 'application/json' } }
                    );
                }
            }

            const now = Math.floor(Date.now() / 1000);
            if (user.EndTime < now) {
                await sendWebhookLog([{
                    title: "⏱️ Expired Key",
                    fields: [
                        { name: "Key", value: key },
                        { name: "Discord ID", value: user.discordID },
                        { name: "Expires", value: formatDate(user.EndTime) }
                    ],
                    color: COLORS.WARNING,
                    timestamp: new Date().toISOString()
                }]);
                return new NextResponse(
                    JSON.stringify({ success: false, message: 'Key has expired' }),
                    { status: 401, headers: { 'Content-Type': 'application/json' } }
                );
            }

            await sendWebhookLog([{
                title: "✅ Successful Auth by Key",
                fields: [
                    { name: "Key", value: key },
                    { name: "Discord ID", value: user.discordID },
                    { name: "HWID", value: user.Hwid || 'None' },
                    { name: "Expires", value: formatDate(user.EndTime) },
                    { name: "IP Info", value: `IP: ${ipInfo?.ip || 'Unknown'}\nLocation: ${ipInfo?.city || 'Unknown'}, ${ipInfo?.region || 'Unknown'}, ${ipInfo?.country || 'Unknown'}` }
                ],
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
                    isExpired: false,
                    session: Math.random().toString(36).substring(7)
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            await sendWebhookLog([{
                title: "❌ Auth Failed",
                description: error.message,
                fields: [
                    { name: "Key", value: key },
                    { name: "Path", value: pathname }
                ],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: `Authentication failed: ${error.message}` }),
                { status: error.message === 'User not found for provided key' ? 404 : 500, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }

    // Handle /auth/hwid?hwid=
    if (pathname === '/auth/hwid') {
        const hwid = searchParams.get('hwid');
        if (!hwid) {
            await sendWebhookLog([{
                title: "❌ Invalid Request",
                description: "Missing hwid parameter",
                fields: [{ name: "Path", value: pathname }],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: 'Missing required parameter: hwid is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        try {
            validateInput(hwid, 'hwid');
            if (blacklistedHwids.includes(hwid)) {
                await sendWebhookLog([{
                    title: "🚫 Blacklisted HWID",
                    fields: [{ name: "HWID", value: hwid }],
                    color: COLORS.ERROR,
                    timestamp: new Date().toISOString()
                }]);
                return new NextResponse(
                    JSON.stringify({ success: false, message: 'HWID is blacklisted' }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );
            }

            const { blobs } = await list({ prefix: USERS_DIR });
            let foundUser = null;
            let foundDiscordID = null;

            for (const blob of blobs) {
                if (blob.pathname.startsWith(USERS_DIR) && blob.pathname.endsWith('.json')) {
                    const blobData = await getBlob(blob.pathname, { access: 'public' });
                    if (!blobData) continue;
                    const userData = JSON.parse(await blobData.text());
                    if (userData.Hwid === hwid) {
                        const match = blob.pathname.match(/user-([^-]+)-[^.]+\.json$/);
                        if (match) {
                            foundDiscordID = match[1];
                            foundUser = userData;
                            foundUser.discordID = foundDiscordID;
                            break;
                        }
                    }
                }
            }

            if (!foundUser) {
                await sendWebhookLog([{
                    title: "❌ HWID Not Found",
                    fields: [{ name: "HWID", value: hwid }],
                    color: COLORS.ERROR,
                    timestamp: new Date().toISOString()
                }]);
                return new NextResponse(
                    JSON.stringify({ success: false, message: 'User not found for provided HWID' }),
                    { status: 404, headers: { 'Content-Type': 'application/json' } }
                );
            }

            if (blacklistedDiscordIds.includes(foundUser.discordID)) {
                await sendWebhookLog([{
                    title: "🚫 Blacklisted Discord ID",
                    fields: [
                        { name: "Discord ID", value: foundUser.discordID },
                        { name: "HWID", value: hwid }
                    ],
                    color: COLORS.ERROR,
                    timestamp: new Date().toISOString()
                }]);
                return new NextResponse(
                    JSON.stringify({ success: false, message: 'Discord ID is blacklisted' }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );
            }

            const now = Math.floor(Date.now() / 1000);
            if (foundUser.EndTime < now) {
                await sendWebhookLog([{
                    title: "⏱️ Expired Key",
                    fields: [
                        { name: "Discord ID", value: foundUser.discordID },
                        { name: "HWID", value: hwid },
                        { name: "Expires", value: formatDate(foundUser.EndTime) }
                    ],
                    color: COLORS.WARNING,
                    timestamp: new Date().toISOString()
                }]);
                return new NextResponse(
                    JSON.stringify({ success: false, message: 'Key has expired' }),
                    { status: 401, headers: { 'Content-Type': 'application/json' } }
                );
            }

            await sendWebhookLog([{
                title: "✅ Successful Auth by HWID",
                fields: [
                    { name: "HWID", value: hwid },
                    { name: "Discord ID", value: foundUser.discordID },
                    { name: "Key", value: foundUser.Key },
                    { name: "Expires", value: formatDate(foundUser.EndTime) },
                    { name: "IP Info", value: `IP: ${ipInfo?.ip || 'Unknown'}\nLocation: ${ipInfo?.city || 'Unknown'}, ${ipInfo?.region || 'Unknown'}, ${ipInfo?.country || 'Unknown'}` }
                ],
                color: COLORS.SUCCESS,
                timestamp: new Date().toISOString()
            }]);

            return new NextResponse(
                JSON.stringify({
                    success: true,
                    discordID: foundUser.discordID,
                    username: foundUser.UserName,
                    key: foundUser.Key,
                    hwid: foundUser.Hwid || '',
                    keytype: foundUser.KeyType || 'free',
                    usertag: foundUser.UserTag || 'None',
                    createdAt: foundUser.CreatedAt,
                    endTime: foundUser.EndTime,
                    isExpired: false,
                    session: Math.random().toString(36).substring(7)
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            await sendWebhookLog([{
                title: "❌ Auth Failed",
                description: error.message,
                fields: [
                    { name: "HWID", value: hwid },
                    { name: "Path", value: pathname }
                ],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: `Authentication failed: ${error.message}` }),
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
            await sendWebhookLog([{
                title: "❌ Invalid Registration Request",
                description: "Missing required parameters",
                fields: [
                    { name: "Discord ID", value: discordID || 'Not provided' },
                    { name: "Username", value: username || 'Not provided' }
                ],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: 'Missing required parameters: discordID and username are required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        try {
            validateInput(discordID, 'discordID');
            validateInput(username, 'username');
            if (blacklistedDiscordIds.includes(discordID)) {
                await sendWebhookLog([{
                    title: "🚫 Blacklisted Discord ID",
                    fields: [{ name: "Discord ID", value: discordID }],
                    color: COLORS.ERROR,
                    timestamp: new Date().toISOString()
                }]);
                return new NextResponse(
                    JSON.stringify({ success: false, message: 'Discord ID is blacklisted' }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );
            }

            if (!['free', 'paid'].includes(keytype)) {
                await sendWebhookLog([{
                    title: "❌ Invalid Key Type",
                    fields: [
                        { name: "Discord ID", value: discordID },
                        { name: "Key Type", value: keytype }
                    ],
                    color: COLORS.ERROR,
                    timestamp: new Date().toISOString()
                }]);
                return new NextResponse(
                    JSON.stringify({ success: false, message: 'Invalid keytype: must be "free" or "paid"' }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                );
            }

            const { blobs } = await list({ prefix: `${USERS_DIR}user-${discordID}-` });
            if (blobs.length > 0) {
                await sendWebhookLog([{
                    title: "❌ Registration Failed",
                    description: "User already exists",
                    fields: [{ name: "Discord ID", value: discordID }],
                    color: COLORS.ERROR,
                    timestamp: new Date().toISOString()
                }]);
                return new NextResponse(
                    JSON.stringify({ success: false, message: 'User with this Discord ID already exists' }),
                    { status: 409, headers: { 'Content-Type': 'application/json' } }
                );
            }

            const endTime = parseTimeToUnix(time);
            const newUser = {
                UserName: username,
                Key: generateKey(),
                Hwid: '',
                KeyType: keytype,
                UserTag: keytype === 'paid' ? 'Customer' : 'None',
                CreatedAt: Math.floor(Date.now() / 1000),
                EndTime: endTime,
                Uses: 0,
                MaxUses: keytype === 'paid' ? 1000 : 100 // Example usage limits
            };

            await writeUserBlob(discordID, newUser);
            await sendWebhookLog([{
                title: "✅ User Registered",
                fields: [
                    { name: "Discord ID", value: discordID },
                    { name: "Username", value: username },
                    { name: "Key", value: newUser.Key },
                    { name: "Key Type", value: keytype },
                    { name: "Expires", value: formatDate(endTime) },
                    { name: "IP Info", value: `IP: ${ipInfo?.ip || 'Unknown'}\nLocation: ${ipInfo?.city || 'Unknown'}, ${ipInfo?.region || 'Unknown'}, ${ipInfo?.country || 'Unknown'}` }
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
                    discordID: discordID,
                    session: Math.random().toString(36).substring(7)
                }),
                { status: 201, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            await sendWebhookLog([{
                title: "❌ Registration Failed",
                description: error.message,
                fields: [
                    { name: "Discord ID", value: discordID },
                    { name: "Username", value: username }
                ],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: `Registration failed: ${error.message}` }),
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
            await sendWebhookLog([{
                title: "🚫 Unauthorized Admin Access",
                fields: [{ name: "Path", value: pathname }],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: 'Unauthorized: Invalid authentication header' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (!discordID || !time) {
            await sendWebhookLog([{
                title: "❌ Invalid Admin Request",
                description: "Missing required parameters",
                fields: [
                    { name: "Discord ID", value: discordID || 'Not provided' },
                    { name: "Time", value: time || 'Not provided' }
                ],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: 'Missing required parameters: user and time are required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        try {
            validateInput(discordID, 'discordID');
            const user = await readUserBlobByDiscordID(discordID);
            const additionalTime = parseTimeToUnix(time) - Math.floor(Date.now() / 1000);
            const newEndTime = user.EndTime + additionalTime;

            if (newEndTime < Math.floor(Date.now() / 1000)) {
                await sendWebhookLog([{
                    title: "❌ Invalid Time Update",
                    description: "New end time cannot be in the past",
                    fields: [{ name: "Discord ID", value: discordID }],
                    color: COLORS.ERROR,
                    timestamp: new Date().toISOString()
                }]);
                return new NextResponse(
                    JSON.stringify({ success: false, message: 'New end time cannot be in the past' }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                );
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
        } catch (error) {
            await sendWebhookLog([{
                title: "❌ Admin Update Failed",
                description: error.message,
                fields: [{ name: "Discord ID", value: discordID }],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: `Failed to update user: ${error.message}` }),
                { status: error.message === 'User not found' ? 404 : 500, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }

    // Handle /users-list
    if (pathname === '/users-list') {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== 'UserMode-2d93n2002n8') {
            await sendWebhookLog([{
                title: "🚫 Unauthorized Users List Access",
                fields: [{ name: "Path", value: pathname }],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: 'Unauthorized: Invalid authentication header' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        try {
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
        } catch (error) {
            await sendWebhookLog([{
                title: "❌ Users List Failed",
                description: error.message,
                fields: [{ name: "Path", value: pathname }],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: `Failed to fetch user list: ${error.message}` }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }

    // Handle /files/?filename=scriptname
    if (pathname === '/files') {
        const filename = searchParams.get('filename');
        const authHeader = request.headers.get('authorization');

        if (authHeader !== 'UserMode-2d93n2002n8') {
            await sendWebhookLog([{
                title: "🚫 Unauthorized File Access",
                fields: [{ name: "Filename", value: filename || 'Not provided' }],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: 'Unauthorized: Invalid authentication header' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (!filename) {
            await sendWebhookLog([{
                title: "❌ Invalid File Request",
                description: "Missing filename parameter",
                fields: [{ name: "Path", value: pathname }],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: 'Filename parameter is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        try {
            validateInput(filename, 'filename');
            if (filename.includes('..')) {
                await sendWebhookLog([{
                    title: "❌ Invalid Filename",
                    description: "Directory traversal attempt",
                    fields: [{ name: "Filename", value: filename }],
                    color: COLORS.ERROR,
                    timestamp: new Date().toISOString()
                }]);
                return new NextResponse(
                    JSON.stringify({ success: false, message: 'Invalid filename: Directory traversal not allowed' }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                );
            }

            const scripts = await get('scripts');
            if (!scripts || !scripts[filename]) {
                await sendWebhookLog([{
                    title: "❌ Script Not Found",
                    fields: [{ name: "Filename", value: filename }],
                    color: COLORS.ERROR,
                    timestamp: new Date().toISOString()
                }]);
                return new NextResponse(
                    JSON.stringify({ success: false, message: `Script "${filename}" not found` }),
                    { status: 404, headers: { 'Content-Type': 'application/json' } }
                );
            }

            const scriptUrl = scripts[filename].Code.endsWith('/')
                ? scripts[filename].Code
                : `${scripts[filename].Code}/`;

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
        } catch (error) {
            await sendWebhookLog([{
                title: "❌ Script Fetch Failed",
                description: error.message,
                fields: [{ name: "Filename", value: filename }],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: `Failed to fetch script "${filename}": ${error.message}` }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }

    // Handle /scripts-list
    if (pathname === '/scripts-list') {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== 'UserMode-2d93n2002n8') {
            await sendWebhookLog([{
                title: "🚫 Unauthorized Scripts List Access",
                fields: [{ name: "Path", value: pathname }],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: 'Unauthorized: Invalid authentication header' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        try {
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
        } catch (error) {
            await sendWebhookLog([{
                title: "❌ Scripts List Failed",
                description: error.message,
                fields: [{ name: "Path", value: pathname }],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: `Failed to fetch script list: ${error.message}` }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }

    // Handle /scripts-metadata
    if (pathname === '/scripts-metadata') {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== 'UserMode-2d93n2002n8') {
            await sendWebhookLog([{
                title: "🚫 Unauthorized Scripts Metadata Access",
                fields: [{ name: "Path", value: pathname }],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: 'Unauthorized: Invalid authentication header' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        try {
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
        } catch (error) {
            await sendWebhookLog([{
                title: "❌ Scripts Metadata Failed",
                description: error.message,
                fields: [{ name: "Path", value: pathname }],
                color: COLORS.ERROR,
                timestamp: new Date(). Sjöndrome
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: `Failed to fetch scripts metadata: ${error.message}` }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }

    // Handle /userinfo/id?discordID=
    if (pathname === '/userinfo/id') {
        const discordID = searchParams.get('discordID');
        const authHeader = request.headers.get('authorization');

        if (authHeader !== 'UserMode-2d93n2002n8') {
            await sendWebhookLog([{
                title: "🚫 Unauthorized User Info Access",
                fields: [{ name: "Discord ID", value: discordID || 'Not provided' }],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: 'Unauthorized: Invalid authentication header' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (!discordID) {
            await sendWebhookLog([{
                title: "❌ Invalid User Info Request",
                description: "Missing discordID parameter",
                fields: [{ name: "Path", value: pathname }],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: 'Missing required parameter: discordID is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        try {
            validateInput(discordID, 'discordID');
            if (blacklistedDiscordIds.includes(discordID)) {
                await sendWebhookLog([{
                    title: "🚫 Blacklisted Discord ID",
                    fields: [{ name: "Discord ID", value: discordID }],
                    color: COLORS.ERROR,
                    timestamp: new Date().toISOString()
                }]);
                return new NextResponse(
                    JSON.stringify({ success: false, message: 'Discord ID is blacklisted' }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );
            }

            const user = await readUserBlobByDiscordID(discordID);
            await sendWebhookLog([{
                title: "✅ User Info Retrieved",
                fields: [
                    { name: "Discord ID", value: discordID },
                    { name: "Username", value: user.UserName },
                    { name: "Key", value: user.Key },
                    { name: "Expires", value: formatDate(user.EndTime) }
                ],
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
                    session: Math.random().toString(36).substring(7)
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            await sendWebhookLog([{
                title: "❌ User Info Failed",
                description: error.message,
                fields: [{ name: "Discord ID", value: discordID }],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: `Failed to fetch user info: ${error.message}` }),
                { status: error.message === 'User not found' ? 404 : 500, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }

    // Handle /userinfo/key?key=
    if (pathname === '/userinfo/key') {
        const key = searchParams.get('key');
        const authHeader = request.headers.get('authorization');

        if (authHeader !== 'UserMode-2d93n2002n8') {
            await sendWebhookLog([{
                title: "🚫 Unauthorized User Info Access",
                fields: [{ name: "Key", value: key || 'Not provided' }],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: 'Unauthorized: Invalid authentication header' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (!key) {
            await sendWebhookLog([{
                title: "❌ Invalid User Info Request",
                description: "Missing key parameter",
                fields: [{ name: "Path", value: pathname }],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: 'Missing required parameter: key is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        try {
            const user = await findUserByKey(key);
            if (blacklistedDiscordIds.includes(user.discordID)) {
                await sendWebhookLog([{
                    title: "🚫 Blacklisted Discord ID",
                    fields: [
                        { name: "Key", value: key },
                        { name: "Discord ID", value: user.discordID }
                    ],
                    color: COLORS.ERROR,
                    timestamp: new Date().toISOString()
                }]);
                return new NextResponse(
                    JSON.stringify({ success: false, message: 'Discord ID is blacklisted' }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );
            }

            await sendWebhookLog([{
                title: "✅ User Info Retrieved",
                fields: [
                    { name: "Key", value: key },
                    { name: "Discord ID", value: user.discordID },
                    { name: "Username", value: user.UserName },
                    { name: "Expires", value: formatDate(user.EndTime) }
                ],
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
                    session: Math.random().toString(36).substring(7)
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            await sendWebhookLog([{
                title: "❌ User Info Failed",
                description: error.message,
                fields: [{ name: "Key", value: key }],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: `Failed to fetch user info: ${error.message}` }),
                { status: error.message === 'User not found for provided key' ? 404 : 500, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }

    // Handle /userinfo/hwid?hwid=
    if (pathname === '/userinfo/hwid') {
        const hwid = searchParams.get('hwid');
        const authHeader = request.headers.get('authorization');

        if (authHeader !== 'UserMode-2d93n2002n8') {
            await sendWebhookLog([{
                title: "🚫 Unauthorized User Info Access",
                fields: [{ name: "HWID", value: hwid || 'Not provided' }],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: 'Unauthorized: Invalid authentication header' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (!hwid) {
            await sendWebhookLog([{
                title: "❌ Invalid User Info Request",
                description: "Missing hwid parameter",
                fields: [{ name: "Path", value: pathname }],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: 'Missing required parameter: hwid is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        try {
            validateInput(hwid, 'hwid');
            if (blacklistedHwids.includes(hwid)) {
                await sendWebhookLog([{
                    title: "🚫 Blacklisted HWID",
                    fields: [{ name: "HWID", value: hwid }],
                    color: COLORS.ERROR,
                    timestamp: new Date().toISOString()
                }]);
                return new NextResponse(
                    JSON.stringify({ success: false, message: 'HWID is blacklisted' }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );
            }

            const { blobs } = await list({ prefix: USERS_DIR });
            let foundUser = null;
            let foundDiscordID = null;

            for (const blob of blobs) {
                if (blob.pathname.startsWith(USERS_DIR) && blob.pathname.endsWith('.json')) {
                    const blobData = await getBlob(blob.pathname, { access: 'public' });
                    if (!blobData) continue;
                    const userData = JSON.parse(await blobData.text());
                    if (userData.Hwid === hwid) {
                        const match = blob.pathname.match(/user-([^-]+)-[^.]+\.json$/);
                        if (match) {
                            foundDiscordID = match[1];
                            foundUser = userData;
                            foundUser.discordID = foundDiscordID;
                            break;
                        }
                    }
                }
            }

            if (!foundUser) {
                await sendWebhookLog([{
                    title: "❌ HWID Not Found",
                    fields: [{ name: "HWID", value: hwid }],
                    color: COLORS.ERROR,
                    timestamp: new Date().toISOString()
                }]);
                return new NextResponse(
                    JSON.stringify({ success: false, message: 'User not found for provided HWID' }),
                    { status: 404, headers: { 'Content-Type': 'application/json' } }
                );
            }

            if (blacklistedDiscordIds.includes(foundUser.discordID)) {
                await sendWebhookLog([{
                    title: "🚫 Blacklisted Discord ID",
                    fields: [
                        { name: "Discord ID", value: foundUser.discordID },
                        { name: "HWID", value: hwid }
                    ],
                    color: COLORS.ERROR,
                    timestamp: new Date().toISOString()
                }]);
                return new NextResponse(
                    JSON.stringify({ success: false, message: 'Discord ID is blacklisted' }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );
            }

            await sendWebhookLog([{
                title: "✅ User Info Retrieved",
                fields: [
                    { name: "HWID", value: hwid },
                    { name: "Discord ID", value: foundUser.discordID },
                    { name: "Username", value: foundUser.UserName },
                    { name: "Expires", value: formatDate(foundUser.EndTime) }
                ],
                color: COLORS.SUCCESS,
                timestamp: new Date().toISOString()
            }]);

            return new NextResponse(
                JSON.stringify({
                    success: true,
                    discordID: foundUser.discordID,
                    username: foundUser.UserName,
                    key: foundUser.Key,
                    hwid: foundUser.Hwid || '',
                    keytype: foundUser.KeyType || 'free',
                    usertag: foundUser.UserTag || 'None',
                    createdAt: foundUser.CreatedAt,
                    endTime: foundUser.EndTime,
                    isExpired: foundUser.EndTime < Math.floor(Date.now() / 1000),
                    session: Math.random().toString(36).substring(7)
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            await sendWebhookLog([{
                title: "❌ User Info Failed",
                description: error.message,
                fields: [{ name: "HWID", value: hwid }],
                color: COLORS.ERROR,
                timestamp: new Date().toISOString()
            }]);
            return new NextResponse(
                JSON.stringify({ success: false, message: `Failed to fetch user info by HWID: ${error.message}` }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
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
