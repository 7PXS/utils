import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';
import { put, get as getBlob, list } from '@vercel/blob';

const BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_utjs6NoOOU3BdeXE_0pNKDMi9ecw5Gh6ls3KB2OSOb2/5';
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

// Middleware function
export async function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;

  try {
    // /auth/v1/?key=&hwid=
    if (pathname.startsWith('/auth/v1/')) {
      const key = searchParams.get('key');
      const hwid = searchParams.get('hwid');

      if (!key || !hwid) {
        return NextResponse.json({ error: 'Missing key or hwid' }, { status: 400 });
      }

      try {
        const blob = await getBlob(`Users/${key}.json`, { access: 'public', token: BLOB_READ_WRITE_TOKEN });
        const userData = JSON.parse(await blob.text());

        if (userData.hwid !== hwid) {
          return NextResponse.json({ error: 'Invalid HWID' }, { status: 401 });
        }

        if (userData.endTime < Math.floor(Date.now() / 1000)) {
          return NextResponse.json({ error: 'Key expired' }, { status: 401 });
        }

        return NextResponse.json({ success: true, user: userData });
      } catch (error) {
        return NextResponse.json({ error: 'Invalid key' }, { status: 401 });
      }
    }

    // /dAuth/v1/?ID=
    if (pathname.startsWith('/dAuth/v1/')) {
      const discordId = searchParams.get('ID');

      if (!discordId) {
        return NextResponse.json({ error: 'Missing Discord ID' }, { status: 400 });
      }

      // Search for user with matching Discord ID
      const { blobs } = await list({ prefix: 'Users/', token: BLOB_READ_WRITE_TOKEN });
      for (const blob of blobs) {
        const userData = JSON.parse(await (await getBlob(blob.pathname, { access: 'public', token: BLOB_READ_WRITE_TOKEN })).text());
        
        if (userData.discordId === discordId) {
          if (userData.endTime < Math.floor(Date.now() / 1000)) {
            return NextResponse.json({ error: 'Key expired' }, { status: 401 });
          }
          return NextResponse.json({ success: true, user: userData });
        }
      }

      return NextResponse.json({ error: 'No user found with this Discord ID' }, { status: 404 });
    }

    // /files/v1/?file=
    if (pathname.startsWith('/files/v1/')) {
      const fileName = searchParams.get('file')?.toLowerCase();
      const key = request.headers.get('authorization')?.split(' ')[1];

      if (!fileName || !key) {
        return NextResponse.json({ error: 'Missing file name or key' }, { status: 400 });
      }

      // Verify user key
      try {
        const userData = JSON.parse(await (await getBlob(`Users/${key}.json`, { access: 'public', token: BLOB_READ_WRITE_TOKEN })).text());
        
        if (userData.endTime < Math.floor(Date.now() / 1000)) {
          return NextResponse.json({ error: 'Key expired' }, { status: 401 });
        }
      } catch (error) {
        return NextResponse.json({ error: 'Invalid key' }, { status: 401 });
      }

      // Get script from Edge Config
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
    if (pathname.startsWith('/manage/v1/')) {
      const discordId = searchParams.get('ID');
      const action = searchParams.get('action');
      const value = searchParams.get('value');

      if (!discordId || !action) {
        return NextResponse.json({ error: 'Missing Discord ID or action' }, { status: 400 });
      }

      // Find user
      let userKey = null;
      let userData = null;
      const { blobs } = await list({ prefix: 'Users/', token: BLOB_READ_WRITE_TOKEN });
      for (const blob of blobs) {
        const data = JSON.parse(await (await getBlob(blob.pathname, { access: 'public', token: BLOB_READ_WRITE_TOKEN })).text());
        if (data.discordId === discordId) {
          userKey = blob.pathname.replace('Users/', '').replace('.json', '');
          userData = data;
          break;
        }
      }

      if (!userKey || !userData) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (action === 'setKeyTime' && value) {
        userData.endTime = parseInt(value);
      } else if (action === 'resetHwid' && value) {
        userData.hwid = value;
      } else {
        return NextResponse.json({ error: 'Invalid action or value' }, { status: 400 });
      }

      // Update user data
      await put(`Users/${userKey}.json`, JSON.stringify(userData), {
        access: 'public',
        token: BLOB_READ_WRITE_TOKEN,
      });

      return NextResponse.json({ success: true, user: userData });
    }

    // /register/v1/?ID=&time=
    if (pathname.startsWith('/register/v1/')) {
      const discordId = searchParams.get('ID');
      const endTime = parseInt(searchParams.get('time') || '0');

      if (!discordId || !endTime) {
        return NextResponse.json({ error: 'Missing Discord ID or time' }, { status: 400 });
      }

      // Check if user already exists
      const { blobs } = await list({ prefix: 'Users/', token: BLOB_READ_WRITE_TOKEN });
      for (const blob of blobs) {
        const data = JSON.parse(await (await getBlob(blob.pathname, { access: 'public', token: BLOB_READ_WRITE_TOKEN })).text());
        if (data.discordId === discordId) {
          return NextResponse.json({ error: 'User already registered' }, { status: 400 });
        }
      }

      const newKey = generateKey();
      const user = {
        key: newKey,
        hwid: '',
        discordId,
        createTime: Math.floor(Date.now() / 1000),
        endTime,
      };

      await put(`Users/${newKey}.json`, JSON.stringify(user), {
        access: 'public',
        token: BLOB_READ_WRITE_TOKEN,
      });

      return NextResponse.json({ success: true, key: newKey, user });
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const config = {
  matcher: ['/auth/v1/:path*', '/dAuth/v1/:path*', '/files/v1/:path*', '/manage/v1/:path*', '/register/v1/:path*'],
};
