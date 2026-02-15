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
const mobileSkipBtn = document.getElementById('mobileSkipBtn');
const mobileSetupScreen = document.getElementById('mobileSetupScreen');
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
    if (state.isMobile) {
      showMobileSetupScreen();
    }
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
  mobileSkipBtn.addEventListener('click', () => {
    if (!state.currentElement) return;
    const nextEl = findNextElementAuto(state.currentElement);
    if (nextEl) {
      updateMobileInputForElement(nextEl);
    }
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
    if (state.isMobile) {
      showMobileSetupScreen();
    }
  });
  shareScoreBtn.addEventListener('click', shareScore);
  
  // Close modals on overlay click
  [historyModal, leaderboardModal, achievementsModal, completeModal].forEach(modal => {
    modal.querySelector('.modal-overlay')?.addEventListener('click', () => closeModal(modal));
  });
  
  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [historyModal, leaderboardModal, achievementsModal, completeModal].forEach(modal => {
        if (!modal.classList.contains('hidden')) {
          closeModal(modal);
        }
      });
      if (!mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.add('hidden');
      }
      if (!mobileInputModal.classList.contains('hidden')) {
        closeMobileInput();
      }
    }
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
      showHintToast('Please select at least one block');
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
      showHintToast('Please select at least one group');
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
      showHintToast('Please select at least one period');
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
    // Don't process clicks when setup screen is visible
    if (!mobileSetupScreen.classList.contains('hidden')) return;
    // When modal is already open, just update it
    if (!mobileInputModal.classList.contains('hidden')) {
      updateMobileInputForElement(element);
    } else {
      openMobileInput(element);
    }
  } else {
    activateElement(element);
  }
}

function openMobileInput(element) {
  state.currentElement = element;
  
  // Render mini table on first open
  renderMiniTable();
  
  const number = mobileInputModal.querySelector('.mobile-input-number');
  const category = mobileInputModal.querySelector('.mobile-input-category');
  
  number.textContent = `Element #${element.dataset.atomic}`;
  category.textContent = element.dataset.category;
  
  mobileInput.value = '';
  
  mobileInputModal.querySelector('.mobile-input-hint').classList.add('hidden');
  mobileInputModal.classList.remove('hidden');
  
  // Highlight current element in mini table
  updateMiniTable(parseInt(element.dataset.atomic), 'current');
  updateMobileStats();
  
  setTimeout(() => mobileInput.focus(), 100);
}

function closeMobileInput() {
  mobileInputModal.classList.add('hidden');
  state.currentElement = null;
}

function handleMobileSubmit() {
  if (!state.currentElement) return;
  
  const value = mobileInput.value.trim();
  if (!value) return;
  
  validateInput(state.currentElement, value);
  
  if (state.currentElement.classList.contains('correct')) {
    // Update mini table
    updateMiniTable(parseInt(state.currentElement.dataset.atomic), 'correct');
    
    // Flash green feedback on input
    mobileInput.classList.add('input-correct');
    setTimeout(() => mobileInput.classList.remove('input-correct'), 400);
    
    updateMobileStats();
    
    // Check if challenge complete
    if (state.correctElements.size === state.activeElements.size) {
      closeMobileInput();
      return;
    }
    
    // Auto-advance to next element (don't close modal)
    const nextEl = findNextElementAuto(state.currentElement);
    if (nextEl) {
      setTimeout(() => updateMobileInputForElement(nextEl), 200);
    } else {
      closeMobileInput();
    }
  } else {
    // Flash red feedback
    updateMiniTable(parseInt(state.currentElement.dataset.atomic), 'incorrect');
    mobileInput.classList.add('input-incorrect');
    setTimeout(() => mobileInput.classList.remove('input-incorrect'), 400);
    mobileInput.value = '';
    mobileInput.focus();
    updateMobileStats();
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
    } else if (!state.isMobile) {
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
    showHintToast('Please select an element first!');
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
    showHintToast(hintText);
  }
}

