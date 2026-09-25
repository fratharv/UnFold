require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const allowedOrigins = process.env.FRONTEND_ORIGIN ? process.env.FRONTEND_ORIGIN.split(',') : ['http://localhost:3000'];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

const SYSTEM_PROMPT = `You are UNFOLD, a rigorous mathematics tutor. 
Principle: "Don't just get the answer. Learn how to find it."
Supported branches: calculus, algebra, trigonometry ONLY.
If a problem is outside these, return branch: "unsupported".
Always respond with VALID JSON only. No markdown formatting around the JSON.`;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'UNFOLD backend is running' });
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { problem } = req.body;
    if (!problem) return res.status(400).json({ error: 'Problem is required' });

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analyze this problem: "${problem}". Return JSON with keys: branch, topic, difficulty, method, concept_explanation. Difficulty must be: beginner, elementary, intermediate, or advanced.` }
      ],
      response_format: { type: "json_object" }
    });

    const data = JSON.parse(response.choices[0].message.content);
    res.json(data);
  } catch (error) {
    console.error('Analyze error:', error);
    res.status(500).json({ error: 'Failed to analyze problem' });
  }
});

app.post('/api/guidance', async (req, res) => {
  try {
    const { problem, stage, analysis } = req.body;
    if (!problem || !stage || !analysis) return res.status(400).json({ error: 'Missing parameters' });

    let prompt = '';
    if (stage === 'RECALL') {
      prompt = `For the problem "${problem}" (${analysis.method}), provide ONLY the relevant formula, theorem, or identity. Return JSON: { "formula": "...", "explanation": "Briefly explain how to apply it without solving." }`;
    } else if (stage === 'APPLY') {
      prompt = `For the problem "${problem}", provide the crucial next step using ${analysis.method}. DO NOT solve the whole problem. Return JSON: { "key_step": "...", "explanation": "Explain why this step is taken." }`;
    }

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    res.json(JSON.parse(response.choices[0].message.content));
  } catch (error) {
    console.error('Guidance error:', error);
    res.status(500).json({ error: 'Failed to get guidance' });
  }
});

app.post('/api/solution', async (req, res) => {
  try {
    const { problem, analysis } = req.body;
    if (!problem || !analysis) return res.status(400).json({ error: 'Missing parameters' });

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Provide the complete, step-by-step worked solution for: "${problem}" using ${analysis.method}. Explain each major step clearly. Return JSON: { "solution": "...", "takeaway": "..." }` }
      ],
      response_format: { type: "json_object" }
    });

    res.json(JSON.parse(response.choices[0].message.content));
  } catch (error) {
    console.error('Solution error:', error);
    res.status(500).json({ error: 'Failed to get solution' });
  }
});

app.listen(PORT, () => {
  console.log(`UNFOLD backend running on port ${PORT}`);
});
