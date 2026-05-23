// Keyboard Shortcuts Handler - Add to VideoMeetMediasoup.jsx
import { useEffect } from 'react';

export function useKeyboardShortcuts(handlers) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.code) {
        case 'KeyM':
          // Mute/Unmute
          if (handlers.onMuteToggle) {
            e.preventDefault();
            handlers.onMuteToggle();
          }
          break;
        case 'KeyV':
          // Video on/off
          if (handlers.onVideoToggle) {
            e.preventDefault();
            handlers.onVideoToggle();
          }
          break;
        case 'KeyS':
          // Screen share
          if (handlers.onScreenShareToggle) {
            e.preventDefault();
            handlers.onScreenShareToggle();
          }
          break;
        case 'KeyC':
          // Chat toggle
          if (handlers.onChatToggle) {
            e.preventDefault();
            handlers.onChatToggle();
          }
          break;
        case 'KeyH':
          // Hand raise (request to speak)
          if (handlers.onHandRaise) {
            e.preventDefault();
            handlers.onHandRaise();
          }
          break;
        case 'Escape':
          // Escape key for any modal/overlay close
          if (handlers.onEscapeKey) {
            e.preventDefault();
            handlers.onEscapeKey();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}

// Keyboard shortcuts help overlay
export function KeyboardShortcutsHelp() {
  return (
    <div style={{ fontSize: '14px', color: '#94a3b8' }}>
      <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>⌨️ Keyboard Shortcuts:</p>
      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px' }}>
        <code>M</code>
        <span>Mute/Unmute</span>
        
        <code>V</code>
        <span>Start/Stop Video</span>
        
        <code>S</code>
        <span>Share Screen</span>
        
        <code>C</code>
        <span>Toggle Chat</span>
        
        <code>H</code>
        <span>Raise Hand</span>
        
        <code>ESC</code>
        <span>Close Modal</span>
      </div>
    </div>
  );
}