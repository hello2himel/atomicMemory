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
  elementAttemptTimes: {},
  timerStarted: false,
  timerInterval: null,
  startTime: null,
  elapsedTime: 0,
  currentElement: null,
  streak: 0,
  maxStreak: 0,
  accuracy: 100,
  totalAttempts: 0,
  correctAttempts: 0,
  hintsUsed: 0,
  isMobile: false,
  totalChallengesCompleted: 0
};

// DOM Elements
const introOverlay = document.getElementById('introOverlay');
const startBtn = document.getElementById('startBtn');
const mainApp = document.getElementById('mainApp');
const darkModeBtn = document.getElementById('darkModeBtn');
const resetBtn = document.getElementById('resetBtn');
const hintBtn = document.getElementById('hintBtn');
const periodicTable = document.getElementById('periodicTable');
const timerDisplay = document.getElementById('timerDisplay');
const correctCountDisplay = document.getElementById('correctCount');
const totalCountDisplay = document.getElementById('totalCount');
const streakDisplay = document.getElementById('streakDisplay');
const accuracyDisplay = document.getElementById('accuracyDisplay');
const progressFill = document.getElementById('progressFill');
const modeSelectionPanel = document.getElementById('modeSelectionPanel');
const historyBtn = document.getElementById('historyBtn');
const historyModal = document.getElementById('historyModal');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');
const historyModalBody = document.getElementById('historyModalBody');
const leaderboardBtn = document.getElementById('leaderboardBtn');
const leaderboardModal = document.getElementById('leaderboardModal');
const closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn');
const leaderboardModalBody = document.getElementById('leaderboardModalBody');
const achievementsBtn = document.getElementById('achievementsBtn');
const achievementsModal = document.getElementById('achievementsModal');
const closeAchievementsBtn = document.getElementById('closeAchievementsBtn');
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const closeMobileMenu = document.getElementById('closeMobileMenu');
const mobileInputModal = document.getElementById('mobileInputModal');
const mobileInput = document.getElementById('mobileInput');
const mobileSubmitBtn = document.getElementById('mobileSubmitBtn');
const mobileHintBtn = document.getElementById('mobileHintBtn');
const completeModal = document.getElementById('completeModal');
const playAgainBtn = document.getElementById('playAgainBtn');
const shareScoreBtn = document.getElementById('shareScoreBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  detectMobile();
  detectDarkMode();
  setupIntro();
  setupEventListeners();
  loadTotalChallenges();
  achievementManager.updateBadge();
});

