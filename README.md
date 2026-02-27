# SyncCode – Real-Time Collaborative Editor

A real-time collaborative code editor with multi-language execution, video calling, and persistent rooms.

## Features

- **Real-time code sync** – Socket.io + Redis for sub-100ms updates and persistence across refreshes
- **Multi-language execution** – Run Python, C++, Java, and SQL via Piston API (Judge0-compatible)
- **SQL selection support** – Run selected SQL with schema context
- **Video/audio calling** – ZegoCloud integration for in-room calls
- **Real-time chat** – In-room messaging with history persisted in Redis
- **Product tour** – Joyride onboarding for new users
- **Persistence** – Room code, language, timer, and chat in Redis; display name/emoji in LocalStorage
- **Error boundaries** – Fallback UI if the editor or video call fails to load (e.g. slow network)

## Tech Stack

- **Frontend:** Next.js (App Router), React, Monaco Editor, Tailwind CSS
- **Realtime:** Socket.io (custom server), Redis (ioredis)
- **Execution:** Piston API (self-hosted or public)
- **Video:** ZegoCloud UIKit
- **Email invites:** Nodemailer (SMTP)

## Getting Started

1. **Clone and install**
   ```bash
   npm install
   ```

2. **Environment variables**  
   Copy `.env.example` to `.env.local` and fill in values (see [Environment variables](#environment-variables) below).

3. **Run the app**  
   The app uses a **custom Node server** that serves both Next.js and Socket.io:
   ```bash
   npm run dev
   ```
   This starts the server (default `http://localhost:3000`). The Socket.io server runs on the same host.

4. **Create a room**  
   Open the app, enter a room name, and share the room URL with others.

## Environment Variables

All sensitive keys and service URLs should be set via environment variables (see `.env.example`). Required for full functionality:

| Variable | Description |
|----------|-------------|
| `REDIS_URL` | Redis connection URL (e.g. Upstash `rediss://...`) for code, chat, and room persistence |
| `PORT` | Server port (default `3000`) |
| `PISTON_API_URL` | Full URL of Piston execute API (e.g. `http://localhost:2000/api/v2/execute`) |
| `NEXT_PUBLIC_ZEGO_APP_ID` | ZegoCloud app ID for video calls |
| `NEXT_PUBLIC_ZEGO_SERVER_SECRET` | ZegoCloud server secret |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | SMTP credentials for email invites (optional) |
| `SMTP_PORT`, `SMTP_FROM_NAME`, `SMTP_FROM_EMAIL` | Optional SMTP options |

For **Vercel** (or split deployment), see the [Deployment](#deployment) section.

## Deployment

### Custom server (recommended)

SyncCode uses a **custom Node server** (`server.js`) that serves Next.js and Socket.io together. **Vercel’s serverless model does not run this server.** To deploy the full app:

1. Deploy the **entire app** (Next + `server.js`) to a **Node-compatible host** that runs a long-lived process, e.g.:
   - Railway  
   - Render  
   - Fly.io  
   - A VPS (e.g. with PM2)

2. Set all [environment variables](#environment-variables) in that host’s dashboard.

3. Build and start with:
   ```bash
   npm run build
   node server.js
   ```
   (Or use the host’s default Node start command and set `PORT`.)

### Split deployment (Next on Vercel + Socket elsewhere)

If you want the **frontend** on Vercel and the **Socket.io server** on another host:

1. Deploy **only** the Socket.io + Next custom server to a Node host (as above), or run a separate Socket.io server that shares Redis with your API.
2. Deploy the **Next.js static/API routes** to Vercel (e.g. with `next build` and Vercel’s Next.js preset; you will not run `server.js` on Vercel).
3. Set `NEXT_PUBLIC_SOCKET_URL` on Vercel to the URL of your Socket server (e.g. `https://your-socket-server.example.com`). The client will use this for Socket.io when set.
4. Enable **CORS** on the Socket server for your Vercel frontend origin.

(If `NEXT_PUBLIC_SOCKET_URL` is not set, the client connects to the same origin; that only works when the custom server serves the app.)

## Scripts

- `npm run dev` – Start custom server in development
- `npm run build` – Build Next.js for production
- `npm start` – Run custom server in production (run after `npm run build`)

## License

MIT
