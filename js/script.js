// State
const state = {
  navigationMode: 'period',
  practiceMode: 'full',
  selectedBlocks: [],
  selectedGroups: [],
  selectedPeriods: [],
  activeElements: new Set(),
  correctElements: new Set(),
  wrongAttempts: {},
  timerStarted: false,
  timerInterval: null,
  startTime: null,
  elapsedTime: 0,
  currentElement: null
};

// DOM Elements
const introOverlay = document.getElementById('introOverlay');
const startBtn = document.getElementById('startBtn');
const mainApp = document.getElementById('mainApp');
const darkModeBtn = document.getElementById('darkModeBtn');
const resetBtn = document.getElementById('resetBtn');
const periodicTable = document.getElementById('periodicTable');
const timerDisplay = document.getElementById('timerDisplay');
const bestTimeDisplay = document.getElementById('bestTime');
const correctCountDisplay = document.getElementById('correctCount');
const totalCountDisplay = document.getElementById('totalCount');
const percentCompleteDisplay = document.getElementById('percentComplete');
const progressFill = document.getElementById('progressFill');
const modeSelectionPanel = document.getElementById('modeSelectionPanel');
const historyBtn = document.getElementById('historyBtn');
const historyModal = document.getElementById('historyModal');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');
const historyModalBody = document.getElementById('historyModalBody');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  detectDarkMode();
  setupIntro();
  setupEventListeners();
});

// Intro Screen
function setupIntro() {
  startBtn.addEventListener('click', startApp);
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !introOverlay.classList.contains('fade-out')) {
      startApp();
    }
  });
}

function startApp() {
  introOverlay.classList.add('fade-out');
  setTimeout(() => {
    introOverlay.classList.add('hidden');
    mainApp.classList.remove('hidden');
    renderPeriodicTable();
    initializeFullTable();
  }, 600);
}

// Dark Mode
function detectDarkMode() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedDarkMode = localStorage.getItem('darkMode');
  
  if (savedDarkMode === 'true' || (savedDarkMode === null && prefersDark)) {
    document.body.dataset.theme = 'dark';
    darkModeBtn.innerHTML = '<i class="ri-sun-line"></i>';
  }
}

// Event Listeners
function setupEventListeners() {
  // Dark mode toggle
  darkModeBtn.addEventListener('click', () => {
    const isDark = document.body.dataset.theme === 'dark';
    document.body.dataset.theme = isDark ? '' : 'dark';
    darkModeBtn.innerHTML = isDark ? '<i class="ri-moon-line"></i>' : '<i class="ri-sun-line"></i>';
    localStorage.setItem('darkMode', !isDark);
  });
  
  // Mode tabs
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const mode = e.currentTarget.dataset.mode;
      state.practiceMode = mode;
      handleModeChange(mode);
    });
  });
  
  // Navigation toggle
  document.querySelectorAll('.nav-option').forEach(option => {
    option.addEventListener('click', (e) => {
      document.querySelectorAll('.nav-option').forEach(o => o.classList.remove('active'));
      e.currentTarget.classList.add('active');
      state.navigationMode = e.currentTarget.dataset.nav;
      localStorage.setItem('navigationMode', state.navigationMode);
    });
  });
  
  // Reset button
  resetBtn.addEventListener('click', resetChallenge);
  
  // History button
  historyBtn.addEventListener('click', openHistoryModal);
  closeHistoryBtn.addEventListener('click', closeHistoryModal);
  historyModal.addEventListener('click', (e) => {
    if (e.target === historyModal) closeHistoryModal();
  });
  
  // Table interaction
  periodicTable.addEventListener('click', handleElementClick);
  
  // Load saved navigation preference
  const savedNav = localStorage.getItem('navigationMode');
  if (savedNav) {
    state.navigationMode = savedNav;
    document.querySelectorAll('.nav-option').forEach(option => {
      if (option.dataset.nav === savedNav) {
        document.querySelectorAll('.nav-option').forEach(o => o.classList.remove('active'));
        option.classList.add('active');
      }
    });
  }
}

