# Project analysis and deployment verification

Date: 21 October 2026 (Asia/Kolkata).

## Delivered application

- Production: https://zoom-clone-blue-pi.vercel.app
- Vercel project: https://vercel.com/harshgavandits-projects/zoom-clone
- Final deployment: `dpl_23CfdtsjY216tp2rdEmcy5an8fWL` (Vercel Ready).
- Local server: http://localhost:8000
- Database: dedicated `zoom-clone-postgres`, provisioned with the free Neon plan through Vercel Marketplace in Singapore.

## Findings and repairs

| Original finding | Delivered behavior |
| --- | --- |
| Frontend hard-coded an unrelated Render server | Same-origin API and signaling on Vercel |
| Native Mediasoup/MongoDB bootstrap required absent infrastructure | Vercel-compatible Express runtime and existing peer-to-peer meeting flow |
| History called nonexistent auth routes and used incompatible tokens | Authenticated history with persistent Postgres sessions |
| Login printed passwords and tokens; registration could store plaintext passwords | No credential logging; bcrypt password hashes and hashed opaque session tokens |
| Logout only removed a browser value | Server revokes both access and refresh credentials |
| Chat identity came from a client-supplied sender string | Server derives the sender from joined participant metadata |
| Signaling could address users outside the current room | Sender and target must belong to the same room |
| Room identity used the entire URL | Stable validated room codes across devices and origins |
| Deprecated WebRTC stream events and global stream state | Per-meeting peers, modern track events, offer-collision handling, queued ICE, and resource cleanup |
| Duplicate listeners could accumulate on reconnect | Listeners are registered once; reconnect replaces presence and replays recent chat |
| Distributed participant lookup could wait for inactive functions | Expiring database presence leases and atomic room admission |
| Screen replacement stopped camera tracks | Camera and screen streams have separate lifecycles |
| Whiteboard clear was local and drawing scaled inconsistently | Normalized coordinates, remote clear, pointer support |
| Recordings UI implied a server archive | Explicit local-download behavior and browser download history |
| Old CRA dependency tree included many known vulnerabilities | Vite/Vitest migration and patched router; final frontend and backend audits report zero advisories |
| Unresolved merge markers in README | Rewritten setup, deployment, verification, architecture, and limitations documentation |
| Mobile landing and controls did not fit | Responsive layouts verified at 390 × 844 without horizontal overflow |

The original `backend/` prototype is retained for reference and is excluded from the deployment. Prototype-only waiting-room, SFU, server recording, and unused analytics/AI components are not represented as verified product features.

## Verification evidence

- `npm test`: passed; 24 real API/meeting checks across two independent local server processes.
- `npm --prefix frontend test`: 3 tests passed, including direct auth and meeting routes and no automatic physical-device activation.
- `npm run build`: passed using Vite 8.
- `npm audit` and `npm audit --prefix frontend`: zero known advisories at verification time.
- `BASE_URL=https://zoom-clone-blue-pi.vercel.app npm run test:live`: all 24 checks passed on the final deployment. Output: `artifacts/live-smoke.txt`.
- Built-in browser: registration, sign-in, meeting history, two-participant video, silent audio packet receipt, chat, media toggles, raised hands, screen-track replacement, drawing/remote clearing, recording download, and network reconnect were exercised.
- Final network-interruption test returned to Connected with one active peer, both videos playing at 640 x 360, 767 decoded remote frames, and 112,346 received silent-audio bytes at the saved observation. Evidence: `artifacts/live-media.json` and `artifacts/live-meeting.png`.
- Vercel Ready screenshot: `artifacts/vercel-ready.png`.
- The synthetic test account was signed out; attempting `/home` redirected to `/auth`. All generated media was stopped, and the public landing page was left open.
- Browser recording generated a 167,662-byte WebM file with the expected EBML header. Screen capture was supplied by a generated stream for the automated test; the physical OS screen picker was not exercised.
- Media checks use generated canvas frames and silent audio, not a physical camera/microphone or an external participant on a separate network.

## Practical boundaries

This is a small-group peer-to-peer meeting app, with a six-person admission limit. Vercel hosts the web app, API, and signaling; video flows between browsers. Postgres is supplied by Neon through the Vercel Marketplace integration.

No TURN relay is available under the current Vercel-only setup. The app uses public STUN by default, so restrictive NAT/firewall networks can still prevent media connections. General Internet/network compatibility and physical hardware quality have not been established by synthetic browser tests.

Recordings are local downloads, not cloud recordings. Room links act as invitations and do not have host approval. There is no claim of Zoom-scale SFU capacity.

The archive's original Git history has been restored against `harshgavandit/Zoom_Clone`. Source publication includes lockfiles, tests, setup documentation, and a GitHub Actions workflow. CI uses an isolated temporary Postgres service. Vercel deployment was performed with the CLI.
