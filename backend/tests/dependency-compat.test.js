import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import bcrypt from 'bcrypt';
import { createServer } from 'node:http';
import { Server as SocketServer } from 'socket.io';
import { User } from '../src/models/user.model.js';
import { login, register } from '../src/controllers/user.controller.js';
import { getWorker } from '../src/mediasoupServer.js';

// Fixed $2b$ hash generated with the established bcrypt format, independent of
// the native bcrypt version under test. No real account or database is used.
const password = 'HistoricalPassword42!';
const storedHash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeoSViVXYiqZZYENdB0xbUNtaWvRn2WpS';
const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test('bcrypt preserves stored hashes and async hash/compare behavior', async () => {
  assert.equal(await bcrypt.compare(password, storedHash), true);
  assert.equal(await bcrypt.compare('WrongPassword42!', storedHash), false);
  const fresh = await bcrypt.hash(password, 10);
  assert.equal(bcrypt.getRounds(fresh), 10);
  assert.equal(await bcrypt.compare(password, fresh), true);
  assert.equal(await bcrypt.compare('WrongPassword42!', fresh), false);
});

test('Mongoose user schema still normalizes and validates without connecting', async () => {
  const user = new User({ name: 'Legacy Test', username: '  OLD_USER ', password: storedHash });
  await user.validate();
  assert.equal(user.username, 'old_user');
  assert.equal(user.role, 'user');
  await assert.rejects(new User({ name: 'Legacy Test', username: 'ab', password: storedHash }).validate(),
    error => error.name === 'ValidationError' && Boolean(error.errors.username));
});

test('existing registration and login controllers retain their bcrypt contract', async t => {
  t.after(() => mock.restoreAll());
  let saved;
  mock.method(User, 'findOne', async () => null);
  mock.method(User.prototype, 'save', async function () {
    await this.validate();
    saved = this;
    return this;
  });
  const registered = response();
  await register({ body: { name: 'Offline Test', username: 'offline_user', password } }, registered);
  assert.equal(registered.statusCode, 201);
  assert.notEqual(saved.password, password);
  assert.equal(await bcrypt.compare(password, saved.password), true);

  User.findOne.mock.mockImplementation(async () => ({ username: 'offline_user', password: storedHash, save: async () => {} }));
  const signedIn = response();
  await login({ body: { username: 'offline_user', password } }, signedIn);
  assert.equal(signedIn.statusCode, 200);
  assert.equal(typeof signedIn.body.token, 'string');
  const refused = response();
  await login({ body: { username: 'offline_user', password: 'WrongPassword42!' } }, refused);
  assert.equal(refused.statusCode, 401);
});

test('used Socket.IO and mediasoup modules remain importable without starting workers', async () => {
  const http = createServer();
  const io = new SocketServer(http);
  await new Promise(resolve => io.close(resolve));
  assert.throws(() => getWorker(), /No mediasoup workers initialized/);
  const route = await import('../src/routes/auth.routes.js');
  assert.equal(typeof route.default, 'function');
});
