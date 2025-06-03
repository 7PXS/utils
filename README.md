# Whitelisting Service

This document explains how to use the whitelisting service, including user registration, authentication, and admin functions for managing keys and user access. The service uses Vercel Blob Storage for persistent user data and supports Discord ID-based user management, key generation, and time-based access control.

## Overview

This middleware provides a robust whitelisting system inspired by services like Luarmor, designed for Discord bot integration and user key management. It supports:

- Random key generation (e.g., `2sfm82n-0jn3-2uhfh`)
- User authentication via key and optional HWID
- Time-based key expiration using UNIX timestamps
- Management of user data and HWID resets
- Secure file access and user listing for admins

## Endpoints

### 1. Register a User

**Endpoint:** `/register/v1`  
**Purpose:** Register a new user with a Discord ID and time duration for key validity.

#### Parameters:
- `ID`: The user's Discord ID (required)
- `time`: Duration for key validity (e.g., `100s`, `100m`, `100h`, `100d`, `100mo`, `100yr`) (required)

#### Time Format:
- `s`: seconds
- `m`: minutes
- `h`: hours
- `d`: days
- `mo`: months (approximated as 30 days)
- `yr`: years (approximated as 365 days)

**Example:** `100d = 100 days`

#### Response:
- **Success:** `{ success: true, key: "generated-key", discordId: "discord-id", createTime: unix-timestamp, endTime: unix-timestamp, hwid: "" }`
- **Error:** `{ error: "description" }` (e.g., missing parameters, user already exists, invalid time format)

#### Example Request:
```
/register/v1?ID=123456789&time=30d
```

#### Example Response:
```json
{
  "success": true,
  "key": "2sfm82n-0jn3-2uhfh",
  "discordId": "123456789",
  "createTime": 1735689600,
  "endTime": 1738281600,
  "hwid": ""
}
```

---

### 2. Authenticate a User by Key

**Endpoint:** `/auth/v1`  
**Purpose:** Authenticate a user via key and optional HWID.

#### Parameters:
- `key`: The user's key (required)
- `hwid`: Hardware ID for additional verification (required)

#### Behavior:
- If no HWID is set for the user and one is provided, it links the HWID to the user.
- Checks if the key has expired based on the `endTime` (UNIX timestamp).

#### Response:
- **Success:** `{ success: true, key: "key", discordId: "discord-id", createTime: unix-timestamp, endTime: unix-timestamp, hwid: "hwid" }`
- **Error:** `{ error: "description" }` (e.g., invalid key, invalid HWID, key expired)

#### Example Request:
```
/auth/v1?key=2sfm82n-0jn3-2uhfh&hwid=abc123
```

#### Example Response:
```json
{
  "success": true,
  "key": "2sfm82n-0jn3-2uhfh",
  "discordId": "123456789",
  "createTime": 1735689600,
  "endTime": 1738281600,
  "hwid": "abc123"
}
```

---

### 3. Authenticate a User by Discord ID

**Endpoint:** `/dAuth/v1`  
**Purpose:** Authenticate a user via Discord ID.

#### Parameters:
- `ID`: The user's Discord ID (required)

#### Behavior:
- Searches for a user with the provided Discord ID and checks if their key has expired.

#### Response:
- **Success:** `{ success: true, key: "key", discordId: "discord-id", createTime: unix-timestamp, endTime: unix-timestamp, hwid: "hwid" }`
- **Error:** `{ error: "description" }` (e.g., user not found, key expired)

#### Example Request:
```
/dAuth/v1?ID=123456789
```

#### Example Response:
```json
{
  "success": true,
  "key": "2sfm82n-0jn3-2uhfh",
  "discordId": "123456789",
  "createTime": 1735689600,
  "endTime": 1738281600,
  "hwid": "abc123"
}
```

---

### 4. Manage User Data

**Endpoint:** `/manage/v1`  
**Purpose:** Update a user's key expiration time or reset their HWID (admin only).

#### Parameters:
- `ID`: The user's Discord ID (required)
- `action`: Action to perform (`setKeyTime` or `resetHwid`) (required)
- `value`: Value for the action (time duration for `setKeyTime`, new HWID for `resetHwid`) (required)

#### Behavior:
- For `setKeyTime`, updates the key's end time by adding the specified duration.
- For `resetHwid`, sets a new HWID for the user.
- Requires proper authorization via the middleware logic.

#### Response:
- **Success:** `{ success: true, key: "key", discordId: "discord-id", createTime: unix-timestamp, endTime: unix-timestamp, hwid: "hwid" }`
- **Error:** `{ error: "description" }` (e.g., user not found, invalid action, invalid time format)

#### Example Request:
```
/manage/v1?ID=123456789&action=setKeyTime&value=15d
```

