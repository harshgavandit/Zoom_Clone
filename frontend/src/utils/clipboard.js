// copyToClipboard.js - Utility for clipboard operations
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      // Modern secure context
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

// Share room functionality
export function generateRoomShareMessage(roomId, roomName) {
  const roomUrl = `${window.location.origin}/ms/${roomId}`;
  return `Join me in a video call: ${roomName} - ${roomUrl}`;
}

export const SHARE_PLATFORMS = [
  {
    name: 'Copy Link',
    icon: '📋',
    handler: async (roomId, roomName) => {
      const message = generateRoomShareMessage(roomId, roomName);
      const success = await copyToClipboard(message);
      return success;
    }
  },
  {
    name: 'WhatsApp',
    icon: '💬',
    handler: (roomId, roomName) => {
      const message = generateRoomShareMessage(roomId, roomName);
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    }
  },
  {
    name: 'Email',
    icon: '📧',
    handler: (roomId, roomName) => {
      const message = generateRoomShareMessage(roomId, roomName);
      const subject = encodeURIComponent(`Join my video call: ${roomName}`);
      const body = encodeURIComponent(message);
      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    }
  },
  {
    name: 'Twitter',
    icon: '𝕏',
    handler: (roomId, roomName) => {
      const message = generateRoomShareMessage(roomId, roomName);
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://twitter.com/intent/tweet?text=${encodedMessage}`, '_blank');
    }
  }
];