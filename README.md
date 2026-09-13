<div align="center">

  <img src="client/public/logo.svg" alt="FrameSync by Silver Star" width="220" />

# FrameSync

**Video review & conditional delivery for post-production studios.**

Upload a cut, send your client a secure magic link, collect frame-accurate
feedback in real time — and the high-resolution master only unlocks after
their digital sign-off.

</div>

---

## Features

- **Multi-tenant agency workspaces** — every agency signs up for its own
  account and sees only its own clients and projects. Tenancy is enforced on
  the project document itself (`ownerId`), so the board query and every
  authorization check are scoped without a join.
- **Email/password or Google sign-in** — agency admins authenticate with
  bcrypt-hashed passwords (12 rounds) or a Google Identity Services ID token
  the server verifies against the configured client ID.
- **Magic-link client access** — no client accounts or passwords. Each project
  gets a scoped review link; the link *is* the credential, and the reviewer
  identity it resolves to is bound to one client entity.
- **Kanban production pipeline** — drag-and-drop project cards across stages
  (Pre-Production → Rough Cut → Client Review → Approved), synced live across
  an agency's open dashboards.
- **Frame-accurate review** — scrub the proxy video, pause on any frame, and
  sketch annotations directly on it with the drawing toolbar. Strokes are
  stored as normalized vectors, so markup is resolution-independent across
  viewports. Comments are pinned to exact timestamps and frames.
- **Real-time collaboration** — Socket.io presence indicators and live comment
  sync between the agency and the client.
- **Conditional master delivery ("Level Lock")** — the master is gated at both
  ends: the API only issues a master *upload* URL once the project is
  Approved, and only issues a master *download* URL after that. The approval
  itself is recorded in an immutable audit trail (who, when, from which IP and
  user agent, with a typed digital signature).
- **In-browser compression** — uploads over 100 MB are transcoded entirely
  client-side with ffmpeg.wasm (x264, dynamic bitrate budget targeting a
  100 MB proxy). No server-side ffmpeg, no upload of huge originals needed
  for review.
- **Pluggable storage** — AWS S3 (or any S3-compatible store like MinIO) in
  production, or disk-backed local storage for development. Media is served
  via presigned / HMAC-signed URLs; the API never proxies bytes in S3 mode.
- **Email notifications** — review links to clients, feedback and sign-off
  alerts to the agency (SMTP via Nodemailer; optional).
- **Animated WebGL backdrop** — a Three.js "light ripple" shader behind the
  UI, with a calm cream theme available via the toggle.

## Tech stack

| Layer  | Tools |
| ------ | ----- |
| Client | React 18, Vite, Tailwind CSS, Three.js, ffmpeg.wasm, Socket.io client, react-router, dnd-kit, axios |
| Server | Node.js, Express, Socket.io, Mongoose (MongoDB), JWT auth, Zod validation, Google Auth Library, Nodemailer, AWS SDK v3 |
| Deploy | Vercel (client) + Render (API) + MongoDB Atlas — or Docker Compose (nginx + Express + MongoDB, optional MinIO) for self-hosting |

## Project structure

```
FrameSync/
├── client/                     # React + Vite frontend
│   ├── public/logo.svg         # Silver Star brand mark
│   ├── src/
│   │   ├── components/         # VideoReviewer, VectorCanvas, annotation toolbar,
│   │   │                       # kanban board, modals, shader + UI flourishes
│   │   ├── context/            # AuthContext
│   │   ├── hooks/              # useProjectRoom (Socket.io), useTheme
│   │   ├── lib/                # ffmpeg compression pipeline, constants, session, time
│   │   ├── pages/              # AdminLogin, AgencyDashboard, ProjectDetail,
│   │   │                       # ClientPortal, NotFound
│   │   └── services/           # api.js (axios), socket.js (Socket.io client)
│   ├── vercel.json             # rewrites /api + /socket.io to the Render API
│   ├── vite.config.js          # dev proxy -> :5001, LAN-accessible host
│   └── Dockerfile, nginx.conf  # optional containerized build
├── server/                     # Express + Socket.io API
│   ├── config/db.js            # Mongoose connection
│   ├── controllers/            # auth, clients, projects, comments, uploads, approvals
│   ├── middleware/             # JWT auth, RBAC + tenant scoping, Zod validation,
│   │                           # security headers
│   ├── models/                 # User, Client, Project, Comment, Approval, ReviewLink
│   ├── routes/                 # REST modules + HMAC-signed local media streaming
│   ├── scripts/                # backfill-ownership.js (one-off data migration)
│   ├── socket/index.js         # project war-rooms + per-agency dashboard rooms
│   ├── utils/                  # storage (S3/local), mailer + templates, jwt,
│   │                           # origin allowlist, token generator
│   └── server.js               # entry point
├── docker-compose.yml          # optional self-hosted full stack
├── render.yaml                 # Render blueprint for the API
└── FrameSync_PDD.md            # full product design document
```

