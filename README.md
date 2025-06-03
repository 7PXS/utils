# 7Px Dashboard

A Next.js dashboard for managing Lua scripts, user authentication, and hardware ID (HWID) resets, integrated with Vercel Edge Config and Blob storage.

## Features
- **Script Management**: Displays script details (`Lang`, `Version`) for "Lone Survival" and "Fallen" via `/scripts-list` and `/files/v1`.
- **User Authentication**: Login/register users with Discord ID and username, storing data in Vercel Blob.
- **HWID Reset**: Users can reset their HWID (if set) twice daily via a button.
- **Logging**: Plain text webhook logs with `[ERROR]`, `[SUCCESS]`, `[WARN]` prefixes and timestamps.

## Setup
1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd 7px-dashboard
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Set Environment Variables**:
   - Go to Vercel dashboard > Project > Settings > Environment Variables.
   - Add:
     - `BLOB_READ_WRITE_TOKEN`: `vercel_blob_rw_utjs6NoOOU3BdeXE_0pNKDMi9ecw5Gh6ls3KB2OSOb2bKxs`
     - `EDGE_CONFIG_URL`: `https://edge-config.vercel.com/ecfg_i4emvlr8if7efdth14-a5b8qu0-b26?token=b26cdde-a12b-39a4-fa98-cef8777d3b26`
     - `WEBHOOK_URL`: Your Discord webhook URL (e.g., `https://discord.com/api/webhooks/...`)
4. **Deploy to Vercel**:
   ```bash
   vercel
   ```

## Endpoints
- **/scripts-list**: Returns script names (`["Lone Survival", "Fallen"]`). Requires `Authorization: UserMode-2d93n2002n8`.
- **/files/v1?file=<name>**: Returns script details (`Lang`, `Version`, `Code`). Requires authorization.
- **/login/v1?ID=<discordId>&username=<username>**: Authenticates users.
- **/register/v1?ID=<discordId>&time=<duration>&username=<username>**: Registers users.
- **/reset-hwid/v1**: Resets user HWID (max 2/day). Requires Discord ID in `Authorization` header.
- **/auth/v1**, **/dAuth/v1**, **/manage/v1**, **/users/v1**: Additional user management endpoints.

## Webhook Logging
Logs are sent to the configured Discord webhook in plain text:
```
[ERROR] /scripts-list: Invalid authorization header
-# 2025-06-03T04:24:00.000Z
[SUCCESS] /scripts-list: Retrieved 2 scripts
-# 2025-06-03T04:24:01.000Z
[WARN] Environment variables missing
-# 2025-06-03T04:24:02.000Z
```

## Development
- **Run Locally**:
  ```bash
  npm run dev
  ```
- **Test Endpoints**:
  ```bash
  curl -H "Authorization: UserMode-2d93n2002n8" https://your-domain.vercel.app/scripts-list
  ```

## Notes
- Ensure the Discord webhook URL is valid and not rate-limited.
- HWID resets are limited to 2 per user per day, stored in Vercel Blob.
- Script content (`Code`) is not fetched by the dashboard to optimize performance.
