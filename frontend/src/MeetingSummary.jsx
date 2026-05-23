// MeetingSummary.jsx - Post-meeting summary report
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';

export default function MeetingSummary({ open, summary, onClose, onDownload }) {
  if (!open || !summary) return null;

  const getScoreColor = (score) => {
    if (score >= 85) return '#00ff88';
    if (score >= 70) return '#ff9500';
    return '#ff6b6b';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ background: 'linear-gradient(135deg, #006aff 0%, #0099ff 100%)', color: '#fff' }}>
        📊 Meeting Summary Report
      </DialogTitle>
      <DialogContent sx={{ backgroundColor: '#1e1e1e', color: '#fff' }}>
        {/* Duration & Participants */}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <Card sx={{ backgroundColor: '#2a2a2a' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="textSecondary" gutterBottom>
                  Duration
                </Typography>
                <Typography variant="h4" sx={{ color: '#00a8ff' }}>
                  {summary.duration} min
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card sx={{ backgroundColor: '#2a2a2a' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="textSecondary" gutterBottom>
                  Participants
                </Typography>
                <Typography variant="h4" sx={{ color: '#00ff88' }}>
                  {summary.participantCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Engagement & Quality Scores */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ color: '#00a8ff', mb: 1 }}>
            Meeting Quality
          </Typography>
          <Card sx={{ backgroundColor: '#2a2a2a', mb: 2 }}>
            <CardContent>
              {/* Engagement Score */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">Engagement Score</Typography>
                  <Chip
                    label={summary.engagementScore}
                    sx={{ backgroundColor: getScoreColor(summary.engagementScore), color: '#000' }}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={summary.engagementScore}
                  sx={{
                    backgroundColor: '#1a1a1a',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getScoreColor(summary.engagementScore),
                    },
                  }}
                />
              </Box>

              {/* Quality Score */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">Connection Quality</Typography>
                  <Chip
                    label={summary.qualityScore}
                    sx={{ backgroundColor: getScoreColor(summary.qualityScore), color: '#000' }}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={summary.qualityScore}
                  sx={{
                    backgroundColor: '#1a1a1a',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getScoreColor(summary.qualityScore),
                    },
                  }}
                />
              </Box>

              {/* Overall Score */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Overall Score
                  </Typography>
                  <Chip
                    label={summary.overallScore}
                    sx={{
                      backgroundColor: getScoreColor(summary.overallScore),
                      color: '#000',
                      fontWeight: 'bold',
                    }}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={summary.overallScore}
                  sx={{
                    backgroundColor: '#1a1a1a',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getScoreColor(summary.overallScore),
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Engagement Metrics */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ color: '#00a8ff', mb: 1 }}>
            Activity Summary
          </Typography>
          <Card sx={{ backgroundColor: '#2a2a2a' }}>
            <CardContent>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ color: '#aaa', borderColor: '#333' }}>Chat Messages</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 'bold', borderColor: '#333' }}>
                      {summary.totalMessages}
                    </TableCell>
                    <TableCell sx={{ color: '#aaa', borderColor: '#333' }}>
                      {summary.avgMessagesPerMinute}/min
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: '#aaa', borderColor: '#333' }}>Emoji Reactions</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 'bold', borderColor: '#333' }}>
                      {summary.totalReactions}
                    </TableCell>
                    <TableCell sx={{ color: '#aaa', borderColor: '#333' }}>👍 ❤️ 😂</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: '#aaa', borderColor: '#333' }}>Screen Shares</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 'bold', borderColor: '#333' }}>
                      {summary.screenShares}
                    </TableCell>
                    <TableCell sx={{ color: '#aaa', borderColor: '#333' }}>📺</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Box>

        {/* Key Insights */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ color: '#00a8ff', mb: 1 }}>
            Key Insights 💡
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {summary.keyInsights?.map((insight, idx) => (
              <Card key={idx} sx={{ backgroundColor: '#2a2a2a' }}>
                <CardContent sx={{ py: 1, px: 2 }}>
                  <Typography variant="body2">{insight}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>

        {/* Recommendations */}
        {summary.recommendedActions?.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#ff9500', mb: 1 }}>
              Recommended Actions ⚡
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {summary.recommendedActions.map((action, idx) => (
                <Card key={idx} sx={{ backgroundColor: '#3a3a2a' }}>
                  <CardContent sx={{ py: 1, px: 2 }}>
                    <Typography variant="body2">{action}</Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ backgroundColor: '#1e1e1e', borderTop: '1px solid #333', p: 2 }}>
        <Button onClick={onClose}>Close</Button>
        <Button
          startIcon={<DownloadIcon />}
          onClick={onDownload}
          variant="contained"
          sx={{ backgroundColor: '#006aff' }}
        >
          Download Report
        </Button>
        <Button
          startIcon={<ShareIcon />}
          variant="outlined"
          sx={{ borderColor: '#00a8ff', color: '#00a8ff' }}
        >
          Share
        </Button>
      </DialogActions>
    </Dialog>
  );
}
