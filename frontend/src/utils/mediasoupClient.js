// mediasoupClient.js - lightweight client helper for mediasoup signaling
// Note: Requires `mediasoup-client` and socket.io-client installed in frontend

import { Device } from 'mediasoup-client';
import io from 'socket.io-client';

export default class MediasoupClient {
  constructor({ url, roomId }) {
    this.url = url;
    this.roomId = roomId;
    this.socket = null;
    this.device = null;
    this.producerTransport = null;
    this.consumerTransport = null;
    this.producers = new Map();
    this.consumers = new Map();
  }

  connect() {
    this.socket = io(this.url);
    return new Promise((resolve) => {
      this.socket.on('connect', () => {
        console.log('socket connected to signaling server', this.socket.id);
        resolve(this.socket);
      });
    });
  }

  async initDevice() {
    const socket = this.socket;
    return new Promise((resolve, reject) => {
      socket.emit('mediasoup:create-router', this.roomId, async (res) => {
        if (!res.ok) return reject(res.error);
        try {
          this.device = new Device();

          // If server provides TURN URL, pass it to device or RTCPeerConnections later
          this.turnUrl = (window.__env && window.__env.REACT_APP_TURN_URL) || process.env.REACT_APP_TURN_URL || null;

          await this.device.load({ routerRtpCapabilities: res.rtpCapabilities });
          resolve(this.device);
        } catch (err) {
          console.error('device.load failed', err);
          reject(err);
        }
      });
    });
  }

  async createSendTransport() {
    const socket = this.socket;
    return new Promise((resolve, reject) => {
      socket.emit('mediasoup:create-transport', this.roomId, (res) => {
        if (!res.ok) return reject(res.error);
        const params = res.params;

        const transport = this.device.createSendTransport(params);

        transport.on('connect', ({ dtlsParameters }, callback, errback) => {
          socket.emit('mediasoup:connect-transport', this.roomId, params.id, dtlsParameters, (res) => {
            if (res.ok) callback(); else errback(res.error);
          });
        });

        transport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
          try {
            socket.emit('mediasoup:produce', this.roomId, params.id, kind, rtpParameters, (res) => {
              if (res.ok) callback({ id: res.id }); else errback(res.error);
            });
          } catch (e) {
            errback(e);
          }
        });

        this.producerTransport = transport;
        resolve(transport);
      });
    });
  }

  async produceLocalTrack(track) {
    if (!this.producerTransport) await this.createSendTransport();
    const params = { track };
    const producer = await this.producerTransport.produce(params);
    this.producers.set(producer.id, producer);
    return producer;
  }

  // Very basic consume helper — in production handle multiple producers/consumers and pause/resume
  async createRecvTransport() {
    // For simplicity using create-transport again and treating it as recv transport
    const socket = this.socket;
    return new Promise((resolve, reject) => {
      socket.emit('mediasoup:create-transport', this.roomId, (res) => {
        if (!res.ok) return reject(res.error);
        const params = res.params;
        const transport = this.device.createRecvTransport(params);

        transport.on('connect', ({ dtlsParameters }, callback, errback) => {
          socket.emit('mediasoup:connect-transport', this.roomId, params.id, dtlsParameters, (res) => {
            if (res.ok) callback(); else errback(res.error);
          });
        });

        this.consumerTransport = transport;
        resolve(transport);
      });
    });
  }

  async consume(producerId, onTrack) {
    const socket = this.socket;
    if (!this.consumerTransport) await this.createRecvTransport();
    return new Promise((resolve, reject) => {
      socket.emit('mediasoup:consume', this.roomId, this.consumerTransport.id, producerId, this.device.rtpCapabilities, (res) => {
        if (!res.ok) return reject(res.error);
        const params = res.params;
        this.consumerTransport.consume(params).then(consumer => {
          consumer.on('trackended', () => console.log('consumer track ended'));
          consumer.on('transportclose', () => console.log('consumer transport closed'));

          const remoteTrack = consumer.track;
          onTrack(remoteTrack, { id: consumer.id, kind: consumer.kind, producerId: consumer.producerId });
          this.consumers.set(consumer.id, consumer);
          resolve(consumer);
        }).catch(reject);
      });
    });
  }

  close() {
    this.producers.forEach(p => p.close());
    this.consumers.forEach(c => c.close());
    if (this.producerTransport) this.producerTransport.close();
    if (this.consumerTransport) this.consumerTransport.close();
    if (this.socket) this.socket.disconnect();
  }
}
