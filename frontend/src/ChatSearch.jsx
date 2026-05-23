// ChatSearch.jsx - Search through chat messages
import React, { useState, useMemo } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Typography,
  Chip,
  Paper,
  Highlighter,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

export default function ChatSearch({ messages = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return messages.filter(msg =>
      msg.message.toLowerCase().includes(query) ||
      msg.username.toLowerCase().includes(query)
    );
  }, [searchQuery, messages]);

  const highlightText = (text, query) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} style={{ backgroundColor: '#ff9500', color: '#000' }}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <TextField
        fullWidth
        size="small"
        placeholder="Search messages..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setShowResults(e.target.value.length > 0);
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: '#94a3b8' }} />
            </InputAdornment>
          ),
          endAdornment: searchQuery && (
            <InputAdornment position="end">
              <ClearIcon
                sx={{ cursor: 'pointer', color: '#94a3b8' }}
                onClick={() => {
                  setSearchQuery('');
                  setShowResults(false);
                }}
              />
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(25, 33, 61, 0.4)',
            borderRadius: '8px',
          }
        }}
      />

      {showResults && (
        <Paper
          sx={{
            mt: 2,
            backgroundColor: 'rgba(25, 33, 61, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            maxHeight: '300px',
            overflowY: 'auto',
          }}
        >
          {searchResults.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                No messages found
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ p: 1 }}>
                <Chip
                  label={`${searchResults.length} result${searchResults.length > 1 ? 's' : ''}`}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(0, 106, 255, 0.2)',
                    color: '#006aff',
                  }}
                />
              </Box>
              <List>
                {searchResults.map((msg, idx) => (
                  <ListItem key={idx} sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <ListItemText
                      primary={
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          {msg.username}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#f8fafc',
                            mt: 0.5,
                            wordBreak: 'break-word'
                          }}
                        >
                          {highlightText(msg.message, searchQuery)}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Paper>
      )}
    </Box>
  );
}