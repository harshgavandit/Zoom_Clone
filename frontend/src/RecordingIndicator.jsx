// RecordingIndicator.jsx - Simple recording indicator with animation
import React from 'react';
import { Box, Typography } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

export default function RecordingIndicator() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        mb: 2,
        p: 1,
        backgroundColor: '#ff3333',
        borderRadius: 1,
        animation: 'pulse 1s infinite',
        '@keyframes pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
      }}
    >
      <FiberManualRecordIcon sx={{ color: '#fff', fontSize: '1rem' }} />
      <Typography variant="caption" sx={{ color: '#fff', fontWeight: 'bold' }}>
        REC
      </Typography>
    </Box>
  );
}