#### Example Response:
```json
{
  "success": true,
  "key": "2sfm82n-0jn3-2uhfh",
  "discordId": "123456789",
  "createTime": 1735689600,
  "endTime": 1739577600,
  "hwid": "abc123"
}
```

---

### 5. Fetch Script

**Endpoint:** `/files/v1`  
**Purpose:** Retrieve a script by filename (admin only).

#### Parameters:
- `file`: Name of the script to fetch (required)

#### Headers:
- `Authorization`: Required for access (e.g., `Bearer <key>`)

#### Behavior:
- Verifies the provided key and checks if it has expired.
- Returns the script's metadata if the file exists.

#### Response:
- **Success:** `{ Code: "script-url" }`
- **Error:** `{ error: "description" }` (e.g., invalid key, key expired, file not found)

#### Example Request:
```
/files/v1?file=scriptname
```

#### Headers:
```
Authorization: Bearer 2sfm82n-0jn3-2uhfh
```

#### Example Response:
```json
{
  "Code": "https://example.com/scriptname/"
}
```

---

### 6. List Users

**Endpoint:** `/users/v1`  
**Purpose:** List all registered users (admin only).

#### Response:
- **Success:** `{ success: true, users: [{ key: "key", discordId: "discord-id", createTime: unix-timestamp, endTime: unix-timestamp, hwid: "hwid" }, ...] }`
- **Error:** `{ error: "description" }` (e.g., fetch failure)

#### Example Request:
```
/users/v1
```

#### Example Response:
```json
{
  "success": true,
  "users": [
    {
      "key": "2sfm82n-0jn3-2uhfh",
      "discordId": "123456789",
      "createTime": 1735689600,
      "endTime": 1738281600,
      "hwid": "abc123"
    },
    {
      "key": "8xkm45p-7mn2-9zqwe",
      "discordId": "987654321",
      "createTime": 1735689600,
      "endTime": 1738281600,
      "hwid": "xyz789"
    }
  ]
}
```

---

## Key Features

- **Key Generation:** Random 14-character keys are generated during registration.
- **Time Management:** Uses UNIX timestamps for creation and end dates. Keys expire based on the specified duration.
- **HWID Linking:** Optional HWID can be linked during authentication or reset via the `/manage/v1` endpoint.
- **Expiration Check:** Authentication fails if the key's end time is in the past.
- **Admin Control:** Secure endpoints for managing users and scripts, protected by authorization checks.
- **Logging:** Requests and errors are logged to a Discord webhook for monitoring.

## Usage Notes

- All time-related values (e.g., `createTime`, `endTime`) are UNIX timestamps (seconds since epoch).
- Admin endpoints require proper authorization as defined in the middleware.
- Ensure Vercel Blob Storage and Edge Config are properly set up in your Vercel project.
- The service prevents directory traversal in the `/files/v1` endpoint for security.
- Errors are returned with appropriate HTTP status codes (400, 401, 404, 500, etc.).

## Setup

### Dependencies
Ensure `next/server`, `@vercel/edge-config`, and `@vercel/blob` are installed in your Next.js project.

### Configuration
- Set up Vercel Blob Storage for user data (prefix: `Users/`).
- Configure Edge Config for script storage.
- Define environment variables:
  - `BLOB_READ_WRITE_TOKEN`: Token for Vercel Blob Storage.
  - `EDGE_CONFIG_URL`: URL for Vercel Edge Config.
  - `WEBHOOK_URL`: Discord webhook URL for logging.

### Deployment
Deploy the `middleware.js` file to your Next.js app, ensuring the matcher config routes requests correctly:
```javascript
export const config = {
  matcher: [
    '/auth/v1(.*)',
    '/dAuth/v1(.*)',
    '/files/v1(.*)',
    '/manage/v1(.*)',
    '/register/v1(.*)',
    '/users/v1(.*)',
  ],
};
```

## Example Workflow

1. **Register:** `/register/v1?ID=123456789&time=30d`
   - Get a key like `2sfm82n-0jn3-2uhfh` and an end time.

2. **Authenticate by Key:** `/auth/v1?key=2sfm82n-0jn3-2uhfh&hwid=abc123`
   - Verify key, link HWID, and check expiration.

3. **Authenticate by Discord ID:** `/dAuth/v1?ID=123456789`
   - Verify user and check key expiration.

4. **Manage User:** `/manage/v1?ID=123456789&action=setKeyTime&value=15d`
   - Extend the key's end time by 15 days.

5. **List Users:** `/users/v1`
   - View all registered users and their details.

6. **Fetch Script:** `/files/v1?file=scriptname` (with auth header)
   - Retrieve a script's URL if authorized.
