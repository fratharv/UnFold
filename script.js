// script.js - UI Logic and State Management

const problemInput = document.getElementById('problem-input');
const analyzeBtn = document.getElementById('analyze-btn');
const guidanceContent = document.getElementById('guidance-content');
const actionArea = document.getElementById('action-area');
const demoToggle = document.getElementById('demo-mode-toggle');

let currentStage = 0;
let currentAnalysis = null;
let currentProblem = '';

// --- KEYPAD LOGIC ---
document.querySelectorAll('.key').forEach(key => {
  key.addEventListener('click', () => {
    const val = key.getAttribute('data-val');
    const action = key.getAttribute('data-action');
    
    if (action === 'clear') {
      problemInput.value = '';
      problemInput.focus();
    } else if (action === 'backspace') {
      const start = problemInput.selectionStart;
      const end = problemInput.selectionEnd;
      if (start === end && start > 0) {
        problemInput.value = problemInput.value.substring(0, start - 1) + problemInput.value.substring(end);
        problemInput.selectionStart = problemInput.selectionEnd = start - 1;
      } else {
        problemInput.value = problemInput.value.substring(0, start) + problemInput.value.substring(end);
        problemInput.selectionStart = problemInput.selectionEnd = start;
      }
      problemInput.focus();
    } else if (action === 'left') {
      problemInput.selectionStart = problemInput.selectionEnd = Math.max(0, problemInput.selectionStart - 1);
      problemInput.focus();
    } else if (action === 'right') {
      problemInput.selectionStart = problemInput.selectionEnd = Math.min(problemInput.value.length, problemInput.selectionEnd + 1);
      problemInput.focus();
    } else if (val) {
      const start = problemInput.selectionStart;
      const end = problemInput.selectionEnd;
      const text = problemInput.value;
      problemInput.value = text.substring(0, start) + val + text.substring(end);
      
      // Smart cursor placement for functions like sin()
      let cursorOffset = val.length;
      if (val.includes('()')) {
        cursorOffset = val.indexOf('()') + 1;
      }
      
      problemInput.focus();
      problemInput.selectionStart = problemInput.selectionEnd = start + cursorOffset;
    }
  });
});

// --- STATE & UI UPDATES ---
function setStage(stageNum) {
  currentStage = stageNum;
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`stage-${i}`);
    el.classList.remove('active', 'completed');
    if (i < stageNum) el.classList.add('completed');
    if (i === stageNum) el.classList.add('active');
  }
}

function showLoading() {
  guidanceContent.innerHTML = '<div class="loading-state">ANALYZING MATHEMATICAL STRUCTURE…</div>';
  actionArea.innerHTML = '';
}

function showError(msg) {
  guidanceContent.innerHTML = `<p style="color: var(--accent-red); font-weight: bold;">ERROR: ${msg}</p>`;
  actionArea.innerHTML = '';
}

