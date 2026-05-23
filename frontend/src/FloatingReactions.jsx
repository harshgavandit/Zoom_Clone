// FloatingReactions.jsx - Animated emoji reactions above video tiles
import React, { useState, useCallback } from 'react';
import { Box } from '@mui/material';

export function FloatingReactions() {
  const [reactions, setReactions] = useState([]);

  const addReaction = useCallback((emoji, x, y) => {
    const id = Date.now() + Math.random();
    const reaction = { id, emoji, x, y };

    setReactions(prev => [...prev, reaction]);

    // Remove after animation completes (3 seconds)
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 3000);
  }, []);

  return (
    <>
      {/* Container for floating reactions */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 50,
        }}
      >
        {reactions.map((reaction) => (
          <FloatingEmoji
            key={reaction.id}
            emoji={reaction.emoji}
            x={reaction.x}
            y={reaction.y}
          />
        ))}
      </Box>

      {/* CSS Animations */}
      <style>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) scale(0.5);
            opacity: 0;
          }
        }

        .floating-emoji {
          animation: float-up 3s ease-out forwards;
          position: fixed;
          font-size: 48px;
          user-select: none;
        }
      `}</style>

      {/* Expose function for external use */}
      {React.useEffect && React.useEffect(() => {
        window.addReaction = addReaction;
        return () => delete window.addReaction;
      }, [addReaction])}

      <div style={{ display: 'none' }}>
        {/* This component is invisible and just manages reactions */}
      </div>
    </>
  );
}

function FloatingEmoji({ emoji, x, y }) {
  return (
    <div
      className="floating-emoji"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      {emoji}
    </div>
  );
}

// Hook to use floating reactions
export function useFloatingReactions() {
  const addReaction = (emoji, event) => {
    if (window.addReaction) {
      const rect = event.target.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      window.addReaction(emoji, x, y);
    }
  };

  return { addReaction };
}