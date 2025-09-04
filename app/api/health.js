// Health check API route
// Place this file at: pages/api/health.js or app/api/health/route.js (depending on your Next.js version)

export default async function handler(req, res) {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: '2.0.0',
      services: {
        database: await checkBlobStorage(),
        discord: await checkDiscordBot(),
        webhook: await checkWebhook()
      }
    };

    res.status(200).json(healthData);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Helper functions for service checks
async function checkBlobStorage() {
  try {
    const { list } = await import('@vercel/blob');
    await list({ token: process.env.VERCEL_BLOB_RW_TOKEN, limit: 1 });
    return { status: 'connected', service: 'Vercel Blob Storage' };
  } catch (error) {
    return { status: 'error', service: 'Vercel Blob Storage', error: error.message };
  }
}

async function checkDiscordBot() {
  try {
    if (!process.env.DISCORD_BOT_TOKEN) {
      return { status: 'not_configured', service: 'Discord Bot' };
    }
    return { status: 'configured', service: 'Discord Bot' };
  } catch (error) {
    return { status: 'error', service: 'Discord Bot', error: error.message };
  }
}

async function checkWebhook() {
  try {
    if (!process.env.DISCORD_WEBHOOK_URL) {
      return { status: 'not_configured', service: 'Discord Webhook' };
    }
    return { status: 'configured', service: 'Discord Webhook' };
  } catch (error) {
    return { status: 'error', service: 'Discord Webhook', error: error.message };
  }
}
