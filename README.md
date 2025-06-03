# Whitelisting Service

This document explains how to use the whitelisting service, including user registration, authentication, and admin functions for managing keys and user access. The service uses Vercel Blob Storage for persistent user data and supports Discord ID-based user management, key generation, and time-based access control.

## Overview

This middleware provides a robust whitelisting system inspired by services like Luarmor, designed for Discord bot integration and user key management. It supports:

- Random key generation (e.g., `2sfm82n-0jn3-2uhfh`)
- Key types: `free` and `paid`
- User tags: `Customer` (for paid) and `None` (for free)
- Time-based key expiration using UNIX timestamps
- Authentication via Discord ID, key, and optional HWID
- Admin endpoint for updating key expiration

## Endpoints

### 1. Register a User

**Endpoint:** `/register`  
**Purpose:** Register a new user with a Discord ID, username, optional time duration, and key type.

#### Parameters:
- `discordID`: The user's Discord ID (required)
- `username`: The user's username (required)
- `time`: Duration for key validity (e.g., `100s`, `100m`, `100h`, `100d`, `100mo`, `100yr`) (optional, defaults to 30 days)
- `keytype`: Type of key (`free` or `paid`) (optional, defaults to `free`)

#### Time Format:
- `s`: seconds
- `m`: minutes
- `h`: hours
- `d`: days
- `mo`: months (approximated as 30 days)
- `yr`: years (approximated as 365 days)

**Example:** `100d = 100 days`

#### Response:
- **Success:** `{ success: true, message: "User registered successfully", key: "generated-key", endTime: unix-timestamp }`
- **Error:** `{ error: "description" }` (e.g., missing parameters, user already exists)

#### Example Request:
```
/register?discordID=123456789&username=JohnDoe&time=30d&keytype=paid
```

