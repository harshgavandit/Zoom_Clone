import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import server from './environment';
import { api } from './utils/api';
import { copyToClipboard } from './utils/clipboard';

export default function useMeeting() {
  const { url, roomId } = useParams();
  const room = roomId || url;
  const navigate = useNavigate();
  const socketRef = useRef(), socketIdRef = useRef(), localVideoref = useRef(), canvasRef = useRef();
  const peers = useRef(new Map()), cameraStream = useRef(), screenStream = useRef(), recordingStream = useRef();
  const mediaRecorderRef = useRef(), mounted = useRef(true), drawing = useRef(false), lastDraw = useRef(0);
  const iceConfig = useRef({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
  const mediaState = useRef({ video: false, audio: false });
  const participantKey = useRef(crypto.randomUUID());
  const [askForUsername, setAskForUsername] = useState(true), [username, setUsername] = useState('');
  const [video, setVideo] = useState(false), [audio, setAudio] = useState(false), [screen, setScreen] = useState(false);
  const [videos, setVideos] = useState([]), [participants, setParticipants] = useState([]);
  const [showChat, setShowChat] = useState(false), [showParticipants, setShowParticipants] = useState(false), [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false), [recording, setRecording] = useState(false), [reactions, setReactions] = useState([]);
  const [messages, setMessages] = useState([]), [message, setMessage] = useState(''), [newMessages, setNewMessages] = useState(0);
  const [drawColor, setDrawColor] = useState('#006aff');
  const [status, setStatus] = useState('Choose your devices, or join with camera and microphone off.');
  const [error, setError] = useState(''), [connected, setConnected] = useState(false);
  const screenAvailable = Boolean(navigator.mediaDevices?.getDisplayMedia);
  const brushSize = 4;

  function stopTracks(stream) { stream?.getTracks().forEach(track => track.stop()); }
  function clearPeers() { peers.current.forEach(({ pc }) => pc.close()); peers.current.clear(); setVideos([]); }
  function cleanup() {
    socketRef.current?.disconnect(); peers.current.forEach(({ pc }) => pc.close()); peers.current.clear();
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    [cameraStream.current, screenStream.current, recordingStream.current].forEach(stopTracks);
  }
  useEffect(() => {
    mounted.current = true;
    api.get('/ice').then(({ data }) => { iceConfig.current = { iceServers: data.iceServers }; }).catch(() => {});
    return () => { mounted.current = false; cleanup(); };
    // Resources are scoped to a mounted meeting, and released on route changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { if (localVideoref.current) localVideoref.current.srcObject = screenStream.current || cameraStream.current || null; }, [askForUsername, screen]);
  function emit(...args) { if (socketRef.current?.connected) socketRef.current.emit(...args); }
  async function publishTracks() {
    const stream = screenStream.current || cameraStream.current;
    if (localVideoref.current) localVideoref.current.srcObject = stream || null;
    for (const { pc } of peers.current.values()) {
      for (const transceiver of pc.getTransceivers()) {
        const kind = transceiver.receiver.track.kind;
        const track = kind === 'video' ? stream?.getVideoTracks()[0] : cameraStream.current?.getAudioTracks()[0];
        await transceiver.sender.replaceTrack(track || null).catch(() => {});
      }
    }
  }
  async function enableMedia() {
    setError('');
    try {
      let stream;
      try { stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); }
      catch {
        try { stream = await navigator.mediaDevices.getUserMedia({ video: true }); }
        catch { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
      }
      if (!mounted.current) { stopTracks(stream); return; }
      stopTracks(cameraStream.current); cameraStream.current = stream;
      mediaState.current = { video: stream.getVideoTracks().length > 0, audio: stream.getAudioTracks().length > 0 };
      setVideo(mediaState.current.video); setAudio(mediaState.current.audio);
      setStatus('Devices ready. Your camera and microphone can be changed at any time.');
      emit('state-change', 'isVideoOff', !mediaState.current.video); emit('state-change', 'isMuted', !mediaState.current.audio);
      await publishTracks();
    } catch { setError('Camera or microphone unavailable. Check browser permissions, or join with devices off.'); }
  }
  function createPeer(id) {
    if (peers.current.has(id)) return peers.current.get(id);
    const pc = new RTCPeerConnection(iceConfig.current);
    const peer = { pc, makingOffer: false, ignoreOffer: false, settingRemoteAnswer: false, pendingCandidates: [] };
    peers.current.set(id, peer);
    for (const kind of ['audio', 'video']) {
      const stream = kind === 'video' ? screenStream.current || cameraStream.current : cameraStream.current;
      const track = stream?.getTracks().find(t => t.kind === kind);
      pc.addTransceiver(track || kind, { direction: 'sendrecv', ...(track ? { streams: [stream] } : {}) });
    }
    pc.onicecandidate = ({ candidate }) => { if (candidate) emit('signal', id, JSON.stringify({ ice: candidate })); };
    pc.ontrack = ({ track, streams }) => {
      setVideos(previous => {
        const existing = previous.find(v => v.socketId === id);
        const stream = existing?.stream || streams[0] || new MediaStream();
        if (!stream.getTracks().includes(track)) stream.addTrack(track);
        return [...previous.filter(v => v.socketId !== id), { socketId: id, stream }];
      });
    };
    pc.onnegotiationneeded = async () => {
      try { peer.makingOffer = true; await pc.setLocalDescription(); emit('signal', id, JSON.stringify({ sdp: pc.localDescription })); }
      catch { if (pc.signalingState !== 'closed') setError('Unable to negotiate video. Leave and rejoin the meeting.'); }
      finally { peer.makingOffer = false; }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') setError(previous => /^(Unable to connect media|A peer media)/.test(previous) ? '' : previous);
      if (pc.connectionState === 'failed') {
        setError('A peer media connection failed. This network may require a TURN relay. Chat remains available.'); pc.restartIce();
      }
    };
    return peer;
  }
  async function receiveSignal(id, message) {
    try {
      const signal = JSON.parse(message), peer = createPeer(id), { pc } = peer;
      if (signal.sdp) {
        const readyForOffer = !peer.makingOffer && (pc.signalingState === 'stable' || peer.settingRemoteAnswer);
        const collision = signal.sdp.type === 'offer' && !readyForOffer;
        peer.ignoreOffer = socketIdRef.current < id && collision;
        if (peer.ignoreOffer) return;
        peer.settingRemoteAnswer = signal.sdp.type === 'answer';
        await pc.setRemoteDescription(signal.sdp);
        peer.settingRemoteAnswer = false;
        for (const candidate of peer.pendingCandidates.splice(0)) await pc.addIceCandidate(candidate);
        if (signal.sdp.type === 'offer') { await pc.setLocalDescription(); emit('signal', id, JSON.stringify({ sdp: pc.localDescription })); }
      } else if (signal.ice && !peer.ignoreOffer) {
        if (pc.remoteDescription) await pc.addIceCandidate(signal.ice); else peer.pendingCandidates.push(signal.ice);
      }
    } catch {
      const peer = peers.current.get(id);
      if (peer) peer.settingRemoteAnswer = false;
      // Old ICE candidates may arrive during a reconnect or an offer collision.
      // A recovered connection must not retain a transient negotiation warning.
      if (peer && !peer.ignoreOffer && !['connected', 'closed'].includes(peer.pc.connectionState)) setError('Unable to connect media to a participant. Try rejoining the meeting.');
    }
  }
  function connect() {
    if (!username.trim() || socketRef.current) return;
    setError(''); setAskForUsername(false); setStatus('Connecting to the meeting…');
    const socket = io(server || window.location.origin, { path: '/api/index', addTrailingSlash: false, transports: ['websocket'], reconnection: true, auth: { clientId: participantKey.current } });
    socketRef.current = socket;
    socket.on('connect', () => {
      clearPeers(); setMessages([]); socketIdRef.current = socket.id;
      socket.timeout(20000).emit('join-call', room, username.trim(), { isMuted: !mediaState.current.audio, isVideoOff: !mediaState.current.video }, (error, result) => {
        if (error || result?.error) { setError(result?.error || 'Meeting server did not respond. Please leave and try again.'); setConnected(false); return; }
        setConnected(true); setStatus('Connected'); setError(''); setIsHandRaised(false);
      });
    });
    socket.on('connect_error', () => { setConnected(false); setError('Unable to reach the meeting server. Reconnecting…'); });
    socket.on('disconnect', () => { setConnected(false); setStatus('Reconnecting…'); setParticipants([]); clearPeers(); });
    socket.on('meeting-error', setError);
    socket.on('user-joined', (id, clients) => {
      setParticipants(clients);
      const activeIds = new Set(clients.map(p => p.socketId));
      for (const [peerId, peer] of peers.current) {
        if (!activeIds.has(peerId)) { peer.pc.close(); peers.current.delete(peerId); }
      }
      setVideos(previous => previous.filter(v => activeIds.has(v.socketId)));
      clients.filter(p => p.socketId !== socket.id).forEach(p => createPeer(p.socketId));
    });
    socket.on('signal', receiveSignal);
    socket.on('user-left', id => {
      peers.current.get(id)?.pc.close(); peers.current.delete(id);
      setVideos(previous => previous.filter(v => v.socketId !== id)); setParticipants(previous => previous.filter(p => p.socketId !== id));
    });
    socket.on('chat-history', setMessages);
    socket.on('chat-message', (data, sender, socketIdSender) => { setMessages(previous => [...previous.slice(-199), { data, sender }]); if (socketIdSender !== socket.id) setNewMessages(n => n + 1); });
    socket.on('state-changed', (id, type, value) => setParticipants(previous => previous.map(p => p.socketId === id ? { ...p, state: { ...p.state, [type]: value } } : p)));
    socket.on('hand-raised', (id, value) => setParticipants(previous => previous.map(p => p.socketId === id ? { ...p, state: { ...p.state, handRaised: value } } : p)));
    socket.on('reaction-received', (socketId, emoji) => {
      const id = `${Date.now()}-${Math.random()}`;
      setReactions(previous => [...previous.slice(-29), { id, socketId, emoji }]);
      setTimeout(() => { if (mounted.current) setReactions(previous => previous.filter(r => r.id !== id)); }, 2200);
    });
    socket.on('draw-received', paint);
    socket.on('whiteboard-cleared', clearCanvas);
  }
  function handleVideo() {
    if (!cameraStream.current?.getVideoTracks().length) { enableMedia(); return; }
    const value = !mediaState.current.video; mediaState.current.video = value; setVideo(value);
    cameraStream.current.getVideoTracks().forEach(track => { track.enabled = value; }); emit('state-change', 'isVideoOff', !value);
    setParticipants(previous => previous.map(p => p.socketId === socketIdRef.current ? { ...p, state: { ...p.state, isVideoOff: !value } } : p));
  }
  function handleAudio() {
    if (!cameraStream.current?.getAudioTracks().length) { enableMedia(); return; }
    const value = !mediaState.current.audio; mediaState.current.audio = value; setAudio(value);
    cameraStream.current.getAudioTracks().forEach(track => { track.enabled = value; }); emit('state-change', 'isMuted', !value);
    setParticipants(previous => previous.map(p => p.socketId === socketIdRef.current ? { ...p, state: { ...p.state, isMuted: !value } } : p));
  }
  async function stopScreen() { stopTracks(screenStream.current); screenStream.current = null; setScreen(false); await publishTracks(); }
  async function handleScreen() {
    if (screenStream.current) { await stopScreen(); return; }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      if (!mounted.current) { stopTracks(stream); return; }
      screenStream.current = stream; setScreen(true); stream.getVideoTracks()[0].onended = stopScreen; await publishTracks();
    } catch { setError('Screen sharing was cancelled or is unavailable in this browser.'); }
  }
  function clearCanvas() { const canvas = canvasRef.current; if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height); }
  function paint(data) {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); ctx.strokeStyle = data.color; ctx.lineWidth = data.brushSize; ctx.lineCap = 'round';
    if (data.type === 'start') { ctx.beginPath(); ctx.moveTo(data.x * canvas.width, data.y * canvas.height); }
    else { ctx.lineTo(data.x * canvas.width, data.y * canvas.height); ctx.stroke(); }
  }
  function drawingEvent(event, type) {
    const rect = canvasRef.current.getBoundingClientRect();
    const data = { type, x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)), color: drawColor, brushSize };
    paint(data); emit('draw', data);
  }
  function startDrawing(event) { drawing.current = true; drawingEvent(event, 'start'); }
  function draw(event) { if (drawing.current && Date.now() - lastDraw.current > 40) { lastDraw.current = Date.now(); drawingEvent(event, 'draw'); } }
  function stopDrawing() { drawing.current = false; }
  function clearWhiteboard() { clearCanvas(); emit('clear-whiteboard'); }
  function toggleHandRaise() { const next = !isHandRaised; setIsHandRaised(next); emit('raise-hand', next); }
  function sendEmojiReaction(emoji) { emit('reaction', emoji); }
  function sendMessage() { if (message.trim() && connected) { emit('chat-message', message.trim()); setMessage(''); } }
  function handleEndCall() { cleanup(); navigate(localStorage.getItem('token') ? '/home' : '/'); }
  async function toggleRecording() {
    if (recording) { mediaRecorderRef.current?.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      if (!mounted.current) { stopTracks(stream); return; }
      recordingStream.current = stream;
      const recorder = new MediaRecorder(stream), chunks = []; mediaRecorderRef.current = recorder;
      recorder.ondataavailable = ({ data }) => { if (data.size) chunks.push(data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob), link = document.createElement('a');
        const file = `meeting-${room}-${Date.now()}.${recorder.mimeType.includes('mp4') ? 'mp4' : 'webm'}`;
        link.href = url; link.download = file; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        let previous = []; try { previous = JSON.parse(localStorage.getItem('recordings') || '[]'); } catch {}
        localStorage.setItem('recordings', JSON.stringify([{ file, date: new Date().toISOString() }, ...previous].slice(0, 100)));
        stopTracks(stream); recordingStream.current = null; if (mounted.current) setRecording(false);
      };
      stream.getVideoTracks()[0].onended = () => { if (recorder.state === 'recording') recorder.stop(); };
      recorder.start(1000); setRecording(true);
    } catch { setError('Screen recording was cancelled or is unavailable in this browser.'); }
  }
  async function copyInvite() { setStatus(await copyToClipboard(window.location.href) ? 'Invite link copied' : 'Copy the meeting URL from your address bar.'); }
  const getParticipantInfo = id => participants.find(p => p.socketId === id) || { username: 'Guest', state: {} };
  return { socketIdRef, localVideoref, canvasRef, askForUsername, username, setUsername, video, audio, screen, screenAvailable,
    videos, participants, showChat, setShowChat, showParticipants, setShowParticipants, showWhiteboard, setShowWhiteboard,
    isHandRaised, recording, reactions, messages, message, setMessage, newMessages, setNewMessages, drawColor, setDrawColor,
    enableMedia, connect, handleVideo, handleAudio, handleScreen, handleEndCall, sendMessage, startDrawing, draw, stopDrawing,
    clearWhiteboard, toggleHandRaise, sendEmojiReaction, toggleRecording, getParticipantInfo, status, error, connected, room, copyInvite };
}
