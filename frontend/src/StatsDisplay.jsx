// StatsDisplay.jsx - Real-time metrics dashboard
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function StatsDisplay({ stats, isOpen, onClose }) {
  const [displayStats, setDisplayStats] = useState({
    video: { bitrate: 0, latency: 0, packets: 0 },
    audio: { bitrate: 0, latency: 0, packets: 0 },
    connection: { latency: 0, bandwidth: 0 },
  });

  useEffect(() => {
    if (stats) {
      setDisplayStats({
        video: {
          bitrate: (stats.video?.bytesSent / 1024 / 10).toFixed(1),
          latency: stats.connection?.latency?.toFixed(0) || 0,
          packets: stats.video?.packetsLost || 0,
        },
        audio: {
          bitrate: (stats.audio?.bytesSent / 1024 / 10).toFixed(1),
          latency: stats.audio?.jitter || 0,
          packets: stats.audio?.packetsLost || 0,
        },
        connection: {
          latency: stats.connection?.latency?.toFixed(0) || 0,
          bandwidth: (stats.connection?.availableOutgoing / 1024 / 1024).toFixed(2) || 0,
        },
      });
    }
  }, [stats]);

  if (!isOpen) return null;

  const MetricCard = ({ title, value, unit, color, progress }) => (
    <Card sx={{ backgroundColor: '#2a2a2a', borderRadius: 1, mb: 1 }}>
      <CardContent sx={{ p: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: '#aaa' }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color, fontWeight: 'bold' }}>
            {value} {unit}
          </Typography>
        </Box>
        {progress !== undefined && (
          <LinearProgress
            variant="determinate"
            value={Math.min(progress, 100)}
            sx={{
              mt: 0.5,
              backgroundColor: '#1a1a1a',
              '& .MuiLinearProgress-bar': { backgroundColor: color },
            }}
          />
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 80,
        right: 20,
        width: 320,
        maxHeight: 400,
        backgroundColor: '#1e1e1e',
        border: '1px solid #333',
        borderRadius: 2,
        p: 2,
        zIndex: 1000,
        overflowY: 'auto',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ color: '#fff' }}>
          📊 Metrics
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: '#999' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Video Stats */}
      <Typography variant="caption" sx={{ color: '#00a8ff', fontWeight: 'bold', display: 'block', mb: 1 }}>
        Video
      </Typography>
      <MetricCard
        title="Bitrate"
        value={displayStats.video.bitrate}
        unit="Kbps"
        color="#00ff88"
        progress={parseInt(displayStats.video.bitrate) / 5}
      />
      <MetricCard
        title="Lost Packets"
        value={displayStats.video.packets}
        unit=""
        color={displayStats.video.packets > 10 ? '#ff6b6b' : '#00ff88'}
      />

      {/* Audio Stats */}
      <Typography variant="caption" sx={{ color: '#00a8ff', fontWeight: 'bold', display: 'block', my: 1 }}>
        Audio
      </Typography>
      <MetricCard
        title="Bitrate"
        value={displayStats.audio.bitrate}
        unit="Kbps"
        color="#ff00ff"
      />
      <MetricCard
        title="Jitter"
        value={displayStats.audio.latency}
        unit="ms"
        color={displayStats.audio.latency > 50 ? '#ff9500' : '#00ff88'}
      />

      {/* Connection Stats */}
      <Typography variant="caption" sx={{ color: '#00a8ff', fontWeight: 'bold', display: 'block', my: 1 }}>
        Connection
      </Typography>
      <MetricCard
        title="RTT Latency"
        value={displayStats.connection.latency}
        unit="ms"
        color={
          displayStats.connection.latency < 50
            ? '#00ff88'
            : displayStats.connection.latency < 150
            ? '#ff9500'
            : '#ff6b6b'
        }
        progress={Math.min(displayStats.connection.latency / 2, 100)}
      />
      <MetricCard
        title="Bandwidth"
        value={displayStats.connection.bandwidth}
        unit="Mbps"
        color="#00a8ff"
      />

      {/* Footer */}
      <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem', display: 'block', mt: 1 }}>
        Updates every second
      </Typography>
    </Box>
  );
}
