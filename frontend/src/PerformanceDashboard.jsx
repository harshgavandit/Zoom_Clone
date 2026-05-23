// PerformanceDashboard.jsx - Advanced performance optimization UI
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Button,
  Alert,
  Grid,
  Tooltip,
  IconButton,
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';

export default function PerformanceDashboard({
  stats,
  performanceScore,
  recommendations = [],
  onOptimize,
  isOpen,
  onClose,
}) {
  const [autoOptimizeEnabled, setAutoOptimizeEnabled] = useState(false);

  const getScoreColor = (score) => {
    if (score >= 80) return '#00ff88';
    if (score >= 60) return '#ff9500';
    return '#ff6b6b';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return '✅ Excellent';
    if (score >= 60) return '⚠️ Fair';
    return '❌ Poor';
  };

  if (!isOpen) return null;

  return (
    <Card
      sx={{
        position: 'fixed',
        top: 450,
        right: 20,
        width: 380,
        maxHeight: 450,
        backgroundColor: '#1e1e1e',
        border: `1px solid ${getScoreColor(performanceScore)}`,
        borderRadius: 2,
        zIndex: 1000,
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <CardContent sx={{ pb: 1, borderBottom: '1px solid #333' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TuneIcon sx={{ color: getScoreColor(performanceScore) }} />
            <Typography variant="h6" sx={{ color: '#fff' }}>
              Performance
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: '#999' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </CardContent>

      {/* Performance Score */}
      <CardContent sx={{ py: 1.5 }}>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2">Overall Score</Typography>
            <Chip
              label={`${performanceScore}/100`}
              sx={{
                backgroundColor: getScoreColor(performanceScore),
                color: '#000',
                fontWeight: 'bold',
              }}
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={performanceScore}
            sx={{
              backgroundColor: '#1a1a1a',
              '& .MuiLinearProgress-bar': {
                backgroundColor: getScoreColor(performanceScore),
              },
              height: 6,
              borderRadius: 3,
            }}
          />
          <Typography variant="caption" sx={{ color: '#aaa', display: 'block', mt: 0.5 }}>
            {getScoreLabel(performanceScore)}
          </Typography>
        </Box>

        {/* Network Metrics */}
        <Typography variant="subtitle2" sx={{ color: '#00a8ff', mb: 1, fontSize: '0.85rem' }}>
          📡 Network Quality
        </Typography>
        <Grid container spacing={0.5} sx={{ mb: 1.5 }}>
          <Grid item xs={6}>
            <Card sx={{ backgroundColor: '#2a2a2a' }}>
              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="caption" sx={{ color: '#aaa', display: 'block', fontSize: '0.7rem' }}>
                  Latency
                </Typography>
                <Typography variant="body2" sx={{ color: '#00a8ff', fontWeight: 'bold' }}>
                  {stats?.connection?.latency?.toFixed(0) || 0}ms
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card sx={{ backgroundColor: '#2a2a2a' }}>
              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="caption" sx={{ color: '#aaa', display: 'block', fontSize: '0.7rem' }}>
                  Bandwidth
                </Typography>
                <Typography variant="body2" sx={{ color: '#00ff88', fontWeight: 'bold' }}>
                  {(stats?.connection?.availableOutgoing / 1024 / 1024)?.toFixed(1) || 0}Mbps
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card sx={{ backgroundColor: '#2a2a2a' }}>
              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="caption" sx={{ color: '#aaa', display: 'block', fontSize: '0.7rem' }}>
                  Video Loss
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: stats?.video?.packetsLost > 10 ? '#ff6b6b' : '#00ff88',
                    fontWeight: 'bold',
                  }}
                >
                  {stats?.video?.packetsLost || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card sx={{ backgroundColor: '#2a2a2a' }}>
              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="caption" sx={{ color: '#aaa', display: 'block', fontSize: '0.7rem' }}>
                  Jitter
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: stats?.audio?.jitter > 50 ? '#ff9500' : '#00ff88',
                    fontWeight: 'bold',
                  }}
                >
                  {stats?.audio?.jitter?.toFixed(0) || 0}ms
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ color: '#ff9500', mb: 0.5, fontSize: '0.85rem' }}>
              💡 Recommendations
            </Typography>
            {recommendations.map((rec, idx) => (
              <Alert
                key={idx}
                severity={rec.type === 'critical' ? 'error' : 'warning'}
                sx={{
                  mb: 0.5,
                  backgroundColor: rec.type === 'critical' ? '#3a2a2a' : '#3a3a2a',
                  color: rec.type === 'critical' ? '#ff6b6b' : '#ff9500',
                  fontSize: '0.75rem',
                  '& .MuiAlert-icon': {
                    fontSize: '1rem',
                  },
                }}
                icon={<WarningIcon />}
              >
                {rec.message}
              </Alert>
            ))}
          </Box>
        )}

        {/* Auto-Optimize */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            fullWidth
            variant={autoOptimizeEnabled ? 'contained' : 'outlined'}
            size="small"
            startIcon={<AutoFixHighIcon />}
            onClick={() => {
              setAutoOptimizeEnabled(!autoOptimizeEnabled);
              if (onOptimize) onOptimize();
            }}
            sx={{
              backgroundColor: autoOptimizeEnabled ? '#00ff88' : 'transparent',
              color: autoOptimizeEnabled ? '#000' : '#00ff88',
              borderColor: '#00ff88',
              fontSize: '0.75rem',
            }}
          >
            {autoOptimizeEnabled ? 'Optimizing' : 'Auto-Optimize'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