// Mode Change Handler
function handleModeChange(mode) {
  modeSelectionPanel.innerHTML = '';
  
  switch (mode) {
    case 'full':
      modeSelectionPanel.classList.add('hidden');
      initializeFullTable();
      break;
    case 'block':
      modeSelectionPanel.classList.remove('hidden');
      createBlockSelector();
      break;
    case 'group':
      modeSelectionPanel.classList.remove('hidden');
      createGroupSelector();
      break;
    case 'period':
      modeSelectionPanel.classList.remove('hidden');
      createPeriodSelector();
      break;
  }
}

// Selectors
function createBlockSelector() {
  modeSelectionPanel.innerHTML = `
    <div class="selector-title">Select Blocks</div>
    <div class="selector-options">
      ${['s', 'p', 'd', 'f'].map(block => `
        <label class="checkbox-option">
          <input type="checkbox" value="${block}" class="block-checkbox">
          <span>${block.toUpperCase()}-Block</span>
        </label>
      `).join('')}
    </div>
    <button class="apply-selection-btn">Apply Selection</button>
  `;
  
  document.querySelector('.apply-selection-btn').addEventListener('click', () => {
    state.selectedBlocks = Array.from(document.querySelectorAll('.block-checkbox:checked')).map(cb => cb.value);
    applySelection();
  });
}

function createGroupSelector() {
  const groups = Array.from({length: 18}, (_, i) => i + 1);
  modeSelectionPanel.innerHTML = `
    <div class="selector-title">Select Groups</div>
    <div class="selector-options group-grid">
      ${groups.map(g => `
        <label class="checkbox-option">
          <input type="checkbox" value="${g}" class="group-checkbox">
          <span>${g}</span>
        </label>
      `).join('')}
    </div>
    <button class="apply-selection-btn">Apply Selection</button>
  `;
  
  document.querySelector('.apply-selection-btn').addEventListener('click', () => {
    state.selectedGroups = Array.from(document.querySelectorAll('.group-checkbox:checked')).map(cb => parseInt(cb.value));
    applySelection();
  });
}

function createPeriodSelector() {
  const periods = Array.from({length: 7}, (_, i) => i + 1);
  modeSelectionPanel.innerHTML = `
    <div class="selector-title">Select Periods</div>
    <div class="selector-options">
      ${periods.map(p => `
        <label class="checkbox-option">
          <input type="checkbox" value="${p}" class="period-checkbox">
          <span>Period ${p}</span>
        </label>
      `).join('')}
    </div>
    <button class="apply-selection-btn">Apply Selection</button>
  `;
  
  document.querySelector('.apply-selection-btn').addEventListener('click', () => {
    state.selectedPeriods = Array.from(document.querySelectorAll('.period-checkbox:checked')).map(cb => parseInt(cb.value));
    applySelection();
  });
}

// Apply Selection
function applySelection() {
  state.activeElements.clear();
  
  ELEMENTS.forEach(element => {
    let isActive = false;
    
    if (state.practiceMode === 'block') {
      isActive = state.selectedBlocks.includes(element.block);
    } else if (state.practiceMode === 'group') {
      isActive = element.group !== null && state.selectedGroups.includes(element.group);
    } else if (state.practiceMode === 'period') {
      isActive = state.selectedPeriods.includes(element.period);
    }
    
    if (isActive) {
      state.activeElements.add(element.atomicNumber);
    }
  });
  
  updateElementStates();
  updateStats();
  loadBestTime();
}

function initializeFullTable() {
  state.activeElements.clear();
  ELEMENTS.forEach(element => {
    state.activeElements.add(element.atomicNumber);
  });
  
  updateElementStates();
  updateStats();
  loadBestTime();
}

function updateElementStates() {
  document.querySelectorAll('.element').forEach(el => {
    if (el.classList.contains('placeholder')) return;
    
    const atomic = parseInt(el.dataset.atomic);
    if (state.activeElements.has(atomic) && !state.correctElements.has(atomic)) {
      el.classList.remove('disabled');
    } else if (!state.activeElements.has(atomic)) {
      el.classList.add('disabled');
    }
  });
}

