// Element lookup map for O(1) access by atomic number
const ELEMENTS_MAP = {};
if (typeof ELEMENTS !== 'undefined') {
  ELEMENTS.forEach(el => { ELEMENTS_MAP[el.atomicNumber] = el; });
}

const APP_URL = 'https://atomicmemory.netlify.app';

// State
const state = {
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
  totalChallengesCompleted: 0,
  navDirection: localStorage.getItem('navDirection') || 'horizontal'
};

// Custom Confirm Dialog (replaces browser native confirm)
function showConfirmDialog(message) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('confirmDialog');
    const msgEl = document.getElementById('confirmMessage');
    const okBtn = document.getElementById('confirmOk');
    const cancelBtn = document.getElementById('confirmCancel');
    const previousFocus = document.activeElement;
    
    msgEl.textContent = message;
    overlay.classList.remove('hidden');
    okBtn.focus();
    
    function cleanup() {
      overlay.classList.add('hidden');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      overlay.removeEventListener('click', onOverlay);
      document.removeEventListener('keydown', onKeydown);
      if (previousFocus) previousFocus.focus();
    }
    function onOk() { cleanup(); resolve(true); }
    function onCancel() { cleanup(); resolve(false); }
    function onOverlay(e) { if (e.target === overlay) { cleanup(); resolve(false); } }
    function onKeydown(e) {
      if (e.key === 'Escape') { cleanup(); resolve(false); }
      if (e.key === 'Tab') {
        // Trap focus within dialog
        const focusable = [cancelBtn, okBtn];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    }
    
    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    overlay.addEventListener('click', onOverlay);
    document.addEventListener('keydown', onKeydown);
  });
}

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
const finishBtn = document.getElementById('finishBtn');
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
const completeModal = document.getElementById('completeModal');
const closeCompleteBtn = document.getElementById('closeCompleteBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const shareScoreBtn = document.getElementById('shareScoreBtn');
const infoModal = document.getElementById('infoModal');
const closeInfoBtn = document.getElementById('closeInfoBtn');
const aboutBtn = document.getElementById('aboutBtn');
const viewTableBtn = document.getElementById('viewTableBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  detectMobile();
  detectDarkMode();
  loadTotalChallenges();
  setupIntro();
  setupEventListeners();
  achievementManager.updateBadge();
});

// Detect Mobile
function detectMobile() {
  state.isMobile = window.innerWidth <= 768;
  window.addEventListener('resize', () => {
    state.isMobile = window.innerWidth <= 768;
  });
}

// Intro Screen — unified for both desktop and mobile
function setupIntro() {
  startBtn.addEventListener('click', startApp);
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !introOverlay.classList.contains('fade-out') && !introOverlay.classList.contains('hidden')) {
      startApp();
    }
  });
  
  // Show total challenges completed on intro
  updateIntroStats();
}

function updateIntroStats() {
  const el = document.getElementById('introTotalChallenges');
  if (el && state.totalChallengesCompleted > 0) {
    el.textContent = `${state.totalChallengesCompleted} challenge${state.totalChallengesCompleted === 1 ? '' : 's'} completed`;
  }
}

