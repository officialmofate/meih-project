const aiService = require('../services/aiService');

exports.chat = async (req, res, next) => {
  try {
    const { message, context } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }
    const validContexts = ['event', 'innovation', 'general'];
    const ctx = validContexts.includes(context) ? context : 'general';

    const result = await aiService.chat(message.trim(), ctx);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.status = async (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({
    status: 'ok',
    gemini_configured: hasKey,
    model: hasKey ? 'gemini-2.5-flash' : 'fallback',
  });
};
