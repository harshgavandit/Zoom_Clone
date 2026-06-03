# 🎥 Zoom Clone — Mediasoup SFU Video Conferencing (Repository Overview)

This repository implements a prototype Zoom-like video conferencing application using a React frontend and a Node.js/Express backend. It uses Mediasoup as an SFU for scalable video forwarding, Socket.IO for signaling, MongoDB for persistence, and Redis/Coturn for scaling and NAT traversal.

This README was updated after scanning the codebase; it corrects run instructions, enumerates the main modules, and calls out a missing `.env.example` referenced in older docs.

## Status from code scan

- Backend: Node.js + Express (ES modules). Entry: `backend/src/app.js` — initializes Mediasoup workers and Socket.IO.
- Frontend: Create React App. Entry: `frontend/src/index.js` → `App.js`. Mediasoup meeting UI: `frontend/src/pages/VideoMeetMediasoup.jsx`.
- Docker Compose: `docker-compose.yml` defines `redis`, `coturn`, and `backend` services. Frontend is expected to run separately during development.
- Note: `.env.example` referenced in older README was not found in the repository — create `backend/.env` manually (see sample below).

---

## Quick Feature Summary

- Mediasoup-based SFU prototype (workers, routers, transports, produce/consume handlers).
- Real-time chat, emoji reactions, host controls, hand-raise, screen sharing signaling.
- Server-side recording helpers (FFmpeg integration expected in `recording_recorder.js`).
- Authentication endpoints and JWT-based tokens with refresh support.

---

## Prerequisites

- Node.js 18+ for local development (backend uses ES modules).
- npm 9+.
- Docker + Docker Compose (recommended for backend services like Redis and Coturn).
- MongoDB instance (local or managed). The compose file does not start MongoDB — provide `MONGO_URL`.

## Sample backend `.env` (create `backend/.env`)

```
MONGO_URL=mongodb://localhost:27017/zoom_clone
REDIS_URL=redis://localhost:6379
PORT=8000
JWT_SECRET=replace_with_a_strong_secret
TURN_URL=turn:coturn:3478
```

(Save secrets securely; do not commit `.env`.)

---

## Run with Docker (recommended for backend services)

1. Start Redis and Coturn via compose and the backend service (frontend runs locally in dev):

```powershell
docker-compose up --build
```

2. The `backend` service will be available on `http://localhost:8000` by default.

Note: The compose file mounts `./backend` into the container so file changes are reflected immediately.

---

## Local Development (separate frontend/backends)

Backend

```powershell
cd backend
npm install
# create backend/.env as above
npm run dev    # uses nodemon to run src/app.js
```

Frontend

```bash
cd frontend
npm install
npm start
```

Frontend dev server runs on `http://localhost:3000` by default. The mediasoup client pages use `process.env.REACT_APP_BACKEND_URL` or the same origin.

---

## Important Code Locations

- `backend/src/app.js` — server bootstrap: MongoDB connect, `initMediasoup()`, Socket.IO attach
- `backend/src/mediasoupServer.js` — creates mediasoup workers
- `backend/src/mediasoupHandlers.js` — router/transport/produce/consume signaling
- `backend/src/controllers/socketManager.js` — initializes socket handlers (chat, mediasoup, screen share)
- `backend/src/routes/*.js` — REST endpoints: auth, recordings, system, users
- `frontend/src/pages/VideoMeetMediasoup.jsx` — example mediasoup client that produces local tracks and consumes remote producers

---

## API Endpoints (summary)

- `POST /api/v1/auth/register` — create account
- `POST /api/v1/auth/login` — authenticate (returns access + refresh tokens)
- `POST /api/v1/auth/refresh` — refresh access token
- `POST /api/v1/auth/logout` — revoke token
- `GET /api/v1/recordings` — list available recordings (from `recordings/` folder)
- `GET /api/v1/recordings/download/:file` — download
- `GET /api/v1/system/info` — server status + TURN URL

---

## Mediasoup & TURN Notes

- Mediasoup requires CPU and networking considerations when deployed (workers, ports 20000-40000/udp). See `backend/src/mediasoupServer.js` for worker creation and `docker-compose.yml` for the port range mapping.
- A TURN server (Coturn) is included in `docker-compose.yml` and exposed on `3478`.

---

## Known Gaps & Next Steps

1. `.env.example` file is referenced by older docs but missing — add a template in the repo.
2. Some mediasoup helpers are prototypes and marked `TODO` (see `mediasoupServer.js`). Consider hardening production behavior (worker lifecycle, error handling).
3. Add automated tests and CI workflows.
4. Add docs for recording pipeline (FFmpeg usage) and retention policy.

---

If you'd like, I can:

1. Create a `backend/.env.example` file and commit it.
2. Draft a shorter quick-start README landing section for contributors.
3. Add a checklist for production hardening and deployment.

<<<<<<< HEAD
Tell me which of these you'd like me to do next.
=======


## 🚀 Production Deployment

Before deploying to production:

1. Set strong JWT secret in .env
2. Configure MongoDB connection to managed service
3. Set Redis connection to managed service
4. Enable HTTPS/TLS on your domain
5. Configure TURN server credentials
6. Set up SSL certificates
7. Enable rate limiting on API endpoints
8. Configure backups for recordings and database

For full production checklist, see Docker Hub deployment documentation.

---

## 📞 Support

**For issues:**
1. Check troubleshooting section above
2. Verify all prerequisites are installed
3. Check .env configuration
4. Review browser console for errors
5. Check backend logs: `docker-compose logs backend`

**For Docker logs:**
```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f redis
```

---

## 📄 License

ISC License - See LICENSE file for details

---

## ✨ Credits

Built as a professional hackathon project demonstrating:
- Advanced WebRTC architecture (SFU)
- Production-grade security practices
- Enterprise-level features (analytics, accessibility)
- Professional UI/UX design
- Scalable infrastructure patterns

**Ready for deployment. Built to win.** 🏆
>>>>>>> b5e23a55c14e98a88ed2ebfdfdfc959ca78ecc6f
