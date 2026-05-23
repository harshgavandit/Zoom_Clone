// mediasoupServer.js - lightweight scaffold for mediasoup SFU prototype
// Note: Install 'mediasoup' on the server and follow its deployment requirements (workers, CPU cores, etc).

import os from 'os';
import mediasoup from 'mediasoup';

let workers = [];
let nextWorkerIndex = 0;

export async function createWorkers({ numWorkers = Math.max(1, os.cpus().length - 1), rtcMinPort = 20000, rtcMaxPort = 40000 } = {}) {
  for (let i = 0; i < numWorkers; ++i) {
    const worker = await mediasoup.createWorker({
      rtcMinPort,
      rtcMaxPort,
      logLevel: 'warn',
      logTags: ['info', 'ice', 'dtls', 'rtp', 'sctp']
    });
    workers.push(worker);
    console.log('mediasoup worker created, pid:', worker.pid);

    worker.on('died', () => {
      console.error('mediasoup worker died, exiting in 2s...');
      setTimeout(() => process.exit(1), 2000);
    });
  }
}

export function getWorker() {
  if (workers.length === 0) throw new Error('No mediasoup workers initialized');
  const worker = workers[nextWorkerIndex];
  nextWorkerIndex = (nextWorkerIndex + 1) % workers.length;
  return worker;
}

export async function initMediasoup() {
  if (workers.length > 0) return workers;
  await createWorkers();
  return workers;
}

// TODO: create routers/transports/produce/consume helpers and integrate with socketManager signaling
