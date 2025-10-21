# Nebula Whitelisting Service

A comprehensive, secure whitelisting service with Discord integration, admin management dashboard, and user directory. Built with Next.js, Vercel Blob Storage, and Discord webhooks.

## 🌟 Features

### User Management
- **Random Key Generation**: Secure keys in format `2sfm82n-0jn3-2uhfh`
- **Key Types**: Free and paid subscriptions
- **Time-Based Expiration**: Unix timestamp-based key management
- **HWID Linking**: Hardware ID authentication for security
- **User Tags**: Automatic tagging (Customer/None)

### Admin Dashboard
- **Real-Time Notifications**: Track key expirations, new users, and system events
- **User Management**: Add time, reset HWID, view detailed user info
- **Statistics Dashboard**: Total users, active keys, expiring subscriptions
- **Search & Filter**: Quick user lookup by username or Discord ID
- **Dark/Light Mode**: Toggle between themes

### User Directory
- **Public User List**: All authenticated users can view community members
- **Privacy First**: Only usernames visible (no sensitive data)
- **Activity Status**: See active/inactive users
- **Join Date Tracking**: View when users joined
- **Responsive Design**: Works on all devices

### Security
- **Discord ID Authentication**: Secure login via Discord
- **Admin-Only Access**: Protected management endpoints
- **Rate Limiting**: Built-in API rate limits
- **Vercel Blob Storage**: Encrypted, persistent data storage

---

## 📁 Project Structure

```
nebula-service/
├── app/
│   ├── admin/
│   │   └── page.js          # Admin dashboard (admin only)
│   ├── users/
│   │   └── page.js          # Public user directory
│   ├── docs/
│   │   └── page.js          # API documentation
│   ├── profile/
│   │   └── page.js          # User profile page
│   ├── page.js              # Landing/login page
│   ├── layout.js            # Root layout
│   └── globals.css          # Global styles
├── middleware.js            # API routes & authentication
├── .env.local              # Environment variables
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- Vercel account (for Blob Storage)
- Discord Bot Token and Webhook URL

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd nebula-service
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file with the following:
   ```env
   # Vercel Blob Storage
   VERCEL_BLOB_RW_TOKEN=your_vercel_blob_token
   
   # Discord Configuration
   DISCORD_BOT_TOKEN=your_discord_bot_token
   DISCORD_WEBHOOK_URL=your_webhook_url
   ADMIN_DISCORD_ID=your_discord_id
   DISCORD_GUILD_ID=your_guild_id
   
   # Application URLs
   SITE_URL=http://localhost:3000
   BASE_URL=http://localhost:3000
   
   # Security
   API_SECRET=your_secure_api_key
   NODE_ENV=development
   
   # Rate Limiting
   RATE_LIMIT_MAX=100
   RATE_LIMIT_WINDOW=3600000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

---

## 📚 API Documentation

### Base URL
```
Production: https://your-domain.vercel.app
Development: http://localhost:3000
```

### Authentication Header
Most endpoints require:
```
User-Agent: Roblox/WinInet
```

Admin endpoints require:
```
Authorization: UserMode-2d93n2002n8
```

---

## 🔌 API Endpoints

### 1. **Health Check**
**GET** `/status`

Check if the API is running.

**Response:**
```json
{
  "success": true,
  "message": "API is running"
}
```

---

### 2. **Register User**
**GET** `/register/v1`

Register a new user with Discord ID and username.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `ID` | String | Yes | Discord ID |
| `username` | String | Yes | Username (3-20 chars, alphanumeric) |
| `time` | String | No | Duration (default: 30d) |

**Time Format:**
- `s` = seconds
- `m` = minutes
- `h` = hours
- `d` = days
- `mo` = months (30 days)
- `yr` = years (365 days)

**Example:**
```
GET /register/v1?ID=123456789&username=JohnDoe&time=30d
```

**Response:**
```json
{
  "success": true,
  "key": "AbCdEfGhIjKlMn",
  "createTime": 1625097600,
  "endTime": 1656633600
}
```

---

### 3. **Authenticate with Key**
**GET** `/auth/v1`

Authenticate a user with their key and HWID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `key` | String | Yes | User's key |
| `hwid` | String | Yes | Hardware ID |
| `gameId` | String | No | Optional game identifier |

**Example:**
```
GET /auth/v1?key=AbCdEfGhIjKlMn&hwid=1234567890
```

**Response:**
```json
{
  "success": true,
  "key": "AbCdEfGhIjKlMn",
  "hwid": "1234567890",
  "discordId": "123456789",
  "username": "JohnDoe",
  "createTime": 1625097600,
  "endTime": 1656633600,
  "Games": {
    "ValidGame": true,
    "Code": "https://example.com/script.js"
  }
}
```

---

### 4. **Authenticate with Discord ID**
**GET** `/dAuth/v1`