#### Example Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "key": "2sfm82n-0jn3-2uhfh",
  "endTime": 1698777600
}
```

---

### 2. Authenticate a User

**Endpoint:** `/auth`  
**Purpose:** Authenticate a user via Discord ID, optional key, and optional HWID.

#### Parameters:
- `ID`: The user's Discord ID (required)
- `key`: The user's key (optional, but required if user has a key)
- `hwid`: Hardware ID for additional verification (optional)

#### Behavior:
- If no HWID is set for the user and one is provided, it links the HWID to the user.
- Checks if the key has expired based on the EndTime (UNIX timestamp).

#### Response:
- **Success:** `{ success: true, keytype: "free|paid", User: "Customer|None", EndTime: unix-timestamp }`
- **Error:** `{ error: "description" }` (e.g., invalid key, invalid HWID, user not found, key expired)

#### Example Request:
```
/auth?ID=123456789&key=2sfm82n-0jn3-2uhfh&hwid=abc123
```

#### Example Response:
```json
{
  "success": true,
  "keytype": "paid",
  "User": "Customer",
  "EndTime": 1698777600
}
```

---

### 3. Admin: Update Key Expiration

**Endpoint:** `/auth/admin`  
**Purpose:** Update the end time of a user's key (admin only).

#### Parameters:
- `user`: The user's Discord ID (required)
- `time`: Additional time to add (e.g., `100s`, `100m`, `100h`, `100d`, `100mo`, `100yr`) (required)

#### Headers:
- `Authorization`: Must be `UserMode-2d93n2002n8` for access

#### Behavior:
- Calculates new end time by adding the specified duration to the existing EndTime.
- Ensures the new end time is not in the past.

#### Response:
- **Success:** `{ success: true, message: "User end time updated", newEndTime: unix-timestamp }`
- **Error:** `{ error: "description" }` (e.g., unauthorized, user not found, invalid time)

#### Example Request:
```
/auth/admin?user=123456789&time=15d
```

#### Headers:
```
Authorization: UserMode-2d93n2002n8
```

#### Example Response:
```json
{
  "success": true,
  "message": "User end time updated",
  "newEndTime": 1698777600
}
```

---

### 4. List Users

**Endpoint:** `/users-list`  
**Purpose:** List all registered Discord IDs (admin only).

#### Headers:
- `Authorization`: Must be `UserMode-2d93n2002n8` for access

#### Response:
- **Success:** Array of Discord IDs (e.g., `["123456789", "987654321"]`)
- **Error:** `{ error: "description" }` (e.g., unauthorized, fetch failure)

#### Example Request:
```
/users-list
```

#### Headers:
```
Authorization: UserMode-2d93n2002n8
```

#### Example Response:
```json
["123456789", "987654321"]
```

---

### 5. Fetch Script

**Endpoint:** `/files`  
**Purpose:** Retrieve a script by filename (admin only).

#### Parameters:
- `filename`: Name of the script to fetch (required)

#### Headers:
- `Authorization`: Must be `UserMode-2d93n2002n8` for access

#### Response:
- **Success:** `{ content: "script-url" }`
- **Error:** `{ error: "description" }` (e.g., unauthorized, script not found)

#### Example Request:
```
/files?filename=scriptname
```

#### Headers:
```
Authorization: UserMode-2d93n2002n8
```

#### Example Response:
```json
{
  "content": "https://example.com/scriptname/"
}
```

---

### 6. List Scripts

**Endpoint:** `/scripts-list`  
**Purpose:** List all available script names (admin only).

#### Headers:
- `Authorization`: Must be `UserMode-2d93n2002n8` for access

#### Response:
- **Success:** Array of script names (e.g., `["script1", "script2"]`)
- **Error:** `{ error: "description" }` (e.g., unauthorized, fetch failure)

#### Example Request:
```
/scripts-list
```

#### Headers:
```
Authorization: UserMode-2d93n2002n8
```

#### Example Response:
```json
["script1", "script2"]
```

---

### 7. Scripts Metadata

**Endpoint:** `/scripts-metadata`  
**Purpose:** Retrieve metadata for all scripts (admin only).

#### Headers:
- `Authorization`: Must be `UserMode-2d93n2002n8` for access

#### Response:
- **Success:** `{ scripts: { script1: { Code: "url" }, script2: { Code: "url" } } }`
- **Error:** `{ error: "description" }` (e.g., unauthorized, fetch failure)

#### Example Request:
```
/scripts-metadata
```

#### Headers:
```
Authorization: UserMode-2d93n2002n8
```

#### Example Response:
```json
{
  "scripts": {
    "script1": {
      "Code": "https://example.com/script1/"
    }
  }
}
```

---

## Key Features

- **Key Generation:** Random keys in the format `2sfm82n-0jn3-2uhfh` are generated during registration.
- **Key Types:** `free` (default) or `paid`, with user tags `None` or `Customer` respectively.
- **Time Management:** Uses UNIX timestamps for creation and end dates. Default key validity is 30 days if no time is specified.
- **HWID Linking:** Optional HWID can be linked during authentication if not already set.
- **Expiration Check:** Authentication fails if the key's end time is in the past.
- **Admin Control:** Secure endpoints for managing users and scripts, protected by an authorization header.

## Usage Notes

- All time-related values (e.g., `EndTime`, `CreatedAt`) are UNIX timestamps (seconds since epoch).
- Admin endpoints require the `Authorization` header: `UserMode-2d93n2002n8`.
- Ensure Vercel Blob Storage and Edge Config are properly set up in your Vercel project.
- The service prevents directory traversal in the `/files` endpoint for security.
- Errors are returned with appropriate HTTP status codes (400, 401, 404, 500, etc.).

## Setup

### Dependencies
Ensure `next/server`, `@vercel/edge-config`, and `@vercel/blob` are installed in your Next.js project.

### Configuration
- Set up Vercel Blob Storage for user data (prefix: `Users/`).
- Configure Edge Config for script storage.

### Deployment
Deploy the `middleware.js` file to your Next.js app, ensuring the matcher config routes requests correctly.

## Example Workflow

1. **Register:** `/register?discordID=123456789&username=JohnDoe&time=30d&keytype=paid`
   - Get a key like `2sfm82n-0jn3-2uhfh` and an end time.

2. **Authenticate:** `/auth?ID=123456789&key=2sfm82n-0jn3-2uhfh&hwid=abc123`
   - Verify key, link HWID, and check expiration.

3. **Admin Update:** `/auth/admin?user=123456789&time=15d` (with auth header)
   - Extend the key's end time by 15 days.

4. **List Users:** `/users-list` (with auth header)
   - View all registered Discord IDs.