// Render Periodic Table
function renderPeriodicTable() {
  periodicTable.innerHTML = '';
  
  // Period 1
  renderElement(ELEMENTS[0]); // H
  for (let i = 0; i < 16; i++) periodicTable.appendChild(createSpacer());
  renderElement(ELEMENTS[1]); // He
  
  // Period 2
  renderElement(ELEMENTS[2]); // Li
  renderElement(ELEMENTS[3]); // Be
  for (let i = 0; i < 10; i++) periodicTable.appendChild(createSpacer());
  for (let i = 4; i <= 9; i++) renderElement(ELEMENTS[i]);
  
  // Period 3
  renderElement(ELEMENTS[10]); // Na
  renderElement(ELEMENTS[11]); // Mg
  for (let i = 0; i < 10; i++) periodicTable.appendChild(createSpacer());
  for (let i = 12; i <= 17; i++) renderElement(ELEMENTS[i]);
  
  // Periods 4-5
  for (let i = 18; i <= 53; i++) renderElement(ELEMENTS[i]);
  
  // Period 6 with lanthanides placeholder
  renderElement(ELEMENTS[54]); // Cs
  renderElement(ELEMENTS[55]); // Ba
  periodicTable.appendChild(createPlaceholder('*'));
  for (let i = 71; i <= 85; i++) renderElement(ELEMENTS[i]);
  
  // Period 7 with actinides placeholder
  renderElement(ELEMENTS[86]); // Fr
  renderElement(ELEMENTS[87]); // Ra
  periodicTable.appendChild(createPlaceholder('**'));
  for (let i = 103; i <= 117; i++) renderElement(ELEMENTS[i]);
  
  // Spacer row
  for (let i = 0; i < 18; i++) periodicTable.appendChild(createSpacer());
  
  // Lanthanides
  for (let i = 0; i < 2; i++) periodicTable.appendChild(createSpacer());
  periodicTable.appendChild(createLabel('Lanthanides'));
  for (let i = 56; i <= 70; i++) renderElement(ELEMENTS[i]);
  
  // Actinides
  for (let i = 0; i < 2; i++) periodicTable.appendChild(createSpacer());
  periodicTable.appendChild(createLabel('Actinides'));
  for (let i = 88; i <= 102; i++) renderElement(ELEMENTS[i]);
}

function renderElement(element) {
  const div = document.createElement('div');
  div.className = 'element';
  div.dataset.atomic = element.atomicNumber;
  div.dataset.symbol = element.symbol;
  div.dataset.name = element.name;
  div.dataset.group = element.group || '';
  div.dataset.period = element.period;
  div.dataset.block = element.block;
  div.dataset.category = element.category;
  
  const numberSpan = document.createElement('span');
  numberSpan.className = 'element-number';
  numberSpan.textContent = element.atomicNumber;
  
  const symbolSpan = document.createElement('span');
  symbolSpan.className = 'element-symbol';
  symbolSpan.textContent = '';
  
  const nameSpan = document.createElement('span');
  nameSpan.className = 'element-name';
  nameSpan.textContent = '';
  
  div.appendChild(numberSpan);
  div.appendChild(symbolSpan);
  div.appendChild(nameSpan);
  
  periodicTable.appendChild(div);
}

function createSpacer() {
  const spacer = document.createElement('div');
  spacer.className = 'spacer';
  return spacer;
}

function createPlaceholder(text) {
  const div = document.createElement('div');
  div.className = 'element placeholder';
  div.textContent = text;
  return div;
}

function createLabel(text) {
  const label = document.createElement('div');
  label.className = text === 'Lanthanides' ? 'lanthanide-label' : 'actinide-label';
  label.textContent = text;
  return label;
}

// Element Interaction
function handleElementClick(e) {
  const element = e.target.closest('.element');
  if (!element || element.classList.contains('placeholder')) return;
  if (element.classList.contains('disabled')) return;
  if (element.classList.contains('correct')) return;
  if (!state.activeElements.has(parseInt(element.dataset.atomic))) return;
  
  activateElement(element);
}

