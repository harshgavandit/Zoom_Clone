// EmojiPicker.jsx - Enhanced emoji picker for reactions and messages
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Tooltip,
  IconButton,
  Popover,
  Grid,
} from '@mui/material';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';

const EMOJI_CATEGORIES = {
  'smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '☺️', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '😑', '😐', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤮', '🤢', '🤮', '🤐', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'],
  'gestures': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🤜', '🤛', '🫳', '🫴', '🙏', '💅', '🦾', '🦿', '👂', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👅'],
  'hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌', '💋', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤'],
  'celebrations': ['🎉', '🎊', '🎈', '🎀', '🎁', '🏆', '🥇', '🥈', '🥉', '⭐', '🌟', '✨', '⚡', '🔥', '💥', '🎯', '🎲', '🎰', '🧩'],
  'nature': ['🌈', '🌞', '🌝', '🌛', '🌜', '💫', '⭐', '🌟', '✨', '🌠', '☄️', '💥', '🔥', '⚡', '❄️', '🌪️', '🌈', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '💧', '💦', '☔'],
  'activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎳', '🏓', '🏸', '🏒', '🏑', '🥊', '🥋', '🎣', '🎽', '🎿', '⛷️', '🛷', '🛹', '🛼', '🛺', '🏋️', '⛹️', '🤸', '🤼', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚴', '🚵', '🎯', '🪃', '🎣'],
};

export function EmojiPicker({ onSelectEmoji, buttonIcon = null }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('smileys');

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEmojiSelect = (emoji) => {
    onSelectEmoji(emoji);
    handleClose();
  };

  const open = Boolean(anchorEl);
  const id = open ? 'emoji-picker' : undefined;

  return (
    <>
      <Tooltip title="Add emoji">
        <IconButton
          aria-describedby={id}
          onClick={handleOpen}
          size="small"
        >
          {buttonIcon || <EmojiEmotionsIcon />}
        </IconButton>
      </Tooltip>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Paper
          sx={{
            width: '300px',
            maxHeight: '400px',
            p: 1,
            backgroundColor: '#0d1224',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* Category selector */}
          <Box
            sx={{
              display: 'flex',
              gap: '4px',
              mb: 1,
              pb: 1,
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              overflowX: 'auto',
            }}
          >
            {Object.keys(EMOJI_CATEGORIES).map((category) => (
              <Tooltip key={category} title={category}>
                <Box
                  onClick={() => setSelectedCategory(category)}
                  sx={{
                    cursor: 'pointer',
                    p: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: selectedCategory === category ?
                      'rgba(0, 106, 255, 0.2)' : 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '18px',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 106, 255, 0.1)',
                    }
                  }}
                >
                  {category === 'smileys' && '😊'}
                  {category === 'gestures' && '👋'}
                  {category === 'hearts' && '❤️'}
                  {category === 'celebrations' && '🎉'}
                  {category === 'nature' && '🌈'}
                  {category === 'activities' && '⚽'}
                </Box>
              </Tooltip>
            ))}
          </Box>

          {/* Emoji grid */}
          <Grid
            container
            spacing={0.5}
            sx={{
              maxHeight: '300px',
              overflowY: 'auto',
            }}
          >
            {EMOJI_CATEGORIES[selectedCategory].map((emoji, idx) => (
              <Grid item xs={4} key={idx} sx={{ p: '4px' }}>
                <Box
                  onClick={() => handleEmojiSelect(emoji)}
                  sx={{
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 106, 255, 0.2)',
                      transform: 'scale(1.2)',
                    }
                  }}
                >
                  {emoji}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Popover>
    </>
  );
}