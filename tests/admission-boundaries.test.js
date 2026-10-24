import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isIP } from 'node:net';
import vm from 'node:vm';
import { test } from 'node:test';

const source = readFileSync(new URL('../server/app.js', import.meta.url), 'utf8');

// Execute the actual production identity function without constructing a database
// pool or listener. The tests assert trust behavior, not its implementation text.
function clientIdentity(env = {}) {
  const start = source.indexOf('const clientIp =');
  const end = source.indexOf('app.disable(', start);
  return vm.runInNewContext(source.slice(start, end) + '\nclientIp;', { process: { env }, isIP });
}

test('direct and self-hosted auth budgets ignore spoofed forwarding headers', () => {
  const identify = clientIdentity();
  const first = identify({ socket: { remoteAddress: '192.0.2.8' }, headers: { 'x-forwarded-for': '198.51.100.1', 'x-vercel-forwarded-for': '198.51.100.2' } });
  const changed = identify({ socket: { remoteAddress: '192.0.2.8' }, headers: { 'x-forwarded-for': '203.0.113.9', 'x-vercel-forwarded-for': '203.0.113.10' } });
  assert.equal(first, '192.0.2.8');
  assert.equal(changed, first, 'Changing a client header must not create another auth-rate bucket');
});

test('Vercel accepts only its platform header containing a valid IP', () => {
  const identify = clientIdentity({ VERCEL: '1' });
  const request = headers => ({ socket: { remoteAddress: '192.0.2.8' }, headers });
  assert.equal(identify(request({ 'x-forwarded-for': '203.0.113.9', 'x-vercel-forwarded-for': '198.51.100.3' })), '198.51.100.3');
  assert.equal(identify(request({ 'x-vercel-forwarded-for': '2001:db8::10' })), '2001:db8::10');
  for (const value of ['invalid', '', ['198.51.100.3']]) {
    assert.equal(identify(request({ 'x-forwarded-for': '203.0.113.9', 'x-vercel-forwarded-for': value })), '192.0.2.8');
  }
});

// Run the actual connection callback with deterministic transaction scheduling.
// The second transaction is delayed until the first commits, modeling two valid
// joins that raced past an earlier pre-await room check. No SQL or network runs.
function meetingHarness({ commitFails = false, joinFails = false } = {}) {
  const start = source.indexOf("io.on('connection'");
  const end = source.indexOf('const staticDir=', start);
  let failNextJoin = joinFails;
  let connectHandler, connects = 0, releases = 0, rollbacks = 0, cleanupDeletes = 0;
  let resolveCommit;
  const firstCommitted = new Promise(resolve => { resolveCommit = resolve; });
  const memberships = new Set(), handlers = new Map(), errors = [];
  const pool = {
    async connect() {
      const id = ++connects;
      return { release() { releases++; }, async query(sql) {
        if (id === 2 && sql === 'BEGIN') await firstCommitted;
        if (sql === 'ROLLBACK') rollbacks++;
        if (sql === 'COMMIT') {
          if (commitFails) throw new Error('Synthetic commit failure');
          resolveCommit();
        }
        return { rows: sql.startsWith('SELECT count') ? [{ count: 0 }] : [] };
      } };
    },
    async query(sql) { if (sql.startsWith('DELETE FROM zoom_presence')) cleanupDeletes++; return { rows: [] }; }
  };
  const io = { on(event, handler) { connectHandler = handler; }, to() { return { emit() {} }; } };
  const socket = { id: 'one-socket', connected: true, data: {}, handshake: { auth: { clientId: 'x'.repeat(40) } },
    on(event, handler) { handlers.set(event, handler); }, use() {},
    async join(room) { memberships.add(room); if (failNextJoin) { failNextJoin = false; throw new Error('Synthetic adapter join failure'); } },
    async leave(room) { memberships.delete(room); },
    to() { return { emit() {} }; }, emit(event, value) { if (event === 'meeting-error') errors.push(value); }
  };
  vm.runInNewContext(source.slice(start, end), { io, pool, members: async () => [],
    token: () => 'x'.repeat(43), roomPattern: /^[a-zA-Z0-9_-]{3,80}$/, Date, Number, Boolean, JSON, Promise,
    setInterval: () => ({ unref() {} }), clearInterval() {} });
  connectHandler(socket);
  return { socket, memberships, errors, join: handlers.get('join-call'),
    counters: () => ({ connects, releases, rollbacks, cleanupDeletes }) };
}

test('parallel joins on one socket cannot subscribe it to two rooms', async () => {
  const fixture = meetingHarness(), results = [];
  await Promise.all([
    fixture.join('room-alpha', 'Alice', {}, result => results.push(result)),
    fixture.join('room-beta', 'Alice', {}, result => results.push(result)),
  ]);
  assert.deepEqual([...fixture.memberships], ['room-alpha']);
  assert.equal(fixture.socket.data.room, 'room-alpha');
  assert.equal(fixture.counters().connects, 1, 'Overlapping admission must stop before taking another database connection');
  assert.equal(results.filter(result => result.ok).length, 1);
  assert.equal(results.filter(result => result.error).length, 1);
  assert.equal(fixture.socket.data.joining, false);
});

test('failed commit leaves no socket membership or room privileges and releases the connection', async () => {
  const fixture = meetingHarness({ commitFails: true });
  await fixture.join('room-alpha', 'Alice', {}, () => assert.fail('A failed admission must not acknowledge success'));
  assert.equal(fixture.memberships.size, 0);
  assert.equal(fixture.socket.data.room, undefined);
  assert.equal(fixture.socket.data.joining, false);
  assert.equal(fixture.counters().rollbacks, 1);
  assert.equal(fixture.counters().releases, 1);
  assert.equal(fixture.errors.length, 1);
});

test('adapter failure after commit removes committed presence and permits a clean retry', async () => {
  const fixture = meetingHarness({ joinFails: true });
  await fixture.join('room-alpha', 'Alice', {}, () => assert.fail('A failed admission must not acknowledge success'));
  assert.equal(fixture.memberships.size, 0);
  assert.equal(fixture.socket.data.room, undefined);
  assert.equal(fixture.socket.data.joining, false);
  assert.equal(fixture.counters().cleanupDeletes, 1);
  assert.equal(fixture.counters().releases, 1);
  assert.equal(fixture.errors.length, 1);
  let retry;
  await fixture.join('room-beta', 'Alice', {}, result => { retry = result; });
  assert.equal(retry.ok, true);
  assert.deepEqual([...fixture.memberships], ['room-beta']);
  assert.equal(fixture.socket.data.room, 'room-beta');
});
