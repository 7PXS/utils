import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== 'UserMode-2d93n2002n8') {
    return NextResponse.json({ error: 'Unauthorized: Invalid authentication header' }, { status: 401 });
  }

  try {
    const scriptsDir = join(process.cwd(), 'public', 'RoHub', 'Scripts');
    const files = await readdir(scriptsDir);
    // Filter for common script extensions (optional)
    const scriptFiles = files.filter((file) =>
      /\.(js|ts|py|lua|rb|php|java|cs|cpp|c|go|rs|sh|sql|html|css)$/i.test(file)
    );
    return NextResponse.json(scriptFiles, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list scripts' }, { status: 404 });
  }
}
