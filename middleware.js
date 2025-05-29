import { NextResponse } from 'next/server';

// Middleware to handle /files/* requests
export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Check if request is for /files/ScriptName
  if (pathname.startsWith('/files/')) {
    const scriptName = pathname.split('/files/')[1];
    const authHeader = request.headers.get('authorization');

    // Validate authorization header
    if (authHeader !== 'UserMode-2d93n2002n8') {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid authentication header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Redirect to static file in public/RoHub/Scripts/
    const filePath = `/RoHub/Scripts/${scriptName}`;
    try {
      // Note: Vercel can't directly read filesystem in middleware.
      // We assume files are in public/RoHub/Scripts/ and rewrite the request.
      // Logs are handled client-side in page.jsx via fetch.
      const url = new URL(filePath, request.nextUrl.origin);
      return NextResponse.rewrite(url);
    } catch (error) {
      return new Response(JSON.stringify({ error: `Script "${scriptName}" not found` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Pass through other requests
  return NextResponse.next();
}

// Configure matcher to target /files/* routes
export const config = {
  matcher: '/files/:path*',
};