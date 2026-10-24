import express from 'express';
import { createServer } from 'node:http';
import { isIP } from 'node:net';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/postgres-adapter';

export const app = express();
const server = createServer(app);
// LISTEN/NOTIFY requires a direct database connection rather than a transaction pooler.
const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const connectionString = databaseUrl?.replace('sslmode=require', 'sslmode=verify-full');
export const pool = new pg.Pool({ connectionString, max: 5, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000 });
pool.on('error', () => console.error('Database connection interrupted'));
let schemaPromise;
export function ready() {
  if (!connectionString) return Promise.reject(new Error('Database is not configured'));
  if (!schemaPromise) schemaPromise = pool.query(`
    CREATE TABLE IF NOT EXISTS zoom_users (
      id uuid PRIMARY KEY, username text UNIQUE NOT NULL, name text NOT NULL,
      password_hash text NOT NULL, created_at timestamptz DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS zoom_sessions (
      token_hash text PRIMARY KEY, refresh_hash text UNIQUE NOT NULL,
      user_id uuid REFERENCES zoom_users(id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL, refresh_expires_at timestamptz NOT NULL
    );
    CREATE TABLE IF NOT EXISTS zoom_history (
      id uuid PRIMARY KEY, user_id uuid REFERENCES zoom_users(id) ON DELETE CASCADE,
      meeting_code text NOT NULL, date timestamptz DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS zoom_history_user ON zoom_history(user_id, date DESC);
    CREATE TABLE IF NOT EXISTS zoom_messages (
      id bigserial PRIMARY KEY, room text NOT NULL, sender text NOT NULL,
      message text NOT NULL, socket_id text NOT NULL, created_at timestamptz DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS zoom_messages_room ON zoom_messages(room, id DESC);
    CREATE TABLE IF NOT EXISTS zoom_limits (key text PRIMARY KEY, count integer NOT NULL, expires_at timestamptz NOT NULL);
    CREATE TABLE IF NOT EXISTS zoom_presence (
      socket_id text PRIMARY KEY, client_id text UNIQUE NOT NULL, room text NOT NULL,
      username text NOT NULL, state jsonb NOT NULL, expires_at timestamptz NOT NULL
    );
    CREATE INDEX IF NOT EXISTS zoom_presence_room ON zoom_presence(room,expires_at);
    CREATE TABLE IF NOT EXISTS socket_io_attachments (
      id bigserial UNIQUE, created_at timestamptz DEFAULT now(), payload bytea
    );
  `).catch(error => { schemaPromise = null; throw error; });
  return schemaPromise;
}
const hash = value => createHash('sha256').update(value).digest('hex');
const token = () => randomBytes(32).toString('base64url');
const roomPattern = /^[a-zA-Z0-9_-]{3,80}$/;
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const publicUser = row => ({ id: row.id, username: row.username, name: row.name, role: 'user' });
const clientIp = req => {
  // Direct/self-hosted clients cannot choose their authentication-rate bucket.
  // Vercel overwrites this platform header; generic forwarding headers are untrusted.
  const forwarded = process.env.VERCEL === '1' ? req.headers['x-vercel-forwarded-for'] : undefined;
  const candidate = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '';
  return isIP(candidate) ? candidate : req.socket.remoteAddress || 'unknown';
};
app.disable('x-powered-by');
app.use(express.json({ limit: '40kb' }));
app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
app.get('/api/health', wrap(async (req, res) => { await ready(); await pool.query('SELECT 1'); res.json({ status: 'ok', database: 'connected', media: 'peer-to-peer' }); }));
app.use('/api', (req, res, next) => ready().then(() => next(), next));

async function throttle(key, limit, seconds) {
  const result = await pool.query(`INSERT INTO zoom_limits(key,count,expires_at) VALUES($1,1,now()+$2*interval '1 second')
    ON CONFLICT(key) DO UPDATE SET count=CASE WHEN zoom_limits.expires_at<now() THEN 1 ELSE zoom_limits.count+1 END,
    expires_at=CASE WHEN zoom_limits.expires_at<now() THEN EXCLUDED.expires_at ELSE zoom_limits.expires_at END RETURNING count`, [key, seconds]);
  return result.rows[0].count <= limit;
}
app.use('/api/v1/auth', (req, res, next) => {
  if (!['/login','/register'].includes(req.path)) return next();
  throttle(`auth:${hash(clientIp(req))}`, 30, 900).then(allowed => allowed ? next() : res.status(429).json({ message: 'Too many attempts. Try again in 15 minutes.' }), next);
});
async function authenticate(req, res, next) {
  try {
    const supplied = req.headers.authorization?.match(/^Bearer ([\w-]{43})$/)?.[1];
    if (!supplied) return res.status(401).json({ message: 'Please sign in again.' });
    const { rows } = await pool.query(`SELECT u.*,s.token_hash FROM zoom_sessions s JOIN zoom_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()`, [hash(supplied)]);
    if (!rows[0]) return res.status(401).json({ message: 'Your session expired. Please sign in again.' });
    req.user = rows[0]; next();
  } catch (error) { next(error); }
}

