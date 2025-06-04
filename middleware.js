import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';
import { put, list } from '@vercel/blob';

const BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_utjs6NoOOU3BdeXE_0pNKDMi9ecw5Gh6ls3KB2OSOb2bKxs';
const EDGE_CONFIG_URL = 'https://edge-config.vercel.com/ecfg_i4emvlr8if7efdth14-a5b8qu0-b26?token=b26cdde-a12b-39a4-fa98-cef8777d3b26';
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1378937855199674508/nHwMtepJ3hKpzKDZErNkMdgIZPWhix80nkqSyMgYlbMMuOrLhHcF0HYsmLcq6CZeJrco';
const SITE_URL = 'https://utils32.vercel.app';

// Send log to Discord webhook as an embed
async function sendWebhookLog(request, message) {
  if (!WEBHOOK_URL) {
    console.warn('WEBHOOK_URL not set, skipping webhook log');
    return;
  }

  let prefix;
  if (message.includes('error') || message.includes('Invalid') || message.includes('failed')) {
    prefix = '[ERROR]';
  } else if (message.includes('warn')) {
    prefix = '[WARN]';
  } else {
    prefix = '[SUCCESS]';
  }

  const timestamp = new Date().toISOString();
  const url = new URL(request.url);
  const fullUrl = `${SITE_URL}${url.pathname}${url.search ? url.search : ''}`;
  const searchParams = Object.fromEntries(url.searchParams.entries());

  const embed = {
    title: `${prefix} Log Entry`,
    description: message,
    color: prefix === '[ERROR]' ? 15158332 : prefix === '[WARN]' ? 16763904 : 65280,
    fields: [
      { name: 'Timestamp', value: timestamp, inline: true },
      { name: 'URL', value: fullUrl, inline: true },
      { name: 'Search Params', value: JSON.stringify(searchParams) || 'None', inline: true },
    ],
    footer: { text: 'Nebula Middleware Logs' },
  };

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText} - ${await response.text()}`);
    }
  } catch (error) {
    console.error(`Failed to send webhook log: ${error.message}`);
    if (error.message.includes('401')) {
      console.warn('Webhook token may be invalid. Consider updating WEBHOOK_URL.');
    }
  }
}

// Generate a 14-character key
function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 14; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// Parse time string (e.g., "100s", "100mo") to seconds
function parseTimeToSeconds(timeStr) {
  const match = timeStr.match(/^(\d+)(s|m|h|d|mo|yr)$/);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2];

  const secondsInUnit = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
    mo: 60 * 60 * 24 * 30,
    yr: 60 * 60 * 24 * 365,
  };

  return value * secondsInUnit[unit];
}

// Middleware function
export async function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] Middleware processing request for path: ${pathname}`;
  console.log(logMessage);
  await sendWebhookLog(request, logMessage);

  if (!BLOB_READ_WRITE_TOKEN || !EDGE_CONFIG_URL || !WEBHOOK_URL) {
    const warningMessage = `[${timestamp}] Environment variables missing, using hardcoded values`;
    console.warn(warningMessage);
    await sendWebhookLog(request, warningMessage);
  }

  try {
    if (pathname.startsWith('/scripts-list')) {
      const logMessage = `[${timestamp}] Handling /scripts-list`;
      console.log(logMessage);
      await sendWebhookLog(request, logMessage);

      const authHeader = request.headers.get('authorization');
      if (authHeader !== 'UserMode-2d93n2002n8') {
        const errorMessage = `[${timestamp}] /scripts-list: Invalid authorization header`;
        console.error(errorMessage);
        await sendWebhookLog(request, errorMessage);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      try {
        const scripts = await get('scripts', { edgeConfig: EDGE_CONFIG_URL });
        const scriptNames = Object.keys(scripts);
        const successMessage = `[${timestamp}] /scripts-list: Retrieved ${scriptNames.length} scripts`;
        console.log(successMessage);
        await sendWebhookLog(request, successMessage);
        return NextResponse.json(scriptNames);
      } catch (error) {
        const errorMessage = `[${timestamp}] /scripts-list: Failed to fetch scripts: ${error.message}`;
        console.error(errorMessage);
        await sendWebhookLog(request, errorMessage);
        return NextResponse.json({ error: 'Failed to fetch scripts' }, { status: 500 });
      }
    }

    if (pathname.startsWith('/auth/v1')) {
      const logMessage = `[${timestamp}] Handling /auth/v1`;
      console.log(logMessage);
      await sendWebhookLog(request, logMessage);

      const key = searchParams.get('key');
      const hwid = searchParams.get('hwid');

      if (!key || !hwid) {
        const errorMessage = `[${timestamp}] /auth/v1: Missing key or hwid`;
        console.error(errorMessage);
        await sendWebhookLog(request, errorMessage);
        return NextResponse.json({ error: 'Missing key or hwid' }, { status: 400 });
      }

      try {
        const { blobs } = await list({ prefix: `Users/${key}-`, token: BLOB_READ_WRITE_TOKEN });
        if (blobs.length === 0) {
          const errorMessage = `[${timestamp}] /auth/v1: Invalid key ${key}`;
          console.error(errorMessage);
          await sendWebhookLog(request, errorMessage);
          return NextResponse.json({ error: 'Invalid key' }, { status: 401 });
        }

        const blob = blobs[0];
        const response = await fetch(blob.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.statusText}`);
        }
        const userData = await response.json();

        if (userData.hwid === '' && hwid) {
          userData.hwid = hwid;
          await put(`Users/${key}-${userData.discordId}.json`, JSON.stringify(userData), {
            access: 'public',
            token: BLOB_READ_WRITE_TOKEN,
            addRandomSuffix: false,
          });
          const hwidLogMessage = `[${timestamp}] /auth/v1: Updated HWID for key ${key} to ${hwid}`;
          console.log(hwidLogMessage);
          await sendWebhookLog(request, hwidLogMessage);
        } else if (userData.hwid !== hwid) {
          const errorMessage = `[${timestamp}] /auth/v1: Invalid HWID for key ${key}`;
          console.error(errorMessage);
          await sendWebhookLog(request, errorMessage);
          return NextResponse.json({ error: 'Invalid HWID' }, { status: 401 });
        }

        if (userData.endTime < Math.floor(Date.now() / 1000)) {
          const errorMessage = `[${timestamp}] /auth/v1: Key expired for key ${key}`;
          console.error(errorMessage);
          await sendWebhookLog(request, errorMessage);
          return NextResponse.json({ error: 'Key expired' }, { status: 401 });
        }

        return NextResponse.json({ success: true, ...userData });
      } catch (error) {
        const errorMessage = `[${timestamp}] Error in /auth/v1 for key ${key}: ${error.message}`;
        console.error(errorMessage);
        await sendWebhookLog(request, errorMessage);
        return NextResponse.json({ error: 'Invalid key' }, { status: 401 });
      }
    }

    if (pathname.startsWith('/dAuth/v1')) {
      const logMessage = `[${timestamp}] Handling /dAuth/v1`;
      console.log(logMessage);
      await sendWebhookLog(request, logMessage);

      const discordId = searchParams.get('ID');

      if (!discordId) {
        const errorMessage = `[${timestamp}] /dAuth/v1: Missing Discord ID`;
        console.error(errorMessage);
        await sendWebhookLog(request, errorMessage);
        return NextResponse.json({ error: 'Missing Discord ID' }, { status: 400 });
      }

      const { blobs } = await list({ prefix: 'Users/', token: BLOB_READ_WRITE_TOKEN });
      for (const blob of blobs) {
        if (blob.pathname.endsWith(`-${discordId}.json`)) {
          try {
            const response = await fetch(blob.url);
            if (!response.ok) {
              throw new Error(`Failed to fetch blob: ${response.statusText}`);
            }
            const userData = await response.json();

            if (userData.endTime < Math.floor(Date.now() / 1000)) {
              const errorMessage = `[${timestamp}] /dAuth/v1: Key expired for Discord ID ${discordId}`;
              console.error(errorMessage);
              await sendWebhookLog(request, errorMessage);
              return NextResponse.json({ error: 'Key expired' }, { status: 401 });
            }
            return NextResponse.json({ success: true, ...userData });
          } catch (error) {
            const errorMessage = `[${timestamp}] Error reading blob ${blob.pathname} in /dAuth/v1: ${error.message}`;
            console.error(errorMessage);
            await sendWebhookLog(request, errorMessage);
            continue;
          }
        }
      }

      const errorMessage = `[${timestamp}] /dAuth/v1: No user found with Discord ID ${discordId}`;
      console.error(errorMessage);
      await sendWebhookLog(request, errorMessage);
      return NextResponse.json({ error: 'No user found with this Discord ID' }, { status: 404 });
    }

    if (pathname.startsWith('/files/v1')) {
      const logMessage = `[${timestamp}] Handling /files/v1`;
      console.log(logMessage);
      await sendWebhookLog(request, logMessage);

      const fileName = searchParams.get('file')?.toLowerCase();
      const key = request.headers.get('authorization')?.split(' ')[1];

      if (!fileName || !key) {
        const errorMessage = `[${timestamp}] /files/v1: Missing file name or key`;
        console.error(errorMessage);
        await sendWebhookLog(request, errorMessage);
        return NextResponse.json({ error: 'Missing file name or key' }, { status: 400 });
      }

      try {
        const { blobs } = await list({ prefix: `Users/${key}-`, token: BLOB_READ_WRITE_TOKEN });
        if (blobs.length === 0) {
          const errorMessage = `[${timestamp}] /files/v1: Invalid key ${key}`;
          console.error(errorMessage);
          await sendWebhookLog(request, errorMessage);
          return NextResponse.json({ error: 'Invalid key' }, { status: 401 });
        }

        const blob = blobs[0];
        const response = await fetch(blob.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.statusText}`);
        }
        const userData = await response.json();

        if (userData.endTime < Math.floor(Date.now() / 1000)) {
          const errorMessage = `[${timestamp}] /files/v1: Key expired for key ${key}`;
          console.error(errorMessage);
          await sendWebhookLog(request, errorMessage);
          return NextResponse.json({ error: 'Key expired' }, { status: 401 });
        }
      } catch (error) {
        const errorMessage = `[${timestamp}] Error in /files/v1 for key ${key}: ${error.message}`;
        console.error(errorMessage);
        await sendWebhookLog(request, errorMessage);
        return NextResponse.json({ error: 'Invalid key' }, { status: 401 });
      }

      const scripts = await get('scripts', { edgeConfig: EDGE_CONFIG_URL });
      const script = Object.keys(scripts).find(
        (key) => key.toLowerCase() === fileName
      );

      if (!script) {
        const errorMessage = `[${timestamp}] /files/v1: File not found: ${fileName}`;
        console.error(errorMessage);
        await sendWebhookLog(request, errorMessage);
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }

      return NextResponse.json(scripts[script]);
    }

    if (pathname.startsWith('/manage/v1')) {
      const logMessage = `[${timestamp}] Handling /manage/v1`;
      console.log(logMessage);
      await sendWebhookLog(request, logMessage);

      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const errorMessage = `[${timestamp}] /manage/v1: Missing or invalid Authorization header`;
        console.error(errorMessage);
        await sendWebhookLog(request, errorMessage);
        return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
      }
      const discordId = authHeader.split(' ')[1];
      if (discordId !== '1272720391462457400') {
        const errorMessage = `[${timestamp}] /manage/v1: Unauthorized - Admin access required`;
        console.error(errorMessage);
        await sendWebhookLog(request, errorMessage);
        return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
      }

      const action = searchParams.get('action');
      if (!action) {
        const errorMessage = `[${timestamp}] /manage/v1: Missing action parameter`;
        console.error(errorMessage);
        await sendWebhookLog(request, errorMessage);
        return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
      }

      if (action === 'list') {
        const { blobs } = await list({ prefix: 'Users/', token: BLOB_READ_WRITE_TOKEN });
        const users = [];

        for (const blob of blobs) {
          try {
            const response = await fetch(blob.url);
            if (!response.ok) {
              throw new Error(`Failed to fetch blob: ${response.statusText}`);
            }
            const userData = await response.json();
            users.push(userData);
          } catch (error) {
            const errorMessage = `[${timestamp}] Error reading blob ${blob.pathname} in /manage/v1: ${error.message}`;
            console.error(errorMessage);
            await sendWebhookLog(request, errorMessage);
            continue;
          }
        }

        const successMessage = `[${timestamp}] /manage/v1: Retrieved ${users.length} users`;
        console.log(successMessage);
        await sendWebhookLog(request, successMessage);
        return NextResponse.json({ success: true, users });
      } else if (action === 'update') {
        const body = await request.json();
        if (!body.discordId || !body.username || !body.endTime) {
          const errorMessage = `[${timestamp}] /manage/v1: Missing required fields in request body`;
          console.error(errorMessage);
          await sendWebhookLog(request, errorMessage);
          return NextResponse.json({ error: 'Missing required fields (discordId, username, endTime)' }, { status: 400 });
        }

        const { blobs } = await list({ prefix: 'Users/', token: BLOB_READ_WRITE_TOKEN });
        let userBlob = null;
        let userData = null;

        for (const blob of blobs) {
          if (blob.pathname.endsWith(`-${body.discordId}.json`)) {
            const response = await fetch(blob.url);
            if (!response.ok) {
              throw new Error(`Failed to fetch blob: ${response.statusText}`);
            }
            userData = await response.json();
            userBlob = blob;
            break;
          }
        }

        if (!userData) {
          const errorMessage = `[${timestamp}] /manage/v1: User not found with Discord ID ${body.discordId}`;
          console.error(errorMessage);
          await sendWebhookLog(request, errorMessage);
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        userData.username = body.username;
        userData.endTime = body.endTime;
        if (body.hwid !== undefined) userData.hwid = body.hwid;

        await put(`Users/${userData.key}-${body.discordId}.json`, JSON.stringify(userData), {
          access: 'public',
          token: BLOB_READ_WRITE_TOKEN,
          addRandomSuffix: false,
        });

        const successMessage = `[${timestamp}] /manage/v1: Updated user ${body.discordId}`;
        console.log(successMessage);
        await sendWebhookLog(request, successMessage);
        return NextResponse.json({ success: true, user: userData });
      } else if (action === 'delete') {
        const body = await request.json();
        if (!body.discordId) {
          const errorMessage = `[${timestamp}] /manage/v1: Missing discordId in request body`;
          console.error(errorMessage);
          await sendWebhookLog(request, errorMessage);
          return NextResponse.json({ error: 'Missing discordId' }, { status: 400 });
        }

        const { blobs } = await list({ prefix: 'Users/', token: BLOB_READ_WRITE_TOKEN });
        const userBlob = blobs.find((blob) => blob.pathname.endsWith(`-${body.discordId}.json`));

        if (!userBlob) {
          const errorMessage = `[${timestamp}] /manage/v1: User not found with Discord ID ${body.discordId}`;
          console.error(errorMessage);
          await sendWebhookLog(request, errorMessage);
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        await fetch(userBlob.url, { method: 'DELETE', token: BLOB_READ_WRITE_TOKEN });

        const successMessage = `[${timestamp}] /manage/v1: Deleted user ${body.discordId}`;
        console.log(successMessage);
        await sendWebhookLog(request, successMessage);
        return NextResponse.json({ success: true });
      } else {
        const errorMessage = `[${timestamp}] /manage/v1: Invalid action ${action}`;
        console.error(errorMessage);
        await sendWebhookLog(request, errorMessage);
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }
    }

    if (pathname.startsWith('/register/v1')) {
      const logMessage = `[${timestamp}] Handling /register/v1`;
      console.log(logMessage);
      await sendWebhookLog(request, logMessage);

      const discordId = searchParams.get('ID');
      const timeStr = searchParams.get('time');
      const username = searchParams.get('username');

      if (!discordId || !timeStr || !username) {
        const errorMessage = `[${timestamp}] /register/v1: Missing Discord ID, time, or username`;
        console.error(errorMessage);
        await sendWebhookLog(request, errorMessage);
        return NextResponse.json({ error: 'Missing Discord ID, time, or username' }, { status: 400 });
      }

      if (username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
        const errorMessage = `[${timestamp}] /register/v1: Invalid username format`;
        console.error(errorMessage);
        await sendWebhookLog(request, errorMessage);
        return NextResponse.json(
          { error: 'Username must be 3-20 characters and contain only letters, numbers, or underscores' },
          { status: 400 }
        );
      }

      const durationSeconds = parseTimeToSeconds(timeStr);
      if (durationSeconds === null) {
        const errorMessage = `[${timestamp}] /register/v1: Invalid time format: ${timeStr}`;
        console.error(errorMessage);
        await sendWebhookLog(request, errorMessage);
        return NextResponse.json(
          { error: 'Invalid time format. Use format like 100s, 100m, 100h, 100d, 100mo, or 100yr' },
          { status: 400 }
        );
      }

      const { blobs } = await list({ prefix: 'Users/', token: BLOB_READ_WRITE_TOKEN });
      for (const blob of blobs) {
        if (blob.pathname.endsWith(`-${discordId}.json`)) {
          const errorMessage = `[${timestamp}] /register/v1: User already registered with Discord ID ${discordId}`;
          console.error(errorMessage);
          await sendWebhookLog(request, errorMessage);
          return NextResponse.json({ error: 'User already registered' }, { status: 400 });
        }
        try {
          const response = await fetch(blob.url);
          if (!response.ok) {
            const errorMessage = `[${timestamp}] /register/v1: Failed to fetch blob ${blob.pathname}: ${response.statusText}`;
            console.error(errorMessage);
            await sendWebhookLog(request, errorMessage);
            continue;
          }
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const errorMessage = `[${timestamp}] /register/v1: Invalid content type for blob ${blob.pathname}: ${contentType}`;
            console.error(errorMessage);
            await sendWebhookLog(request, errorMessage);
            continue;
          }
          const userData = await response.json();
          if (userData.username === username) {
            const errorMessage = `[${timestamp}] /register/v1: Username ${username} already taken`;
            console.error(errorMessage);
            await sendWebhookLog(request, errorMessage);
            return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
          }
        } catch (error) {
          const errorMessage = `[${timestamp}] /register/v1: Error reading blob ${blob.pathname}: ${error.message}`;
          console.error(errorMessage);
          await sendWebhookLog(request, errorMessage);
          continue;
        }
      }

      const newKey = generateKey();
      const createTime = Math.floor(Date.now() / 1000);
      const user = {
        key: newKey,
        hwid: '',
        discordId,
        username,
        createTime,
        endTime: createTime + durationSeconds,
      };

      await put(`Users/${newKey}-${discordId}.json`, JSON.stringify(user), {
        access: 'public',
        token: BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: false,
      });

      const successMessage = `[${timestamp}] /register/v1: Registered user ${username} with Discord ID ${discordId}, key ${newKey}`;
      console.log(successMessage);
      await sendWebhookLog(request, successMessage);

      return NextResponse.json({ success: true, ...user });
    }

    if (pathname.startsWith('/login/v1')) {
      const logMessage = `[${timestamp}] Handling /login/v1`;
      console.log(logMessage);
      await sendWebhookLog(request, logMessage);

      const discordId = searchParams.get('ID');
      const username = searchParams.get('username');

      if (!discordId || !username) {
        const errorMessage = `[${timestamp}] /login/v1: Missing Discord ID or username`;
        console.error(errorMessage);
        await sendWebhookLog(request, errorMessage);
        return NextResponse.json({ error: 'Missing Discord ID or username' }, { status: 400 });
      }

      const { blobs } = await list({ prefix: 'Users/', token: BLOB_READ_WRITE_TOKEN });
      for (const blob of blobs) {
        if (blob.pathname.endsWith(`-${discordId}.json`)) {
          try {
            const response = await fetch(blob.url);
            if (!response.ok) {
              throw new Error(`Failed to fetch blob: ${response.statusText}`);
            }
            const userData = await response.json();

            if (userData.username !== username) {
              const errorMessage = `[${timestamp}] /login/v1: Invalid username for Discord ID ${discordId}`;
              console.error(errorMessage);
              await sendWebhookLog(request, errorMessage);
              return NextResponse.json({ error: 'Invalid username' }, { status: 401 });
            }

            if (userData.endTime < Math.floor(Date.now() / 1000)) {
              const errorMessage = `[${timestamp}] /login/v1: Key expired for Discord ID ${discordId}`;
              console.error(errorMessage);
              await sendWebhookLog(request, errorMessage);
              return NextResponse.json({ error: 'Key expired' }, { status: 401 });
            }

            return NextResponse.json({ success: true, ...userData });
          } catch (error) {
            const errorMessage = `[${timestamp}] Error reading blob ${blob.pathname} in /login/v1: ${error.message}`;
            console.error(errorMessage);
            await sendWebhookLog(request, errorMessage);
            continue;
          }
        }
      }

      const errorMessage = `[${timestamp}] /login/v1: No user found with Discord ID ${discordId}`;
      console.error(errorMessage);
      await sendWebhookLog(request, errorMessage);
      return NextResponse.json({ error: 'No user found with this Discord ID' }, { status: 404 });
    }

    if (pathname.startsWith('/users/v1')) {
      const logMessage = `[${timestamp}] Handling /users/v1`;
      console.log(logMessage);
      await sendWebhookLog(request, logMessage);

      const { blobs } = await list({ prefix: 'Users/', token: BLOB_READ_WRITE_TOKEN });
      const users = [];

      for (const blob of blobs) {
        try {
          const response = await fetch(blob.url);
          if (!response.ok) {
            throw new Error(`Failed to fetch blob: ${response.statusText}`);
          }
          const userData = await response.json();
          users.push(userData);
        } catch (error) {
          const errorMessage = `[${timestamp}] Error reading blob ${blob.pathname} in /users/v1: ${error.message}`;
          console.error(errorMessage);
          await sendWebhookLog(request, errorMessage);
          continue;
        }
      }

      const successMessage = `[${timestamp}] /users/v1: Retrieved ${users.length} users`;
      console.log(successMessage);
      await sendWebhookLog(request, successMessage);

      return NextResponse.json({ success: true, users });
    }

    if (pathname.startsWith('/reset-hwid/v1')) {
      const logMessage = `[${timestamp}] Handling /reset-hwid/v1`;
      console.log(logMessage);
      await sendWebhookLog(request, logMessage);

      const authHeader = request.headers.get('authorization');
      const discordId = authHeader?.split(' ')[1];

      if (!discordId) {
        const errorMessage = `[${timestamp}] /reset-hwid/v1: Missing Discord ID in authorization header`;
        console.error(errorMessage);
        await sendWebhookLog(request, errorMessage);
        return NextResponse.json({ error: 'Missing Discord ID' }, { status: 400 });
      }

      try {
        let userBlob = null;
        let userData = null;
        const { blobs } = await list({ prefix: 'Users/', token: BLOB_READ_WRITE_TOKEN });
        for (const blob of blobs) {
          if (blob.pathname.endsWith(`-${discordId}.json`)) {
            userBlob = blob;
            const response = await fetch(blob.url);
            if (!response.ok) {
              throw new Error(`Failed to fetch blob: ${response.statusText}`);
            }
            userData = await response.json();
            break;
          }
        }

        if (!userData) {
          const errorMessage = `[${timestamp}] /reset-hwid/v1: User not found with Discord ID ${discordId}`;
          console.error(errorMessage);
          await sendWebhookLog(request, errorMessage);
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!userData.hwid) {
          const errorMessage = `[${timestamp}] /reset-hwid/v1: No HWID set for Discord ID ${discordId}`;
          console.error(errorMessage);
          await sendWebhookLog(request, errorMessage);
          return NextResponse.json({ error: 'No HWID set' }, { status: 400 });
        }

        const today = new Date().toISOString().split('T')[0];
        const resetKey = `HwidResets/${discordId}/${today}.json`;
        let resetData = { count: 0, resets: [] };

        const { blobs: resetBlobs } = await list({ prefix: resetKey, token: BLOB_READ_WRITE_TOKEN });
        if (resetBlobs.length > 0) {
          const resetResponse = await fetch(resetBlobs[0].url);
          if (!resetResponse.ok) {
            throw new Error(`Failed to fetch reset blob: ${resetResponse.statusText}`);
          }
          resetData = await resetResponse.json();
        }

        if (resetData.count >= 2 && discordId !== '1272720391462457400') {
          const errorMessage = `[${timestamp}] /reset-hwid/v1: HWID reset limit reached for Discord ID ${discordId}`;
          console.error(errorMessage);
          await sendWebhookLog(request, errorMessage);
          return NextResponse.json({ error: 'HWID reset limit reached (2/day)' }, { status: 429 });
        }

        userData.hwid = '';
        await put(`Users/${userData.key}-${discordId}.json`, JSON.stringify(userData), {
          access: 'public',
          token: BLOB_READ_WRITE_TOKEN,
          addRandomSuffix: false,
        });

        resetData.count += 1;
        resetData.resets.push({ timestamp });
        await put(resetKey, JSON.stringify(resetData), {
          access: 'public',
          token: BLOB_READ_WRITE_TOKEN,
          addRandomSuffix: false,
        });

        const successMessage = `[${timestamp}] /reset-hwid/v1: HWID reset for Discord ID ${discordId} (${resetData.count}/2 today)`;
        console.log(successMessage);
        await sendWebhookLog(request, successMessage);

        return NextResponse.json({ success: true, message: 'HWID reset successfully' });
      } catch (error) {
        const errorMessage = `[${timestamp}] Error in /reset-hwid/v1 for Discord ID ${discordId}: ${error.message}`;
        console.error(errorMessage);
        await sendWebhookLog(request, errorMessage);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    }

    const noRouteMessage = `[${timestamp}] No matching route for ${pathname}, passing to Next.js`;
    console.log(noRouteMessage);
    await sendWebhookLog(request, noRouteMessage);
    return NextResponse.next();
  } catch (error) {
    const errorMessage = `[${timestamp}] Middleware error: ${error.message}`;
    console.error(errorMessage);
    await sendWebhookLog(request, errorMessage);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