Authenticate using Discord ID only.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `ID` | String | Yes | Discord ID |
| `gameId` | String | No | Optional game identifier |

**Example:**
```
GET /dAuth/v1?ID=123456789
```

**Response:**
```json
{
  "success": true,
  "key": "AbCdEfGhIjKlMn",
  "hwid": "1234567890",
  "discordId": "123456789",
  "username": "JohnDoe",
  "createTime": 1625097600,
  "endTime": 1656633600
}
```

---

### 5. **Get Script File**
**GET** `/files/v1`

Retrieve a script by filename (requires valid key).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `file` | String | Yes | Script filename |
| `key` | String | Yes | User's key |

**Example:**
```
GET /files/v1?file=myscript&key=AbCdEfGhIjKlMn
```

**Response:**
```json
{
  "GameID": "12345",
  "Code": "https://example.com/script.js"
}
```

---

### 6. **List All Scripts**
**GET** `/scripts-list`

Get a list of all available scripts (admin only).

**Headers:**
```
Authorization: UserMode-2d93n2002n8
```

**Response:**
```json
{
  "success": true,
  "scripts": ["script1", "script2", "script3"]
}
```

---

### 7. **Admin: Update Key Time**
**GET** `/auth/admin`

Add time to a user's key expiration (admin only).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `user` | String | Yes | Discord ID |
| `time` | String | Yes | Time to add (e.g., "30d") |

**Headers:**
```
Authorization: UserMode-2d93n2002n8
```

**Example:**
```
GET /auth/admin?user=123456789&time=30d
```

**Response:**
```json
{
  "success": true,
  "message": "User end time updated",
  "newEndTime": 1698777600
}
```

---

### 8. **Login**
**GET** `/login/v1`

Authenticate for web dashboard.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `ID` | String | Yes | Discord ID |
| `username` | String | Yes | Username |

**Example:**
```
GET /login/v1?ID=123456789&username=JohnDoe
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful"
}
```

---

### 9. **List Users**
**GET** `/users/v1`

Get all registered Discord IDs (admin only).

**Headers:**
```
Authorization: UserMode-2d93n2002n8
```

**Response:**
```json
{
  "success": true,
  "users": ["123456789", "987654321"]
}
```

---

### 10. **Reset HWID**
**GET** `/reset-hwid/v1`

Reset a user's hardware ID.

**Headers:**
```
Authorization: Bearer {discordId}
```

**Response:**
```json
{
  "success": true,
  "message": "HWID reset successful"
}
```

---

## 🎨 User Interface

### Landing Page
- **Login/Register**: Discord ID + Username authentication
- **Animated Background**: Particle effects and gradients
- **Dark Mode**: Default dark theme with light mode toggle
- **Responsive**: Mobile-friendly design

### Admin Dashboard (`/admin`)
**Admin Only** - Requires Discord ID: `1272720391462457400`

Features:
- **Real-Time Stats**: Total users, active keys, expiring subscriptions
- **User Table**: Searchable, sortable user list
- **Notifications Panel**: Track key expirations and system events
- **Quick Actions**: Add time, reset HWID with one click
- **Dark/Light Mode**: Toggle theme preference

Notifications:
- 🔴 **High Priority**: Keys expiring in ≤3 days
- 🟡 **Medium Priority**: Keys expiring in ≤7 days
- 🟢 **Low Priority**: Success messages
- 🔵 **Info**: New users, requests

### User Directory (`/users`)
**All Authenticated Users** - View community members

Features:
- **User Cards**: Display username and join date
- **Activity Status**: Active/inactive indicator
- **Search**: Filter by username
- **Stats**: Total members, active users, new (24h)
- **Privacy**: Only usernames shown (no Discord IDs)

### Documentation (`/docs`)
- Full API reference
- Endpoint examples
- Response formats
- Authentication guide

### Profile (`/profile`)
- View user information
- Key details and expiration
- Reset HWID
- Add time to key (coming soon)

---

## 🔒 Security Features

### Authentication
- Discord ID-based login
- Hardware ID (HWID) binding
- Key-based access control
- Admin-only endpoints

### Data Protection
- Vercel Blob Storage encryption
- No plain-text passwords
- Secure environment variables
- Rate limiting on API calls

### Admin Controls
- Restricted Discord ID check
- Authorization headers required
- Audit logging via Discord webhooks
- Time-based key expiration

---

## 🎯 Usage Examples

### Register a New User
```javascript
// Using fetch
const response = await fetch(
  '/register/v1?ID=123456789&username=JohnDoe&time=30d',
  { headers: { 'User-Agent': 'Roblox/WinInet' } }
);
const data = await response.json();
console.log(data.key); // AbCdEfGhIjKlMn
```

