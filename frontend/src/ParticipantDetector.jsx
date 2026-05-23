// ParticipantDetector.jsx - AI-powered participant face detection and speaker identification
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  AvatarGroup,
  Tooltip,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function ParticipantDetector({ 
  participants = [], 
  activeSpeaker = null,
  videoElements = {} 
}) {
  const [detectedFaces, setDetectedFaces] = useState({});
  const canvasRef = useRef(null);

  useEffect(() => {
    // Simulate face detection using canvas analysis (for hackathon demo)
    // In production, use TensorFlow.js or MediaPipe
    const detectFaces = async () => {
      const newDetections = {};
      
      // Simple brightness-based face detection (approximation)
      Object.entries(videoElements).forEach(([userId, videoEl]) => {
        if (!videoEl || !videoEl.srcObject) return;

        try {
          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext('2d');
          canvas.width = videoEl.videoWidth;
          canvas.height = videoEl.videoHeight;
          ctx.drawImage(videoEl, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Calculate average brightness (proxy for face detection)
          let brightness = 0;
          for (let i = 0; i < data.length; i += 4) {
            brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
          }
          brightness /= data.length / 4;

          newDetections[userId] = {
            detected: brightness > 50,
            brightness: Math.round(brightness),
            quality: brightness > 100 ? 'good' : brightness > 50 ? 'fair' : 'poor',
          };
        } catch (err) {
          console.log('Face detection skipped for', userId);
        }
      });

      setDetectedFaces(newDetections);
    };

    const interval = setInterval(detectFaces, 2000);
    return () => clearInterval(interval);
  }, [videoElements]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Active Speaker Indicator */}
      {activeSpeaker && (
        <Card sx={{ backgroundColor: '#2a3a2a', borderLeft: '4px solid #00ff88' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <MicIcon sx={{ color: '#00ff88', fontSize: '1.5rem' }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#aaa' }}>
                  Currently Speaking
                </Typography>
                <Typography variant="body2" sx={{ color: '#00ff88', fontWeight: 'bold' }}>
                  {activeSpeaker.name || 'Unknown'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Participant Detection Status */}
      <Card sx={{ backgroundColor: '#2a2a2a' }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ color: '#00a8ff', mb: 1.5 }}>
            👤 Participant Status
          </Typography>
          <Grid container spacing={1}>
            {participants.map((participant) => {
              const detection = detectedFaces[participant.id] || {};
              return (
                <Grid item xs={12} key={participant.id}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1,
                      backgroundColor: '#1a1a1a',
                      borderRadius: 1,
                      borderLeft: detection.detected ? '3px solid #00ff88' : '3px solid #555',
                    }}
                  >
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                      {participant.name?.charAt(0) || '?'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ color: '#fff' }}>
                        {participant.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25 }}>
                        {detection.detected && (
                          <Tooltip title="Camera detected">
                            <VisibilityIcon sx={{ fontSize: '0.875rem', color: '#00ff88' }} />
                          </Tooltip>
                        )}
                        {participant.audioEnabled && (
                          <Tooltip title="Microphone active">
                            <MicIcon sx={{ fontSize: '0.875rem', color: '#00a8ff' }} />
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                    <Chip
                      label={detection.quality || 'unknown'}
                      size="small"
                      sx={{
                        backgroundColor:
                          detection.quality === 'good'
                            ? '#00ff88'
                            : detection.quality === 'fair'
                            ? '#ff9500'
                            : '#555',
                        color: '#000',
                        fontSize: '0.65rem',
                      }}
                    />
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
