// ai.js - Frontend AI Communication Layer
// NEVER contains API keys. Communicates only with the backend.

const API_BASE_URL = 'http://localhost:3000/api'; // Change to your Render URL in production

// Demo data for fallback mode
const DEMO_DATA = {
  '∫ x²eˣ dx': {
    analysis: { branch: 'calculus', topic: 'integration', difficulty: 'intermediate', method: 'integration by parts', concept_explanation: 'This problem involves a product of two functions. Integration by parts is useful when differentiating one factor simplifies it while the other can be integrated directly.' },
    recall: { formula: '∫u dv = uv − ∫v du', explanation: 'Try identifying which part of the expression should be u (the part that simplifies when differentiated) and which should be dv.' },
    apply: { key_step: 'Choose u = x² and dv = eˣ dx. Then du = 2x dx and v = eˣ.', explanation: 'This choice reduces the power of x in the remaining integral.' },
    solution: { solution: '1. Apply formula: x²eˣ − ∫eˣ(2x)dx\n2. Simplify: x²eˣ − 2∫xeˣdx\n3. Apply integration by parts again on ∫xeˣdx (u=x, dv=eˣdx)\n4. Result: x²eˣ − 2(xeˣ − eˣ) + C\n5. Final: eˣ(x² − 2x + 2) + C', takeaway: 'Repeated integration by parts is a standard technique for polynomials multiplied by exponentials.' }
  },
  'x² − 5x + 6 = 0': {
    analysis: { branch: 'algebra', topic: 'equations', difficulty: 'elementary', method: 'factoring quadratic equation', concept_explanation: 'This is a standard quadratic equation. The goal is to find the roots by expressing the quadratic as a product of two binomials.' },
    recall: { formula: 'ax² + bx + c = (x - p)(x - q) = 0', explanation: 'Find two numbers that multiply to c (6) and add to b (-5).' },
    apply: { key_step: 'The numbers are -2 and -3. Rewrite as (x - 2)(x - 3) = 0.', explanation: 'Setting each factor to zero gives the solutions.' },
    solution: { solution: '1. Factor: (x - 2)(x - 3) = 0\n2. Set each factor to zero: x - 2 = 0 or x - 3 = 0\n3. Solve: x = 2 or x = 3', takeaway: 'Factoring is the most efficient method for quadratics with integer roots.' }
  },
  'sin²x + cos²x = 1': {
    analysis: { branch: 'trigonometry', topic: 'identities', difficulty: 'beginner', method: 'pythagorean identity', concept_explanation: 'This is the fundamental Pythagorean identity in trigonometry, derived from the unit circle definition of sine and cosine.' },
    recall: { formula: 'sin²θ + cos²θ = 1', explanation: 'This identity holds for all real values of x. It relates the squares of the primary trigonometric functions.' },
    apply: { key_step: 'Recognize that this is already in its simplest, proven form.', explanation: 'In a proof context, this is often the starting point or the target to reach.' },
    solution: { solution: '1. Consider a right triangle with hypotenuse 1 (unit circle).\n2. By definition, sin(x) = opposite/hypotenuse = y, cos(x) = adjacent/hypotenuse = x.\n3. By Pythagorean theorem: x² + y² = 1².\n4. Substitute: cos²x + sin²x = 1.', takeaway: 'This identity is the foundation for deriving all other trigonometric identities.' }
  }
};

async function analyzeProblem(problem, isDemo) {
  if (isDemo) {
    await new Promise(r => setTimeout(r, 800)); // Simulate network delay
    const normalized = problem.trim();
    if (DEMO_DATA[normalized]) return DEMO_DATA[normalized].analysis;
    return { branch: 'unsupported', error: 'UNFOLD currently supports Calculus, Algebra and Trigonometry. Try a demo example.' };
  }

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ problem })
  });
  
  if (!response.ok) throw new Error('Backend analysis failed');
  return await response.json();
}

async function getGuidance(problem, stage, analysis, isDemo) {
  if (isDemo) {
    await new Promise(r => setTimeout(r, 600));
    const normalized = problem.trim();
    if (DEMO_DATA[normalized]) {
      return stage === 'RECALL' ? DEMO_DATA[normalized].recall : DEMO_DATA[normalized].apply;
    }
  }

  const response = await fetch(`${API_BASE_URL}/guidance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ problem, stage, analysis })
  });
  
  if (!response.ok) throw new Error('Backend guidance failed');
  return await response.json();
}

async function showSolution(problem, analysis, isDemo) {
  if (isDemo) {
    await new Promise(r => setTimeout(r, 800));
    const normalized = problem.trim();
    if (DEMO_DATA[normalized]) return DEMO_DATA[normalized].solution;
  }

  const response = await fetch(`${API_BASE_URL}/solution`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ problem, analysis })
  });
  
  if (!response.ok) throw new Error('Backend solution failed');
  return await response.json();
}