### Authenticate User
```javascript
const response = await fetch(
  '/auth/v1?key=AbCdEfGhIjKlMn&hwid=1234567890',
  { headers: { 'User-Agent': 'Roblox/WinInet' } }
);
const data = await response.json();
if (data.success) {
  console.log('Authenticated!');
}
```

### Admin: Add Time to Key
```javascript
const response = await fetch(
  '/auth/admin?user=123456789&time=15d',
  { headers: { 'Authorization': 'UserMode-2d93n2002n8' } }
);
const data = await response.json();
console.log(data.newEndTime);
```

---

## 🌐 Deployment

### Vercel Deployment

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository

3. **Configure Environment Variables**
   - Add all variables from `.env.local`
   - Include Vercel Blob Storage token

4. **Deploy**
   - Vercel will automatically build and deploy
   - Your site will be live at `https://your-project.vercel.app`

5. **Set Admin Discord ID**
   - Update `ADMIN_DISCORD_ID` in environment variables
   - Redeploy for changes to take effect

---

## 🎨 Theme & Design

### Color Palette
- **Primary Purple**: `#a100ff` - Main brand color
- **Dark Purple**: `#7b00cc` - Hover states
- **Background Dark**: `#0a0a0f` - Main background
- **Card Dark**: `#0f0f1a` - Card backgrounds
- **Accent Colors**: Green (active), Red (expiring), Yellow (warning)

### Design Philosophy
- **Depth & Layers**: Glassmorphism effects with backdrop blur
- **Smooth Animations**: Hover effects, transitions, scale transforms
- **Purple Theme**: Consistent purple gradient throughout
- **Responsive**: Mobile-first design approach
- **Accessibility**: Proper contrast ratios, semantic HTML

### Inspiration
Design inspired by modern web applications with a focus on:
- Clean, minimal interfaces
- Smooth micro-interactions
- Clear information hierarchy
- Consistent spacing and typography

---

## 📊 Notification System

### Notification Types

#### 🔴 High Priority (Red)
- Keys expiring in ≤3 days
- Critical system errors
- Failed authentication attempts

#### 🟡 Medium Priority (Yellow)
- Keys expiring in ≤7 days
- HWID conflicts
- Rate limit warnings

#### 🟢 Low Priority (Green)
- Successful operations
- Time added to keys
- HWID resets

#### 🔵 Info (Blue)
- New user registrations
- General system notifications
- Requests and queries

### Notification Features
- **Auto-Refresh**: Updates every 30 seconds
- **Real-Time**: Instant notifications for actions
- **Persistent**: Last 20 notifications stored
- **Clickable**: Quick access to related users
- **Dismissable**: Close individual notifications

---

## 🛠️ Customization

### Changing Admin Discord ID
Edit `.env.local`:
```env
ADMIN_DISCORD_ID=your_discord_id_here
```

### Adding New Themes
Modify `globals.css`:
```css
:root {
  --primary: #a100ff;        /* Change primary color */
  --secondary: #1e1e1e;      /* Change secondary color */
  --background: #0a0a0f;     /* Change background */
}
```

### Customizing Key Format
Edit `middleware.js` - `generateKey()` function:
```javascript
function generateKey() {
  // Custom key format here
  return 'YOUR-CUSTOM-FORMAT';
}
```

### Adding New Notification Categories
Edit admin dashboard notification logic:
```javascript
const newNotifications = [
  {
    type: 'custom_type',
    severity: 'high|medium|low',
    message: 'Your message',
    timestamp: Date.now()
  }
];
```

---

## 🐛 Troubleshooting

### Common Issues

#### Authentication Failed
**Problem**: User can't log in
**Solution**: 
- Verify Discord ID is correct
- Check if user is registered
- Ensure `.env.local` has correct tokens

#### Admin Dashboard Not Accessible
**Problem**: "Access Denied" message
**Solution**:
- Confirm `ADMIN_DISCORD_ID` matches your Discord ID
- Check environment variables are loaded
- Restart development server

#### Users Not Loading
**Problem**: Empty user list
**Solution**:
- Verify Vercel Blob Storage token is valid
- Check network tab for API errors
- Ensure user data exists in storage

#### HWID Reset Not Working
**Problem**: HWID reset fails
**Solution**:
- Check authorization header is correct
- Verify user exists in database
- Review Discord webhook logs

#### Notifications Not Appearing
**Problem**: No notifications show up
**Solution**:
- Check if users have expiring keys
- Verify notification fetch interval (30s)
- Clear browser cache and reload

---

## 📈 Performance Tips

### Optimization
1. **Lazy Loading**: Components load on demand
2. **Caching**: Browser caches static assets
3. **Debouncing**: Search inputs debounced
4. **Pagination**: Large user lists paginated (future)
5. **Image Optimization**: Next.js automatic image optimization

### Best Practices
- Keep user list under 1000 users for optimal performance
- Use search/filter for large datasets
- Enable CDN for static assets
- Monitor Vercel Analytics

