# Apna Video Call

A React video-meeting app deployed on Vercel, with an Express API and Socket.IO signaling on Vercel Functions. Accounts, sessions, meeting history, and recent chat use a dedicated Neon Postgres database provisioned through Vercel Marketplace.

**Live app:** https://zoom-clone-blue-pi.vercel.app

## What works

- Register, sign in, refresh sessions, and sign out with server-side revocation.
- Start a guest meeting or join with a meeting code, then copy the invite link.
- Peer-to-peer audio/video, camera and microphone toggles, and screen sharing.
- Chat, participant presence, raised hands, emoji reactions, and shared whiteboard drawing/clearing.
- Meeting history for signed-in users.
- Browser screen recording with a local video download and a list of downloads made in that browser.
- Responsive desktop and mobile layouts, direct URL navigation, and automatic signaling reconnection.

Meetings are intended for small groups, with a six-participant admission check. Anyone with the meeting link can join. Generate a random meeting code for a private invitation.

## Architecture

```text
Browser React/Vite app -> Vercel CDN
  REST requests        -> Vercel Function (Express) -> Postgres
  WebSocket signaling  -> Vercel Function (Socket.IO)
                            <-> Postgres LISTEN/NOTIFY adapter
  Audio/video          <-> Other meeting participants via WebRTC
```

Vercel Functions support WebSockets with Fluid compute. The client connects directly over WebSocket at `/api/index`, avoiding HTTP polling and sticky-session requirements. The Postgres adapter forwards room events between independent function instances. Participant presence uses expiring Postgres leases, with an atomic room-capacity check and a per-tab reconnect identity; joining does not wait for suspended function instances. When a function reaches its maximum duration, the client reconnects and rejoins the room; peer media may briefly renegotiate.

The deployment uses the existing app's peer-to-peer meeting flow. The original `backend/` Mediasoup/MongoDB prototype is retained as reference and is excluded from Vercel deployment. `/ms/:roomId` opens the supported peer-to-peer meeting UI for the same room code. This deployment does not run a native SFU, Coturn, Redis, or FFmpeg worker.

## Local setup

Use Node.js 22.22.2 or newer in the 22.x line (Vercel uses Node 22). From the repository root:

```powershell
npm ci
npm ci --prefix frontend
npx vercel link
npx vercel env pull .env.local
npm run build
npm start
```

Open http://localhost:8000. The one server serves the production frontend and API. For frontend hot reload, leave the backend running and use `npm --prefix frontend start` in a second terminal; Vite proxies `/api` to port 8000.

The ignored `.env.local` must contain the dedicated database connection. Use `DATABASE_URL_UNPOOLED` for Socket.IO LISTEN/NOTIFY; a transaction-pooler URL does not support its persistent listeners. TLS certificate verification remains enabled. The server creates its tables idempotently on first use.

The application hashes passwords with bcrypt and stores only SHA-256 hashes of random access/refresh tokens. No signing secret or development authentication fallback is required. Authentication requests have a shared database-backed rate limit.

## Vercel deployment

The root `vercel.json` installs both packages, builds the frontend into `frontend/build`, and routes the API to `api/index.js`. Static assets remain on the CDN.

1. Link or create the Vercel project from this root directory.
2. Provision a dedicated free Neon database in Vercel Marketplace and connect the project environments. The existing deployment uses `zoom-clone-postgres` in Singapore.
3. Keep Fluid compute enabled. The function duration is 300 seconds, with client reconnection on disconnect.
4. Run `npx vercel --prod`.
5. Verify `/api/health` and run the live smoke command below.

Source is maintained at [harshgavandit/Zoom_Clone](https://github.com/harshgavandit/Zoom_Clone). The repository is connected to the Vercel `zoom-clone` project: pushes to `main` automatically create production deployments and update the production domain after a successful build. Other branches and pull requests use preview deployments. The CLI remains available for manual deployments. GitHub Actions verifies each push and pull request using a temporary Postgres service; no production database credentials are required by CI.

## Verification

```powershell
npm test
npm --prefix frontend test
npm run build
npm audit
npm audit --prefix frontend
$env:BASE_URL='https://zoom-clone-blue-pi.vercel.app'
npm run test:live
```

`npm test` starts two independent local backend processes against the dedicated database and runs 24 real HTTP and meeting-event checks. These cover registration, invalid credentials, token rotation/replay, logout revocation, authenticated history, distributed presence/signaling, chat identity, room isolation, participant departure, reactions, raised hands, whiteboard events, and ICE configuration. Test accounts use generated synthetic credentials.

On GitHub Actions the same integration suite uses the workflow's disposable Postgres service instead of the hosted database. Build output, `.env.local`, local evidence, and agent tooling are excluded from Git.

Browser verification uses the built-in browser. Generated video and silent audio may be used for reproducible media checks; those checks do not establish physical camera/microphone quality or actual OS screen-capture behavior.

## Practical limits

- **Network traversal:** the default uses a public STUN server. Vercel does not provide a TURN relay. Calls on restrictive NAT/firewall networks can require an authenticated TURN service; configure the optional `TURN_URL`, `TURN_USERNAME`, and `TURN_CREDENTIAL` variables if one becomes available. A Vercel-only deployment cannot guarantee media connectivity on every network.
- **Recordings:** recording requires browser support and screen-selection permission. Videos download locally; there is no cloud recording archive. The recordings page clearly describes that behavior.
- **Scale:** this is a small-group peer-to-peer app. Every participant sends media to the others. It is not an SFU-scale replacement for Zoom.
- **Access:** room codes are invitations, not host-approved waiting rooms. Prototype admin/analytics/virtual-background components from the archive are not exposed as verified product features.
- **Retention:** the chat API only replays the last 100 messages from the preceding 24 hours. Database retention/backup policies should be configured for a larger production rollout.

## Source map

- `server/app.js`: active API, database schema, sessions, validation, Socket.IO, and distributed adapter.
- `api/index.js`: Vercel function export.
- `frontend/src/useMeeting.js`: meeting media, signaling, reconnection, recording, and whiteboard lifecycle.
- `frontend/src/pages/VideoMeet.jsx`: meeting UI.
- `frontend/src/utils/api.js`: same-origin API client and session refresh.
- `scripts/smoke.mjs`, `tests/integration.test.js`: real integration verification.
- `backend/`: original native Mediasoup prototype, not the deployed runtime.
