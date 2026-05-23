import React, { useState } from 'react';
import { IconButton, Tooltip, Box } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

export default function ControlBar({ 
  onEndCall, 
  onToggleMic, 
  onToggleVideo, 
  onScreenShare, 
  onToggleRecording,
  onToggleNoiseSuppression,
  isMicOn = true, 
  isVideoOn = true,
  isRecording = false,
  isNoiseSuppressionOn = false 
}) {
  const [showTooltip, setShowTooltip] = useState(null);

  const controls = [
    { id: 'mic', icon: isMicOn ? MicIcon : MicOffIcon, label: isMicOn ? 'Mute' : 'Unmute', onClick: onToggleMic, color: isMicOn ? 'inherit' : 'error' },
    { id: 'video', icon: isVideoOn ? VideocamIcon : VideocamOffIcon, label: isVideoOn ? 'Stop Video' : 'Start Video', onClick: onToggleVideo, color: isVideoOn ? 'inherit' : 'error' },
    { id: 'screen', icon: ScreenShareIcon, label: 'Share Screen', onClick: onScreenShare },
    { id: 'noise', icon: VolumeUpIcon, label: isNoiseSuppressionOn ? 'Noise Off' : 'Noise On', onClick: onToggleNoiseSuppression, color: isNoiseSuppressionOn ? 'primary' : 'inherit' },
    { id: 'record', icon: FiberManualRecordIcon, label: isRecording ? 'Stop Recording' : 'Start Recording', onClick: onToggleRecording, color: isRecording ? 'error' : 'inherit' },
  ];

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(13, 18, 36, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '12px 24px',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 12px 40px -10px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
        zIndex: 100,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 16px 45px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
        }
      }}
    >
      {controls.map(ctrl => (
        <Tooltip key={ctrl.id} title={ctrl.label} arrow placement="top">
          <IconButton
            onClick={ctrl.onClick}
            color={ctrl.color || 'inherit'}
            sx={{
              transition: 'all 0.2s ease-out',
              '&:hover': { transform: 'scale(1.1)', opacity: 0.8 },
              '&:active': { transform: 'scale(0.95)' }
            }}
          >
            <ctrl.icon sx={{ fontSize: 24 }} />
          </IconButton>
        </Tooltip>
      ))}
      <Box sx={{ width: 1, height: 1, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
      <Tooltip title="End Call" arrow placement="top">
        <IconButton
          onClick={onEndCall}
          color="error"
          sx={{
            transition: 'all 0.2s ease-out',
            '&:hover': { transform: 'scale(1.1)', opacity: 0.8 },
            '&:active': { transform: 'scale(0.95)' }
          }}
        >
          <CallEndIcon sx={{ fontSize: 24 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