app.post('/api/v1/auth/register', wrap(async (req,res) => {
  const { password, name } = req.body;
  const username = typeof req.body.username === 'string' ? req.body.username.trim().toLowerCase() : '';
  if (!/^[a-z0-9_-]{3,20}$/.test(username)) return res.status(400).json({ message: 'Username must be 3–20 letters, digits, hyphens, or underscores.' });
  if (typeof password !== 'string' || Buffer.byteLength(password)>72 || password.length<8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) return res.status(400).json({ message: 'Use 8–72 characters with uppercase, lowercase, and a number.' });
  if (typeof name !== 'string' || !name.trim() || name.length>80) return res.status(400).json({ message: 'Enter a name of 1–80 characters.' });
  try {
    await pool.query('INSERT INTO zoom_users(id,username,name,password_hash) VALUES($1,$2,$3,$4)', [randomUUID(),username,name.trim(),await bcrypt.hash(password,12)]);
  } catch (error) { if (error.code==='23505') return res.status(409).json({ message: 'Username already taken.' }); throw error; }
  res.status(201).json({ message: 'Account created. You can now sign in.' });
}));
app.post('/api/v1/auth/login', wrap(async (req,res) => {
  const username = typeof req.body.username === 'string' ? req.body.username.trim().toLowerCase() : '';
  const password = req.body.password;
  if (typeof password!=='string' || Buffer.byteLength(password)>72) return res.status(400).json({message:'Enter a valid username and password.'});
  const { rows } = await pool.query('SELECT * FROM zoom_users WHERE username=$1',[username]);
  const user = rows[0];
  if (!user || !await bcrypt.compare(password,user.password_hash)) return res.status(401).json({message:'Invalid username or password.'});
  const accessToken=token(), refreshToken=token();
  await pool.query(`INSERT INTO zoom_sessions(token_hash,refresh_hash,user_id,expires_at,refresh_expires_at) VALUES($1,$2,$3,now()+interval '1 hour',now()+interval '7 days')`,[hash(accessToken),hash(refreshToken),user.id]);
  res.json({accessToken,refreshToken,user:publicUser(user)});
}));
app.post('/api/v1/auth/refresh',wrap(async(req,res)=>{
  if(typeof req.body.refreshToken!=='string' || req.body.refreshToken.length!==43) return res.status(401).json({message:'Please sign in again.'});
  const accessToken=token(),refreshToken=token();
  const {rowCount}=await pool.query(`UPDATE zoom_sessions SET token_hash=$1,refresh_hash=$2,expires_at=now()+interval '1 hour' WHERE refresh_hash=$3 AND refresh_expires_at>now()`,[hash(accessToken),hash(refreshToken),hash(req.body.refreshToken)]);
  if(!rowCount) return res.status(401).json({message:'Please sign in again.'});
  res.json({accessToken,refreshToken});
}));
app.post('/api/v1/auth/logout',authenticate,wrap(async(req,res)=>{
  await pool.query('DELETE FROM zoom_sessions WHERE token_hash=$1',[req.user.token_hash]);res.json({message:'Signed out.'});
}));
app.get(['/api/v1/auth/get_all_activity','/api/v1/users/get_all_activity'],authenticate,wrap(async(req,res)=>{
  const {rows}=await pool.query('SELECT id AS _id,meeting_code AS "meetingCode",date FROM zoom_history WHERE user_id=$1 ORDER BY date DESC LIMIT 100',[req.user.id]);res.json(rows);
}));
app.post(['/api/v1/auth/add_to_activity','/api/v1/users/add_to_activity'],authenticate,wrap(async(req,res)=>{
  if(typeof req.body.meeting_code!=='string'||!roomPattern.test(req.body.meeting_code)) return res.status(400).json({message:'Use a meeting code with 3–80 letters, digits, hyphens, or underscores.'});
  await pool.query('INSERT INTO zoom_history(id,user_id,meeting_code) VALUES($1,$2,$3)',[randomUUID(),req.user.id,req.body.meeting_code]);res.status(201).json({message:'Meeting saved.'});
}));
app.get('/api/v1/recordings',(req,res)=>res.json([]));
app.get('/api/v1/system/info',(req,res)=>res.json({server:'Apna Video Call on Vercel',version:'1.0.0',media:'Peer-to-peer WebRTC',storage:'Postgres',turnConfigured:Boolean(process.env.TURN_URL),turnUrl:process.env.TURN_URL||null}));
app.get('/api/v1/ice',(req,res)=>{
  const iceServers=[{urls:'stun:stun.l.google.com:19302'}];
  if(process.env.TURN_URL&&process.env.TURN_USERNAME&&process.env.TURN_CREDENTIAL) iceServers.push({urls:process.env.TURN_URL,username:process.env.TURN_USERNAME,credential:process.env.TURN_CREDENTIAL});
  res.json({iceServers,turnConfigured:iceServers.length>1});
});
app.use('/api',(req,res)=>res.status(404).json({message:'API route not found.'}));

