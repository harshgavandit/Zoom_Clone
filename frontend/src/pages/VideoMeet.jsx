import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField, Button, Box, Tooltip, Typography, Paper } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import PanToolIcon from '@mui/icons-material/PanTool'
import GestureIcon from '@mui/icons-material/Gesture'
import PeopleIcon from '@mui/icons-material/People'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import StopIcon from '@mui/icons-material/Stop'
import CloseIcon from '@mui/icons-material/Close'
import SendIcon from '@mui/icons-material/Send'
import server from '../environment';
import styles from "../styles/videoComponent.module.css";

const server_url = server;
let connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {
    const socketRef = useRef();
    const socketIdRef = useRef();
    const localVideoref = useRef();
    const canvasRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);

    // Media states
    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [video, setVideo] = useState(true);
    const [audio, setAudio] = useState(true);
    const [screen, setScreen] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(false);

    // Navigation and Join states
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");
    const [videos, setVideos] = useState([]); // Array of remote streams: { socketId, stream }
    const [participants, setParticipants] = useState([]); // List of current clients: { socketId, username, state }

    // Interactivity states
    const [showChat, setShowChat] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [showWhiteboard, setShowWhiteboard] = useState(false);
    const [isHandRaised, setIsHandRaised] = useState(false);
    const [recording, setRecording] = useState(false);
    const [reactions, setReactions] = useState([]); // Active flying emojis: { id, socketId, emoji }

    // Chat states
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState(0);

    // Whiteboard drawing states
    const [drawing, setDrawing] = useState(false);
    const [drawColor, setDrawColor] = useState('#006aff');
    const [brushSize, setBrushSize] = useState(4);

    // 1. Initial Permission Gathering on Mount
    useEffect(() => {
        getPermissions();
    }, []);

    const getPermissions = async () => {
        try {
            const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .catch(async () => {
                    // Try video only if mic is blocked or missing
                    return await navigator.mediaDevices.getUserMedia({ video: true })
                        .catch(() => null);
                });

            if (userMediaStream) {
                setVideoAvailable(userMediaStream.getVideoTracks().length > 0);
                setAudioAvailable(userMediaStream.getAudioTracks().length > 0);
                window.localStream = userMediaStream;
                if (localVideoref.current) {
                    localVideoref.current.srcObject = userMediaStream;
                }
            } else {
                setVideoAvailable(false);
                setAudioAvailable(false);
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            }
        } catch (error) {
            console.error("Permission request failed", error);
        }
    };

    // Helper to get media when states change
    const getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .catch((e) => console.log("Failed getUserMedia", e))
        } else {
            try {
                if (localVideoref.current && localVideoref.current.srcObject) {
                    localVideoref.current.srcObject.getTracks().forEach(track => track.stop());
                }
            } catch (e) { }
        }
    };

    const getUserMediaSuccess = (stream) => {
        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop())
            }
        } catch (e) { }

        window.localStream = stream;
        if (localVideoref.current) {
            localVideoref.current.srcObject = stream;
        }

        // Update stream on all active peer connections
        for (let id in connections) {
            if (id === socketIdRef.current) continue;
            
            const pc = connections[id];
            
            // Remove old sender tracks
            pc.getSenders().forEach(sender => pc.removeTrack(sender));
            
            // Add new sender tracks
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Renegotiate connection
            pc.createOffer().then((description) => {
                pc.setLocalDescription(description).then(() => {
                    socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': pc.localDescription }));
                }).catch(e => console.log(e));
            }).catch(e => console.log(e));
        }
    };

    useEffect(() => {
        if (!askForUsername) {
            getUserMedia();
        }
    }, [video, audio, askForUsername]);

    // 2. WebRTC Peer Connection Core Logic
    const initializePeerConnection = (socketListId) => {
        if (connections[socketListId]) return connections[socketListId];

        const pc = new RTCPeerConnection(peerConfigConnections);
        connections[socketListId] = pc;

        pc.onicecandidate = (event) => {
            if (event.candidate != null) {
                socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }));
            }
        };

        pc.onaddstream = (event) => {
            setVideos(videos => {
                const videoExists = videos.find(v => v.socketId === socketListId);
                if (videoExists) {
                    return videos.map(v => v.socketId === socketListId ? { ...v, stream: event.stream } : v);
                } else {
                    return [...videos, { socketId: socketListId, stream: event.stream }];
                }
            });
        };

        if (window.localStream) {
            window.localStream.getTracks().forEach(track => {
                pc.addTrack(track, window.localStream);
            });
        }

        return pc;
    };

    const gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message);
        if (fromId === socketIdRef.current) return;

        const pc = initializePeerConnection(fromId);

        if (signal.sdp) {
            pc.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                if (signal.sdp.type === 'offer') {
                    pc.createAnswer().then((description) => {
                        pc.setLocalDescription(description).then(() => {
                            socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': pc.localDescription }));
                        }).catch(e => console.log(e));
                    }).catch(e => console.log(e));
                }
            }).catch(e => console.log(e));
        }

        if (signal.ice) {
            pc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
        }
    };

    // 3. Socket Event Registrations
    const connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false });

        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href, username);
            socketIdRef.current = socketRef.current.id;

            socketRef.current.on('chat-message', (data, sender, socketIdSender) => {
                setMessages(prev => [...prev, { sender, data }]);
                if (socketIdSender !== socketIdRef.current) {
                    setNewMessages(prev => prev + 1);
                }
            });

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id));
                setParticipants((parts) => parts.filter((p) => p.socketId !== id));
                if (connections[id]) {
                    connections[id].close();
                    delete connections[id];
                }
            });

            socketRef.current.on('user-joined', (joinedId, clients) => {
                setParticipants(clients);

                if (joinedId === socketIdRef.current) {
                    // I joined - establish outbound connection to everyone
                    clients.forEach((client) => {
                        if (client.socketId === socketIdRef.current) return;
                        
                        const pc = initializePeerConnection(client.socketId);
                        pc.createOffer().then((description) => {
                            pc.setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', client.socketId, JSON.stringify({ 'sdp': pc.localDescription }));
                            }).catch(e => console.log(e));
                        }).catch(e => console.log(e));
                    });
                } else {
                    // Someone else joined - wait for their offer
                    initializePeerConnection(joinedId);
                }
            });

            // Participant Real-Time State Listeners
            socketRef.current.on('state-changed', (id, type, value) => {
                setParticipants(prev => prev.map(p => 
                    p.socketId === id ? { ...p, state: { ...p.state, [type]: value } } : p
                ));
            });

            socketRef.current.on('hand-raised', (id, isRaised) => {
                setParticipants(prev => prev.map(p => 
                    p.socketId === id ? { ...p, state: { ...p.state, handRaised: isRaised } } : p
                ));
            });

            socketRef.current.on('reaction-received', (id, emoji) => {
                triggerReactionAnimation(id, emoji);
            });

            // Collaborative Whiteboard Synchronizer
            socketRef.current.on('draw-received', (drawData) => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                ctx.strokeStyle = drawData.color;
                ctx.lineWidth = drawData.brushSize;
                ctx.lineCap = 'round';

                if (drawData.type === 'start') {
                    ctx.beginPath();
                    ctx.moveTo(drawData.x * canvas.width, drawData.y * canvas.height);
                } else if (drawData.type === 'draw') {
                    ctx.lineTo(drawData.x * canvas.width, drawData.y * canvas.height);
                    ctx.stroke();
                }
            });
        });
    };

    const connect = () => {
        setAskForUsername(false);
        connectToSocketServer();
    };

    // 4. Client Side Actions (Mic, Camera, Screen Share)
    const handleVideo = () => {
        const nextVal = !video;
        setVideo(nextVal);
        if (socketRef.current) {
            socketRef.current.emit('state-change', 'isVideoOff', !nextVal);
        }
    };

    const handleAudio = () => {
        const nextVal = !audio;
        setAudio(nextVal);
        if (socketRef.current) {
            socketRef.current.emit('state-change', 'isMuted', !nextVal);
        }
    };

    const handleScreen = () => {
        if (!screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then((stream) => {
                        setScreen(true);
                        getUserMediaSuccess(stream);
                        
                        stream.getVideoTracks()[0].onended = () => {
                            setScreen(false);
                            getUserMedia();
                        };
                    })
                    .catch((e) => console.log(e));
            }
        } else {
            setScreen(false);
            getUserMedia();
        }
    };

    const handleEndCall = () => {
        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
            }
        } catch (e) { }
        window.location.href = "/home";
    };

    // 5. Chat Actions
    const sendMessage = () => {
        if (message.trim()) {
            socketRef.current.emit('chat-message', message, username);
            setMessage("");
        }
    };

    // 6. Collaborative Whiteboard Drawing Logic
    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);

        setDrawing(true);
        socketRef.current.emit('draw', { type: 'start', x, y, color: drawColor, brushSize });
    };

    const draw = (e) => {
        if (!drawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        const ctx = canvas.getContext('2d');
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();

        socketRef.current.emit('draw', { type: 'draw', x, y, color: drawColor, brushSize });
    };

    const stopDrawing = () => {
        setDrawing(false);
    };

    const clearWhiteboard = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    // 7. Hand Raise & Emojis reactions
    const toggleHandRaise = () => {
        const nextState = !isHandRaised;
        setIsHandRaised(nextState);
        socketRef.current.emit('raise-hand', nextState);
    };

    const sendEmojiReaction = (emoji) => {
        socketRef.current.emit('reaction', emoji);
    };

    const triggerReactionAnimation = (socketId, emoji) => {
        const id = Date.now() + Math.random().toString();
        setReactions(prev => [...prev, { id, socketId, emoji }]);
        setTimeout(() => {
            setReactions(prev => prev.filter(r => r.id !== id));
        }, 2200);
    };

    // 8. Client Side Recording Logic
    const toggleRecording = async () => {
        if (recording) {
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stop();
            }
        } else {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true
                });
                
                recordedChunksRef.current = [];
                const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
                mediaRecorderRef.current = mediaRecorder;

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        recordedChunksRef.current.push(event.data);
                    }
                };

                mediaRecorder.onstop = () => {
                    const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = `meeting-recording-${Date.now()}.webm`;
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                    }, 100);

                    stream.getTracks().forEach(track => track.stop());
                    setRecording(false);
                };

                mediaRecorder.start();
                setRecording(true);
            } catch (err) {
                console.error("Failed to start recording screen", err);
            }
        }
    };

    // Helper to get participant info by socket ID
    const getParticipantInfo = (socketId) => {
        return participants.find(p => p.socketId === socketId) || { username: 'Guest', state: {} };
    };

    return (
        <div>
            {askForUsername === true ? (
                /* 1. LOBBY INTERFACE */
                <div className={styles.lobbyContainer}>
                    <div className="glow-blob blob-blue"></div>
                    <div className="glow-blob blob-purple"></div>

                    <div className={styles.lobbyCard}>
                        <div className={styles.lobbyVideoPreviewContainer}>
                            <video className={styles.lobbyVideoPreview} ref={localVideoref} autoPlay muted></video>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                                <IconButton 
                                    onClick={() => setVideo(!video)} 
                                    sx={{ 
                                        bgcolor: video ? 'rgba(255,255,255,0.05)' : 'error.main', 
                                        color: 'white',
                                        '&:hover': { bgcolor: video ? 'rgba(255,255,255,0.1)' : 'error.dark' }
                                    }}
                                >
                                    {video ? <VideocamIcon /> : <VideocamOffIcon />}
                                </IconButton>
                                <IconButton 
                                    onClick={() => setAudio(!audio)} 
                                    sx={{ 
                                        bgcolor: audio ? 'rgba(255,255,255,0.05)' : 'error.main', 
                                        color: 'white',
                                        '&:hover': { bgcolor: audio ? 'rgba(255,255,255,0.1)' : 'error.dark' }
                                    }}
                                >
                                    {audio ? <MicIcon /> : <MicOffIcon />}
                                </IconButton>
                            </Box>
                        </div>
                        <div className={styles.lobbyFormContainer}>
                            <h2>Join Video Call</h2>
                            <p>Enter your display name and configure your settings to connect.</p>
                            <TextField 
                                fullWidth
                                label="Display Name" 
                                value={username} 
                                onChange={e => setUsername(e.target.value)} 
                                variant="outlined" 
                                size="medium"
                            />
                            <Button 
                                fullWidth
                                size="large"
                                variant="contained" 
                                onClick={connect}
                                disabled={!username.trim()}
                                sx={{ py: 1.5, fontSize: '1.05rem', boxShadow: '0 4px 15px rgba(0, 106, 255, 0.4)' }}
                            >
                                Enter Meeting
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                /* 2. CONFERENCE MEETING ROOM INTERFACE */
                <div className={styles.meetVideoContainer}>
                    
                    {/* VIDEO GRID AREA */}
                    <div className={styles.videoGridContainer}>
                        <div className={styles.videoGrid}>
                            
                            {/* LOCAL VIDEO CARD */}
                            <div className={styles.videoCard}>
                                <video ref={localVideoref} autoPlay muted></video>
                                
                                {/* Overlay name & media state tags */}
                                <div className={styles.participantTag}>
                                    {username} (You)
                                    {!video && <VideocamOffIcon sx={{ fontSize: 16, color: 'error.main' }} />}
                                    {!audio && <MicOffIcon sx={{ fontSize: 16, color: 'error.main' }} />}
                                </div>

                                {isHandRaised && (
                                    <div className={styles.badgeIndicator}>
                                        <PanToolIcon sx={{ fontSize: 14 }} /> Hand Raised
                                    </div>
                                )}

                                {/* Floating Reaction display area */}
                                <div className={styles.reactionsContainer}>
                                    {reactions.filter(r => r.socketId === socketIdRef.current).map(r => (
                                        <span key={r.id} className={styles.floatingReaction}>{r.emoji}</span>
                                    ))}
                                </div>
                            </div>

                            {/* REMOTE VIDEOS */}
                            {videos.map((vid) => {
                                const pInfo = getParticipantInfo(vid.socketId);
                                return (
                                    <div key={vid.socketId} className={styles.videoCard}>
                                        <video
                                            data-socket={vid.socketId}
                                            ref={ref => {
                                                if (ref && vid.stream) {
                                                    ref.srcObject = vid.stream;
                                                }
                                            }}
                                            autoPlay
                                        />
                                        <div className={styles.participantTag}>
                                            {pInfo.username}
                                            {pInfo.state?.isVideoOff && <VideocamOffIcon sx={{ fontSize: 16, color: 'error.main' }} />}
                                            {pInfo.state?.isMuted && <MicOffIcon sx={{ fontSize: 16, color: 'error.main' }} />}
                                        </div>

                                        {pInfo.state?.handRaised && (
                                            <div className={styles.badgeIndicator}>
                                                <PanToolIcon sx={{ fontSize: 14 }} /> Hand Raised
                                            </div>
                                        )}

                                        <div className={styles.reactionsContainer}>
                                            {reactions.filter(r => r.socketId === vid.socketId).map(r => (
                                                <span key={r.id} className={styles.floatingReaction}>{r.emoji}</span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* WHITEBOARD CANVAS OVERLAY */}
                        {showWhiteboard && (
                            <div className={styles.whiteboardOverlay}>
                                <div className={styles.whiteboardHeader}>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Collaborative Whiteboard</Typography>
                                    <div className={styles.whiteboardControls}>
                                        <input 
                                            type="color" 
                                            value={drawColor} 
                                            onChange={e => setDrawColor(e.target.value)} 
                                            style={{ width: 30, height: 30, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        />
                                        <Button variant="outlined" size="small" onClick={clearWhiteboard}>Clear</Button>
                                        <IconButton onClick={() => setShowWhiteboard(false)} sx={{ color: 'text.secondary' }}>
                                            <CloseIcon />
                                        </IconButton>
                                    </div>
                                </div>
                                <canvas 
                                    ref={canvasRef}
                                    className={styles.whiteboardCanvas}
                                    width={1200}
                                    height={800}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                />
                            </div>
                        )}

                        {/* FLOATING ACTION CONTROL BAR */}
                        <div className={styles.buttonContainers}>
                            <Tooltip title={video ? "Mute Video" : "Unmute Video"}>
                                <IconButton onClick={handleVideo} sx={{ color: video ? 'white' : 'error.main' }}>
                                    {video ? <VideocamIcon /> : <VideocamOffIcon />}
                                </IconButton>
                            </Tooltip>

                            <Tooltip title={audio ? "Mute Mic" : "Unmute Mic"}>
                                <IconButton onClick={handleAudio} sx={{ color: audio ? 'white' : 'error.main' }}>
                                    {audio ? <MicIcon /> : <MicOffIcon />}
                                </IconButton>
                            </Tooltip>

                            {screenAvailable && (
                                <Tooltip title={screen ? "Stop Sharing" : "Share Screen"}>
                                    <IconButton onClick={handleScreen} sx={{ color: screen ? 'primary.main' : 'white' }}>
                                        {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                                    </IconButton>
                                </Tooltip>
                            )}

                            <Tooltip title={isHandRaised ? "Lower Hand" : "Raise Hand"}>
                                <IconButton onClick={toggleHandRaise} sx={{ color: isHandRaised ? 'warning.main' : 'white' }}>
                                    <PanToolIcon />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Whiteboard">
                                <IconButton onClick={() => setShowWhiteboard(!showWhiteboard)} sx={{ color: showWhiteboard ? 'primary.main' : 'white' }}>
                                    <GestureIcon />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title={recording ? "Stop Recording" : "Record Screen"}>
                                <IconButton onClick={toggleRecording} sx={{ color: recording ? 'error.main' : 'white' }}>
                                    {recording ? <StopIcon /> : <FiberManualRecordIcon />}
                                </IconButton>
                            </Tooltip>

                            {/* Emoji Reaction Selector */}
                            <Box sx={{ display: 'flex', gap: 0.5, borderLeft: '1px solid rgba(255,255,255,0.1)', pl: 1.5 }}>
                                {['👍', '👏', '❤️', '😂', '🎉'].map(emoji => (
                                    <Button 
                                        key={emoji}
                                        onClick={() => sendEmojiReaction(emoji)}
                                        sx={{ minWidth: 32, p: 0.5, fontSize: '1.25rem' }}
                                    >
                                        {emoji}
                                    </Button>
                                ))}
                            </Box>

                            {/* Side panel toggle actions */}
                            <Box sx={{ display: 'flex', gap: 1, borderLeft: '1px solid rgba(255,255,255,0.1)', pl: 1.5 }}>
                                <Badge badgeContent={newMessages} color="primary">
                                    <Tooltip title="Chat">
                                        <IconButton onClick={() => { setShowChat(!showChat); setShowParticipants(false); setNewMessages(0); }} sx={{ color: showChat ? 'primary.main' : 'white' }}>
                                            <ChatIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Badge>

                                <Tooltip title="Participants">
                                    <IconButton onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }} sx={{ color: showParticipants ? 'primary.main' : 'white' }}>
                                        <PeopleIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>

                            <Tooltip title="Leave Meeting">
                                <IconButton onClick={handleEndCall} sx={{ color: 'error.main' }}>
                                    <CallEndIcon />
                                </IconButton>
                            </Tooltip>
                        </div>
                    </div>

                    {/* SLIDE-OUT CHAT DRAWER */}
                    {showChat && (
                        <div className={styles.chatRoom}>
                            <div className={styles.chatContainer}>
                                <div className={styles.chatHeader}>
                                    <h2>Meeting Chat</h2>
                                    <IconButton onClick={() => setShowChat(false)} sx={{ color: 'text.secondary' }}>
                                        <CloseIcon />
                                    </IconButton>
                                </div>

                                <div className={styles.chattingDisplay}>
                                    {messages.length !== 0 ? messages.map((item, index) => (
                                        <div 
                                            key={index}
                                            className={`${styles.messageBubble} ${item.sender === username ? styles.messageSent : styles.messageReceived}`}
                                        >
                                            <p className={styles.messageSender}>{item.sender}</p>
                                            <p>{item.data}</p>
                                        </div>
                                    )) : (
                                        <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                            <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>No messages yet</Typography>
                                        </Box>
                                    )}
                                </div>

                                <div className={styles.chattingArea}>
                                    <TextField 
                                        fullWidth
                                        size="small"
                                        value={message} 
                                        onChange={(e) => setMessage(e.target.value)} 
                                        placeholder="Type message..." 
                                        variant="outlined" 
                                    />
                                    <IconButton onClick={sendMessage} color="primary" disabled={!message.trim()}>
                                        <SendIcon />
                                    </IconButton>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SLIDE-OUT PARTICIPANTS DRAWER */}
                    {showParticipants && (
                        <div className={styles.participantsDrawer}>
                            <div className={styles.participantsContainer}>
                                <div className={styles.chatHeader}>
                                    <h2>Participants ({participants.length})</h2>
                                    <IconButton onClick={() => setShowParticipants(false)} sx={{ color: 'text.secondary' }}>
                                        <CloseIcon />
                                    </IconButton>
                                </div>

                                <div className={styles.participantsList}>
                                    {participants.map((p, index) => (
                                        <div key={index} className={styles.participantItem}>
                                            <div className={styles.participantLeft}>
                                                <div className={styles.participantAvatar}>
                                                    {p.username.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className={styles.participantName}>
                                                    {p.username} {p.socketId === socketIdRef.current && '(You)'}
                                                </span>
                                            </div>
                                            <div className={styles.participantActions}>
                                                {p.state?.handRaised && <PanToolIcon sx={{ fontSize: 16, color: 'warning.main' }} />}
                                                {p.state?.isVideoOff ? 
                                                    <VideocamOffIcon sx={{ fontSize: 16, color: 'error.main' }} /> : 
                                                    <VideocamIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                }
                                                {p.state?.isMuted ? 
                                                    <MicOffIcon sx={{ fontSize: 16, color: 'error.main' }} /> : 
                                                    <MicIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                }
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
