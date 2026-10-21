import { test } from 'node:test';
import { spawn } from 'node:child_process';
import { smoke } from '../scripts/smoke.mjs';

test('HTTP flows and distributed meeting events', { timeout: 180000 }, async () => {
  const processes = [8121, 8122].map(port => spawn(process.execPath, ['--env-file-if-exists=.env.local', 'server/index.js'], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore', windowsHide: true }));
  try {
    for (const port of [8121,8122]) {
      let healthy = false;
      for (let i=0;i<40;i++) { try { if ((await fetch(`http://localhost:${port}/api/health`, { signal: AbortSignal.timeout(5000) })).ok) { healthy=true; break; } } catch {} await new Promise(resolve => setTimeout(resolve,500)); }
      if (!healthy) throw new Error('Test server failed readiness. Check the dedicated database configuration.');
    }
    await smoke('http://localhost:8121','http://localhost:8122');
  } finally { processes.forEach(child => child.kill()); }
});
