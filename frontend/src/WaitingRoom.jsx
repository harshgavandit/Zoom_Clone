// WaitingRoom.jsx - Waiting room UI with host approval
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LockIcon from '@mui/icons-material/Lock';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

export default function WaitingRoom({
  open,
  isHost,
  waitingParticipants,
  approvedParticipants,
  onApprove,
  onReject,
  onMuteAll,
  onLockRoom,
  roomLocked,
}) {
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  return (
    <>
      {/* Waiting Room Dialog */}
      <Dialog open={open && waitingParticipants.length > 0} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Waiting Room
            <Chip
              label={`${waitingParticipants.length} waiting`}
              color="warning"
              size="small"
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {isHost ? (
            <List>
              {waitingParticipants.map((participant) => (
                <ListItem key={participant.id} sx={{ mb: 1, backgroundColor: '#2a2a2a', borderRadius: 1 }}>
                  <ListItemText
                    primary={participant.name || 'Anonymous'}
                    secondary={`Waiting since ${new Date(participant.joinTime).toLocaleTimeString()}`}
                    primaryTypographyProps={{ sx: { color: '#fff' } }}
                    secondaryTypographyProps={{ sx: { color: '#aaa' } }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => onApprove(participant.id)}
                      sx={{ color: '#00ff88' }}
                      title="Approve"
                    >
                      <CheckCircleIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => onReject(participant.id)}
                      sx={{ color: '#ff6b6b' }}
                      title="Reject"
                    >
                      <CancelIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography sx={{ color: '#aaa', textAlign: 'center', py: 2 }}>
              You are in the waiting room. The host will admit you shortly.
            </Typography>
          )}
        </DialogContent>
        {isHost && (
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button variant="outlined" startIcon={<VolumeOffIcon />} onClick={onMuteAll}>
              Mute All
            </Button>
            <Button
              variant={roomLocked ? 'contained' : 'outlined'}
              startIcon={<LockIcon />}
              onClick={onLockRoom}
              color={roomLocked ? 'error' : 'primary'}
            >
              {roomLocked ? 'Unlock Room' : 'Lock Room'}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
}
