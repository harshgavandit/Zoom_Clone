import express from 'express';
const router = express.Router();

router.get('/info', (req, res) => {
  res.json({
    server: 'Zoom Clone Backend',
    version: 'prototype',
    turnUrl: process.env.TURN_URL || null
  });
});

export default router;