function activateElement(element) {
  document.querySelectorAll('.element input').forEach(input => input.remove());
  document.querySelectorAll('.element').forEach(el => el.classList.remove('active'));
  
  state.currentElement = element;
  element.classList.add('active');
  
  const input = document.createElement('input');
  input.type = 'text';
  input.maxLength = 3;
  input.autocomplete = 'off';
  input.placeholder = '?';
  
  element.appendChild(input);
  input.focus();
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = input.value.trim();
      if (value) {
        validateInput(element, value);
      }
    } else if (e.key === 'Escape') {
      input.remove();
      element.classList.remove('active');
      state.currentElement = null;
    }
  });
  
  input.addEventListener('blur', () => {
    setTimeout(() => {
      if (document.activeElement !== input && element.contains(input)) {
        input.remove();
        element.classList.remove('active');
        state.currentElement = null;
      }
    }, 100);
  });
}

function validateInput(element, userInput) {
  const atomic = parseInt(element.dataset.atomic);
  const correctSymbol = element.dataset.symbol;
  const isCorrect = userInput.toLowerCase() === correctSymbol.toLowerCase();
  
  const input = element.querySelector('input');
  
  if (isCorrect) {
    if (!state.timerStarted) startTimer();
    
    state.correctElements.add(atomic);
    element.classList.add('correct', 'success-pulse');
    element.classList.remove('active');
    if (input) input.remove();
    
    const symbolSpan = element.querySelector('.element-symbol');
    const nameSpan = element.querySelector('.element-name');
    symbolSpan.textContent = correctSymbol;
    nameSpan.textContent = element.dataset.name;
    
    setTimeout(() => element.classList.remove('success-pulse'), 500);
    
    updateStats();
    
    if (state.correctElements.size === state.activeElements.size) {
      completeChallenge();
    } else {
      setTimeout(() => moveToNextElement(element), 100);
    }
  } else {
    element.classList.add('incorrect');
    if (!state.wrongAttempts[atomic]) state.wrongAttempts[atomic] = 0;
    state.wrongAttempts[atomic]++;
    
    if (input) {
      input.value = '';
      input.focus();
    }
    
    setTimeout(() => element.classList.remove('incorrect'), 400);
  }
}

function moveToNextElement(currentElement) {
  const atomic = parseInt(currentElement.dataset.atomic);
  const currentPeriod = parseInt(currentElement.dataset.period);
  const currentGroup = parseInt(currentElement.dataset.group) || null;
  const currentCategory = currentElement.dataset.category;
  
  let nextElement = null;
  
  if (state.navigationMode === 'period') {
    if (currentCategory === 'lanthanide') {
      nextElement = findNextInCategory('lanthanide', atomic);
      if (!nextElement) {
        // End of lanthanides, go to first element of period 6 after lanthanides
        nextElement = findFirstInPeriod(6, 71); // Hf onwards
      }
    } else if (currentCategory === 'actinide') {
      nextElement = findNextInCategory('actinide', atomic);
      if (!nextElement) {
        // End of actinides, go to first element of period 7 after actinides
        nextElement = findFirstInPeriod(7, 103); // Rf onwards
      }
    } else if (currentGroup === 18) {
      // End of period, go to first element of next period
      nextElement = findFirstInPeriod(currentPeriod + 1);
    } else {
      nextElement = findNextInPeriod(currentPeriod, atomic);
      if (!nextElement) {
        // End of current period segment, try next period
        nextElement = findFirstInPeriod(currentPeriod + 1);
      }
    }
  } else {
    // Group mode (vertical)
    if (currentCategory === 'lanthanide' || currentCategory === 'actinide') {
      nextElement = findNextInCategory(currentCategory, atomic);
      if (!nextElement && currentCategory === 'lanthanide') {
        // Try actinides
        nextElement = findFirstInCategory('actinide');
      }
    } else if (currentGroup) {
      nextElement = findNextInGroup(currentGroup, currentPeriod);
      if (!nextElement) {
        // End of group, go to first element of next group
        nextElement = findFirstInGroup(currentGroup + 1);
      }
    }
  }
  
  if (nextElement && !nextElement.classList.contains('correct') && !nextElement.classList.contains('disabled')) {
    activateElement(nextElement);
  }
}

