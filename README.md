# MM2 Tracker

Premium Roblox MM2 Middleman + Trade Tracker with real Discord-verified trades, live Socket.IO updates, admin dashboard, and modular MM2 value data integration.

## Features

- **Real verified trades** from your Discord trade channel (no fake/random trades)
- **Discord.js bot** with configurable trade message parser
- **Socket.IO** real-time trade notifications and stat updates
- **MongoDB** persistence for trades, middlemen, vouches, items, activity, logs
- **Admin dashboard** for settings, middlemen, vouches, logs, test trades
- **Responsive dark UI** with glassmorphism and animated statistics
- **Modular Neblio/provider layer** for authorized MM2 data APIs

## Project Structure

```
mm2-tracker/
├── frontend/          # Static HTML/CSS/JS website
├── backend/           # Express API + Socket.IO + MongoDB
├── bot/               # Discord.js bot (separate process)
├── database/          # Seed script
├── .env               # Environment variables (never commit)
├── .env.example
├── package.json
├── docker-compose.yml
└── README.md
```

## Requirements

- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- Discord bot application with **Message Content Intent**

## Quick Start

### 1. Install Node.js

Download from [https://nodejs.org](https://nodejs.org) (LTS recommended).

### 2. Install dependencies

```bash
cd mm2-tracker
npm install
```

### 3. Create a Discord bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create an application → **Bot** → reset/copy token
3. Enable **Message Content Intent** (and Presence if needed)
4. Copy your **Application ID**, **Bot Token**, **Server (Guild) ID**, and **Trade Channel ID**

### 4. Invite the bot to your server

Use this URL (replace `CLIENT_ID`):

```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=66560&scope=bot%20applications.commands
```

Required permissions: Read Messages, Read Message History, Send Messages, Use Slash Commands.

### 5. Configure `.env`

Copy `.env.example` to `.env` and fill in:

```env
DISCORD_TOKEN=your_bot_token
DISCORD_GUILD_ID=your_server_id
TRADE_CHANNEL_ID=your_trade_channel_id
MONGODB_URI=mongodb://localhost:27017/mm2_tracker
BACKEND_URL=http://localhost:3000
API_SECRET=your_shared_secret
PORT=3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=your_bcrypt_password_hash
ADMIN_DISCORD_IDS=your_discord_user_id
```

**Important:** `API_SECRET` must match in both the website backend and bot.

### 6. Seed the database (optional — also runs on server start)

```bash
npm run seed
```

### 7. Start the backend

```bash
npm run server
```

Website: [http://localhost:3000](http://localhost:3000)

### 8. Start the Discord bot (separate terminal)

```bash
npm run bot
```

Or start both together:

```bash
npm run dev
```

## Trade Message Format

Post completed trades in your configured trade channel using this format:

```
TRADE COMPLETED

Buyer: PlayerA
Seller: PlayerB

PlayerA gave:
Chroma Knife

PlayerB gave:
Ancient Gun

Value:
5000

Status:
Completed

Middleman: Nexus
```

- If no middleman was used, omit the `Middleman:` line (shows as **Direct Trade**)
- Parser patterns are configurable from the admin dashboard
- Duplicate Discord message IDs are ignored automatically

## Bot Admin Commands

Administrator-only slash commands (requires your Discord user ID in `ADMIN_DISCORD_IDS`):

| Command | Description |
|---------|-------------|
| `/status` | Bot, guild, channel, tracking status |
| `/testtrade` | Creates a labeled TEST trade (does not affect real stats) |
| `/sync` | Manual synchronization check |

## Admin Dashboard

Open [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

Login with `ADMIN_USERNAME` and the plaintext password corresponding to `ADMIN_PASSWORD_HASH` in `.env`.

Manage:
- Bot/system status
- Trade channel & parser settings
- Small/Medium/Large value ranges
- Middlemen & vouch counts
- Items, announcements, logs
- Test trades & data refresh

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/trades` | Paginated trade history with filters |
| `GET /api/trades/latest` | Latest verified trade |
| `GET /api/middlemen` | Middleman profiles |
| `GET /api/stats` | Website statistics |
| `POST /api/stats/visit` | Track real visit (once per session) |
| `GET /api/activities` | Activity feed |
| `GET /api/neblio` | MM2 value data (authorized provider) |
| `POST /api/external/trades` | Verified external trade ingestion (requires `Authorization: Bearer API_SECRET`) |
| `POST /api/bot/trades` | Legacy bot ingestion/status API (requires `x-api-secret`) |

## Socket.IO Events

| Event | Description |
|-------|-------------|
| `trade:new` | New verified trade saved |
| `stats:update` | Statistics updated |
| `activity:new` | A persisted trade activity entry was created |
| `middleman:updated` | A persisted middleman trade count changed |

## Neblio / MM2 Data Integration

The system includes a modular provider layer for authorized MM2 data sources.

Set `NEBLIO_API_BASE` to an **official authorized API base URL** when available. The integration will fetch:

- Value list
- Value changes
- Most traded
- Market activity
- Trading servers
- Experience leaderboard
- Contributors

Without an authorized API, value pages show admin-managed items and a configuration notice. **Do not use unauthorized scraping.**

## Docker (optional)

```bash
docker-compose up -d
```

Requires local `.env` and Dockerfiles (use `npm run server` / `npm run bot` for standard setup).

## Security Notes

- Never expose `DISCORD_TOKEN` or `API_SECRET` in frontend code
- `.env` is gitignored — never commit secrets
- External trade ingestion requires a Bearer token, provider trade ID, verification source/time, completed status, and idempotent persistence
- Generate `ADMIN_PASSWORD_HASH` with `node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 12))" "your-password"`; do not put a plaintext admin password in `.env`
- Admin routes require JWT authentication
- Rate limiting enabled on API routes
- **Rotate your Discord bot token** if it was ever shared publicly

## Deployment

### Website (e.g. Render)

1. Deploy backend with `npm run server`
2. Set environment variables from `.env.example`
3. Point `MONGODB_URI` to MongoDB Atlas

### Railway

Create two Railway services from this repository:

- **Website/backend:** select `Dockerfile.backend`, expose port `3000`, and add the website variables from `.env.example`.
- **Discord bot:** select `Dockerfile.bot`, add the bot variables plus the same `API_SECRET`, and keep the service private.

Use MongoDB Atlas for production. Never upload `.env` or place `DISCORD_TOKEN`, `MONGODB_URI`, `API_SECRET`, `JWT_SECRET`, or admin credentials in frontend files. Configure `BACKEND_URL` on the bot to the public Railway backend URL.

### Bot (separate service)

1. Deploy bot with `npm run bot`
2. Set `BACKEND_URL` to your hosted website URL
3. Ensure `API_SECRET` matches the website

## Discord Server

Join: [https://discord.gg/HpPSfvjmmT](https://discord.gg/HpPSfvjmmT)

## License

Private project — all rights reserved.
