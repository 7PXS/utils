import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

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
      // Construct file path
      const filePath = path.join(process.cwd(), 'public', 'RoHub', 'Scripts', filename);
      
      // Check if file exists
      await fs.access(filePath);

      // Read file content
      const content = await fs.readFile(filePath, 'utf-8');

      // Return file content as raw text
      return new NextResponse(content, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    } catch (error) {
      return new NextResponse(
        JSON.stringify({ error: `Script "${filename}" not found` }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // Pass through other requests
  return NextResponse.next();
}

// Configure matcher to target /files route
export const config = {
  matcher: '/files',
};