function updatePortrait(analysis) {
  const placeholder = document.getElementById('portrait-placeholder');
  const display = document.getElementById('portrait-display');
  const img = document.getElementById('math-portrait');
  const name = document.getElementById('math-name');
  const branch = document.getElementById('math-branch');

  if (analysis.branch === 'unsupported') {
    placeholder.classList.remove('hidden');
    display.classList.add('hidden');
    return;
  }

  placeholder.classList.add('hidden');
  display.classList.remove('hidden');

  const portraits = {
    calculus: { name: 'NEWTON', branch: 'CALCULUS', url: 'https://upload.wikimedia.org/wikipedia/commons/3/39/GodfreyKneller-IsaacNewton-1689.jpg' },
    algebra: { name: 'GALOIS', branch: 'ALGEBRA', url: 'https://upload.wikimedia.org/wikipedia/commons/0/01/%C3%89variste_Galois.jpg' },
    trigonometry: { name: 'HIPPARCHUS', branch: 'TRIGONOMETRY', url: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Hipparchus_1.jpeg' }
  };

  const p = portraits[analysis.branch] || portraits.calculus;
  img.src = p.url;
  img.alt = `Portrait of ${p.name}`;
  name.textContent = p.name;
  branch.textContent = p.branch;
}

function resetUI() {
  currentStage = 0;
  currentAnalysis = null;
  setStage(0);
  guidanceContent.innerHTML = '<p class="placeholder-text">Submit a problem to begin.</p>';
  actionArea.innerHTML = '';
  document.getElementById('portrait-placeholder').classList.remove('hidden');
  document.getElementById('portrait-display').classList.add('hidden');
}

// --- MAIN ACTIONS ---
analyzeBtn.addEventListener('click', async () => {
  currentProblem = problemInput.value.trim();
  if (!currentProblem) {
    showError('Please enter a mathematics problem.');
    return;
  }

  resetUI();
  setStage(1);
  showLoading();
  analyzeBtn.disabled = true;

  try {
    const isDemo = demoToggle.checked;
    currentAnalysis = await analyzeProblem(currentProblem, isDemo);

    if (currentAnalysis.branch === 'unsupported') {
      showError(currentAnalysis.error || 'Unsupported branch.');
      analyzeBtn.disabled = false;
      return;
    }

    // Render Stage 1: IDENTIFY
    guidanceContent.innerHTML = `
      ${isDemo ? '<div class="demo-badge">DEMO MODE</div>' : ''}
      <h4>${currentAnalysis.branch.toUpperCase()} · ${currentAnalysis.topic.toUpperCase()}</h4>
      <p><strong>Difficulty:</strong> ${currentAnalysis.difficulty.toUpperCase()}</p>
      <p><strong>Method:</strong> ${currentAnalysis.method}</p>
      <hr style="margin: 1rem 0; border: 1px solid var(--text-dark);">
      <p>${currentAnalysis.concept_explanation}</p>
    `;
    
    updatePortrait(currentAnalysis);

    actionArea.innerHTML = `<button class="secondary-btn" id="next-recall">I'M STILL STUCK →</button>`;
    document.getElementById('next-recall').addEventListener('click', handleRecall);

  } catch (err) {
    console.error(err);
    showError('Failed to connect to the UNFOLD backend. Check console or enable Demo Mode.');
  } finally {
    analyzeBtn.disabled = false;
  }
});

async function handleRecall() {
  setStage(2);
  showLoading();
  
  try {
    const isDemo = demoToggle.checked;
    const data = await getGuidance(currentProblem, 'RECALL', currentAnalysis, isDemo);
    
    guidanceContent.innerHTML = `
      ${isDemo ? '<div class="demo-badge">DEMO MODE</div>' : ''}
      <h4>02 · RECALL</h4>
      <div class="formula">${data.formula}</div>
      <p>${data.explanation}</p>
    `;
    
    actionArea.innerHTML = `<button class="secondary-btn" id="next-apply">GIVE ME THE NEXT STEP →</button>`;
    document.getElementById('next-apply').addEventListener('click', handleApply);
  } catch (err) {
    showError('Failed to load recall guidance.');
  }
}

async function handleApply() {
  setStage(3);
  showLoading();
  
  try {
    const isDemo = demoToggle.checked;
    const data = await getGuidance(currentProblem, 'APPLY', currentAnalysis, isDemo);
    
    guidanceContent.innerHTML = `
      ${isDemo ? '<div class="demo-badge">DEMO MODE</div>' : ''}
      <h4>03 · APPLY</h4>
      <p><strong>Next Step:</strong> ${data.key_step}</p>
      <p>${data.explanation}</p>
    `;
    
    actionArea.innerHTML = `<button class="secondary-btn" id="next-solve">SHOW COMPLETE SOLUTION →</button>`;
    document.getElementById('next-solve').addEventListener('click', handleSolve);
  } catch (err) {
    showError('Failed to load apply guidance.');
  }
}

async function handleSolve() {
  setStage(4);
  showLoading();
  
  try {
    const isDemo = demoToggle.checked;
    const data = await showSolution(currentProblem, currentAnalysis, isDemo);
    
    // Format solution with line breaks
    const formattedSolution = data.solution.replace(/\n/g, '<br>');
    
    guidanceContent.innerHTML = `
      ${isDemo ? '<div class="demo-badge">DEMO MODE</div>' : ''}
      <h4>04 · SOLVE</h4>
      <div style="background: var(--paper-color); padding: 1rem; border: 2px solid var(--text-dark); margin-bottom: 1rem;">
        ${formattedSolution}
      </div>
      <p><strong>Takeaway:</strong> ${data.takeaway}</p>
    `;
    
    actionArea.innerHTML = `<button class="primary-btn" id="reset-btn">ANALYZE NEW PROBLEM</button>`;
    document.getElementById('reset-btn').addEventListener('click', () => {
      problemInput.value = '';
      resetUI();
    });
  } catch (err) {
    showError('Failed to load complete solution.');
  }
}

// Initialize
resetUI();
