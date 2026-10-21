import React from 'react'
import { Badge, IconButton, TextField, Button, Box, Tooltip, Typography } from '@mui/material';
import { Videocam as VideocamIcon } from '@mui/icons-material';
import { VideocamOff as VideocamOffIcon } from '@mui/icons-material';
import { CallEnd as CallEndIcon } from '@mui/icons-material';
import { Mic as MicIcon } from '@mui/icons-material';
import { MicOff as MicOffIcon } from '@mui/icons-material';
import { ScreenShare as ScreenShareIcon } from '@mui/icons-material';
import { StopScreenShare as StopScreenShareIcon } from '@mui/icons-material';
import { Chat as ChatIcon } from '@mui/icons-material';
import { PanTool as PanToolIcon } from '@mui/icons-material';
import { Gesture as GestureIcon } from '@mui/icons-material';
import { People as PeopleIcon } from '@mui/icons-material';
import { FiberManualRecord as FiberManualRecordIcon } from '@mui/icons-material';
import { Stop as StopIcon } from '@mui/icons-material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Send as SendIcon } from '@mui/icons-material';
import useMeeting from '../useMeeting';
import styles from "../styles/videoComponent.module.css";

export default function VideoMeetComponent() {
    const { socketIdRef, localVideoref, canvasRef, askForUsername, username, setUsername, video, audio, screen, screenAvailable,
        videos, participants, showChat, setShowChat, showParticipants, setShowParticipants, showWhiteboard, setShowWhiteboard,
        isHandRaised, recording, reactions, messages, message, setMessage, newMessages, setNewMessages, drawColor, setDrawColor,
        enableMedia, connect, handleVideo, handleAudio, handleScreen, handleEndCall, sendMessage, startDrawing, draw, stopDrawing,
        clearWhiteboard, toggleHandRaise, sendEmojiReaction, toggleRecording, getParticipantInfo, status, error, connected, room, copyInvite } = useMeeting();
    return (
        <div>
            <div role="status" className={styles.connectionStatus} style={{ position: 'fixed', top: 10, left: 16, right: 16, zIndex: 50, pointerEvents: 'none', color: error ? '#fca5a5' : '#94a3b8', fontSize: 13 }}>{error || status}</div>
            {!askForUsername && <Button className={styles.inviteButton} onClick={copyInvite}>Copy invite link</Button>}
            {askForUsername === true ? (
                /* 1. LOBBY INTERFACE */
                <div className={styles.lobbyContainer}>
                    <div className="glow-blob blob-blue"></div>
                    <div className="glow-blob blob-purple"></div>

                    <div className={styles.lobbyCard}>
                        <div className={styles.lobbyVideoPreviewContainer}>
                            <video playsInline className={styles.lobbyVideoPreview} ref={localVideoref} autoPlay muted></video>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                                <IconButton
                                    aria-label={video ? "Mute Video" : "Enable Video"} onClick={handleVideo}
                                    sx={{
                                        bgcolor: video ? 'rgba(255,255,255,0.05)' : 'error.main',
                                        color: 'white',
                                        '&:hover': { bgcolor: video ? 'rgba(255,255,255,0.1)' : 'error.dark' }
                                    }}
                                >
                                    {video ? <VideocamIcon /> : <VideocamOffIcon />}
                                </IconButton>
                                <IconButton
                                    aria-label={audio ? "Mute Mic" : "Enable Mic"} onClick={handleAudio}
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
                            <p>Meeting: <span style={{ overflowWrap: 'anywhere' }}>{room}</span></p>
                            <Button variant="outlined" onClick={enableMedia}>Enable camera and microphone</Button>
                            <p>Enter your display name. You can join with camera and microphone off.</p>
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
                                <video playsInline ref={localVideoref} autoPlay muted style={{ transform: screen ? 'none' : 'scaleX(-1)' }}></video>

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
                                        <video playsInline
                                            data-socket={vid.socketId}
                                            ref={ref => {
                                                if (ref && vid.stream && ref.srcObject !== vid.stream) {
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
                                        <IconButton aria-label="Whiteboard" onClick={() => setShowWhiteboard(false)} sx={{ color: 'text.secondary' }}>
                                            <CloseIcon />
                                        </IconButton>
                                    </div>
                                </div>
                                <canvas
                                    ref={canvasRef}
                                    className={styles.whiteboardCanvas} aria-label="Shared whiteboard" style={{ touchAction: 'none' }}
                                    width={1200}
                                    height={800}
                                    onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); startDrawing(e); }}
                                    onPointerMove={draw}
                                    onPointerUp={stopDrawing}
                                    onPointerCancel={stopDrawing}
                                />
                            </div>
                        )}

                        {/* FLOATING ACTION CONTROL BAR */}
                        <div className={styles.buttonContainers}>
                            <Tooltip title={video ? "Mute Video" : "Unmute Video"}>
                                <IconButton aria-label={video ? "Mute Video" : "Enable Video"} onClick={handleVideo} sx={{ color: video ? 'white' : 'error.main' }}>
                                    {video ? <VideocamIcon /> : <VideocamOffIcon />}
                                </IconButton>
                            </Tooltip>

                            <Tooltip title={audio ? "Mute Mic" : "Unmute Mic"}>
                                <IconButton aria-label={audio ? "Mute Mic" : "Enable Mic"} onClick={handleAudio} sx={{ color: audio ? 'white' : 'error.main' }}>
                                    {audio ? <MicIcon /> : <MicOffIcon />}
                                </IconButton>
                            </Tooltip>

                            {screenAvailable && (
                                <Tooltip title={screen ? "Stop Sharing" : "Share Screen"}>
                                    <IconButton aria-label="Share screen" onClick={handleScreen} sx={{ color: screen ? 'primary.main' : 'white' }}>
                                        {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                                    </IconButton>
                                </Tooltip>
                            )}

                            <Tooltip title={isHandRaised ? "Lower Hand" : "Raise Hand"}>
                                <IconButton aria-label="Raise hand" onClick={toggleHandRaise} sx={{ color: isHandRaised ? 'warning.main' : 'white' }}>
                                    <PanToolIcon />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Whiteboard">
                                <IconButton aria-label="Whiteboard" onClick={() => setShowWhiteboard(!showWhiteboard)} sx={{ color: showWhiteboard ? 'primary.main' : 'white' }}>
                                    <GestureIcon />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title={recording ? "Stop Recording" : "Record Screen"}>
                                <IconButton aria-label="Record screen" onClick={toggleRecording} sx={{ color: recording ? 'error.main' : 'white' }}>
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
                                        <IconButton aria-label="Chat" onClick={() => { setShowChat(!showChat); setShowParticipants(false); setNewMessages(0); }} sx={{ color: showChat ? 'primary.main' : 'white' }}>
                                            <ChatIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Badge>

                                <Tooltip title="Participants">
                                    <IconButton aria-label="Participants" onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }} sx={{ color: showParticipants ? 'primary.main' : 'white' }}>
                                        <PeopleIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>

                            <Tooltip title="Leave Meeting">
                                <IconButton aria-label="Leave meeting" onClick={handleEndCall} sx={{ color: 'error.main' }}>
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
                                        placeholder="Type message..." inputProps={{ maxLength: 500, 'aria-label': 'Chat message' }} onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                                        variant="outlined"
                                    />
                                    <IconButton aria-label="Send message" onClick={sendMessage} color="primary" disabled={!message.trim() || !connected}>
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