function findNextInPeriod(period, afterAtomic) {
  const elements = Array.from(document.querySelectorAll('.element'))
    .filter(el => !el.classList.contains('placeholder'))
    .filter(el => parseInt(el.dataset.period) === period)
    .filter(el => parseInt(el.dataset.atomic) > afterAtomic)
    .filter(el => state.activeElements.has(parseInt(el.dataset.atomic)))
    .filter(el => !el.classList.contains('correct'));
  
  return elements[0] || null;
}

function findFirstInPeriod(period, minAtomic = 0) {
  const elements = Array.from(document.querySelectorAll('.element'))
    .filter(el => !el.classList.contains('placeholder'))
    .filter(el => parseInt(el.dataset.period) === period)
    .filter(el => parseInt(el.dataset.atomic) > minAtomic)
    .filter(el => state.activeElements.has(parseInt(el.dataset.atomic)))
    .filter(el => !el.classList.contains('correct'))
    .sort((a, b) => parseInt(a.dataset.atomic) - parseInt(b.dataset.atomic));
  
  return elements[0] || null;
}

function findNextInGroup(group, afterPeriod) {
  const elements = Array.from(document.querySelectorAll('.element'))
    .filter(el => !el.classList.contains('placeholder'))
    .filter(el => parseInt(el.dataset.group) === group)
    .filter(el => parseInt(el.dataset.period) > afterPeriod)
    .filter(el => state.activeElements.has(parseInt(el.dataset.atomic)))
    .filter(el => !el.classList.contains('correct'));
  
  return elements[0] || null;
}

function findFirstInGroup(group) {
  const elements = Array.from(document.querySelectorAll('.element'))
    .filter(el => !el.classList.contains('placeholder'))
    .filter(el => parseInt(el.dataset.group) === group)
    .filter(el => state.activeElements.has(parseInt(el.dataset.atomic)))
    .filter(el => !el.classList.contains('correct'))
    .sort((a, b) => parseInt(a.dataset.period) - parseInt(b.dataset.period));
  
  return elements[0] || null;
}

function findNextInCategory(category, afterAtomic) {
  const elements = Array.from(document.querySelectorAll('.element'))
    .filter(el => el.dataset.category === category)
    .filter(el => parseInt(el.dataset.atomic) > afterAtomic)
    .filter(el => state.activeElements.has(parseInt(el.dataset.atomic)))
    .filter(el => !el.classList.contains('correct'));
  
  return elements[0] || null;
}

function findFirstInCategory(category) {
  const elements = Array.from(document.querySelectorAll('.element'))
    .filter(el => el.dataset.category === category)
    .filter(el => state.activeElements.has(parseInt(el.dataset.atomic)))
    .filter(el => !el.classList.contains('correct'))
    .sort((a, b) => parseInt(a.dataset.atomic) - parseInt(b.dataset.atomic));
  
  return elements[0] || null;
}

// Timer
function startTimer() {
  state.timerStarted = true;
  state.startTime = Date.now();
  
  state.timerInterval = setInterval(() => {
    state.elapsedTime = Math.floor((Date.now() - state.startTime) / 1000);
    updateTimerDisplay();
  }, 100);
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
  state.timerStarted = false;
}