function showHintToast(message) {
  const toast = document.getElementById('hintToast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  
  clearTimeout(toast._hideTimeout);
  toast._hideTimeout = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
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
      // On mobile, if modal is open update in-place; otherwise open it
      if (!mobileInputModal.classList.contains('hidden')) {
        updateMobileInputForElement(nextElement);
      } else {
        openMobileInput(nextElement);
      }
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
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  timerDisplay.textContent = timeStr;
  // Mirror timer in mobile modal
  const mobileTimer = document.getElementById('mobileTimerDisplay');
  if (mobileTimer) mobileTimer.textContent = timeStr;
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
  
  // Reset mini table if it exists
  const miniTable = document.getElementById('miniPeriodicTable');
  if (miniTable) miniTable.innerHTML = '';
  
  // Close mobile input modal if open
  if (!mobileInputModal.classList.contains('hidden')) {
    closeMobileInput();
  }
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
  
  // Update mobile modal stats if visible
  if (!mobileInputModal.classList.contains('hidden')) {
    updateMobileStats();
  }
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
      showHintToast('Score copied to clipboard!');
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

// ===== MOBILE SETUP & PERSISTENT MODAL =====

function showMobileSetupScreen() {
  const screen = mobileSetupScreen;
  
  screen.innerHTML = `
    <div class="mobile-setup-header">
      <div class="mobile-setup-title">⚛️ AtomicMemory</div>
      <div class="mobile-setup-subtitle">Configure your challenge</div>
    </div>
    
    <div class="mobile-setup-section">
      <div class="mobile-setup-section-title">
        <i class="ri-gamepad-line"></i> Mode
      </div>
      <div class="mobile-setup-mode-tabs">
        <button class="mobile-setup-mode-tab ${state.practiceMode === 'full' ? 'active' : ''}" data-mode="full">
          <i class="ri-table-2"></i>
          Full
        </button>
        <button class="mobile-setup-mode-tab ${state.practiceMode === 'block' ? 'active' : ''}" data-mode="block">
          <i class="ri-shapes-line"></i>
          Blocks
        </button>
        <button class="mobile-setup-mode-tab ${state.practiceMode === 'group' ? 'active' : ''}" data-mode="group">
          <i class="ri-layout-column-line"></i>
          Groups
        </button>
        <button class="mobile-setup-mode-tab ${state.practiceMode === 'period' ? 'active' : ''}" data-mode="period">
          <i class="ri-layout-row-line"></i>
          Periods
        </button>
      </div>
      <div id="mobileSetupSelectors" class="mobile-setup-selectors"></div>
    </div>
    
    <div class="mobile-setup-section">
      <div class="mobile-setup-section-title">
        <i class="ri-compass-3-line"></i> Navigation
      </div>
      <div class="mobile-setup-nav-toggle">
        <button class="mobile-setup-nav-option ${state.navigationMode === 'period' ? 'active' : ''}" data-nav="period">
          <i class="ri-arrow-right-line"></i> Horizontal
        </button>
        <button class="mobile-setup-nav-option ${state.navigationMode === 'group' ? 'active' : ''}" data-nav="group">
          <i class="ri-arrow-down-line"></i> Vertical
        </button>
      </div>
    </div>
    
    <button class="mobile-start-btn" id="mobileStartBtn">
      <i class="ri-play-fill"></i>
      Start Challenge
    </button>
  `;
  
  // Mode tab listeners
  screen.querySelectorAll('.mobile-setup-mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      screen.querySelectorAll('.mobile-setup-mode-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.practiceMode = tab.dataset.mode;
      
      // Also sync the main mode tabs
      document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
      const mainTab = document.querySelector(`.mode-tab[data-mode="${tab.dataset.mode}"]`);
      if (mainTab) mainTab.classList.add('active');
      
      updateMobileSetupSelectors();
    });
  });
  
  // Nav toggle listeners
  screen.querySelectorAll('.mobile-setup-nav-option').forEach(option => {
    option.addEventListener('click', () => {
      screen.querySelectorAll('.mobile-setup-nav-option').forEach(o => o.classList.remove('active'));
      option.classList.add('active');
      state.navigationMode = option.dataset.nav;
      localStorage.setItem('navigationMode', state.navigationMode);
      
      // Sync main nav toggles
      document.querySelectorAll('.nav-option').forEach(o => o.classList.remove('active'));
      const mainOpt = document.querySelector(`.nav-option[data-nav="${option.dataset.nav}"]`);
      if (mainOpt) mainOpt.classList.add('active');
    });
  });
  
  // Start button
  screen.querySelector('#mobileStartBtn').addEventListener('click', startMobileChallenge);
  
  updateMobileSetupSelectors();
  screen.classList.remove('hidden');
}

