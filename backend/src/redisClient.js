// redisClient.js - Redis integration for presence, pub/sub, job queues
import Redis from 'ioredis';
import Queue from 'bull';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Presence store: tracks active participants
export async function setPresence(roomId, userId, data) {
  const key = `presence:${roomId}:${userId}`;
  await redis.setex(key, 300, JSON.stringify(data)); // 5 min TTL
}

export async function getPresence(roomId) {
  const keys = await redis.keys(`presence:${roomId}:*`);
  const presence = {};
  for (const key of keys) {
    const userId = key.split(':')[2];
    const data = await redis.get(key);
    presence[userId] = JSON.parse(data);
  }
  return presence;
}

export async function removePresence(roomId, userId) {
  await redis.del(`presence:${roomId}:${userId}`);
}

// Pub/Sub for real-time room events
export const pubsub = redis.duplicate();

export async function publishRoomEvent(roomId, event, data) {
  await redis.publish(`room:${roomId}`, JSON.stringify({ event, data, timestamp: Date.now() }));
}

export function subscribeToRoom(roomId, handler) {
  const subscriber = redis.duplicate();
  subscriber.subscribe(`room:${roomId}`, (err, count) => {
    if (err) console.error('Redis subscribe error', err);
  });
  subscriber.on('message', (channel, message) => {
    try {
      const payload = JSON.parse(message);
      handler(payload);
    } catch (e) { console.error('Redis message parse error', e); }
  });
  return subscriber;
}

// Job queues for background tasks (e.g., recording, transcoding)
export const recordingQueue = new Queue('recording', process.env.REDIS_URL || 'redis://localhost:6379');
export const transcodingQueue = new Queue('transcoding', process.env.REDIS_URL || 'redis://localhost:6379');

recordingQueue.process(async (job) => {
  console.log('Processing recording job', job.data);
  // Implement recording logic here
});

transcodingQueue.process(async (job) => {
  console.log('Processing transcoding job', job.data);
  // Implement transcoding logic here
});

export default redis;
