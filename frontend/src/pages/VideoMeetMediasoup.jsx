import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import MediasoupClient from '../utils/mediasoupClient';

export default function VideoMeetMediasoup() {
  const { roomId } = useParams();
  const [client, setClient] = useState(null);
  const localVideoRef = useRef();
  const remoteVideosRef = useRef(new Map());

  useEffect(() => {
    const signalingUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
    const c = new MediasoupClient({ url: signalingUrl, roomId: roomId || 'demo-room' });
    setClient(c);

    let mounted = true;

    async function start() {
      try {
        await c.connect();
        await c.initDevice();

        // get user media and produce
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!mounted) return;

        // attach local preview
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          await localVideoRef.current.play().catch(()=>{});
        }

        // produce tracks
        for (const track of stream.getTracks()) {
          await c.produceLocalTrack(track);
        }

        // Listen for new producers -> consume
        c.socket.on('mediasoup:producer-created', async ({ producerId, kind }) => {
          try {
            if (producerId && producerId.length) {
              await c.consume(producerId, (remoteTrack, meta) => {
                const key = meta.id;
                let el = remoteVideosRef.current.get(key);
                if (!el) {
                  el = document.createElement('video');
                  el.autoplay = true;
                  el.playsInline = true;
                  el.style.width = '240px';
                  remoteVideosRef.current.set(key, el);
                  document.getElementById('remoteContainer').appendChild(el);
                }
                const remoteStream = new MediaStream();
                remoteStream.addTrack(remoteTrack);
                el.srcObject = remoteStream;
              });
            }
          } catch (e) { console.error('consume failed', e); }
        });

      } catch (err) {
        console.error('mediasoup init failed', err);
      }
    }

    start();

    return () => {
      mounted = false;
      try { c.close(); } catch (e) {}
    };
  }, [roomId]);

  return (
    <div style={{ padding: 20 }}>
      <h3>Mediasoup Prototype Meeting</h3>
      <div style={{ display: 'flex', gap: 12 }}>
        <video ref={localVideoRef} style={{ width: 320, borderRadius: 8, background: '#000' }} autoPlay playsInline />
        <div id="remoteContainer" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}></div>
      </div>
    </div>
  );
}