function updateMobileSetupSelectors() {
  const container = document.getElementById('mobileSetupSelectors');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (state.practiceMode === 'block') {
    container.innerHTML = `
      <div class="mobile-setup-selector-grid">
        ${['s', 'p', 'd', 'f'].map(block => `
          <label class="mobile-setup-checkbox-option">
            <input type="checkbox" value="${block}" class="mobile-block-checkbox">
            <span>${block.toUpperCase()}-Block</span>
          </label>
        `).join('')}
      </div>
    `;
  } else if (state.practiceMode === 'group') {
    const groups = Array.from({length: 18}, (_, i) => i + 1);
    container.innerHTML = `
      <div class="mobile-setup-selector-grid">
        ${groups.map(g => `
          <label class="mobile-setup-checkbox-option">
            <input type="checkbox" value="${g}" class="mobile-group-checkbox">
            <span>Group ${g}</span>
          </label>
        `).join('')}
      </div>
    `;
  } else if (state.practiceMode === 'period') {
    const periods = Array.from({length: 7}, (_, i) => i + 1);
    container.innerHTML = `
      <div class="mobile-setup-selector-grid">
        ${periods.map(p => `
          <label class="mobile-setup-checkbox-option">
            <input type="checkbox" value="${p}" class="mobile-period-checkbox">
            <span>Period ${p}</span>
          </label>
        `).join('')}
      </div>
    `;
  }
}

function hideMobileSetupScreen() {
  mobileSetupScreen.classList.add('hidden');
}

function startMobileChallenge() {
  const mode = state.practiceMode;
  
  if (mode === 'block') {
    state.selectedBlocks = Array.from(document.querySelectorAll('.mobile-block-checkbox:checked')).map(cb => cb.value);
    if (state.selectedBlocks.length === 0) {
      showHintToast('Please select at least one block');
      return;
    }
  } else if (mode === 'group') {
    state.selectedGroups = Array.from(document.querySelectorAll('.mobile-group-checkbox:checked')).map(cb => parseInt(cb.value));
    if (state.selectedGroups.length === 0) {
      showHintToast('Please select at least one group');
      return;
    }
  } else if (mode === 'period') {
    state.selectedPeriods = Array.from(document.querySelectorAll('.mobile-period-checkbox:checked')).map(cb => parseInt(cb.value));
    if (state.selectedPeriods.length === 0) {
      showHintToast('Please select at least one period');
      return;
    }
  }
  
  hideMobileSetupScreen();
  
  // Apply mode
  if (mode === 'full') {
    handleModeChange('full');
  } else {
    handleModeChange(mode);
    applySelection();
  }
  
  // Find first active element and open persistent modal
  const firstElement = findFirstActiveElement();
  if (firstElement) {
    openMobileInput(firstElement);
  }
}

function findFirstActiveElement() {
  const elements = Array.from(document.querySelectorAll('.element'))
    .filter(el => !el.classList.contains('placeholder'))
    .filter(el => state.activeElements.has(parseInt(el.dataset.atomic)))
    .filter(el => !el.classList.contains('correct'))
    .sort((a, b) => parseInt(a.dataset.atomic) - parseInt(b.dataset.atomic));
  
  return elements[0] || null;
}

function renderMiniTable() {
  const miniTable = document.getElementById('miniPeriodicTable');
  if (!miniTable) return;
  miniTable.innerHTML = '';
  
  // Build the same layout as renderPeriodicTable()
  const layout = [];
  
  // Period 1: H (1), 16 spacers, He (2)
  layout.push(1);
  for (let i = 0; i < 16; i++) layout.push('spacer');
  layout.push(2);
  
  // Period 2: Li (3), Be (4), 10 spacers, B-Ne (5-10)
  layout.push(3, 4);
  for (let i = 0; i < 10; i++) layout.push('spacer');
  for (let i = 5; i <= 10; i++) layout.push(i);
  
  // Period 3: Na (11), Mg (12), 10 spacers, Al-Ar (13-18)
  layout.push(11, 12);
  for (let i = 0; i < 10; i++) layout.push('spacer');
  for (let i = 13; i <= 18; i++) layout.push(i);
  
  // Periods 4-5: K-Xe (19-54)
  for (let i = 19; i <= 54; i++) layout.push(i);
  
  // Period 6: Cs (55), Ba (56), placeholder, Lu-At (72-86)
  layout.push(55, 56, 'placeholder');
  for (let i = 72; i <= 86; i++) layout.push(i);
  
  // Period 7: Fr (87), Ra (88), placeholder, Lr-Og (103-118)
  layout.push(87, 88, 'placeholder');
  for (let i = 103; i <= 118; i++) layout.push(i);
  
  // Spacer row
  for (let i = 0; i < 18; i++) layout.push('spacer');
  
  // Lanthanides: 2 spacers, label, La-Lu (57-71)
  layout.push('spacer', 'spacer', 'label');
  for (let i = 57; i <= 71; i++) layout.push(i);
  
  // Actinides: 2 spacers, label, Ac-Lr (89-103)
  layout.push('spacer', 'spacer', 'label');
  for (let i = 89; i <= 103; i++) layout.push(i);
  
  // Build mini cells
  layout.forEach(item => {
    if (item === 'spacer' || item === 'label' || item === 'placeholder') {
      const spacer = document.createElement('div');
      spacer.className = 'mini-spacer';
      miniTable.appendChild(spacer);
    } else {
      const cell = document.createElement('div');
      cell.className = 'mini-cell';
      cell.dataset.atomic = item;
      
      // Color by category
      const elData = ELEMENTS.find(e => e.atomicNumber === item);
      if (elData) {
        cell.style.background = getCategoryColor(elData.category);
        cell.style.borderColor = getCategoryColor(elData.category);
      }
      
      // Mark disabled if not active
      if (!state.activeElements.has(item)) {
        cell.classList.add('mini-disabled');
      }
      
      // Mark correct if already answered
      if (state.correctElements.has(item)) {
        cell.classList.add('mini-correct');
      }
      
      miniTable.appendChild(cell);
    }
  });
}