function startApp() {
  introOverlay.classList.add('fade-out');
  setTimeout(() => {
    introOverlay.classList.add('hidden');
    mainApp.classList.remove('hidden');
    renderPeriodicTable();
    initializeFullTable();
    
    if (state.isMobile) {
      // On mobile, go straight into the game modal
      const firstElement = findFirstActiveElement();
      if (firstElement) {
        openMobileInput(firstElement);
      }
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
  
  // Reset button
  resetBtn.addEventListener('click', async () => {
    if (await showConfirmDialog('Are you sure you want to reset? Your current progress will be lost.')) {
      resetChallenge();
    }
  });
  
  // Finish button
  finishBtn.addEventListener('click', finishChallenge);
  
  // Hint button (removed from UI, guard against null)
  if (hintBtn) hintBtn.addEventListener('click', showHint);
  
  // History button
  historyBtn.addEventListener('click', openHistoryModal);
  closeHistoryBtn.addEventListener('click', () => closeModal(historyModal));
  
  // Leaderboard button
  leaderboardBtn.addEventListener('click', openLeaderboardModal);
  closeLeaderboardBtn.addEventListener('click', () => closeModal(leaderboardModal));
  
  // Achievements button
  achievementsBtn.addEventListener('click', openAchievementsModal);
  closeAchievementsBtn.addEventListener('click', () => closeModal(achievementsModal));
  
  // Info modal
  aboutBtn.addEventListener('click', openInfoModal);
  closeInfoBtn.addEventListener('click', () => closeModal(infoModal));
  
  // View table button (toggle element visibility on existing table)
  viewTableBtn.addEventListener('click', toggleViewTable);
  
  // Mobile menu
  menuBtn.addEventListener('click', openMobileMenu);
  closeMobileMenu.addEventListener('click', () => mobileMenu.classList.add('hidden'));
  
  // Mobile input
  document.querySelector('.mobile-input-close').addEventListener('click', closeMobileInput);
  
  // Mobile arrow key buttons
  document.getElementById('mobileArrowUp').addEventListener('click', () => navigateToAdjacentElement('up'));
  document.getElementById('mobileArrowDown').addEventListener('click', () => navigateToAdjacentElement('down'));
  document.getElementById('mobileArrowLeft').addEventListener('click', () => navigateToAdjacentElement('left'));
  document.getElementById('mobileArrowRight').addEventListener('click', () => navigateToAdjacentElement('right'));
  
  // Mobile finish button
  document.getElementById('mobileFinishBtn').addEventListener('click', finishChallenge);
  
  // QWERTY keyboard
  document.querySelectorAll('.qwerty-key').forEach(key => {
    key.addEventListener('click', (e) => {
      e.preventDefault();
      const k = key.dataset.key;
      handleQwertyKey(k);
    });
  });
  
  // Navigation direction toggle (HUD - desktop)
  document.querySelectorAll('.hud-nav-option').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.hud-nav-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.navDirection = btn.dataset.nav;
      localStorage.setItem('navDirection', state.navDirection);
      // Sync mobile pill toggle
      document.querySelectorAll('.gc-pill').forEach(b => {
        b.classList.toggle('active', b.dataset.nav === state.navDirection);
      });
    });
  });
  
  // Navigation direction toggle (mobile pill toggle)
  document.querySelectorAll('.gc-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.gc-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.navDirection = btn.dataset.nav;
      localStorage.setItem('navDirection', state.navDirection);
      // Sync desktop toggle
      document.querySelectorAll('.hud-nav-option').forEach(b => {
        b.classList.toggle('active', b.dataset.nav === state.navDirection);
      });
    });
  });
  
  // Set initial nav direction from state
  document.querySelectorAll('.hud-nav-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.nav === state.navDirection);
  });
  document.querySelectorAll('.gc-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.nav === state.navDirection);
  });
  
  
  // Mobile toolbar buttons
  document.getElementById('mobileToolbarTheme').addEventListener('click', () => {
    darkModeBtn.click();
    // Update the toolbar icon
    const icon = document.querySelector('#mobileToolbarTheme i');
    icon.className = document.body.dataset.theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line';
  });
  document.getElementById('mobileToolbarReset').addEventListener('click', async () => {
    if (await showConfirmDialog('Reset current challenge?')) {
      resetChallenge();
      if (state.isMobile) {
        closeMobileInput();
        showIntroScreen();
      }
    }
  });
  
  // Mobile nav buttons (history, leaderboard, achievements, about)
  document.getElementById('mobileToolbarHistory').addEventListener('click', openHistoryModal);
  document.getElementById('mobileToolbarLeaderboard').addEventListener('click', openLeaderboardModal);
  document.getElementById('mobileToolbarAchievements').addEventListener('click', openAchievementsModal);
  document.getElementById('mobileToolbarAbout').addEventListener('click', openInfoModal);
  
  // Complete modal
  closeCompleteBtn.addEventListener('click', () => {
    closeModal(completeModal);
  });
  playAgainBtn.addEventListener('click', () => {
    closeModal(completeModal);
    resetChallenge();
    showIntroScreen();
  });
  shareScoreBtn.addEventListener('click', shareScore);
  
  // Breakdown toggle
  const breakdownToggle = document.getElementById('breakdownToggle');
  if (breakdownToggle) {
    breakdownToggle.addEventListener('click', () => {
      const content = document.getElementById('breakdownContent');
      const expanded = breakdownToggle.getAttribute('aria-expanded') === 'true';
      breakdownToggle.setAttribute('aria-expanded', String(!expanded));
      content.classList.toggle('hidden');
    });
  }
  
  // Close modals on overlay click
  [historyModal, leaderboardModal, achievementsModal, completeModal, infoModal].forEach(modal => {
    modal.querySelector('.modal-overlay')?.addEventListener('click', () => closeModal(modal));
  });
  
  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [historyModal, leaderboardModal, achievementsModal, completeModal, infoModal].forEach(modal => {
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
      <button class="mobile-menu-btn" onclick="openInfoModal(); mobileMenu.classList.add('hidden')">
        <i class="ri-information-line"></i>
        <span>About</span>
      </button>
    </div>
  `;
  
  mobileMenu.classList.remove('hidden');
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
  if (viewTableBtn.classList.contains('viewing')) return;
  if (!state.activeElements.has(parseInt(element.dataset.atomic))) return;
  
  if (state.isMobile) {
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

function formatCellPosition(element) {
  const period = element.dataset.period;
  const group = element.dataset.group;
  if (group) {
    return `Period ${period} · Group ${group}`;
  }
  return `Period ${period}`;
}

function openMobileInput(element) {
  state.currentElement = element;
  
  // Render mini table on first open
  renderMiniTable();
  
  // Update cell display
  const cellAtomicNum = document.getElementById('cellAtomicNumber');
  const cellSymbolDisplay = document.getElementById('cellSymbolDisplay');
  const cellNameDisplay = document.getElementById('cellNameDisplay');
  const cellPosition = document.getElementById('cellPositionDisplay');
  if (cellAtomicNum) cellAtomicNum.textContent = element.dataset.atomic;
  if (cellSymbolDisplay) {
    cellSymbolDisplay.textContent = '—';
    cellSymbolDisplay.classList.add('empty');
  }
  if (cellNameDisplay) cellNameDisplay.textContent = '';
  if (cellPosition) cellPosition.textContent = formatCellPosition(element);
  
  mobileInput.value = '';
  updateGcInputState();
  
  mobileInputModal.querySelector('.mobile-input-hint').classList.add('hidden');
  mobileInputModal.classList.remove('hidden');
  
  // Sync theme icon in modal toolbar
  const themeIcon = document.querySelector('#mobileToolbarTheme i');
  if (themeIcon) {
    themeIcon.className = document.body.dataset.theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line';
  }
  
  // Highlight current element in mini table
  updateMiniTable(parseInt(element.dataset.atomic), 'current');
  updateMobileStats();
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
  
  const gcInputBox = document.getElementById('gcInputBox');
  const cellDisplay = document.getElementById('cellSymbolDisplay');
  const cellName = document.getElementById('cellNameDisplay');
  
  if (state.currentElement.classList.contains('correct')) {
    // Update mini table
    updateMiniTable(parseInt(state.currentElement.dataset.atomic), 'correct');
    
    // Flash green feedback on input box
    if (gcInputBox) {
      gcInputBox.classList.add('cell-correct');
      setTimeout(() => gcInputBox.classList.remove('cell-correct'), 400);
    }
    
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
    if (gcInputBox) {
      gcInputBox.classList.add('cell-incorrect');
      setTimeout(() => gcInputBox.classList.remove('cell-incorrect'), 400);
    }
    mobileInput.value = '';
    if (cellDisplay) {
      cellDisplay.textContent = '—';
      cellDisplay.classList.add('empty');
    }
    updateGcInputState();
    updateMobileStats();
  }
}

// Update game control zone input box visual state
function updateGcInputState() {
  const gcInputBox = document.getElementById('gcInputBox');
  const hasInput = mobileInput.value.length > 0;
  if (gcInputBox) gcInputBox.classList.toggle('has-input', hasInput);
}

function formatSymbolInput(input) {
  const val = input.value;
  if (!val) return;
  const pos = input.selectionStart;
  const formatted = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
  if (input.value !== formatted) {
    input.value = formatted;
    input.setSelectionRange(pos, pos);
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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
  
  input.addEventListener('input', () => {
    formatSymbolInput(input);
  });
  
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
    } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const direction = e.key.replace('Arrow', '').toLowerCase();
      navigateToAdjacentElement(direction);
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
  // Use the configured navigation direction
  const nextElement = state.navDirection === 'vertical' 
    ? findNextElementByGroup(currentElement) 
    : findNextElementByPeriod(currentElement);
  
  if (nextElement && !nextElement.classList.contains('correct') && !nextElement.classList.contains('disabled')) {
    if (state.isMobile) {
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

// Find the next element using period-based (horizontal) navigation
function findNextElementByPeriod(currentElement) {
  const atomic = parseInt(currentElement.dataset.atomic);
  const currentPeriod = parseInt(currentElement.dataset.period);
  const currentGroup = parseInt(currentElement.dataset.group) || null;
  const currentCategory = currentElement.dataset.category;
  
  let nextElement = null;
  
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
  
  return nextElement;
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

// Find the next element using group-based (vertical) navigation
function findNextElementByGroup(currentElement) {
  const atomic = parseInt(currentElement.dataset.atomic);
  const currentPeriod = parseInt(currentElement.dataset.period);
  const currentGroup = parseInt(currentElement.dataset.group) || null;
  const currentCategory = currentElement.dataset.category;
  
  let nextElement = null;
  
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
  } else if (currentGroup) {
    nextElement = findNextInGroup(currentGroup, currentPeriod);
    if (!nextElement) {
      // Move to next group
      const nextGroup = currentGroup + 1;
      if (nextGroup <= 18) {
        nextElement = findFirstInGroup(nextGroup);
      }
      if (!nextElement) {
        nextElement = findFirstActiveElement();
      }
    }
  } else {
    nextElement = findFirstActiveElement();
  }
  
  return nextElement;
}

// Timer
function startTimer() {
  state.timerStarted = true;
  state.startTime = Date.now();
  // Reset view mode if active
  if (viewTableBtn.classList.contains('viewing')) {
    toggleViewTable();
  }
  viewTableBtn.classList.add('hidden');
  
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
  // Mirror timer in desktop bottom bar
  const bottomTimer = document.getElementById('bottomTimer');
  if (bottomTimer) bottomTimer.textContent = timeStr;
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
  // Reset view mode
  viewTableBtn.classList.remove('hidden', 'viewing');
  viewTableBtn.querySelector('i').className = 'ri-eye-line';
  viewTableBtn.querySelector('span').textContent = 'View';
  
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
  viewTableBtn.classList.remove('hidden', 'viewing');
  viewTableBtn.querySelector('i').className = 'ri-eye-line';
  viewTableBtn.querySelector('span').textContent = 'View';
  
  const totalMistakes = Object.values(state.wrongAttempts).reduce((a, b) => a + b, 0);
  
  // Calculate final score
  const finalScore = scoringSystem.calculateFinalScore(
    state.correctElements.size,
    state.elapsedTime,
    totalMistakes
  );
  
  // Save score
  const configKey = getConfigKey();
  scoringSystem.saveScore(configKey, state.correctElements.size, state.elapsedTime, totalMistakes, getModeLabel());
  
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
  return 'full';
}

function getModeLabel() {
  return 'Full Table (118 elements)';
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
  
  // Update desktop bottom bar stats
  updateBottomBarStats();
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

function openInfoModal() {
  infoModal.classList.remove('hidden');
}

function toggleViewTable() {
  // Block viewing while game is active
  if (state.timerStarted) {
    showHintToast("Can't view while playing. Finish the game first.");
    return;
  }

  const isViewing = viewTableBtn.classList.toggle('viewing');
  const icon = viewTableBtn.querySelector('i');

  document.querySelectorAll('.element').forEach(el => {
    if (el.classList.contains('placeholder')) return;
    if (el.classList.contains('correct')) return;

    const symbolSpan = el.querySelector('.element-symbol');
    const nameSpan = el.querySelector('.element-name');
    if (!symbolSpan || !nameSpan) return;

    if (isViewing) {
      symbolSpan.textContent = el.dataset.symbol;
      nameSpan.textContent = el.dataset.name;
    } else {
      symbolSpan.textContent = '';
      nameSpan.textContent = '';
    }
  });

  if (isViewing) {
    icon.className = 'ri-eye-off-line';
    viewTableBtn.querySelector('span').textContent = 'Hide';
  } else {
    icon.className = 'ri-eye-line';
    viewTableBtn.querySelector('span').textContent = 'View';
  }
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
          <div class="leaderboard-mode">${entry.modeLabel || entry.config || 'Unknown'}</div>
          <div class="leaderboard-date">${dateStr} • ${formatTime(entry.time)} • ${entry.accuracy}% acc</div>
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
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(rank.color)) {
    finalRankDisplay.style.background = rank.color;
  }
  
  const minutes = Math.floor(state.elapsedTime / 60);
  const seconds = state.elapsedTime % 60;
  completeTime.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  completeAccuracy.textContent = `${state.accuracy}%`;
  completeStreak.textContent = state.maxStreak;
  
  breakdownBase.textContent = scoringSystem.formatScore(scoringSystem.baseScore);
  breakdownBonus.textContent = `+${scoringSystem.formatScore(scoringSystem.bonusPoints)}`;
  breakdownPenalty.textContent = `-${scoringSystem.formatScore(scoringSystem.penaltyPoints)}`;
  
  // Ensure breakdown is collapsed
  const breakdownContent = document.getElementById('breakdownContent');
  const breakdownToggle = document.getElementById('breakdownToggle');
  if (breakdownContent) breakdownContent.classList.add('hidden');
  if (breakdownToggle) breakdownToggle.setAttribute('aria-expanded', 'false');
  
  completeModal.classList.remove('hidden');
  
  // Save to history
  saveToHistory();
}

function getShareFocusLabel() {
  return 'All 118 Elements';
}

function getShareModeLabel() {
  return 'Full Table';
}

function shareScore() {
  const rank = scoringSystem.getRank();
  const minutes = Math.floor(state.elapsedTime / 60);
  const seconds = String(state.elapsedTime % 60).padStart(2, '0');
  const modeLabel = getShareModeLabel();
  const focusLabel = getShareFocusLabel();
  
  const text = `🎓 I just scored ${scoringSystem.formatScore(scoringSystem.score)} points on AtomicMemory!\n\n🏆 Rank: ${rank.name}\n🧪 Mode: ${modeLabel}\n📚 Focus: ${focusLabel}\n⏱️ Time: ${minutes}:${seconds}\n🎯 Accuracy: ${state.accuracy}%\n\nCan you beat my score?\nPlay now → ${APP_URL}`;
  
  if (navigator.share) {
    navigator.share({
      title: 'AtomicMemory Score',
      text: text,
      url: APP_URL
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

// ===== QWERTY KEYBOARD HANDLER =====

function handleQwertyKey(key) {
  if (!state.currentElement) return;
  
  const cellSymbolDisplay = document.getElementById('cellSymbolDisplay');
  
  if (key === 'BACKSPACE') {
    if (mobileInput.value.length > 0) {
      mobileInput.value = mobileInput.value.slice(0, -1);
      if (cellSymbolDisplay) {
        cellSymbolDisplay.textContent = mobileInput.value || '—';
        cellSymbolDisplay.classList.toggle('empty', !mobileInput.value);
      }
      updateGcInputState();
    }
    return;
  }
  
  if (key === 'SUBMIT') {
    handleMobileSubmit();
    return;
  }
  
  // Letter key
  if (mobileInput.value.length < 3) {
    mobileInput.value += key;
    formatSymbolInput(mobileInput);
    if (cellSymbolDisplay) {
      cellSymbolDisplay.textContent = mobileInput.value;
      cellSymbolDisplay.classList.remove('empty');
    }
    updateGcInputState();
  }
}

// ===== SHOW INTRO SCREEN =====

function showIntroScreen() {
  // Show intro overlay again
  introOverlay.classList.remove('hidden', 'fade-out');
  mainApp.classList.add('hidden');
  updateIntroStats();
}

// ===== DESKTOP BOTTOM BAR STATS =====

function updateBottomBarStats() {
  const correct = state.correctElements.size;
  const total = state.activeElements.size;
  const accuracy = state.totalAttempts > 0 ? Math.round((state.correctAttempts / state.totalAttempts) * 100) : 100;
  
  const bottomScore = document.getElementById('bottomScore');
  const bottomTimer = document.getElementById('bottomTimer');
  const bottomProgress = document.getElementById('bottomProgress');
  const bottomStreak = document.getElementById('bottomStreak');
  const bottomAccuracy = document.getElementById('bottomAccuracy');
  
  if (bottomScore && typeof scoringSystem !== 'undefined') {
    bottomScore.textContent = scoringSystem.formatScore(scoringSystem.score);
  }
  if (bottomTimer) {
    const minutes = Math.floor(state.elapsedTime / 60);
    const seconds = state.elapsedTime % 60;
    bottomTimer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  if (bottomProgress) bottomProgress.textContent = `${correct}/${total}`;
  if (bottomStreak) bottomStreak.textContent = state.streak;
  if (bottomAccuracy) bottomAccuracy.textContent = `${accuracy}%`;
}

// ===== MOBILE PERSISTENT MODAL =====

function findFirstActiveElement() {
  const elements = Array.from(document.querySelectorAll('.element'))
    .filter(el => !el.classList.contains('placeholder'))
    .filter(el => state.activeElements.has(parseInt(el.dataset.atomic)))
    .filter(el => !el.classList.contains('correct'))
    .sort((a, b) => parseInt(a.dataset.atomic) - parseInt(b.dataset.atomic));
  
  return elements[0] || null;
}

function getMiniTableLayout() {
  const layout = [];
  layout.push(1);
  for (let i = 0; i < 16; i++) layout.push('spacer');
  layout.push(2);
  layout.push(3, 4);
  for (let i = 0; i < 10; i++) layout.push('spacer');
  for (let i = 5; i <= 10; i++) layout.push(i);
  layout.push(11, 12);
  for (let i = 0; i < 10; i++) layout.push('spacer');
  for (let i = 13; i <= 18; i++) layout.push(i);
  for (let i = 19; i <= 54; i++) layout.push(i);
  layout.push(55, 56, 'placeholder');
  for (let i = 72; i <= 86; i++) layout.push(i);
  layout.push(87, 88, 'placeholder');
  for (let i = 104; i <= 118; i++) layout.push(i);
  for (let i = 0; i < 18; i++) layout.push('spacer');
  layout.push('spacer', 'spacer', 'label');
  for (let i = 57; i <= 71; i++) layout.push(i);
  layout.push('spacer', 'spacer', 'label');
  for (let i = 89; i <= 103; i++) layout.push(i);
  return layout;
}

function renderMiniTable() {
  const miniTable = document.getElementById('miniPeriodicTable');
  if (!miniTable) return;
  miniTable.innerHTML = '';
  
  const layout = getMiniTableLayout();
  
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
      
      // No category colors — cells are blank/neutral
      // Only correctly answered elements get colored (green)
      
      // Mark disabled if not active
      if (!state.activeElements.has(item)) {
        cell.classList.add('mini-disabled');
      }
      
      // Mark correct if already answered and show symbol
      if (state.correctElements.has(item)) {
        cell.classList.add('mini-correct');
        const el = ELEMENTS[item - 1];
        if (el) cell.textContent = el.symbol;
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
    const el = ELEMENTS[atomicNumber - 1];
    if (el) cell.textContent = el.symbol;
  } else if (status === 'incorrect') {
    cell.classList.add('mini-incorrect');
    // Flash red then revert to neutral
    setTimeout(() => {
      cell.classList.remove('mini-incorrect');
    }, 600);
  } else if (status === 'current') {
    cell.classList.add('mini-current');
    // Draw connector line from mini-table cell to input card
    drawConnectorLine(atomicNumber);
  }
}

// Draw a dashed curved line from the current mini-table cell to the input card
function drawConnectorLine(atomicNumber) {
  const svg = document.getElementById('gcConnectorSvg');
  const path = document.getElementById('gcConnectorPath');
  if (!svg || !path) return;
  
  const miniCell = document.querySelector(`#miniPeriodicTable .mini-cell[data-atomic="${atomicNumber}"]`);
  const inputCard = document.querySelector('.gc-info-card');
  const container = document.querySelector('.mobile-input-content');
  if (!miniCell || !inputCard || !container) return;
  
  const containerRect = container.getBoundingClientRect();
  const cellRect = miniCell.getBoundingClientRect();
  const cardRect = inputCard.getBoundingClientRect();
  
  // Start point: bottom center of the mini cell
  const x1 = cellRect.left + cellRect.width / 2 - containerRect.left;
  const y1 = cellRect.bottom - containerRect.top;
  
  // End point: top center of the input card
  const x2 = cardRect.left + cardRect.width / 2 - containerRect.left;
  const y2 = cardRect.top - containerRect.top;
  
  // Cubic Bézier curve with two control points for a gentle S-curve
  const midY = (y1 + y2) / 2;
  const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  
  path.setAttribute('d', d);
}

function updateMobileInputForElement(element) {
  state.currentElement = element;
  
  // Update cell display
  const cellAtomicNum = document.getElementById('cellAtomicNumber');
  const cellSymbolDisplay = document.getElementById('cellSymbolDisplay');
  const cellNameDisplay = document.getElementById('cellNameDisplay');
  const cellPosition = document.getElementById('cellPositionDisplay');
  if (cellAtomicNum) cellAtomicNum.textContent = element.dataset.atomic;
  if (cellSymbolDisplay) {
    cellSymbolDisplay.textContent = '—';
    cellSymbolDisplay.classList.add('empty');
  }
  if (cellNameDisplay) cellNameDisplay.textContent = '';
  if (cellPosition) cellPosition.textContent = formatCellPosition(element);
  
  mobileInput.value = '';
  updateGcInputState();
  mobileInputModal.querySelector('.mobile-input-hint').classList.add('hidden');
  
  // Update mini table to highlight new current element
  updateMiniTable(parseInt(element.dataset.atomic), 'current');
  updateMobileStats();
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
  
  // Update score and rank
  const scoreEl = document.getElementById('mobileScoreDisplay');
  const rankEl = document.getElementById('mobileRankDisplay');
  if (scoreEl && typeof scoringSystem !== 'undefined') {
    scoreEl.textContent = scoringSystem.formatScore(scoringSystem.score);
  }
  if (rankEl && typeof scoringSystem !== 'undefined') {
    const rank = scoringSystem.getRank();
    rankEl.textContent = rank.name;
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(rank.color)) {
      rankEl.style.background = `linear-gradient(135deg, ${rank.color} 0%, ${rank.color}dd 100%)`;
    }
  }
}

