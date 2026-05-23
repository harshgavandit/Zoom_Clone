import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function RecordingsPage() {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    async function fetchFiles() {
      try {
        const res = await axios.get('/api/v1/recordings');
        setFiles(res.data);
      } catch (err) { console.error(err); }
    }
    fetchFiles();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h3>Recordings</h3>
      <ul>
        {files.map(f => (
          <li key={f.file}><a href={f.url}>{f.file}</a></li>
        ))}
      </ul>
    </div>
  );
}
