// ParticipantEngagement.jsx - Real-time engagement tracking dashboard
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Grid,
  Chip,
  Tooltip,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

export default function ParticipantEngagement({ isOpen, onClose, participants, metrics }) {
  const [engagementRanks, setEngagementRanks] = useState([]);

  useEffect(() => {
    if (participants && participants.length > 0) {
      const ranked = [...participants]
        .map((p) => ({
          ...p,
          engagementScore: (
            (p.messages || 0) * 5 +
            (p.reactions || 0) * 2 +
            (p.speakingTime || 0) / 10
          ),
        }))
        .sort((a, b) => b.engagementScore - a.engagementScore);
      setEngagementRanks(ranked);
    }
  }, [participants]);

  if (!isOpen) return null;

  const getEngagementColor = (score) => {
    if (score > 80) return '#00ff88';
    if (score > 50) return '#ff9500';
    return '#ff6b6b';
  };

  const getEngagementLabel = (score) => {
    if (score > 80) return '🔥 Very Active';
    if (score > 50) return '👍 Active';
    return '🤐 Quiet';
  };

  return (
    <Card
      sx={{
        position: 'fixed',
        bottom: 540,
        right: 20,
        width: 380,
        maxHeight: 500,
        backgroundColor: '#1e1e1e',
        border: '1px solid #333',
        borderRadius: 2,
        zIndex: 1000,
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <CardContent sx={{ pb: 1, borderBottom: '1px solid #333' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEventsIcon sx={{ color: '#ff9500' }} />
            <Typography variant="h6" sx={{ color: '#fff' }}>
              Engagement
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: '#999' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </CardContent>

      {/* Engagement Ranks */}
      <CardContent sx={{ pt: 1 }}>
        {engagementRanks.map((participant, index) => (
          <Box
            key={participant.id}
            sx={{
              mb: 1.5,
              p: 1,
              backgroundColor: '#2a2a2a',
              borderRadius: 1,
            }}
          >
            {/* Rank & Name */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#555',
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                }}
              >
                {index + 1}
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: '#fff',
                  fontWeight: 500,
                  flex: 1,
                }}
              >
                {participant.name}
              </Typography>
              <Chip
                label={getEngagementLabel(participant.engagementScore)}
                size="small"
                sx={{
                  backgroundColor: getEngagementColor(participant.engagementScore),
                  color: '#000',
                  fontWeight: 'bold',
                }}
              />
            </Box>

            {/* Score Bar */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#aaa', fontSize: '0.65rem' }}>
                  Score: {Math.round(participant.engagementScore)}/100
                </Typography>
                <Typography variant="caption" sx={{ color: '#aaa', fontSize: '0.65rem' }}>
                  {participant.messages || 0} msgs · {participant.reactions || 0} emoji
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(participant.engagementScore, 100)}
                sx={{
                  backgroundColor: '#1a1a1a',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getEngagementColor(participant.engagementScore),
                  },
                }}
              />
            </Box>
          </Box>
        ))}

        {/* Engagement Summary */}
        <Box sx={{ mt: 2, p: 1, backgroundColor: '#2a2a2a', borderRadius: 1 }}>
          <Typography variant="caption" sx={{ color: '#00a8ff', fontWeight: 'bold', display: 'block', mb: 1 }}>
            💡 Meeting Insights
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#aaa' }}>
              • Average engagement: {metrics?.avgEngagement || 0}%
            </Typography>
            <Typography variant="caption" sx={{ color: '#aaa' }}>
              • Most active: {engagementRanks[0]?.name || 'N/A'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#aaa' }}>
              • Participation rate: {((engagementRanks.filter(p => p.engagementScore > 30).length / engagementRanks.length) * 100).toFixed(0)}%
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
