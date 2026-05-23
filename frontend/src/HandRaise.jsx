// HandRaise.jsx - Raise hand to request speaking
import React, { useState } from 'react';
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
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import PanToolIcon from '@mui/icons-material/PanTool';
import CloseIcon from '@mui/icons-material/Close';

export default function HandRaiseManager({ socket, roomId, userId, username, isHost }) {
  const [raisedHands, setRaisedHands] = useState(new Map()); // userId -> { username, timestamp }
  const [showDialog, setShowDialog] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  React.useEffect(() => {
    if (!socket || !roomId) return;

    // Listen for hand raise events
    const onHandRaised = (data) => {
      setRaisedHands(prev => new Map(prev).set(data.userId, {
        username: data.username,
        timestamp: data.timestamp,
        userId: data.userId
      }));
    };

    const onHandLowered = (data) => {
      setRaisedHands(prev => {
        const newMap = new Map(prev);
        newMap.delete(data.userId);
        return newMap;
      });
    };

    socket.on('hand:raised', onHandRaised);
    socket.on('hand:lowered', onHandLowered);

    return () => {
      socket.off('hand:raised', onHandRaised);
      socket.off('hand:lowered', onHandLowered);
    };
  }, [socket, roomId]);

  const toggleHandRaise = () => {
    if (isHandRaised) {
      socket.emit('hand:lower', { roomId, userId, username });
      setIsHandRaised(false);
    } else {
      socket.emit('hand:raise', { roomId, userId, username, timestamp: Date.now() });
      setIsHandRaised(true);
    }
  };

  const lowerParticipantHand = (participantId) => {
    socket.emit('hand:lower-participant', { 
      roomId, 
      participantId, 
      requestedBy: userId 
    });
  };

  return (
    <>
      {/* Hand Raise Button */}
      <Tooltip title={isHandRaised ? 'Lower hand' : 'Raise hand'}>
        <IconButton
          onClick={toggleHandRaise}
          sx={{
            color: isHandRaised ? '#ff9500' : 'inherit',
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'scale(1.1)',
              color: '#ff9500'
            },
            animation: isHandRaised ? 'bounce 1s infinite' : 'none'
          }}
        >
          <PanToolIcon />
        </IconButton>
      </Tooltip>

      {/* Raised Hands Badge */}
      {raisedHands.size > 0 && (
        <Chip
          icon={<PanToolIcon />}
          label={`${raisedHands.size} hand${raisedHands.size > 1 ? 's' : ''}`}
          onClick={() => setShowDialog(true)}
          sx={{
            backgroundColor: 'rgba(255, 149, 0, 0.2)',
            color: '#ff9500',
            ml: 1,
            cursor: 'pointer'
          }}
        />
      )}

      {/* Raised Hands Dialog (for Host) */}
      {isHost && (
        <Dialog open={showDialog} onClose={() => setShowDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Raised Hands ({raisedHands.size})</Typography>
            <IconButton onClick={() => setShowDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent>
            {raisedHands.size === 0 ? (
              <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
                No hands raised
              </Typography>
            ) : (
              <List>
                {Array.from(raisedHands.values()).map((hand) => (
                  <ListItem key={hand.userId} sx={{ mb: 1 }}>
                    <ListItemText
                      primary={hand.username}
                      secondary={`Raised at ${new Date(hand.timestamp).toLocaleTimeString()}`}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => lowerParticipantHand(hand.userId)}
                      sx={{ ml: 1 }}
                    >
                      Lower
                    </Button>
                  </ListItem>
                ))}
              </List>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* CSS for bounce animation */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </>
  );
}