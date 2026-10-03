const express = require('express');
const router = express.Router();
const { transcribeAudio } = require('../services/ai/voice-transcribe.service');

// POST /voice/transcribe
router.post('/transcribe', async (req, res) => {
  try {
    const { audio, mimeType } = req.body;
    if (!audio) {
      return res.status(400).json({ success: false, msg: 'Missing audio base64 payload' });
    }

    const result = await transcribeAudio({ base64Audio: audio, mimeType });
    res.json(result);
  } catch (err) {
    console.error('[Voice Route Error]:', err.message);
    res.status(500).json({ success: false, msg: err.message || 'Failed to transcribe voice audio' });
  }
});

module.exports = router;
