// mediasoupHandlers.js - room/router/transport/produce/consume handlers (prototype)
import { getWorker } from './mediasoupServer.js';

// Very small in-memory store for prototype
const rooms = new Map();

function ensureRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { router: null, transports: new Map(), producers: new Map(), consumers: new Map() });
  }
  return rooms.get(roomId);
}

export async function mediasoupInitHandlers(io, socket) {
  // Register mediasoup-related signaling handlers per-socket

  socket.on('mediasoup:create-router', async (roomId, cb) => {
    try {
      const room = ensureRoom(roomId);
      if (room.router) {
        return cb({ ok: true, rtpCapabilities: room.router.rtpCapabilities });
      }
      const worker = getWorker();
      const mediaCodecs = [
        { kind: 'audio', mimeType: 'audio/opus', clockRate: 48000, channels: 2 },
        { kind: 'video', mimeType: 'video/VP8', clockRate: 90000 }
      ];
      const router = await worker.createRouter({ mediaCodecs });
      room.router = router;
      console.log('Created router for room', roomId);
      cb({ ok: true, rtpCapabilities: router.rtpCapabilities });
    } catch (err) {
      console.error('create-router error', err);
      cb({ ok: false, error: err.message });
    }
  });

  socket.on('mediasoup:get-rtpCapabilities', (roomId, cb) => {
    try {
      const room = rooms.get(roomId);
      if (!room || !room.router) return cb({ ok: false, error: 'Router not found' });
      cb({ ok: true, rtpCapabilities: room.router.rtpCapabilities });
    } catch (err) {
      cb({ ok: false, error: err.message });
    }
  });

  socket.on('mediasoup:create-transport', async (roomId, cb) => {
    try {
      const room = rooms.get(roomId);
      if (!room || !room.router) return cb({ ok: false, error: 'Router not found' });

      const webRtcTransportOptions = {
        listenIps: [{ ip: '0.0.0.0', announcedIp: null }],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        initialAvailableOutgoingBitrate: 1000000
      };

      const transport = await room.router.createWebRtcTransport(webRtcTransportOptions);
      room.transports.set(transport.id, transport);

      cb({ ok: true, params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters
      }});
    } catch (err) {
      console.error('create-transport error', err);
      cb({ ok: false, error: err.message });
    }
  });

  socket.on('mediasoup:connect-transport', async (roomId, transportId, dtlsParameters, cb) => {
    try {
      const room = rooms.get(roomId);
      if (!room) return cb({ ok: false, error: 'Room not found' });
      const transport = room.transports.get(transportId);
      if (!transport) return cb({ ok: false, error: 'Transport not found' });
      await transport.connect({ dtlsParameters });
      cb({ ok: true });
    } catch (err) {
      console.error('connect-transport error', err);
      cb({ ok: false, error: err.message });
    }
  });

  socket.on('mediasoup:produce', async (roomId, transportId, kind, rtpParameters, cb) => {
    try {
      const room = rooms.get(roomId);
      if (!room) return cb({ ok: false, error: 'Room not found' });
      const transport = room.transports.get(transportId);
      if (!transport) return cb({ ok: false, error: 'Transport not found' });

      const producer = await transport.produce({ kind, rtpParameters });
      room.producers.set(producer.id, producer);

      // Notify other peers that a new producer is available
      io.to(roomId).emit('mediasoup:producer-created', { producerId: producer.id, kind });

      cb({ ok: true, id: producer.id });
    } catch (err) {
      console.error('produce error', err);
      cb({ ok: false, error: err.message });
    }
  });

  socket.on('mediasoup:consume', async (roomId, consumerTransportId, producerId, rtpCapabilities, cb) => {
    try {
      const room = rooms.get(roomId);
      if (!room) return cb({ ok: false, error: 'Room not found' });
      const router = room.router;
      if (!router) return cb({ ok: false, error: 'Router not found' });

      // Ensure the router can consume the producer
      if (!router.canConsume({ producerId, rtpCapabilities })) {
        return cb({ ok: false, error: 'Cannot consume' });
      }

      const transport = room.transports.get(consumerTransportId);
      if (!transport) return cb({ ok: false, error: 'Transport not found' });

      const consumer = await transport.consume({ producerId, rtpCapabilities, paused: false });
      room.consumers.set(consumer.id, consumer);

      cb({ ok: true, params: {
        id: consumer.id,
        producerId: consumer.producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters
      }});
    } catch (err) {
      console.error('consume error', err);
      cb({ ok: false, error: err.message });
    }
  });

  // Recording controls (prototype)
  socket.on('recording:start', async (roomId, producerId, cb) => {
    try {
      const room = rooms.get(roomId);
      if (!room || !room.router) return cb({ ok: false, error: 'Room or router not found' });
      const producer = Array.from(room.producers.values()).find(p => p.id === producerId);
      if (!producer) return cb({ ok: false, error: 'Producer not found' });

      // Lazy import to avoid circular deps
      const { startRecording } = await import('../recording_recorder.js');
      const outFile = `./recordings/${roomId}-${Date.now()}.mp4`;
      const result = await startRecording({ router: room.router, producer, outFile });
      return cb({ ok: true, recordingId: result.recordingId, outFile: result.outFile });
    } catch (err) {
      console.error('recording:start error', err);
      return cb({ ok: false, error: err.message });
    }
  });

  socket.on('recording:stop', async (recordingId, cb) => {
    try {
      const { stopRecording } = await import('../recording_recorder.js');
      const ok = await stopRecording(recordingId);
      return cb({ ok });
    } catch (err) {
      console.error('recording:stop error', err);
      return cb({ ok: false, error: err.message });
    }
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    // Note: do NOT destroy router/worker on single disconnect in prototype
  });
}
