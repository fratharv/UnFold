// ai.js - Direct Frontend OpenAI Integration
// ⚠️ SECURITY WARNING: Your API key is visible in the browser source code. 

// 👇 PASTE YOUR OPENAI API KEY HERE 👇
const OPENAI_API_KEY = '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'; 
const OPENAI_MODEL = 'gpt-4o'; // You can change this to gpt-3.5-turbo if needed

const SYSTEM_PROMPT = `You are UNFOLD, a rigorous mathematics tutor. 
Principle: "Don't just get the answer. Learn how to find it."
Supported branches: calculus, algebra, trigonometry ONLY.
If a problem is outside these, return branch: "unsupported".
Always respond with VALID JSON only. Do not wrap the JSON in markdown blocks.`;

// Demo data for fallback mode (if API fails or demo is toggled)
const DEMO_DATA = {
  '∫ x²eˣ dx': {
    analysis: { branch: 'calculus', topic: 'integration', difficulty: 'intermediate', method: 'integration by parts', concept_explanation: 'This problem involves a product of two functions. Integration by parts is useful when differentiating one factor simplifies it while the other can be integrated directly.' },
    recall: { formula: '∫u dv = uv − ∫v du', explanation: 'Try identifying which part of the expression should be u (the part that simplifies when differentiated) and which should be dv.' },
    apply: { key_step: 'Choose u = x² and dv = eˣ dx. Then du = 2x dx and v = eˣ.', explanation: 'This choice reduces the power of x in the remaining integral.' },
    solution: { solution: '1. Apply formula: x²eˣ − ∫eˣ(2x)dx<br>2. Simplify: x²eˣ − 2∫xeˣdx<br>3. Apply integration by parts again on ∫xeˣdx (u=x, dv=eˣdx)<br>4. Result: x²eˣ − 2(xeˣ − eˣ) + C<br>5. Final: eˣ(x² − 2x + 2) + C', takeaway: 'Repeated integration by parts is a standard technique for polynomials multiplied by exponentials.' }
  },
  'x² − 5x + 6 = 0': {
    analysis: { branch: 'algebra', topic: 'equations', difficulty: 'elementary', method: 'factoring quadratic equation', concept_explanation: 'This is a standard quadratic equation. The goal is to find the roots by expressing the quadratic as a product of two binomials.' },
    recall: { formula: 'ax² + bx + c = (x - p)(x - q) = 0', explanation: 'Find two numbers that multiply to c (6) and add to b (-5).' },
    apply: { key_step: 'The numbers are -2 and -3. Rewrite as (x - 2)(x - 3) = 0.', explanation: 'Setting each factor to zero gives the solutions.' },
    solution: { solution: '1. Factor: (x - 2)(x - 3) = 0<br>2. Set each factor to zero: x - 2 = 0 or x - 3 = 0<br>3. Solve: x = 2 or x = 3', takeaway: 'Factoring is the most efficient method for quadratics with integer roots.' }
  },
  'sin²x + cos²x = 1': {
    analysis: { branch: 'trigonometry', topic: 'identities', difficulty: 'beginner', method: 'pythagorean identity', concept_explanation: 'This is the fundamental Pythagorean identity in trigonometry, derived from the unit circle definition of sine and cosine.' },
    recall: { formula: 'sin²θ + cos²θ = 1', explanation: 'This identity holds for all real values of x. It relates the squares of the primary trigonometric functions.' },
    apply: { key_step: 'Recognize that this is already in its simplest, proven form.', explanation: 'In a proof context, this is often the starting point or the target to reach.' },
    solution: { solution: '1. Consider a right triangle with hypotenuse 1 (unit circle).<br>2. By definition, sin(x) = opposite/hypotenuse = y, cos(x) = adjacent/hypotenuse = x.<br>3. By Pythagorean theorem: x² + y² = 1².<br>4. Substitute: cos²x + sin²x = 1.', takeaway: 'This identity is the foundation for deriving all other trigonometric identities.' }
  }
};

function cleanJSONResponse(text) {
  return text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
}

async function analyzeProblem(problem, isDemo) {
  if (isDemo) {
    await new Promise(r => setTimeout(r, 800));
    const normalized = problem.trim();
    if (DEMO_DATA[normalized]) return DEMO_DATA[normalized].analysis;
    return { branch: 'unsupported', error: 'UNFOLD currently supports Calculus, Algebra and Trigonometry. Try a demo example.' };
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analyze this problem: "${problem}". Return JSON with keys: branch, topic, difficulty, method, concept_explanation. Difficulty must be: beginner, elementary, intermediate, or advanced.` }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'OpenAI API request failed. Check your API key.');
  }

  const data = await response.json();
  return JSON.parse(cleanJSONResponse(data.choices[0].message.content));
}

async function getGuidance(problem, stage, analysis, isDemo) {
  if (isDemo) {
    await new Promise(r => setTimeout(r, 600));
    const normalized = problem.trim();
    if (DEMO_DATA[normalized]) {
      return stage === 'RECALL' ? DEMO_DATA[normalized].recall : DEMO_DATA[normalized].apply;
    }
  }

  let prompt = '';
  if (stage === 'RECALL') {
    prompt = `For the problem "${problem}" (${analysis.method}), provide ONLY the relevant formula, theorem, or identity. Return JSON: { "formula": "...", "explanation": "Briefly explain how to apply it without solving." }`;
  } else if (stage === 'APPLY') {
    prompt = `For the problem "${problem}", provide the crucial next step using ${analysis.method}. DO NOT solve the whole problem. Return JSON: { "key_step": "...", "explanation": "Explain why this step is taken." }`;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) throw new Error('Failed to get guidance from OpenAI.');
  const data = await response.json();
  return JSON.parse(cleanJSONResponse(data.choices[0].message.content));
}

async function showSolution(problem, analysis, isDemo) {
  if (isDemo) {
    await new Promise(r => setTimeout(r, 800));
    const normalized = problem.trim();
    if (DEMO_DATA[normalized]) return DEMO_DATA[normalized].solution;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Provide the complete, step-by-step worked solution for: "${problem}" using ${analysis.method}. Explain each major step clearly. Use <br> for line breaks. Return JSON: { "solution": "...", "takeaway": "..." }` }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) throw new Error('Failed to get solution from OpenAI.');
  const data = await response.json();
  return JSON.parse(cleanJSONResponse(data.choices[0].message.content));
}