function findNextElementAuto(currentElement) {
  let nextElement = state.navDirection === 'vertical'
    ? findNextElementByGroup(currentElement)
    : findNextElementByPeriod(currentElement);
  
  // If no next element found or it's already correct/disabled, find any unanswered element
  if (!nextElement || nextElement.classList.contains('correct') || nextElement.classList.contains('disabled')) {
    nextElement = findFirstActiveElement();
  }
  
  if (!nextElement || nextElement.classList.contains('correct') || nextElement.classList.contains('disabled')) {
    return null;
  }
  
  return nextElement;
}

// Arrow key navigation between element cells
function navigateToAdjacentElement(direction) {
  if (!state.currentElement) return;
  
  const currentAtomic = parseInt(state.currentElement.dataset.atomic);
  const currentPeriod = parseInt(state.currentElement.dataset.period);
  const currentGroup = parseInt(state.currentElement.dataset.group) || null;
  const currentCategory = state.currentElement.dataset.category;
  
  let targetElement = null;
  
  // Build a grid-based lookup of elements by position
  const allElements = Array.from(document.querySelectorAll('.element'))
    .filter(el => !el.classList.contains('placeholder') && !el.classList.contains('disabled'));
  
  if (direction === 'left' || direction === 'right') {
    // Navigate within the same period, including f-block elements in their period
    const sameRow = allElements
      .filter(el => parseInt(el.dataset.period) === currentPeriod)
      .sort((a, b) => parseInt(a.dataset.atomic) - parseInt(b.dataset.atomic));
    
    const currentIndex = sameRow.findIndex(el => parseInt(el.dataset.atomic) === currentAtomic);
    if (currentIndex !== -1) {
      // Scan past correct cells to find the next unanswered one
      const step = direction === 'left' ? -1 : 1;
      for (let i = currentIndex + step; i >= 0 && i < sameRow.length; i += step) {
        if (!sameRow[i].classList.contains('correct')) {
          targetElement = sameRow[i];
          break;
        }
      }
    }
  } else if (direction === 'up' || direction === 'down') {
    if (currentCategory === 'lanthanide' || currentCategory === 'actinide') {
      // For lanthanides/actinides, up/down moves between the two series
      const elData = ELEMENTS_MAP[currentAtomic];
      if (elData) {
        const offset = currentCategory === 'lanthanide' ? currentAtomic - 57 : currentAtomic - 89;
        let targetAtomic;
        if (direction === 'down' && currentCategory === 'lanthanide') {
          targetAtomic = 89 + offset;
        } else if (direction === 'up' && currentCategory === 'actinide') {
          targetAtomic = 57 + offset;
        } else if (direction === 'up' && currentCategory === 'lanthanide') {
          // Go to the closest unanswered element in the main table in period 6 before lanthanides
          const mainRow = allElements
            .filter(el => parseInt(el.dataset.period) === 6 && el.dataset.category !== 'lanthanide')
            .filter(el => parseInt(el.dataset.atomic) < 57)
            .sort((a, b) => parseInt(b.dataset.atomic) - parseInt(a.dataset.atomic));
          for (const el of mainRow) {
            if (!el.classList.contains('correct')) {
              targetElement = el;
              break;
            }
          }
        }
        if (targetAtomic && !targetElement) {
          const candidate = allElements.find(el => parseInt(el.dataset.atomic) === targetAtomic);
          if (candidate && !candidate.classList.contains('correct')) {
            targetElement = candidate;
          }
        }
      }
    } else if (currentGroup) {
      // Navigate within the same group (column), skip over correct cells
      const sameCol = allElements
        .filter(el => parseInt(el.dataset.group) === currentGroup &&
                      el.dataset.category !== 'lanthanide' && el.dataset.category !== 'actinide')
        .sort((a, b) => parseInt(a.dataset.period) - parseInt(b.dataset.period));
      
      const currentIndex = sameCol.findIndex(el => parseInt(el.dataset.atomic) === currentAtomic);
      if (currentIndex !== -1) {
        const step = direction === 'up' ? -1 : 1;
        for (let i = currentIndex + step; i >= 0 && i < sameCol.length; i += step) {
          if (!sameCol[i].classList.contains('correct')) {
            targetElement = sameCol[i];
            break;
          }
        }
      }
      
      // Special: going down from group 3 into f-block
      if (!targetElement && direction === 'down' && currentGroup === 3) {
        if (currentPeriod === 5) {
          // Scan lanthanides for first unanswered
          const lanthSeries = allElements
            .filter(el => el.dataset.category === 'lanthanide')
            .sort((a, b) => parseInt(a.dataset.atomic) - parseInt(b.dataset.atomic));
          for (const el of lanthSeries) {
            if (!el.classList.contains('correct')) { targetElement = el; break; }
          }
        } else if (currentPeriod === 6) {
          // Scan actinides for first unanswered
          const actSeries = allElements
            .filter(el => el.dataset.category === 'actinide')
            .sort((a, b) => parseInt(a.dataset.atomic) - parseInt(b.dataset.atomic));
          for (const el of actSeries) {
            if (!el.classList.contains('correct')) { targetElement = el; break; }
          }
        }
      }
    }
  }
  
  if (targetElement) {
    if (state.isMobile) {
      updateMobileInputForElement(targetElement);
    } else {
      activateElement(targetElement);
    }
  }
}

// Finish challenge early (with partial completion)
async function finishChallenge() {
  if (state.correctElements.size === 0) {
    showHintToast('Please answer at least one element before finishing.');
    return;
  }
  
  if (!await showConfirmDialog(`Finish with ${state.correctElements.size}/${state.activeElements.size} elements? Your score will be calculated based on what you've completed.`)) {
    return;
  }
  
  completeChallenge();
}