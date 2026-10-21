# Frontend

React 18, Vite 8, Material UI, React Router, and Socket.IO Client.

Run the commands documented in the root README. `npm start` here starts Vite; it proxies `/api` to the backend at http://localhost:8000. `npm run build` produces `build/`, and `npm test` runs Vitest.

API calls use the same origin by default. `VITE_BACKEND_URL` is optional for a deliberately separate development backend. The production deployment uses one Vercel origin.

The old Create React App template is retained in `legacy-cra-index.html` for reference and is not an entry point.
