import React, { useEffect, useState } from 'react';
import { api, errorMessage } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { Button, Box, Card, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

export default function SystemInfo() {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/system/info').then(res => setInfo(res.data)).catch(err => setError(errorMessage(err)));
  }, []);

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>System Info</Typography>
      <p role="alert">{error}</p>
      {info && (
        <Card sx={{ p: 2, background: 'rgba(13, 18, 36, 0.8)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Typography sx={{ mb: 1 }}><strong>Server:</strong> {info.server}</Typography>
          <Typography sx={{ mb: 1 }}><strong>Version:</strong> {info.version}</Typography>
          <Typography sx={{ mb: 1 }}><strong>Media:</strong> {info.media}</Typography>
        </Card>
      )}
    </Box>
  );
}
