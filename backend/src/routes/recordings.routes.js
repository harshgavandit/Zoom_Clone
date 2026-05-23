import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const recordingsDir = path.join(process.cwd(), 'recordings');

router.get('/', (req, res) => {
  if (!fs.existsSync(recordingsDir)) return res.json([]);
  const files = fs.readdirSync(recordingsDir).map(f => ({ file: f, url: `/api/v1/recordings/download/${encodeURIComponent(f)}` }));
  res.json(files);
});

router.get('/download/:file', (req, res) => {
  const file = req.params.file;
  const filePath = path.join(recordingsDir, file);
  if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
  res.download(filePath);
});

export default router;