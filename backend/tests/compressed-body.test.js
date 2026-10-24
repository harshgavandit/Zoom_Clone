import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { request } from 'node:http';
import { test } from 'node:test';
import { gzipSync, deflateSync } from 'node:zlib';

test('historical Express parsers keep compressed requests bounded and recover after failures', { timeout: 20000 }, async t => {
  const child = spawn(process.execPath, ['--input-type=module', '-e', `
    import express from 'express';
    const app = express();
    app.use(express.json({ limit: '40kb' }));
    app.use(express.urlencoded({ limit: '40kb', extended: true }));
    app.post('/', (req,res) => {
      const reply = () => res.json(req.body);
      if (req.complete) reply(); else req.once('end', reply);
      process.send({ type: 'parsed' });
    });
    app.use((error,req,res,next) => res.status(error.status || 500).json({ error: 'body rejected' }));
    const server = app.listen(0, '127.0.0.1', () => process.send({ type: 'ready', port: server.address().port }));
  `], { cwd: new URL('../', import.meta.url), stdio: ['ignore', 'ignore', 'pipe', 'ipc'], windowsHide: true });
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', text => { stderr += text; });
  const exited = once(child, 'exit');
  t.after(async () => { if (child.exitCode === null && child.signalCode === null) child.kill(); await exited; });
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Historical parser did not start')), 10000);
    child.once('error', reject);
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`Historical parser exited (${code}): ${stderr}`)); });
    child.on('message', message => { if (message.type === 'ready') { clearTimeout(timer); resolve(message.port); } });
  });
  const send = (body, encoding, contentType = 'application/json', trailing) => new Promise((resolve,reject) => {
    const req = request({ host: '127.0.0.1', port, path: '/', method: 'POST', agent: false,
      headers: { 'Content-Type': contentType, 'Content-Length': body.length + (trailing?.length || 0), ...(encoding ? { 'Content-Encoding': encoding } : {}) } }, res => {
      let text = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { text += chunk; });
      res.on('error', reject);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(text) }); } catch (error) { reject(error); } });
    });
    const onParsed = message => { if (message.type === 'parsed') req.end(trailing); };
    const onExit = code => req.destroy(new Error(`Historical parser exited (${code}): ${stderr}`));
    child.once('exit', onExit);
    if (trailing) child.on('message', onParsed);
    req.once('close', () => { child.off('exit', onExit); child.off('message', onParsed); });
    req.on('error', reject);
    req.setTimeout(5000, () => req.destroy(new Error('Historical parser request did not finish')));
    if (trailing) req.write(body); else req.end(body);
  });
  const json = Buffer.from('{"message":"legacy control"}');
  const expected = { status: 200, body: JSON.parse(json) };
  for (const encoding of ['gzip', 'deflate']) {
    const compress = encoding === 'gzip' ? gzipSync : deflateSync;
    assert.deepEqual(await send(compress(json), encoding), expected);
    assert.equal((await send(Buffer.from('invalid compressed bytes'), encoding)).status, 400);
    assert.deepEqual(await send(json), expected);
  }
  assert.deepEqual(await send(gzipSync(Buffer.from('message=form+control')), 'gzip', 'application/x-www-form-urlencoded'),
    { status: 200, body: { message: 'form control' } });
  assert.equal((await send(gzipSync(Buffer.from(JSON.stringify({ message: 'x'.repeat(41000) }))), 'gzip')).status, 413);
  assert.deepEqual(await send(Buffer.concat([gzipSync(json), Buffer.from([0]), Buffer.alloc(100 * 1024, 0x58)]), 'gzip'), expected);
  assert.deepEqual(await send(Buffer.concat([deflateSync(json), Buffer.from([0])]), 'deflate', 'application/json', Buffer.alloc(1024)), expected);
  await new Promise(resolve => setTimeout(resolve, 100));
  assert.equal(child.exitCode, null, stderr);
  assert.deepEqual(await send(json), expected);
});
