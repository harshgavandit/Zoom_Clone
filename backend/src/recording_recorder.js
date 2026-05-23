// recorder_recorder.js - prototype server-side recording scaffold (single-file fallback)
// Uses mediasoup PlainTransport to forward RTP to an FFmpeg process which records to file.
// NOTE: This is a prototype scaffold. mediasoup requires careful handling for production recording.

import { spawn } from 'child_process';

const recordings = new Map(); // recordingId -> { process, info }

export async function startRecording({ router, producer, outFile }) {
  // router: mediasoup Router instance
  // producer: mediasoup Producer instance to record
  // outFile: path to output file (e.g., ./recordings/room123.mp4)

  // Create a plain transport that FFmpeg can connect to
  const plainTransport = await router.createPlainTransport({
    listenIp: { ip: '127.0.0.1', announcedIp: null },
    rtcpMux: false,
    comedia: false
  });

  // Pipe the producer to the plain transport if available
  try {
    if (producer.pipeToTransport) {
      await producer.pipeToTransport({ transport: plainTransport });
    } else {
      console.warn('producer.pipeToTransport not available; implement alternative piping for your mediasoup version');
    }
  } catch (err) {
    console.error('pipeToTransport failed', err);
  }

  // Build FFmpeg command to receive SDP on stdin and write to file.
  const ffmpegArgs = [
    '-protocol_whitelist', 'file,udp,rtp',
    '-f', 'sdp', '-i', 'pipe:0',
    '-map', '0:v?', '-map', '0:a?',
    '-c:v', 'copy', '-c:a', 'copy',
    '-y', outFile
  ];

  const sdp = `v=0\no=- 0 0 IN IP4 127.0.0.1\ns=mediasoup-record\nc=IN IP4 127.0.0.1\nt=0 0\n`;

  const ff = spawn('ffmpeg', ffmpegArgs, { stdio: ['pipe', 'ignore', 'inherit'] });
  ff.stdin.write(sdp);
  ff.stdin.end();

  const recordingId = `${producer.id}-${Date.now()}`;
  recordings.set(recordingId, { process: ff, info: { outFile, producerId: producer.id } });

  ff.on('exit', (code, sig) => {
    console.log('ffmpeg exited', code, sig);
    recordings.delete(recordingId);
  });

  return { recordingId, outFile };
}

export async function stopRecording(recordingId) {
  const rec = recordings.get(recordingId);
  if (!rec) return false;
  try {
    rec.process.kill('SIGINT');
    recordings.delete(recordingId);
    return true;
  } catch (err) {
    console.error('Failed to stop recording', err);
    return false;
  }
}