// Detect Mobile
function detectMobile() {
  state.isMobile = window.innerWidth <= 768;
  window.addEventListener('resize', () => {
    state.isMobile = window.innerWidth <= 768;
  });
}

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
  resetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset? Your current progress will be lost.')) {
      resetChallenge();
    }
  });
  
  // Hint button
  hintBtn.addEventListener('click', showHint);
  
  // History button
  historyBtn.addEventListener('click', openHistoryModal);
  closeHistoryBtn.addEventListener('click', () => closeModal(historyModal));
  
  // Leaderboard button
  leaderboardBtn.addEventListener('click', openLeaderboardModal);
  closeLeaderboardBtn.addEventListener('click', () => closeModal(leaderboardModal));
  
  // Achievements button
  achievementsBtn.addEventListener('click', openAchievementsModal);
  closeAchievementsBtn.addEventListener('click', () => closeModal(achievementsModal));
  
  // Mobile menu
  menuBtn.addEventListener('click', openMobileMenu);
  closeMobileMenu.addEventListener('click', () => mobileMenu.classList.add('hidden'));
  
  // Mobile input
  mobileSubmitBtn.addEventListener('click', handleMobileSubmit);
  mobileHintBtn.addEventListener('click', () => {
    showHint();
    mobileInputModal.querySelector('.mobile-input-hint').classList.remove('hidden');
  });
  mobileInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleMobileSubmit();
    }
  });
  document.querySelector('.mobile-input-close').addEventListener('click', closeMobileInput);
  
  // Complete modal
  playAgainBtn.addEventListener('click', () => {
    closeModal(completeModal);
    resetChallenge();
  });
  shareScoreBtn.addEventListener('click', shareScore);
  
  // Close modals on overlay click
  [historyModal, leaderboardModal, achievementsModal, completeModal].forEach(modal => {
    modal.querySelector('.modal-overlay')?.addEventListener('click', () => closeModal(modal));
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

// Mobile Menu
function openMobileMenu() {
  const menuBody = document.getElementById('mobileMenuBody');
  
  menuBody.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <button class="mobile-menu-btn" onclick="openHistoryModal(); mobileMenu.classList.add('hidden')">
        <i class="ri-history-line"></i>
        <span>Practice History</span>
      </button>
      <button class="mobile-menu-btn" onclick="openLeaderboardModal(); mobileMenu.classList.add('hidden')">
        <i class="ri-trophy-line"></i>
        <span>Top Scores</span>
      </button>
      <button class="mobile-menu-btn" onclick="openAchievementsModal(); mobileMenu.classList.add('hidden')">
        <i class="ri-medal-line"></i>
        <span>Achievements (${achievementManager.getUnlockedCount()}/${achievementManager.getTotalCount()})</span>
      </button>
      <button class="mobile-menu-btn" onclick="darkModeBtn.click(); mobileMenu.classList.add('hidden')">
        <i class="${document.body.dataset.theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line'}"></i>
        <span>Toggle Theme</span>
      </button>
    </div>
  `;
  
  mobileMenu.classList.remove('hidden');
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
    if (state.selectedBlocks.length === 0) {
      alert('Please select at least one block');
      return;
    }
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
    if (state.selectedGroups.length === 0) {
      alert('Please select at least one group');
      return;
    }
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
    if (state.selectedPeriods.length === 0) {
      alert('Please select at least one period');
      return;
    }
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
  
  resetChallenge();
}

function initializeFullTable() {
  state.activeElements.clear();
  ELEMENTS.forEach(element => {
    state.activeElements.add(element.atomicNumber);
  });
  
  resetChallenge();
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
  
  if (state.isMobile) {
    openMobileInput(element);
  } else {
    activateElement(element);
  }
}

function openMobileInput(element) {
  state.currentElement = element;
  
  const number = mobileInputModal.querySelector('.mobile-input-number');
  const category = mobileInputModal.querySelector('.mobile-input-category');
  
  number.textContent = `Element #${element.dataset.atomic}`;
  category.textContent = element.dataset.category;
  
  mobileInput.value = '';
  mobileInput.focus();
  
  mobileInputModal.querySelector('.mobile-input-hint').classList.add('hidden');
  mobileInputModal.classList.remove('hidden');
}

function closeMobileInput() {
  mobileInputModal.classList.add('hidden');
  state.currentElement = null;
}

function handleMobileSubmit() {
  if (!state.currentElement) return;
  
  const value = mobileInput.value.trim();
  if (value) {
    validateInput(state.currentElement, value);
    if (state.currentElement.classList.contains('correct')) {
      closeMobileInput();
    } else {
      mobileInput.value = '';
      mobileInput.focus();
    }
  }
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
  state.totalAttempts++;
  
  if (isCorrect) {
    if (!state.timerStarted) startTimer();
    
    state.correctAttempts++;
    state.correctElements.add(atomic);
    element.classList.add('correct', 'success-pulse');
    element.classList.remove('active');
    if (input) input.remove();
    
    const symbolSpan = element.querySelector('.element-symbol');
    const nameSpan = element.querySelector('.element-name');
    symbolSpan.textContent = correctSymbol;
    nameSpan.textContent = element.dataset.name;
    
    setTimeout(() => element.classList.remove('success-pulse'), 500);
    
    // Scoring
    const attemptCount = (state.wrongAttempts[atomic] || 0) + 1;
    const points = scoringSystem.addCorrectAnswer(atomic, attemptCount, 0);
    
    // Show score change
    const rect = element.getBoundingClientRect();
    scoringSystem.showScoreChange(points, rect.left + rect.width / 2, rect.top);
    
    // Update streak
    state.streak++;
    if (state.streak > state.maxStreak) {
      state.maxStreak = state.streak;
    }
    
    updateStats();
    checkAchievements();
    
    if (state.correctElements.size === state.activeElements.size) {
      completeChallenge();
    } else {
      setTimeout(() => moveToNextElement(element), 100);
    }
  } else {
    element.classList.add('incorrect');
    if (!state.wrongAttempts[atomic]) state.wrongAttempts[atomic] = 0;
    state.wrongAttempts[atomic]++;
    
    // Scoring penalty
    const mistakeNumber = state.wrongAttempts[atomic];
    const penalty = scoringSystem.addMistake(atomic, mistakeNumber);
    
    // Show score change
    const rect = element.getBoundingClientRect();
    scoringSystem.showScoreChange(penalty, rect.left + rect.width / 2, rect.top);
    
    // Reset streak
    state.streak = 0;
    
    if (input) {
      input.value = '';
      input.focus();
    }
    
    updateStats();
    
    setTimeout(() => element.classList.remove('incorrect'), 400);
  }
}

function showHint() {
  if (!state.currentElement) {
    alert('Please select an element first!');
    return;
  }
  
  const symbol = state.currentElement.dataset.symbol;
  const category = state.currentElement.dataset.category;
  const block = state.currentElement.dataset.block;
  
  const hintText = `Block: ${block.toUpperCase()}-block | Category: ${category}`;
  
  // Apply hint penalty
  const penalty = scoringSystem.addHintPenalty('SMALL');
  const rect = state.currentElement.getBoundingClientRect();
  scoringSystem.showScoreChange(penalty, rect.left + rect.width / 2, rect.top);
  
  state.hintsUsed++;
  updateStats();
  
  if (state.isMobile) {
    const hintDiv = mobileInputModal.querySelector('.mobile-input-hint');
    hintDiv.textContent = hintText;
    hintDiv.classList.remove('hidden');
  } else {
    alert(hintText);
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
        nextElement = findFirstInPeriod(6, 71);
      }
    } else if (currentCategory === 'actinide') {
      nextElement = findNextInCategory('actinide', atomic);
      if (!nextElement) {
        nextElement = findFirstInPeriod(7, 103);
      }
    } else if (currentGroup === 18) {
      nextElement = findFirstInPeriod(currentPeriod + 1);
    } else {
      nextElement = findNextInPeriod(currentPeriod, atomic);
      if (!nextElement) {
        nextElement = findFirstInPeriod(currentPeriod + 1);
      }
    }
  } else {
    if (currentCategory === 'lanthanide' || currentCategory === 'actinide') {
      nextElement = findNextInCategory(currentCategory, atomic);
      if (!nextElement && currentCategory === 'lanthanide') {
        nextElement = findFirstInCategory('actinide');
      }
    } else if (currentGroup) {
      nextElement = findNextInGroup(currentGroup, currentPeriod);
      if (!nextElement) {
        nextElement = findFirstInGroup(currentGroup + 1);
      }
    }
  }
  
  if (nextElement && !nextElement.classList.contains('correct') && !nextElement.classList.contains('disabled')) {
    if (state.isMobile) {
      openMobileInput(nextElement);
    } else {
      activateElement(nextElement);
    }
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
  
  scoringSystem.reset();
  scoringSystem.updateScoreDisplay();
  
  state.correctElements.clear();
  state.wrongAttempts = {};
  state.currentElement = null;
  state.streak = 0;
  state.maxStreak = 0;
  state.totalAttempts = 0;
  state.correctAttempts = 0;
  state.accuracy = 100;
  state.hintsUsed = 0;
  
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
  
  const totalMistakes = Object.values(state.wrongAttempts).reduce((a, b) => a + b, 0);
  
  // Calculate final score
  const finalScore = scoringSystem.calculateFinalScore(
    state.correctElements.size,
    state.elapsedTime,
    totalMistakes
  );
  
  // Save score
  const configKey = getConfigKey();
  scoringSystem.saveScore(configKey, state.correctElements.size, state.elapsedTime, totalMistakes);
  
  // Update stats
  state.totalChallengesCompleted++;
  saveTotalChallenges();
  
  // Check achievements
  checkAchievements(true);
  
  // Show complete modal
  showCompleteModal();
}

function checkAchievements(challengeComplete = false) {
  const stats = {
    correct: state.correctElements.size,
    mistakes: Object.values(state.wrongAttempts).reduce((a, b) => a + b, 0),
    time: state.elapsedTime,
    elementsCount: state.activeElements.size,
    score: scoringSystem.score,
    maxStreak: state.maxStreak,
    challengeComplete: challengeComplete,
    totalChallenges: state.totalChallengesCompleted
  };
  
  const newAchievements = achievementManager.checkAchievements(stats);
  
  newAchievements.forEach(achievement => {
    setTimeout(() => {
      achievementManager.showAchievementToast(achievement);
    }, 500);
  });
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

// Stats
function updateStats() {
  const correct = state.correctElements.size;
  const total = state.activeElements.size;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
  
  state.accuracy = state.totalAttempts > 0 ? Math.round((state.correctAttempts / state.totalAttempts) * 100) : 100;
  
  correctCountDisplay.textContent = correct;
  totalCountDisplay.textContent = total;
  streakDisplay.textContent = state.streak;
  accuracyDisplay.textContent = `${state.accuracy}%`;
  progressFill.style.width = `${percent}%`;
  
  scoringSystem.updateScoreDisplay();
}

// Save/Load Total Challenges
function saveTotalChallenges() {
  localStorage.setItem('totalChallenges', state.totalChallengesCompleted);
}

function loadTotalChallenges() {
  const saved = localStorage.getItem('totalChallenges');
  if (saved) {
    state.totalChallengesCompleted = parseInt(saved);
  }
}

// Modals
function closeModal(modal) {
  modal.classList.add('hidden');
}

function openHistoryModal() {
  loadHistory();
  historyModal.classList.remove('hidden');
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
  
  historyModalBody.innerHTML = history.slice(0, 20).map(record => {
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
          <div class="history-score">Score: ${scoringSystem.formatScore(record.score || 0)}</div>
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

function openLeaderboardModal() {
  loadLeaderboard();
  leaderboardModal.classList.remove('hidden');
}

function loadLeaderboard() {
  const scores = scoringSystem.getTopScores(10);
  
  if (scores.length === 0) {
    leaderboardModalBody.innerHTML = `
      <div class="leaderboard-empty">
        <i class="ri-trophy-line"></i>
        <p>No scores yet.<br>Complete a challenge to start climbing!</p>
      </div>
    `;
    return;
  }
  
  leaderboardModalBody.innerHTML = scores.map((entry, index) => {
    const date = new Date(entry.date);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return `
      <div class="leaderboard-item">
        <div class="leaderboard-rank ${index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : ''}">
          ${index + 1}
        </div>
        <div class="leaderboard-info">
          <div class="leaderboard-mode">${getModeLabel()}</div>
          <div class="leaderboard-date">${dateStr} • ${entry.time}s • ${entry.accuracy}% acc</div>
        </div>
        <div class="leaderboard-score">
          ${scoringSystem.formatScore(entry.score)}
        </div>
      </div>
    `;
  }).join('');
}

function openAchievementsModal() {
  achievementManager.renderAchievements();
  achievementsModal.classList.remove('hidden');
}

function showCompleteModal() {
  const finalScoreDisplay = document.getElementById('finalScoreDisplay');
  const finalRankDisplay = document.getElementById('finalRankDisplay');
  const completeTime = document.getElementById('completeTime');
  const completeAccuracy = document.getElementById('completeAccuracy');
  const completeStreak = document.getElementById('completeStreak');
  const breakdownBase = document.getElementById('breakdownBase');
  const breakdownBonus = document.getElementById('breakdownBonus');
  const breakdownPenalty = document.getElementById('breakdownPenalty');
  
  const rank = scoringSystem.getRank();
  
  finalScoreDisplay.textContent = scoringSystem.formatScore(scoringSystem.score);
  finalRankDisplay.textContent = rank.name;
  finalRankDisplay.style.background = `linear-gradient(135deg, ${rank.color} 0%, ${rank.color}dd 100%)`;
  
  const minutes = Math.floor(state.elapsedTime / 60);
  const seconds = state.elapsedTime % 60;
  completeTime.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  completeAccuracy.textContent = `${state.accuracy}%`;
  completeStreak.textContent = state.maxStreak;
  
  breakdownBase.textContent = scoringSystem.formatScore(scoringSystem.baseScore);
  breakdownBonus.textContent = `+${scoringSystem.formatScore(scoringSystem.bonusPoints)}`;
  breakdownPenalty.textContent = `-${scoringSystem.formatScore(scoringSystem.penaltyPoints)}`;
  
  // Add confetti effect
  createConfetti();
  
  completeModal.classList.remove('hidden');
  
  // Save to history
  saveToHistory();
}

function createConfetti() {
  const confettiContainer = document.querySelector('.complete-confetti');
  confettiContainer.innerHTML = '';
  
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.style.position = 'absolute';
    confetti.style.width = '10px';
    confetti.style.height = '10px';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.top = '-10px';
    confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    confetti.style.animation = `confetti-fall ${2 + Math.random() * 2}s linear forwards`;
    confetti.style.opacity = '0.8';
    
    confettiContainer.appendChild(confetti);
  }
  
  // Add keyframe animation
  if (!document.getElementById('confetti-animation')) {
    const style = document.createElement('style');
    style.id = 'confetti-animation';
    style.textContent = `
      @keyframes confetti-fall {
        to {
          transform: translateY(600px) rotate(${Math.random() * 720}deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

function shareScore() {
  const rank = scoringSystem.getRank();
  const text = `🎓 I just scored ${scoringSystem.formatScore(scoringSystem.score)} points on AtomicMemory!\n\n🏆 Rank: ${rank.name}\n⏱️ Time: ${Math.floor(state.elapsedTime / 60)}:${String(state.elapsedTime % 60).padStart(2, '0')}\n🎯 Accuracy: ${state.accuracy}%\n\nCan you beat my score?`;
  
  if (navigator.share) {
    navigator.share({
      title: 'AtomicMemory Score',
      text: text,
      url: window.location.href
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => {
      alert('Score copied to clipboard!');
    });
  }
}

function saveToHistory() {
  const history = JSON.parse(localStorage.getItem('history') || '[]');
  
  const modeLabel = getModeLabel();
  const wrongAttempts = Object.values(state.wrongAttempts).reduce((a, b) => a + b, 0);
  
  const record = {
    mode: modeLabel,
    time: state.elapsedTime,
    wrongAttempts: wrongAttempts,
    elementsCount: state.activeElements.size,
    score: scoringSystem.score,
    accuracy: state.accuracy,
    maxStreak: state.maxStreak,
    date: Date.now()
  };
  
  history.unshift(record);
  
  // Keep last 50 records
  if (history.length > 50) {
    history.splice(50);
  }
  
  localStorage.setItem('history', JSON.stringify(history));
}