## Getting started (local development)

### Prerequisites

- Node.js 18+
- MongoDB — a free [Atlas](https://www.mongodb.com/atlas) cluster or a local
  `mongod`
- Two terminals (one for the API, one for the client)

### 1. Clone and configure the API

```bash
git clone https://github.com/<your-user>/framesync.git
cd framesync/server
npm install
cp .env.example .env
```

Edit `server/.env` — the minimum required values:

| Variable | Notes |
| -------- | ----- |
| `MONGO_URI` | Atlas connection string. **URL-encode special characters in the password** (`@` → `%40`). |
| `JWT_SECRET` | Any long random string. Also signs the local-media URLs, so keep it secret. |
| `STORAGE_MODE` | `local` for dev (no AWS needed — media lands in `server/storage/`), `s3` for production. |
| `CLIENT_URL` | Frontend origin, used for CORS and magic-link URLs (default `http://localhost:5173`). |
| `GOOGLE_CLIENT_ID` | Optional — leave blank to hide Google sign-in (`POST /api/auth/google` then answers 503). |
| `AWS_*` / `S3_BUCKET_NAME` | Only when `STORAGE_MODE=s3`. |
| `SMTP_*` | Optional — leave `SMTP_HOST` blank to log emails instead of sending them. |
| `TRUST_PROXY` | Number of reverse-proxy hops in front of the API. Leave blank when running locally — trusting a forwarded IP that no proxy sets would let clients spoof the approval audit. |

Start the API:

```bash
npm run dev        # nodemon — watches for changes
```

You should see `FrameSync API + Socket.io running on port 5001`, and
`GET /api/health` answers `{"status":"ok","service":"framesync-api"}`.

### 2. Start the client

```bash
cd ../client
npm install
npm run dev
```

The app runs at **http://localhost:5173** (Vite proxies `/api` and the
Socket.io websocket to port 5001).

Open `/login`, switch the form to **Create account** to register an agency
admin, then create a client and a project, upload a proxy video, and share the
review link.

> To enable the "Continue with Google" button, set `VITE_GOOGLE_CLIENT_ID` in
> `client/.env` to the same OAuth client ID as the server's `GOOGLE_CLIENT_ID`,
> and add the app origin to that client's **Authorised JavaScript origins** in
> the Google Cloud Console.

### Using FrameSync from other devices on your Wi-Fi

The dev client binds to all interfaces (`host: true`), and the API derives
shareable magic-link origins automatically — so links generated on your
machine open correctly on another laptop on the same network via
`http://<your-lan-ip>:5173`.

## Deployment

FrameSync's production topology is **Vercel** (static client) → **Render**
(Express + Socket.io API) → **MongoDB Atlas**, with no server-side ffmpeg and
no API-hosted media in S3 mode.

```
Browser ──► framesync.vercel.app ──► /api/*, /socket.io/*  ──► Render API ──► Atlas
                                     (vercel.json rewrites)
```

### Client → Vercel

Deploy `client/` as the project root. Vercel applies `client/vercel.json`,
which rewrites `/api/*` and `/socket.io/*` to the Render service and falls
back to `index.html` for client-side routes:

```json
{ "source": "/api/(.*)", "destination": "https://<your-service>.onrender.com/api/$1" }
```

The client always talks to a **same-origin** `/api`, so there is no API base
URL to configure — in dev the Vite proxy handles it, in production the rewrite
does. Set `VITE_GOOGLE_CLIENT_ID` in the Vercel project's environment
variables if you're using Google sign-in.

