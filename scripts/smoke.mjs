import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { io } from 'socket.io-client';

export async function smoke(base = process.env.BASE_URL || 'http://localhost:8000', secondary = process.env.SECONDARY_URL || base) {
  let checks = 0;
  const pass = name => { checks++; console.log(`PASS ${name}`); };
  const request = async (route, method = 'GET', body, accessToken) => {
    const response = await fetch(`${base}${route}`, { method, headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30000) });
    const data = await response.json(); return { status: response.status, data };
  };
  const expect = (socket, event, timeout = 20000) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.off(event, handler); reject(new Error(`Timed out waiting for ${event}`)); }, timeout);
    const handler = (...args) => { clearTimeout(timer); resolve(args); }; socket.once(event, handler);
  });
  const connect = async (url) => {
    const socket = io(url, { path: '/api/index', addTrailingSlash: false, transports: ['websocket'], reconnection: false, timeout: 20000 });
    await new Promise((resolve,reject) => { socket.once('connect',resolve); socket.once('connect_error',error => { socket.disconnect(); reject(error); }); }); return socket;
  };
  const ack = (socket, ...args) => new Promise((resolve, reject) => socket.timeout(20000).emit(...args, (error, result) => error ? reject(error) : resolve(result)));
  const stamp = randomBytes(5).toString('hex'), username = `codex_${stamp}`, password = `Test-${randomBytes(12).toString('base64url')}A1`;
  const room = `smoke-${stamp}`, sockets = [];
  const authPath = '/api/v1/auth';
  try {
    let result = await request('/api/health'); assert.equal(result.status, 200); assert.equal(result.data.database, 'connected'); pass('database readiness');
    result = await request('/api/v1/users/get_all_activity'); assert.equal(result.status, 401); pass('history requires authentication');
    result = await request(`${authPath}/register`, 'POST', { username, name: 'Synthetic Test', password: 'weak' }); assert.equal(result.status, 400); pass('password validation');
    result = await request(`${authPath}/register`, 'POST', { username, name: 'Synthetic Test', password }); assert.equal(result.status, 201); pass('registration');
    result = await request(`${authPath}/register`, 'POST', { username, name: 'Synthetic Test', password }); assert.equal(result.status, 409); pass('duplicate account protection');
    result = await request(`${authPath}/login`, 'POST', { username, password: `${password}wrong` }); assert.equal(result.status, 401); pass('invalid login rejected');
    result = await request(`${authPath}/login`, 'POST', { username: username.toUpperCase(), password }); assert.equal(result.status, 200); let session = result.data; pass('case-normalized sign-in');
    result = await request('/api/v1/users/add_to_activity', 'POST', { meeting_code: '../auth' }, session.accessToken); assert.equal(result.status, 400); pass('invalid meeting code rejected');
    result = await request('/api/v1/users/add_to_activity', 'POST', { meeting_code: room }, session.accessToken); assert.equal(result.status, 201);
    result = await request('/api/v1/users/get_all_activity', 'GET', undefined, session.accessToken); assert(result.data.some(item => item.meetingCode === room)); pass('persistent meeting history');
    const old = session.accessToken, oldRefresh = session.refreshToken;
    result = await request(`${authPath}/refresh`, 'POST', { refreshToken: oldRefresh }); assert.equal(result.status, 200); session = result.data;
    assert.equal((await request('/api/v1/users/get_all_activity', 'GET', undefined, old)).status, 401);
    assert.equal((await request(`${authPath}/refresh`, 'POST', { refreshToken: oldRefresh })).status, 401); pass('token rotation and refresh replay protection');
    assert.equal((await request('/api/v1/users/get_all_activity', 'GET', undefined, session.accessToken)).status, 200);
    assert.equal((await request(`${authPath}/logout`, 'POST', {}, session.accessToken)).status, 200);
    assert.equal((await request('/api/v1/users/get_all_activity', 'GET', undefined, session.accessToken)).status, 401);
    assert.equal((await request(`${authPath}/refresh`, 'POST', { refreshToken: session.refreshToken })).status, 401); pass('logout revokes access and refresh tokens');
    const a = await connect(base); sockets.push(a);
    const b = await connect(secondary); sockets.push(b);
    const c = await connect(base); sockets.push(c);
    assert((await ack(a, 'join-call', room, 'Alice', {})).ok);
    const joined = expect(a, 'user-joined'); assert((await ack(b, 'join-call', room, 'Bob', {})).ok);
    const [, participants] = await joined; assert.equal(participants.length, 2); pass('two-participant presence across servers');
    assert((await ack(c, 'join-call', `${room}-isolated`, 'Outsider', {})).ok);
    let leaked = false; c.on('chat-message', () => { leaked = true; }); c.on('signal', () => { leaked = true; });
    const chatA = expect(a, 'chat-message'), chatB = expect(b, 'chat-message'); a.emit('chat-message', 'Synthetic end-to-end message', 'Spoofed name');
    assert.equal((await chatA)[1], 'Alice'); assert.equal((await chatB)[0], 'Synthetic end-to-end message'); pass('chat delivery with server-owned identity');
    const state = expect(b, 'state-changed'); a.emit('state-change', 'isMuted', true); assert.deepEqual((await state).slice(1), ['isMuted', true]); pass('mute state synchronization');
    const hand = expect(b, 'hand-raised'); a.emit('raise-hand', true); assert.equal((await hand)[1], true); pass('raised hands');
    const reaction = expect(b, 'reaction-received'); a.emit('reaction', '👍'); assert.equal((await reaction)[1], '👍'); pass('emoji reactions');
    const drawing = expect(b, 'draw-received'); a.emit('draw', { type: 'start', x: 0.2, y: 0.3, color: '#006aff', brushSize: 4 }); assert.equal((await drawing)[0].x, 0.2); pass('whiteboard drawing');
    const clear = expect(b, 'whiteboard-cleared'); a.emit('clear-whiteboard'); await clear; pass('whiteboard clear synchronization');
    const signaling = expect(b, 'signal'); a.emit('signal', b.id, JSON.stringify({ sdp: { type: 'offer', sdp: 'synthetic-negotiation' } })); assert.equal((await signaling)[0], a.id); pass('peer signaling across instances');
    a.emit('signal', c.id, JSON.stringify({ ice: { candidate: 'synthetic' } }));
    const d = await connect(secondary); sockets.push(d); const history = expect(d, 'chat-history');
    assert((await ack(d, 'join-call', room, 'Returning participant', {})).ok); assert((await history)[0].some(m => m.data === 'Synthetic end-to-end message')); pass('chat recovery for late joins');
    const left = expect(a, 'user-left'); b.disconnect(); assert((await left)[0]); pass('participant departure cleanup');
    assert.equal(leaked, false); pass('cross-room chat and signaling isolation');
    result = await request('/api/v1/ice'); assert(Array.isArray(result.data.iceServers)); pass('ICE configuration');
    result = await request('/api/not-a-route'); assert.equal(result.status, 404); pass('unknown API returns JSON 404');
    console.log(`${checks} end-to-end checks passed.`); return checks;
  } finally { sockets.forEach(socket => socket.disconnect()); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  smoke().then(() => process.exit(0), error => { console.error(error.message); process.exit(1); });
}
