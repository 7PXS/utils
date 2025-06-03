import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';
import { put, download, list } from '@vercel/blob';

const BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_utjs6NoOOU3BdeXE_0pNKDMi9ecw5Gh6ls3KB2OSOb2bKxs';
const EDGE_CONFIG_URL = 'https://edge-config.vercel.com/ecfg_i4emvlr8if7stfth14z98b5qu0yk?token=b26cdde2-ba12-4a39-8fa9-8cef777d3276';

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
  if (!match) {
    return null;
  }

  const value = parseInt(match[1]);
  const unit = match[2];

  const secondsInUnit = {
    s: 1, // seconds
    m: 60, // minutes
    h: 60 * 60, // hours
    d: 60 * 60 * 24, // days
    mo: 60 * 60 * 24 * 30, // months (approx 30 days)
    yr: 60 * 60 * 24 * 365, // years (approx 365 days)
  };

  return value * secondsInUnit[unit];
}

// Middleware function
export async function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;
  console.log(`Middleware processing request for path: ${pathname}`);

  try {
    // /auth/v1/?key=&hwid=
    if (pathname.startsWith('/auth/v1')) {
      console.log('Handling /auth/v1');
      const key = searchParams.get('key');
      const hwid = searchParams.get('hwid');

      if (!key || !hwid) {
        return NextResponse.json({ error: 'Missing key or hwid' }, { status: 400 });
      }

      try {
        // Find blob by key (must match key-<discordId>.json)
        const { blobs } = await list({ prefix: 'Users/', token: BLOB_READ_WRITE_TOKEN });
        const blob = blobs.find(b => b.pathname.startsWith(`Users/${key}-`));
        if (!blob) {
          return NextResponse.json({ error: 'Invalid key' }, { status: 401 });
        }

        const userData = JSON.parse(await (await download(blob.pathname, { access: 'public', token: BLOB_READ_WRITE_TOKEN })).text());

        // If hwid is empty in blob and request provides hwid, update it
        if (userData.hwid === '' && hwid) {
          userData.hwid = hwid;
          await put(blob.pathname, JSON.stringify(userData), {
            access: 'public',
            token: BLOB_READ_WRITE_TOKEN,
          });
          console.log(`Updated HWID for key ${key} to ${hwid}`);
        } else if (userData.hwid !== hwid) {
          return NextResponse.json({ error: 'Invalid HWID' }, { status: 401 });
        }

        if (userData.endTime < Math.floor(Date.now() / 1000)) {
          return NextResponse.json({ error: 'Key expired' }, { status: 401 });
        }

        return NextResponse.json({ success: true, user: userData });
      } catch (error) {
        console.error(`Error in /auth/v1 for key ${key}:`, error.message);
        return NextResponse.json({ error: 'Invalid key' }, { status: 401 });
      }
    }

    // /dAuth/v1/?ID=
    if (pathname.startsWith('/dAuth/v1')) {
      console.log('Handling /dAuth/v1');
      const discordId = searchParams.get('ID');

      if (!discordId) {
        return NextResponse.json({ error: 'Missing Discord ID' }, { status: 400 });
      }

      const { blobs } = await list({ prefix: 'Users/', token: BLOB_READ_WRITE_TOKEN });
      for (const blob of blobs) {
        if (blob.pathname.endsWith(`-${discordId}.json`)) {
          try {
            const userData = JSON.parse(await (await download(blob.pathname, { access: 'public', token: BLOB_READ_WRITE_TOKEN })).text());
            if (userData.endTime < Math.floor(Date.now() / 1000)) {
              return NextResponse.json({ error: 'Key expired' }, { status: 401 });
            }
            return NextResponse.json({ success: true, user: userData });
          } catch (error) {
            console.error(`Error reading blob ${blob.pathname} in /dAuth/v1:`, error.message);
            continue; // Skip invalid blobs
          }
        }
      }

      return NextResponse.json({ error: 'No user found with this Discord ID' }, { status: 404 });
    }

    // /files/v1/?file=
    if (pathname.startsWith('/files/v1')) {
      console.log('Handling /files/v1');
      const fileName = searchParams.get('file')?.toLowerCase();
      const key = request.headers.get('authorization')?.split(' ')[1];

      if (!fileName || !key) {
        return NextResponse.json({ error: 'Missing file name or key' }, { status: 400 });
      }

      try {
        const { blobs } = await list({ prefix: 'Users/', token: BLOB_READ_WRITE_TOKEN });
        const blob = blobs.find(b => b.pathname.startsWith(`Users/${key}-`));
        if (!blob) {
          return NextResponse.json({ error: 'Invalid key' }, { status: 401 });
        }

        const userData = JSON.parse(await (await download(blob.pathname, { access: 'public', token: BLOB_READ_WRITE_TOKEN })).text());
        
        if (userData.endTime < Math.floor(Date.now() / 1000)) {
          return NextResponse.json({ error: 'Key expired' }, { status: 401 });
        }
      } catch (error) {
        console.error(`Error in /files/v1 for key ${key}:`, error.message);
        return NextResponse.json({ error: 'Invalid key' }, { status: 401 });
      }

      const scripts = await get('scripts');
      const script = Object.keys(scripts).find(
        (key) => key.toLowerCase() === fileName
      );

      if (!script) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }

      return NextResponse.json(scripts[script]);
    }

    // /manage/v1/?ID=&action=&value=
    if (pathname.startsWith('/manage/v1')) {
      console.log('Handling /manage/v1');
      const discordId = searchParams.get('ID');
      const action = searchParams.get('action');
      const value = searchParams.get('value');

      if (!discordId || !action) {
        return NextResponse.json({ error: 'Missing Discord ID or action' }, { status: 400 });
      }

      let userKey = null;
      let userData = null;
      const { blobs } = await list({ prefix: 'Users/', token: BLOB_READ_WRITE_TOKEN });
      for (const blob of blobs) {
        if (blob.pathname.endsWith(`-${discordId}.json`)) {
          try {
            userData = JSON.parse(await (await download(blob.pathname, { access: 'public', token: BLOB_READ_WRITE_TOKEN })).text());
            userKey = blob.pathname.replace('Users/', '').replace(`-${discordId}.json`, '');
            break;
          } catch (error) {
            console.error(`Error reading blob ${blob.pathname} in /manage/v1:`, error.message);
            continue; // Skip invalid blobs
          }
        }
      }

      if (!userKey || !userData) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (action === 'setKeyTime' && value) {
        const durationSeconds = parseTimeToSeconds(value);
        if (durationSeconds === null) {
          return NextResponse.json({ error: 'Invalid time format' }, { status: 400 });
        }
        userData.endTime = Math.floor(Date.now() / 1000) + durationSeconds;
      } else if (action === 'resetHwid' && value) {
        userData.hwid = value;
      } else {
        return NextResponse.json({ error: 'Invalid action or value' }, { status: 400 });
      }

      await put(`Users/${userKey}-${discordId}.json`, JSON.stringify(userData), {
        access: 'public',
        token: BLOB_READ_WRITE_TOKEN,
      });

      return NextResponse.json({ success:aternity, user: userData });
    }

    // /register/v1/?ID=&time=
    if (pathname.startsWith('/register/v1')) {
      console.log('Handling /register/v1');
      const discordId = searchParams.get('ID');
      const timeStr = searchParams.get('time');

      if (!discordId || !timeStr) {
        return NextResponse.json({ error: 'Missing Discord ID or time' }, { status: 400 });
      }

      const durationSeconds = parseTimeToSeconds(timeStr);
      if (durationSeconds === null) {
        return NextResponse.json({ error: 'Invalid time format. Use format like 100s, 100m, 100h, 100d, 100mo, or 100yr' }, { status: 400 });
      }

      const { blobs } = await list({ prefix: 'Users/', token: BLOB_READ_WRITE_TOKEN });
      for (const blob of blobs) {
        if (blob.pathname.endsWith(`-${discordId}.json`)) {
          return NextResponse.json({ error: 'User already registered' }, { status: 400 });
        }
      }

      const newKey = generateKey();
      const createTime = Math.floor(Date.now() / 1000);
      const user = {
        key: newKey,
        hwid: '',
        discordId,
        createTime,
        endTime: createTime + durationSeconds,
      };

      await put(`Users/${newKey}-${discordId}.json`, JSON.stringify(user), {
        access: 'public',
        token: BLOB_READ_WRITE_TOKEN,
      });

      return NextResponse.json({ success: true, key: newKey, user });
    }

    console.log(`No matching route for ${pathname}, passing to Next.js`);
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const config = {
  matcher: [
    '/auth/v1(.*)',
    '/dAuth/v1(.*)',
    '/files/v1(.*)',
    '/manage/v1(.*)',
    '/register/v1(.*)',
  ],
};
