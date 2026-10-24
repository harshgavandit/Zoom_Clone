import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { request } from 'node:http';
import { test } from 'node:test';
import { gzipSync, deflateSync } from 'node:zlib';

const body = Buffer.from('{"message":"meeting parser check"}');
const expected = JSON.parse(body);
const root = new URL('../', import.meta.url);

// Exercise the application's installed express.json middleware in a separate
// process: an unhandled decompressor error must fail this test, not its runner.
const childSource = `
  import server, { app } from './server/app.js';
  app.post('/__parser_check', (req, res) => {
    process.send({ type: 'parsed' });
    const reply = () => res.json(req.body);
    if (req.complete) reply();
    else req.once('end', reply);
  });
  server.listen(0, '127.0.0.1', () => {
    process.send({ type: 'ready', port: server.address().port });
  });
`;

async function startServer(t) {
  let errors = '';
  const child = spawn(process.execPath, ['--input-type=module', '-e', childSource], {
    cwd: root,
    env: { ...process.env },
    stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
    windowsHide: true,
  });
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', chunk => { errors += chunk; });
  const exited = once(child, 'exit');
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill();
    await exited;
  });
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Parser test server did not start')), 10000);
    child.once('error', reject);
    child.once('exit', code => {
      clearTimeout(timer);
      reject(new Error(`Parser test server exited before readiness (${code}): ${errors}`));
    });
    child.on('message', message => {
      if (message.type === 'ready') {
        clearTimeout(timer);
        resolve(message.port);
      }
    });
  });
  return { child, port, errors: () => errors };
}

function post(server, first, encoding, trailing) {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': first.length + (trailing?.length || 0),
    };
    if (encoding) headers['Content-Encoding'] = encoding;
    const req = request({ host: '127.0.0.1', port: server.port,
      path: '/__parser_check', method: 'POST', headers, agent: false }, res => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { data += chunk; });
      res.on('error', reject);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    const onExit = code => req.destroy(new Error(`Parser process exited (${code}): ${server.errors()}`));
    const onParsed = message => {
      if (message.type === 'parsed') req.end(trailing);
    };
    server.child.once('exit', onExit);
    if (trailing) server.child.on('message', onParsed);
    req.once('close', () => {
      server.child.off('exit', onExit);
      server.child.off('message', onParsed);
    });
    req.on('error', reject);
    req.setTimeout(5000, () => req.destroy(new Error('Compressed request did not finish')));
    if (trailing) req.write(first);
    else req.end(first);
  });
}

const scenarios = [
  { name: 'plain JSON', bytes: body, status: 200 },
  { name: 'valid gzip JSON', bytes: gzipSync(body), encoding: 'gzip', status: 200 },
  { name: 'valid deflate JSON', bytes: deflateSync(body), encoding: 'deflate', status: 200 },
  { name: 'malformed gzip', bytes: Buffer.from('not a gzip stream'), encoding: 'gzip', status: 503 },
  { name: 'malformed deflate', bytes: Buffer.from('not a deflate stream'), encoding: 'deflate', status: 503 },
  { name: 'gzip frame with trailing bytes', encoding: 'gzip', status: 200,
    bytes: Buffer.concat([gzipSync(body), Buffer.from([0]), Buffer.alloc(100 * 1024, 0x58)]) },
  { name: 'deflate frame with delayed trailing bytes', encoding: 'deflate', status: 200,
    bytes: Buffer.concat([deflateSync(body), Buffer.from([0])]), trailing: Buffer.alloc(1024) },
];

for (const scenario of scenarios) {
  test(`JSON parser survives ${scenario.name} and accepts the next request`, { timeout: 15000 }, async t => {
    const server = await startServer(t);
    const response = await post(server, scenario.bytes, scenario.encoding, scenario.trailing);
    assert.equal(response.status, scenario.status);
    if (scenario.status === 200) assert.deepEqual(response.body, expected);
    // Late stream errors can happen after the first response has completed.
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(server.child.exitCode, null, server.errors());
    assert.deepEqual(await post(server, body), { status: 200, body: expected });
  });
}
