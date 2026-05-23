// ParticipantBadges.jsx - Show badges for host, speaker, presenting, etc
import React from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import PresentToAllIcon from '@mui/icons-material/PresentToAll';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';

export function ParticipantBadges({ participant }) {
  if (!participant) return null;

  const badges = [];

  // Host badge
  if (participant.role === 'host') {
    badges.push({
      key: 'host',
      label: 'Host',
      icon: AdminPanelSettingsIcon,
      color: 'error',
      tooltip: 'Meeting host',
    });
  }

  // Speaker badge (actively speaking)
  if (participant.isSpeaking) {
    badges.push({
      key: 'speaking',
      label: 'Speaking',
      icon: GraphicEqIcon,
      color: 'success',
      tooltip: 'Active speaker',
    });
  }

  // Presenting badge (screen sharing)
  if (participant.isScreenSharing) {
    badges.push({
      key: 'presenting',
      label: 'Presenting',
      icon: PresentToAllIcon,
      color: 'info',
      tooltip: 'Screen sharing active',
    });
  }

  // Muted badge
  if (participant.isMuted) {
    badges.push({
      key: 'muted',
      label: 'Muted',
      icon: MicOffIcon,
      color: 'warning',
      tooltip: 'Microphone muted',
    });
  }

  // Video off badge
  if (participant.isVideoOff) {
    badges.push({
      key: 'video-off',
      label: 'Video Off',
      icon: VideocamOffIcon,
      color: 'warning',
      tooltip: 'Camera is off',
    });
  }

  if (badges.length === 0) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        gap: '4px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      {badges.map((badge) => (
        <Tooltip key={badge.key} title={badge.tooltip}>
          <Chip
            icon={<badge.icon sx={{ fontSize: '16px !important' }} />}
            label={badge.label}
            size="small"
            variant="outlined"
            sx={{
              height: '20px',
              fontSize: '11px',
              color: `var(--mui-palette-${badge.color}-main)`,
              borderColor: `var(--mui-palette-${badge.color}-main)`,
              '& .MuiChip-icon': {
                marginLeft: '4px !important',
                color: 'inherit !important',
              }
            }}
          />
        </Tooltip>
      ))}
    </Box>
  );
}

// Particle badge for video tile overlay
export function ParticipantBadgeOverlay({ participant }) {
  if (!participant) return null;

  const badges = [];

  if (participant.role === 'host') badges.push('HOST');
  if (participant.isSpeaking) badges.push('SPEAKING');
  if (participant.isScreenSharing) badges.push('SCREEN');

  if (badges.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: '8px',
        left: '8px',
        display: 'flex',
        gap: '4px',
        zIndex: 10,
      }}
    >
      {badges.map((badge) => (
        <Chip
          key={badge}
          label={badge}
          size="small"
          sx={{
            height: '20px',
            fontSize: '11px',
            fontWeight: 'bold',
            backgroundColor: badge === 'HOST' ? 'rgba(244, 67, 54, 0.8)' :
                             badge === 'SPEAKING' ? 'rgba(76, 175, 80, 0.8)' :
                             'rgba(33, 150, 243, 0.8)',
            color: '#fff',
          }}
        />
      ))}
    </Box>
  );
}