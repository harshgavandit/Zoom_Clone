import React from 'react';
import { Link } from 'react-router-dom';
export default function RecordingsPage() {
  let files = []; try { files = JSON.parse(localStorage.getItem('recordings') || '[]'); } catch {}
  return <main style={{ padding: 32, maxWidth: 800, margin: 'auto' }}><Link to={localStorage.getItem('token') ? '/home' : '/'}>Back to home</Link><h1>Recordings</h1>
    <p>Record a meeting with the Record Screen button, then choose the screen or tab to capture. When recording stops, the video downloads to your device.</p>
    <p>Recordings stay on your device. This page lists downloads made in this browser; open the video from your Downloads folder.</p>
    {files.length ? <ul>{files.map(f => <li key={f.file} style={{ margin: '20px 0' }}>{f.file}<p>{new Date(f.date).toLocaleString()}</p></li>)}</ul> : <p>No recordings have been downloaded in this browser yet.</p>}
  </main>;
}
