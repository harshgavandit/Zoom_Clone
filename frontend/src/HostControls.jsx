// HostControls.jsx - Host/moderator controls panel
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import LockIcon from '@mui/icons-material/Lock';
import RecordingIndicator from './RecordingIndicator';

export default function HostControls({
  isHost,
  participants,
  isRecording,
  onToggleRecord,
  onMuteParticipant,
  onRemoveParticipant,
  onMuteAll,
  onLockRoom,
  roomLocked,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [muteDialogOpen, setMuteDialogOpen] = useState(false);

  if (!isHost) return null;

  return (
    <Card
      sx={{
        position: 'fixed',
        top: 20,
        right: 420,
        width: 300,
        backgroundColor: '#1e1e1e',
        border: '1px solid #333',
        borderRadius: 2,
        zIndex: 999,
      }}
    >
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#fff' }}>
            👑 Host Controls
          </Typography>
          <IconButton
            size="small"
            onClick={() => setShowMenu(!showMenu)}
            sx={{ color: '#aaa' }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>

        {/* Recording Indicator */}
        {isRecording && <RecordingIndicator />}

        {/* Participant Controls */}
        <Typography variant="subtitle2" sx={{ color: '#00a8ff', mb: 1 }}>
          Participants ({participants.length})
        </Typography>
        <Box sx={{ maxHeight: 200, overflowY: 'auto', mb: 2 }}>
          {participants.map((participant) => (
            <Box
              key={participant.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 0.5,
                mb: 0.5,
                backgroundColor: '#2a2a2a',
                borderRadius: 1,
                fontSize: '0.85rem',
                color: '#fff',
              }}
            >
              <span>{participant.name}</span>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Mute">
                  <IconButton
                    size="small"
                    onClick={() => onMuteParticipant(participant.id)}
                    sx={{ p: 0.25, color: '#ff9500' }}
                  >
                    <VolumeOffIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Remove">
                  <IconButton
                    size="small"
                    onClick={() => onRemoveParticipant(participant.id)}
                    sx={{ p: 0.25, color: '#ff6b6b' }}
                  >
                    <PersonRemoveIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            fullWidth
            variant="contained"
            size="small"
            startIcon={<VolumeOffIcon />}
            onClick={onMuteAll}
            sx={{
              backgroundColor: '#ff9500',
              '&:hover': { backgroundColor: '#ff7700' },
            }}
          >
            Mute All
          </Button>
          <Button
            fullWidth
            variant={roomLocked ? 'contained' : 'outlined'}
            size="small"
            startIcon={<LockIcon />}
            onClick={onLockRoom}
            color={roomLocked ? 'error' : 'primary'}
          >
            {roomLocked ? 'Unlock' : 'Lock Room'}
          </Button>
          <Button
            fullWidth
            variant={isRecording ? 'contained' : 'outlined'}
            size="small"
            color={isRecording ? 'error' : 'primary'}
            onClick={onToggleRecord}
          >
            {isRecording ? '⏹ Stop Recording' : '⏺ Start Recording'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
