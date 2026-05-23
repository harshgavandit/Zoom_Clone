// EmptyStates.jsx - Beautiful empty state UI components
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import StorageIcon from '@mui/icons-material/Storage';

export function EmptyParticipants({ onInvite }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        p: 3,
      }}
    >
      <PeopleAltIcon sx={{ fontSize: 64, color: 'rgba(0, 106, 255, 0.4)', mb: 2 }} />
      <Typography variant="h6" sx={{ color: '#f8fafc', mb: 1 }}>
        Waiting for participants...
      </Typography>
      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
        Share the room link to invite others to join the call
      </Typography>
      {onInvite && (
        <Button variant="contained" onClick={onInvite} sx={{
          background: 'linear-gradient(90deg, #006aff 0%, #0052cc 100%)',
        }}>
          Invite Others
        </Button>
      )}
    </Box>
  );
}

export function EmptyChat() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        p: 3,
      }}
    >
      <ChatBubbleOutlineIcon sx={{ fontSize: 48, color: 'rgba(0, 106, 255, 0.4)', mb: 2 }} />
      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
        No messages yet. Start the conversation!
      </Typography>
    </Box>
  );
}

export function NoVideoStream() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        backgroundColor: 'rgba(25, 33, 61, 0.4)',
        borderRadius: '12px',
      }}
    >
      <VideocamOffIcon sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.3)', mb: 1 }} />
      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
        Video off
      </Typography>
    </Box>
  );
}

export function NoRecordings() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        textAlign: 'center',
        p: 4,
      }}
    >
      <StorageIcon sx={{ fontSize: 64, color: 'rgba(0, 106, 255, 0.4)', mb: 2 }} />
      <Typography variant="h6" sx={{ color: '#f8fafc', mb: 1 }}>
        No recordings yet
      </Typography>
      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
        Start a meeting and enable recording to save your sessions
      </Typography>
    </Box>
  );
}