export const io=new Server(server,{path:'/api/index',addTrailingSlash:false,transports:['websocket'],maxHttpBufferSize:65536,serveClient:false,
  allowRequest:(req,callback)=>{
    const origin=req.headers.origin;
    callback(null,!origin||origin===`https://${req.headers.host}`||(!process.env.VERCEL&&/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)));
  }
});
io.adapter(createAdapter(pool,{channelPrefix:'zoom-clone',tableName:'socket_io_attachments',heartbeatInterval:5000,heartbeatTimeout:12000}));
io.use((socket,next)=>ready().then(()=>next(),()=>next(new Error('Meeting service unavailable. Please try again.'))));
// Presence must not query other function instances: HTTP-only instances can be
// suspended by Vercel while their distributed adapter still appears alive.
const members=async room=>(await pool.query('SELECT socket_id AS "socketId",username,state FROM zoom_presence WHERE room=$1 AND expires_at>now() ORDER BY socket_id',[room])).rows;
io.on('connection',socket=>{
  const safe=fn=>(...args)=>Promise.resolve(fn(...args)).catch(()=>socket.emit('meeting-error','The meeting service is temporarily unavailable.'));
  let rateStart=Date.now(),events=0;
  socket.use((packet,next)=>{
    if(Date.now()-rateStart>10000){rateStart=Date.now();events=0;}
    if(++events>400) return next(new Error('Too many meeting events.'));
    next();
  });
  socket.on('error',()=>{});
  socket.on('join-call',safe(async(room,username,initialState={},ack=()=>{})=>{
    if(socket.data.room) return ack({ok:true});
    if(socket.data.joining) return ack({error:'A meeting join is already in progress.'});
    if(typeof room!=='string'||!roomPattern.test(room)||typeof username!=='string'||!username.trim()||username.length>80) return ack({error:'Enter a valid meeting code and display name.'});
    const suppliedId=socket.handshake.auth?.clientId;
    const clientId=typeof suppliedId==='string'&&/^[\w-]{32,80}$/.test(suppliedId)?suppliedId:token();
    const state={handRaised:false,isMuted:Boolean(initialState?.isMuted),isVideoOff:Boolean(initialState?.isVideoOff)};
    // Reserve admission synchronously: per-room database locks cannot serialize
    // two simultaneous requests on this socket targeting different rooms.
    socket.data.joining=true;
    let transaction,committed=false;
    try {
      transaction=await pool.connect();
      await transaction.query('BEGIN');
      await transaction.query('SELECT pg_advisory_xact_lock(hashtext($1))',[room]);
      // A reconnect replaces this tab's previous lease, including after an
      // abrupt function shutdown that could not run disconnect cleanup.
      await transaction.query('DELETE FROM zoom_presence WHERE client_id=$1 OR expires_at<now()',[clientId]);
      const count=await transaction.query('SELECT count(*)::int AS count FROM zoom_presence WHERE room=$1',[room]);
      if(count.rows[0].count>=6){await transaction.query('ROLLBACK');return ack({error:'This meeting is full (6 participants).'});}
      await transaction.query(`INSERT INTO zoom_presence(socket_id,client_id,room,username,state,expires_at) VALUES($1,$2,$3,$4,$5,now()+interval '90 seconds')`,[socket.id,clientId,room,username.trim(),state]);
      await transaction.query('COMMIT');
      committed=true;
      await socket.join(room);
      if(!socket.connected) throw new Error('Participant disconnected during admission');
      socket.data.room=room;socket.data.username=username.trim();socket.data.state=state;
    }catch(error){
      if(transaction&&!committed) await transaction.query('ROLLBACK').catch(()=>{});
      // An adapter failure may happen after joining; remove that subscription
      // and any committed lease before allowing another admission attempt.
      await Promise.resolve().then(()=>socket.leave(room)).catch(()=>{});
      if(committed) await pool.query('DELETE FROM zoom_presence WHERE socket_id=$1',[socket.id]).catch(()=>{});
      delete socket.data.room;delete socket.data.username;delete socket.data.state;
      throw error;
    }finally{transaction?.release();socket.data.joining=false;}
    const clients=await members(room);
    io.to(room).emit('user-joined',socket.id,clients);
    const {rows}=await pool.query(`SELECT sender,message,socket_id FROM zoom_messages WHERE room=$1 AND created_at>now()-interval '24 hours' ORDER BY id DESC LIMIT 100`,[room]);
    socket.emit('chat-history',rows.reverse().map(m=>({sender:m.sender,data:m.message,socketIdSender:m.socket_id})));
    ack({ok:true});
  }));
  socket.on('signal',safe(async(toId,message)=>{
    if(!socket.data.room||typeof message!=='string'||message.length>60000) return;
    if(!(await members(socket.data.room)).some(s=>s.socketId===toId)) return;
    try{const signal=JSON.parse(message);if(!signal.sdp&&!signal.ice)return;}catch{return;}
    io.to(toId).emit('signal',socket.id,message);
  }));
  socket.on('chat-message',safe(async data=>{
    if(!socket.data.room||typeof data!=='string'||!data.trim()||data.length>500)return;
    await pool.query('INSERT INTO zoom_messages(room,sender,message,socket_id) VALUES($1,$2,$3,$4)',[socket.data.room,socket.data.username,data.trim(),socket.id]);
    io.to(socket.data.room).emit('chat-message',data.trim(),socket.data.username,socket.id);
  }));
  socket.on('state-change',safe(async(type,value)=>{
    if(!socket.data.room||!['isMuted','isVideoOff'].includes(type)||typeof value!=='boolean')return;
    socket.data.state[type]=value;
    await pool.query('UPDATE zoom_presence SET state=$1 WHERE socket_id=$2',[socket.data.state,socket.id]);
    socket.to(socket.data.room).emit('state-changed',socket.id,type,value);
  }));
  socket.on('raise-hand',safe(async value=>{
    if(!socket.data.room||typeof value!=='boolean')return;
    socket.data.state.handRaised=value;
    await pool.query('UPDATE zoom_presence SET state=$1 WHERE socket_id=$2',[socket.data.state,socket.id]);
    io.to(socket.data.room).emit('hand-raised',socket.id,value);
  }));
  socket.on('reaction',emoji=>{if(socket.data.room&&['👍','👏','❤️','😂','🎉'].includes(emoji))io.to(socket.data.room).emit('reaction-received',socket.id,emoji);});
  socket.on('draw',data=>{
    if(!socket.data.room||!data||!['start','draw'].includes(data.type)||!Number.isFinite(data.x)||!Number.isFinite(data.y)||data.x<0||data.x>1||data.y<0||data.y>1||!/^#[0-9a-f]{6}$/i.test(data.color)||!Number.isFinite(data.brushSize)||data.brushSize<1||data.brushSize>20)return;
    socket.to(socket.data.room).emit('draw-received',data);
  });
  socket.on('clear-whiteboard',()=>{if(socket.data.room)socket.to(socket.data.room).emit('whiteboard-cleared');});
  const heartbeat=setInterval(()=>{
    if(socket.data.room)pool.query("UPDATE zoom_presence SET expires_at=now()+interval '90 seconds' WHERE socket_id=$1",[socket.id]).catch(()=>{});
  },20000);
  heartbeat.unref?.();
  socket.on('disconnect',()=>{
    clearInterval(heartbeat);
    if(socket.data.room){socket.to(socket.data.room).emit('user-left',socket.id);pool.query('DELETE FROM zoom_presence WHERE socket_id=$1',[socket.id]).catch(()=>{});}
  });
});
const staticDir=fileURLToPath(new URL('../frontend/build/',import.meta.url));
app.use(express.static(staticDir));
app.get('*',(req,res)=>res.sendFile(path.join(staticDir,'index.html')));
app.use((error,req,res,next)=>{
  if(res.headersSent)return next(error);
  console.error('Request failed:',error.code||error.name);
  res.status(error.type==='entity.too.large'?413:503).json({message:'The service is temporarily unavailable. Please try again.'});
});
export default server;