---

## 🔄 Workflow Examples

### Admin Daily Workflow
1. **Login** to admin dashboard
2. **Check notifications** for expiring keys
3. **Review stats** (users, active keys, new members)
4. **Search users** if specific lookup needed
5. **Add time** to expiring keys
6. **Reset HWID** for users who request it

### User Workflow
1. **Register/Login** with Discord ID
2. **View profile** to check key expiration
3. **Browse users** in community directory
4. **Check docs** for API integration
5. **Reset HWID** if changing hardware

### Developer Workflow
1. **Test endpoints** using `/docs` page
2. **Monitor logs** via Discord webhooks
3. **Add new scripts** via Edge Config
4. **Update user data** via admin panel
5. **Deploy changes** via Vercel Git integration

---

## 📦 Dependencies

### Production
- `next` (14.2.33) - React framework
- `react` (18.3.1) - UI library
- `react-dom` (18.3.1) - React DOM renderer
- `discord.js` (14.14.1) - Discord bot integration
- `@vercel/blob` (0.23.0) - Blob storage
- `@vercel/edge-config` (0.4.1) - Edge configuration

### Development
- `tailwindcss` (3.4.1) - CSS framework
- `typescript` (5.0.0) - Type checking
- `eslint` (8.0.0) - Code linting
- `autoprefixer` (10.4.16) - CSS vendor prefixes
- `postcss` (8.4.31) - CSS processing

---

## 🤝 Contributing

### How to Contribute
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Standards
- Use ES6+ syntax
- Follow Next.js conventions
- Write meaningful commit messages
- Add comments for complex logic
- Test on both dark and light modes

### Feature Requests
- Open an issue on GitHub
- Describe the feature clearly
- Explain use case
- Provide examples if possible

---

## 📝 License

This project is licensed under the MIT License.

---

## 🆘 Support

### Getting Help
- **Documentation**: Read this README thoroughly
- **Discord**: Join our Discord server for support
- **Issues**: Open GitHub issues for bugs
- **Email**: Contact admin for urgent matters

### Useful Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Discord.js Guide](https://discordjs.guide)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

## 🎯 Roadmap

### Planned Features
- [ ] Pagination for large user lists
- [ ] Advanced filtering (by date, status, etc.)
- [ ] Bulk operations (add time to multiple users)
- [ ] Email notifications
- [ ] Two-factor authentication
- [ ] API key management
- [ ] Usage analytics dashboard
- [ ] Custom branding options
- [ ] Multi-language support
- [ ] Mobile app

### In Progress
- [x] Admin dashboard
- [x] User directory
- [x] Notification system
- [x] Dark/Light mode
- [x] Responsive design

### Completed
- [x] Basic authentication
- [x] Key generation
- [x] HWID linking
- [x] Discord integration
- [x] API endpoints
- [x] Documentation

---

## 📸 Screenshots

### Admin Dashboard
![Admin Dashboard](https://via.placeholder.com/800x450?text=Admin+Dashboard)
- Real-time statistics
- User management table
- Notification panel
- Quick actions

### User Directory
![User Directory](https://via.placeholder.com/800x450?text=User+Directory)
- Community member cards
- Activity status
- Search functionality
- Join date tracking

### Profile Page
![Profile Page](https://via.placeholder.com/800x450?text=Profile+Page)
- User information
- Key details
- Expiration date
- Quick actions

---

## 🔐 Security Best Practices

### For Admins
1. **Never share** your admin Discord ID
2. **Rotate** API secrets regularly
3. **Monitor** Discord webhooks for suspicious activity
4. **Backup** user data periodically
5. **Review** logs regularly

### For Users
1. **Keep** your Discord ID private
2. **Don't share** your key with others
3. **Report** suspicious activity
4. **Use** unique HWIDs
5. **Update** your information if compromised

### For Developers
1. **Use** environment variables for secrets
2. **Never commit** `.env.local` to Git
3. **Validate** all user inputs
4. **Sanitize** database queries
5. **Implement** rate limiting

---

## 🌟 Credits

### Built With
- **Next.js** - React framework by Vercel
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide Icons** - Beautiful hand-crafted icons
- **Vercel** - Hosting and edge functions
- **Discord** - Bot integration and webhooks

### Acknowledgments
- Design inspiration from modern web apps
- Community feedback and testing
- Open source contributors

---

## 📞 Contact

- **Website**: https://your-domain.vercel.app
- **Discord**: Your Discord Server
- **GitHub**: Your GitHub Profile
- **Email**: your.email@example.com

---

## 🎉 Thank You

Thank you for using Nebula Whitelisting Service! We hope this solution meets your needs for secure user management and authentication. If you have any questions, issues, or suggestions, please don't hesitate to reach out.

**Happy coding!** 🚀
