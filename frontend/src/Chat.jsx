// Chat.jsx - React chat component with message list and input
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  Avatar,
  Chip,
  Tooltip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import CloseIcon from '@mui/icons-material/Close';

const REACTIONS = ['👍', '❤️', '😂', '🎉', '🔥'];

export default function Chat({ socket, roomId, userId, username, isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket || !roomId) return;

    // Request chat history on mount
    socket.emit('chat:history', roomId);

    // Listen for new messages
    const onNewMessage = (msg) => {
      setMessages(prev => [...prev, msg]);
    };

    const onHistory = (history) => {
      setMessages(history);
    };

    socket.on('chat:new-message', onNewMessage);
    socket.on('chat:history', onHistory);

    return () => {
      socket.off('chat:new-message', onNewMessage);
      socket.off('chat:history', onHistory);
    };
  }, [socket, roomId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit('chat:message', {
      roomId,
      userId,
      username,
      message,
      timestamp: Date.now(),
    });

    setMessage('');
  };

  const sendReaction = (emoji) => {
    socket.emit('chat:reaction', {
      roomId,
      userId,
      username,
      emoji,
      timestamp: Date.now(),
    });
    setShowReactions(false);
  };

  if (!isOpen) return null;

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 380,
        height: 500,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1e1e1e',
        borderRadius: 2,
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid #333',
        }}
      >
        <Typography variant="h6" sx={{ color: '#fff' }}>
          Chat
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: '#999' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#2a2a2a',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#555',
            borderRadius: '4px',
          },
        }}
      >
        {messages.length === 0 ? (
          <Typography sx={{ color: '#666', textAlign: 'center', my: 'auto' }}>
            No messages yet
          </Typography>
        ) : (
          messages.map((msg) => (
            <Box key={msg.id} sx={{ display: 'flex', gap: 1 }}>
              <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                {msg.username.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ color: '#aaa' }}>
                  {msg.username}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#fff',
                    backgroundColor: '#2a2a2a',
                    p: 1,
                    borderRadius: 1,
                    wordWrap: 'break-word',
                  }}
                >
                  {msg.message}
                </Typography>
              </Box>
            </Box>
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Box sx={{ p: 2, borderTop: '1px solid #333' }}>
        {/* Reactions */}
        {showReactions && (
          <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
            {REACTIONS.map((emoji) => (
              <Tooltip key={emoji} title={emoji}>
                <Chip
                  icon={<span>{emoji}</span>}
                  onClick={() => sendReaction(emoji)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: '#2a2a2a',
                    color: '#fff',
                    '&:hover': { backgroundColor: '#3a3a3a' },
                  }}
                  label=""
                />
              </Tooltip>
            ))}
          </Box>
        )}

        {/* Message Input */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            sx={{
              '& .MuiInputBase-input': {
                color: '#fff',
                fontSize: '0.875rem',
              },
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#2a2a2a',
                '& fieldset': { borderColor: '#444' },
                '&:hover fieldset': { borderColor: '#555' },
              },
            }}
          />
          <Tooltip title="Reactions">
            <IconButton
              size="small"
              onClick={() => setShowReactions(!showReactions)}
              sx={{ color: '#aaa' }}
            >
              <EmojiEmotionsIcon />
            </IconButton>
          </Tooltip>
          <IconButton
            size="small"
            onClick={sendMessage}
            disabled={!message.trim()}
            sx={{ color: message.trim() ? '#00a8ff' : '#555' }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
}