### API → Render

[`render.yaml`](./render.yaml) is a Render Blueprint — in the Render dashboard
choose **New → Blueprint** and point it at this repo. It provisions one web
service from `server/` (`npm ci` → `npm start`) with health check
`/api/health`, and prompts for the secrets that are deliberately not committed:

| Variable | Notes |
| -------- | ----- |
| `MONGO_URI` | Your Atlas connection string. |
| `JWT_SECRET` | Generated by Render. Sessions minted with the dev secret simply re-login. |
| `CLIENT_URL` | **Set this to the deployed Vercel origin.** Magic links and the CORS allowlist are built from it, so a wrong value means the client can't reach the API and emailed review links point at the wrong host. |
| `TRUST_PROXY` | Pinned to `1` — Render terminates TLS one hop in front of the app, so the approval audit records the real client IP instead of Render's. |
| `STORAGE_MODE` | `local` in the blueprint. Render's free-tier disk is **ephemeral** — uploads are lost on every deploy or restart. Fine for a demo; switch to `s3` (adding `AWS_*` + `S3_BUCKET_NAME`) for real use. |
| `SMTP_*` | Optional — leave blank to log emails instead of sending them. |

### Docker Compose (optional, self-hosted)

```bash
# from the repo root (configure server/.env first)
docker compose up --build
```

| Service | URL | Notes |
| ------- | -- | ----- |
| `web` | http://localhost:8080 | nginx: built client + same-origin API proxy |
| `api` | internal `:5001` | Express + Socket.io |
| `mongo` | internal | MongoDB 7 with a named volume |

Compose overrides `MONGO_URI` to the internal `mongo` service and sets
`CLIENT_URL` to the public web origin, so magic links work out of the box.
For S3-compatible local storage add the storage profile:

```bash
docker compose --profile storage up
# MinIO on :9000 (console :9001) — set S3_ENDPOINT=http://localhost:9000
# and S3_FORCE_PATH_STYLE=true in server/.env
```

## Scripts

| Location | Command | What it does |
| -------- | ------- | ------------ |
| `client/` | `npm run dev` | Vite dev server (LAN-accessible) |
| `client/` | `npm run build` | Production build to `client/dist` |
| `client/` | `npm run preview` | Serve the built client locally |
| `server/` | `npm run dev` | API with nodemon reload |
| `server/` | `npm start` | API (production) |

### One-off migration

`server/scripts/backfill-ownership.js` stamps an owner onto Client and Project
documents that predate the multi-tenant `ownerId` field. Without it those rows
are invisible to every account, because the board filters on `ownerId`.

```bash
cd server
node scripts/backfill-ownership.js you@studio.com --dry-run   # preview
node scripts/backfill-ownership.js you@studio.com             # apply
```

It only ever touches rows that have no owner yet, so it is safe to re-run.

## How the review flow works

1. **Agency** signs in, creates a client + project, and uploads the review
   proxy (the final master can only be uploaded once the project is Approved).
2. **Share** generates a magic link — sent by email if SMTP is configured,
   otherwise copy it manually.
3. **Client** opens the link (no login), watches the proxy, sketches on
   frames, and leaves timestamped comments. Everyone in the room sees new
   comments and presence live.
4. **Approval** — when the client signs off with a typed digital signature,
   the project moves to Approved, the immutable audit record is written, and
   the master unlocks for delivery. The master download URL is short-lived and
   issued per request.

## Troubleshooting

- **Atlas connection refused** — check **Network Access** in the Atlas console;
  your IP must be whitelisted (or add `0.0.0.0/0`).
- **Client can't reach the API after deploying** — confirm the `CLIENT_URL`
  value on Render matches the Vercel origin exactly (scheme + host, no trailing
  slash), and that `client/vercel.json` points at the right Render service.
- **Uploads vanish on Render** — expected on the free tier with
  `STORAGE_MODE=local`; the disk is ephemeral. Move to S3.

See [`FrameSync_PDD.md`](./FrameSync_PDD.md) for the full product design
document, including the data model, access-control rules, and phase plan.
