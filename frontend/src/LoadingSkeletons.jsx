// LoadingSkeletons.jsx - Beautiful loading states
import React from 'react';
import { Box, Skeleton, Grid } from '@mui/material';

export function VideoTileSkeleton() {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(25, 33, 61, 0.4)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      <Skeleton
        variant="rectangular"
        width="100%"
        height="100%"
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }}
      />
    </Box>
  );
}

export function ParticipantListSkeleton({ count = 3 }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="text" width="100%" height={20} />
        </Box>
      ))}
    </Box>
  );
}

export function ChatMessageSkeleton({ count = 5 }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Box key={i}>
          <Skeleton variant="text" width={100} height={16} />
          <Skeleton variant="text" width="90%" height={20} sx={{ mt: 0.5 }} />
          <Skeleton variant="text" width="70%" height={16} sx={{ mt: 0.5 }} />
        </Box>
      ))}
    </Box>
  );
}

export function MetricsSkeleton() {
  return (
    <Grid container spacing={2}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Grid item xs={12} sm={6} key={i}>
          <Box sx={{ p: 2, backgroundColor: 'rgba(25, 33, 61, 0.4)', borderRadius: '8px' }}>
            <Skeleton variant="text" width={100} height={16} />
            <Skeleton variant="text" width="60%" height={28} sx={{ mt: 1 }} />
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}

export function RoomLoadingSkeleton() {
  return (
    <Box sx={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Skeleton */}
      <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="text" width={200} height={24} />
      </Box>

      {/* Videos Grid Skeleton */}
      <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, p: 2 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <VideoTileSkeleton key={i} />
        ))}
      </Box>

      {/* Control Bar Skeleton */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="circular" width={48} height={48} />
        ))}
      </Box>
    </Box>
  );
}