function getCategoryColor(category) {
  const colors = {
    'alkali metal': 'var(--cat-alkali)',
    'alkaline earth metal': 'var(--cat-alkaline)',
    'transition metal': 'var(--cat-transition)',
    'post-transition metal': 'var(--cat-post-transition)',
    'metalloid': 'var(--cat-metalloid)',
    'nonmetal': 'var(--cat-nonmetal)',
    'halogen': 'var(--cat-halogen)',
    'noble gas': 'var(--cat-noble)',
    'lanthanide': 'var(--cat-lanthanide)',
    'actinide': 'var(--cat-actinide)'
  };
  return colors[category] || 'var(--bg-tertiary)';
}

function updateMiniTable(atomicNumber, status) {
  const miniTable = document.getElementById('miniPeriodicTable');
  if (!miniTable) return;
  
  // Remove current highlight from all cells
  miniTable.querySelectorAll('.mini-current').forEach(cell => {
    cell.classList.remove('mini-current');
  });
  
  const cell = miniTable.querySelector(`.mini-cell[data-atomic="${atomicNumber}"]`);
  if (!cell) return;
  
  if (status === 'correct') {
    cell.classList.remove('mini-incorrect');
    cell.classList.add('mini-correct');
    cell.style.background = '';
    cell.style.borderColor = '';
  } else if (status === 'incorrect') {
    cell.classList.add('mini-incorrect');
    cell.style.background = '';
    cell.style.borderColor = '';
    // Flash red then revert
    setTimeout(() => {
      cell.classList.remove('mini-incorrect');
      const elData = ELEMENTS.find(e => e.atomicNumber === atomicNumber);
      if (elData && !state.correctElements.has(atomicNumber)) {
        cell.style.background = getCategoryColor(elData.category);
        cell.style.borderColor = getCategoryColor(elData.category);
      }
    }, 600);
  } else if (status === 'current') {
    cell.classList.add('mini-current');
  }
}

function updateMobileInputForElement(element) {
  state.currentElement = element;
  
  const number = mobileInputModal.querySelector('.mobile-input-number');
  const category = mobileInputModal.querySelector('.mobile-input-category');
  
  number.textContent = `Element #${element.dataset.atomic}`;
  category.textContent = element.dataset.category;
  
  mobileInput.value = '';
  mobileInputModal.querySelector('.mobile-input-hint').classList.add('hidden');
  
  // Update mini table to highlight new current element
  updateMiniTable(parseInt(element.dataset.atomic), 'current');
  updateMobileStats();
  
  setTimeout(() => mobileInput.focus(), 50);
}

function updateMobileStats() {
  const correct = state.correctElements.size;
  const total = state.activeElements.size;
  const accuracy = state.totalAttempts > 0 ? Math.round((state.correctAttempts / state.totalAttempts) * 100) : 100;
  
  const progressEl = document.getElementById('mobileProgressDisplay');
  const streakEl = document.getElementById('mobileStreakDisplay');
  const accuracyEl = document.getElementById('mobileAccuracyDisplay');
  const timerEl = document.getElementById('mobileTimerDisplay');
  
  if (progressEl) progressEl.textContent = `${correct}/${total}`;
  if (streakEl) streakEl.textContent = state.streak;
  if (accuracyEl) accuracyEl.textContent = `${accuracy}%`;
  if (timerEl) {
    const minutes = Math.floor(state.elapsedTime / 60);
    const seconds = state.elapsedTime % 60;
    timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}

function findNextElementAuto(currentElement) {
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
  
  // If the found element is already correct or disabled, try to find any unanswered element
  if (nextElement && (nextElement.classList.contains('correct') || nextElement.classList.contains('disabled'))) {
    nextElement = findFirstActiveElement();
  }
  
  if (!nextElement || nextElement.classList.contains('correct') || nextElement.classList.contains('disabled')) {
    return null;
  }
  
  return nextElement;
}