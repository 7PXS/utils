import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { get } from '@vercel/edge-config';

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

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
    if (filename.includes('..') || filename.includes('/')) {
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

      // Return script content
      return new NextResponse(scripts[filename].Code, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
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

  // Pass through other requests
  return NextResponse.next();
}

export const config = {
  matcher: ['/files', '/scripts-list'],
};
