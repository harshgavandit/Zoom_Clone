// useScreenShare.js - React hook for screen sharing
import { useState, useRef, useCallback } from 'react';

export function useScreenShare(socket, roomId, userId) {
  const [isSharing, setIsSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const peerConnectionRef = useRef(null);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      });

      setScreenStream(stream);
      setIsSharing(true);

      socket.emit('screen-share:start', {
        roomId,
        userId,
        username: 'User',
      });

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      return stream;
    } catch (err) {
      if (err.name !== 'NotAllowedError') {
        console.error('Screen share error:', err);
      }
      setIsSharing(false);
    }
  }, [socket, roomId, userId]);

  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }

    setIsSharing(false);

    socket.emit('screen-share:stop', {
      roomId,
      userId,
    });
  }, [screenStream, socket, roomId, userId]);

  return {
    isSharing,
    screenStream,
    startScreenShare,
    stopScreenShare,
  };
}