function resetTimer() {
  stopTimer();
  state.elapsedTime = 0;
  state.startTime = null;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const minutes = Math.floor(state.elapsedTime / 60);
  const seconds = state.elapsedTime % 60;
  timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Challenge
function resetChallenge() {
  stopTimer();
  resetTimer();
  
  state.correctElements.clear();
  state.wrongAttempts = {};
  state.currentElement = null;
  
  document.querySelectorAll('.element').forEach(el => {
    if (el.classList.contains('placeholder')) return;
    
    el.classList.remove('correct', 'incorrect', 'active');
    el.querySelector('.element-symbol').textContent = '';
    el.querySelector('.element-name').textContent = '';
    
    const input = el.querySelector('input');
    if (input) input.remove();
  });
  
  updateElementStates();
  updateStats();
}

function completeChallenge() {
  stopTimer();
  
  const configKey = getConfigKey();
  const bestTimes = JSON.parse(localStorage.getItem('bestTimes') || '{}');
  
  if (!bestTimes[configKey] || state.elapsedTime < bestTimes[configKey]) {
    bestTimes[configKey] = state.elapsedTime;
    localStorage.setItem('bestTimes', JSON.stringify(bestTimes));
    loadBestTime();
  }
  
  // Save to history
  saveToHistory();
}

// Config
function getConfigKey() {
  if (state.practiceMode === 'full') {
    return 'full';
  } else if (state.practiceMode === 'block') {
    return `block-${state.selectedBlocks.sort().join(',')}`;
  } else if (state.practiceMode === 'group') {
    return `group-${state.selectedGroups.sort().join(',')}`;
  } else if (state.practiceMode === 'period') {
    return `period-${state.selectedPeriods.sort().join(',')}`;
  }
  return 'default';
}

function loadBestTime() {
  const configKey = getConfigKey();
  const bestTimes = JSON.parse(localStorage.getItem('bestTimes') || '{}');
  
  if (bestTimes[configKey]) {
    const time = bestTimes[configKey];
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    bestTimeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else {
    bestTimeDisplay.textContent = '--:--';
  }
}

// Stats
function updateStats() {
  const correct = state.correctElements.size;
  const total = state.activeElements.size;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
  
  correctCountDisplay.textContent = correct;
  totalCountDisplay.textContent = total;
  percentCompleteDisplay.textContent = percent;
  progressFill.style.width = `${percent}%`;
}

// History
function saveToHistory() {
  const history = JSON.parse(localStorage.getItem('history') || '[]');
  
  const modeLabel = getModeLabel();
  const wrongAttempts = Object.values(state.wrongAttempts).reduce((a, b) => a + b, 0);
  
  const record = {
    mode: modeLabel,
    time: state.elapsedTime,
    wrongAttempts: wrongAttempts,
    elementsCount: state.activeElements.size,
    date: Date.now(),
    config: state.currentConfig || state.practiceMode
  };
  
  history.unshift(record);
  
  // Keep last 50 records
  if (history.length > 50) {
    history.splice(50);
  }
  
  localStorage.setItem('history', JSON.stringify(history));
}

function getModeLabel() {
  if (state.practiceMode === 'full') {
    return 'Full Table (118 elements)';
  } else if (state.practiceMode === 'block') {
    return `Blocks: ${state.selectedBlocks.join(', ').toUpperCase()}`;
  } else if (state.practiceMode === 'group') {
    return `Groups: ${state.selectedGroups.join(', ')}`;
  } else if (state.practiceMode === 'period') {
    return `Periods: ${state.selectedPeriods.join(', ')}`;
  }
  return 'Custom';
}

function openHistoryModal() {
  historyModal.classList.remove('hidden');
  loadHistory();
}

function closeHistoryModal() {
  historyModal.classList.add('hidden');
}

function loadHistory() {
  const history = JSON.parse(localStorage.getItem('history') || '[]');
  
  if (history.length === 0) {
    historyModalBody.innerHTML = `
      <div class="history-empty">
        <i class="ri-inbox-line"></i>
        <p>No practice history yet.<br>Complete a challenge to see it here!</p>
      </div>
    `;
    return;
  }
  
  historyModalBody.innerHTML = history.map(record => {
    const date = new Date(record.date);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    const minutes = Math.floor(record.time / 60);
    const seconds = record.time % 60;
    const durationStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    return `
      <div class="history-item">
        <div class="history-info">
          <div class="history-mode">${record.mode}</div>
          <div class="history-details">
            <span><i class="ri-calendar-line"></i> ${dateStr} ${timeStr}</span>
            <span><i class="ri-close-circle-line"></i> ${record.wrongAttempts} errors</span>
            <span><i class="ri-checkbox-circle-line"></i> ${record.elementsCount} elements</span>
          </div>
        </div>
        <div class="history-time">${durationStr}</div>
      </div>
    `;
  }).join('');
}