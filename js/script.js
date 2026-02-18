// Element lookup map for O(1) access by atomic number
const ELEMENTS_MAP = {};
if (typeof ELEMENTS !== 'undefined') {
  ELEMENTS.forEach(el => { ELEMENTS_MAP[el.atomicNumber] = el; });
}

const APP_URL = 'https://atomicmemory.netlify.app';

// Safe localStorage helpers
function safeGetItem(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

function safeSetItem(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { /* quota exceeded or disabled */ }
}

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
  shiftActive: false,
  totalChallengesCompleted: 0,
  navDirection: safeGetItem('navDirection') || 'horizontal',
  gameMode: safeGetItem('gameMode') || 'classic',
  pendingAnswers: {}
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
const donateBtn = document.getElementById('donateBtn');
const donateModal = document.getElementById('donateModal');
const donateDismissBtn = document.getElementById('donateDismissBtn');

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
    initInGameModeToggle();
    updateFinishButtonForMode();
    
    if (state.isMobile) {
      const firstElement = findFirstActiveElement();
      if (firstElement) {
        openMobileInput(firstElement);
        // Show first-play guide after a short delay
        if (!safeGetItem('guideDismissed')) {
          setTimeout(() => showMobileGuide(), 600);
        }
      }
    } else {
      const firstElement = findFirstActiveElement();
      if (firstElement) {
        activateElement(firstElement);
        // Show first-play guide after a short delay
        if (!safeGetItem('guideDismissed')) {
          setTimeout(() => showDesktopGuide(firstElement), 600);
        }
      }
    }
  }, 600);
}

// Dark Mode
function detectDarkMode() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedDarkMode = safeGetItem('darkMode');
  
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
    safeSetItem('darkMode', !isDark);
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
  
  // Data management buttons
  const exportDataBtn = document.getElementById('exportDataBtn');
  const importDataBtn = document.getElementById('importDataBtn');
  const importFileInput = document.getElementById('importFileInput');
  const resetDataBtn = document.getElementById('resetDataBtn');
  if (exportDataBtn) exportDataBtn.addEventListener('click', exportData);
  if (importDataBtn) importDataBtn.addEventListener('click', () => importFileInput.click());
  if (importFileInput) importFileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) importData(e.target.files[0]);
    e.target.value = '';
  });
  if (resetDataBtn) resetDataBtn.addEventListener('click', resetAllData);
  
  // Leaderboard button
  leaderboardBtn.addEventListener('click', openLeaderboardModal);
  closeLeaderboardBtn.addEventListener('click', () => closeModal(leaderboardModal));
  
  // Achievements button
  achievementsBtn.addEventListener('click', openAchievementsModal);
  closeAchievementsBtn.addEventListener('click', () => closeModal(achievementsModal));
  
  // Info modal
  aboutBtn.addEventListener('click', openInfoModal);
  closeInfoBtn.addEventListener('click', () => closeModal(infoModal));
  
  // Donate modal
  donateBtn.addEventListener('click', openDonateModal);
  donateDismissBtn.addEventListener('click', () => closeModal(donateModal));
  
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
      safeSetItem('navDirection', state.navDirection);
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
      safeSetItem('navDirection', state.navDirection);
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
  document.getElementById('mobileToolbarDonate').addEventListener('click', openDonateModal);
  
  // Complete modal
  closeCompleteBtn.addEventListener('click', () => {
    dismissCompleteModal();
  });
  playAgainBtn.addEventListener('click', () => {
    dismissCompleteModal();
  });
  shareScoreBtn.addEventListener('click', shareScore);
  
  // Try Recall Mode button in completion modal
  const tryRecallBtn = document.getElementById('tryRecallBtn');
  if (tryRecallBtn) {
    tryRecallBtn.addEventListener('click', () => {
      closeModal(completeModal);
      state.gameMode = 'recall';
      safeSetItem('gameMode', 'recall');
      resetChallenge();
      // Sync mode toggle buttons
      const desktopClassic = document.getElementById('desktopModeClassic');
      const desktopRecall = document.getElementById('desktopModeRecall');
      const mobileClassic = document.getElementById('mobileModeClassic');
      const mobileRecall = document.getElementById('mobileModeRecall');
      [desktopClassic, mobileClassic].forEach(b => { if (b) b.classList.remove('active'); });
      [desktopRecall, mobileRecall].forEach(b => { if (b) b.classList.add('active'); });
      updateFinishButtonForMode();
      if (state.isMobile) {
        const firstElement = findFirstActiveElement();
        if (firstElement) openMobileInput(firstElement);
      }
    });
  }
  
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
  [historyModal, leaderboardModal, achievementsModal, infoModal, donateModal].forEach(modal => {
    modal.querySelector('.modal-overlay')?.addEventListener('click', () => closeModal(modal));
  });
  completeModal.querySelector('.modal-overlay')?.addEventListener('click', () => dismissCompleteModal());
  
  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [historyModal, leaderboardModal, achievementsModal, infoModal, donateModal].forEach(modal => {
        if (!modal.classList.contains('hidden')) {
          closeModal(modal);
        }
      });
      if (!completeModal.classList.contains('hidden')) {
        dismissCompleteModal();
      }
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
      <button class="mobile-menu-btn" onclick="openDonateModal(); mobileMenu.classList.add('hidden')">
        <i class="ri-heart-fill donate-heart-icon"></i>
        <span>Donate</span>
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
  
  // Brand block: occupies the d-block gap in rows 1-2 (grid-column 3/13, grid-row 1/3)
  const brand = document.createElement('div');
  brand.className = 'table-brand';
  const brandTitle = document.createElement('div');
  brandTitle.className = 'table-brand-title';
  brandTitle.textContent = 'AtomicMemory';
  const brandTagline = document.createElement('div');
  brandTagline.className = 'table-brand-tagline';
  brandTagline.textContent = 'Learn the periodic table through an interactive, gamified experience.';
  brand.appendChild(brandTitle);
  brand.appendChild(brandTagline);
  periodicTable.appendChild(brand);

  // Period 1
  renderElement(ELEMENTS[0], 1, 1); // H
  renderElement(ELEMENTS[1], 1, 18); // He
  
  // Period 2
  renderElement(ELEMENTS[2], 2, 1); // Li
  renderElement(ELEMENTS[3], 2, 2); // Be
  for (let i = 4; i <= 9; i++) renderElement(ELEMENTS[i], 2, ELEMENTS[i].group);
  
  // Period 3
  for (let i = 10; i <= 17; i++) renderElement(ELEMENTS[i], 3, ELEMENTS[i].group);
  
  // Periods 4-5 (all have group assignments)
  for (let i = 18; i <= 53; i++) renderElement(ELEMENTS[i], ELEMENTS[i].period, ELEMENTS[i].group);
  
  // Period 6 with lanthanides placeholder
  renderElement(ELEMENTS[54], 6, 1); // Cs
  renderElement(ELEMENTS[55], 6, 2); // Ba
  periodicTable.appendChild(createPlaceholder('57–71', 6, 3));
  for (let i = 71; i <= 85; i++) renderElement(ELEMENTS[i], 6, ELEMENTS[i].group);
  
  // Period 7 with actinides placeholder
  renderElement(ELEMENTS[86], 7, 1); // Fr
  renderElement(ELEMENTS[87], 7, 2); // Ra
  periodicTable.appendChild(createPlaceholder('89–103', 7, 3));
  for (let i = 103; i <= 117; i++) renderElement(ELEMENTS[i], 7, ELEMENTS[i].group);
  
  // Lanthanides (row 9, with a spacer row 8)
  periodicTable.appendChild(createLabel('Lanthanides', 9));
  for (let col = 4, idx = 56; idx <= 70; idx++, col++) renderElement(ELEMENTS[idx], 9, col);
  
  // Actinides (row 10)
  periodicTable.appendChild(createLabel('Actinides', 10));
  for (let col = 4, idx = 88; idx <= 102; idx++, col++) renderElement(ELEMENTS[idx], 10, col);
}

function renderElement(element, row, col) {
  const div = document.createElement('div');
  div.className = 'element';
  div.dataset.atomic = element.atomicNumber;
  div.dataset.symbol = element.symbol;
  div.dataset.name = element.name;
  div.dataset.group = element.group || '';
  div.dataset.period = element.period;
  div.dataset.block = element.block;
  div.dataset.category = element.category;
  if (row && col) {
    div.style.gridRow = row;
    div.style.gridColumn = col;
  }
  
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

function createPlaceholder(text, row, col) {
  const div = document.createElement('div');
  div.className = 'element placeholder';
  div.textContent = text;
  if (row && col) {
    div.style.gridRow = row;
    div.style.gridColumn = col;
  }
  return div;
}

function createLabel(text, row) {
  const label = document.createElement('div');
  label.className = text === 'Lanthanides' ? 'lanthanide-label' : 'actinide-label';
  label.textContent = text;
  if (row) {
    label.style.gridRow = row;
    label.style.gridColumn = '1 / 4';
  }
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
  
  // In Recall mode, pre-fill with pending answer
  const atomic = parseInt(element.dataset.atomic);
  if (state.gameMode === 'recall' && state.pendingAnswers[atomic]) {
    mobileInput.value = state.pendingAnswers[atomic];
    if (cellSymbolDisplay) {
      cellSymbolDisplay.textContent = state.pendingAnswers[atomic];
      cellSymbolDisplay.classList.remove('empty');
    }
  } else {
    mobileInput.value = '';
    if (cellSymbolDisplay) {
      cellSymbolDisplay.textContent = '—';
      cellSymbolDisplay.classList.add('empty');
    }
  }
  
  if (cellNameDisplay) cellNameDisplay.textContent = '';
  if (cellPosition) cellPosition.textContent = formatCellPosition(element);
  
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
  
  // In Recall mode, store pending answer without validating
  if (state.gameMode === 'recall') {
    if (!state.timerStarted) startTimer();
    const atomic = parseInt(state.currentElement.dataset.atomic);
    state.pendingAnswers[atomic] = value;
    state.currentElement.classList.add('pending');
    
    // Show typed symbol in main table cell
    const symbolSpan = state.currentElement.querySelector('.element-symbol');
    if (symbolSpan) symbolSpan.textContent = value;
    
    // Update mini table with pending status
    updateMiniTable(atomic, 'pending');
    
    // Flash neutral feedback
    const gcInputBox = document.getElementById('gcInputBox');
    if (gcInputBox) {
      gcInputBox.classList.add('cell-pending');
      setTimeout(() => gcInputBox.classList.remove('cell-pending'), 400);
    }
    
    // Auto-advance to next element
    const nextEl = findNextElementAuto(state.currentElement);
    if (nextEl) {
      setTimeout(() => updateMobileInputForElement(nextEl), 200);
    }
    
    dismissGuide();
    updateMobileStats();
    return;
  }
  
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
  
  const isCorrect = element.classList.contains('correct');
  
  const input = document.createElement('input');
  input.type = 'text';
  input.maxLength = 3;
  input.autocomplete = 'off';
  
  if (isCorrect) {
    // Answered cell: read-only, invisible input just to capture arrow keys
    input.readOnly = true;
    input.style.cssText = 'position:absolute;opacity:0;width:0;height:0;pointer-events:none;';
  } else {
    input.placeholder = '?';
    // In Recall mode, pre-fill with pending answer if exists
    const atomic = parseInt(element.dataset.atomic);
    if (state.gameMode === 'recall' && state.pendingAnswers[atomic]) {
      input.value = state.pendingAnswers[atomic];
    }
  }
  
  element.appendChild(input);
  input.focus();
  
  if (!isCorrect) {
    input.addEventListener('input', () => {
      formatSymbolInput(input);
      dismissGuide();
    });
  }
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !isCorrect) {
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
  
  // In Recall mode, store pending answer without validating
  if (state.gameMode === 'recall') {
    if (!state.timerStarted) startTimer();
    state.pendingAnswers[atomic] = userInput;
    element.classList.add('pending');
    element.classList.remove('active');
    const input = element.querySelector('input');
    if (input) input.remove();
    
    // Show typed symbol in cell with pending style
    const symbolSpan = element.querySelector('.element-symbol');
    if (symbolSpan) symbolSpan.textContent = userInput;
    
    if (!state.isMobile) {
      setTimeout(() => moveToNextElement(element), 100);
    }
    return;
  }
  
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
    
    // Mid-game confetti on new high score (check every 10 correct, skip first game)
    if (state.correctElements.size % 10 === 0 && state.correctElements.size > 0) {
      const currentBest = scoringSystem.getPersonalBest();
      if (currentBest && scoringSystem.score > currentBest.score) {
        launchConfetti();
      }
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
  
  if (nextElement && !nextElement.classList.contains('correct') && !nextElement.classList.contains('disabled')
      && !(state.gameMode === 'recall' && nextElement.classList.contains('pending'))) {
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

// Pause timer when page is hidden to save resources
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
  } else if (state.timerStarted && !state.timerInterval) {
    state.timerInterval = setInterval(() => {
      state.elapsedTime = Math.floor((Date.now() - state.startTime) / 1000);
      updateTimerDisplay();
    }, 100);
  }
});

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
  state.pendingAnswers = {};
  
  document.querySelectorAll('.element').forEach(el => {
    if (el.classList.contains('placeholder')) return;
    
    el.classList.remove('correct', 'incorrect', 'active', 'pending');
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
  viewTableBtn.querySelector('span').textContent = 'Reveal Table';
  
  // Restore Finish button if it was changed to Play Again
  restoreFinishButton();
  
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
  
  // Close mobile input modal if open to prevent jarring transition
  if (!mobileInputModal.classList.contains('hidden')) {
    closeMobileInput();
  }
  
  viewTableBtn.classList.remove('hidden', 'viewing');
  viewTableBtn.querySelector('i').className = 'ri-eye-line';
  viewTableBtn.querySelector('span').textContent = 'Reveal Table';
  
  const totalMistakes = Object.values(state.wrongAttempts).reduce((a, b) => a + b, 0);
  
  // Get personal best before saving new score
  const previousBest = scoringSystem.getPersonalBest();
  
  // Calculate final score
  const finalScore = scoringSystem.calculateFinalScore(
    state.correctElements.size,
    state.elapsedTime,
    totalMistakes
  );
  
  // Check for new high score and trigger confetti (skip first game)
  if (previousBest && finalScore > previousBest.score) {
    launchConfetti();
  }
  
  // Save score
  scoringSystem.saveScore('full', state.correctElements.size, state.elapsedTime, totalMistakes);
  
  // Update stats
  state.totalChallengesCompleted++;
  saveTotalChallenges();
  
  // Check achievements
  checkAchievements(true);
  
  // Replace Finish button with Play Again
  setFinishButtonToPlayAgain();
  
  // Show complete modal
  showCompleteModal();
}

function setFinishButtonToPlayAgain() {
  finishBtn.querySelector('i').className = 'ri-restart-line';
  finishBtn.querySelector('span').textContent = 'Play Again';
  finishBtn.classList.add('play-again');
  finishBtn.removeEventListener('click', finishChallenge);
  finishBtn.addEventListener('click', handlePlayAgain);
}

function restoreFinishButton() {
  finishBtn.querySelector('i').className = state.gameMode === 'recall' ? 'ri-check-double-line' : 'ri-flag-line';
  finishBtn.querySelector('span').textContent = state.gameMode === 'recall' ? 'Check Answers' : 'Finish';
  finishBtn.classList.remove('play-again');
  finishBtn.removeEventListener('click', handlePlayAgain);
  finishBtn.addEventListener('click', finishChallenge);
  // Mobile finish button too
  const mobileFinish = document.getElementById('mobileFinishBtn');
  if (mobileFinish) {
    mobileFinish.innerHTML = state.gameMode === 'recall' ? '<i class="ri-check-double-line"></i> Check Answers' : '<i class="ri-flag-line"></i> Finish Game';
  }
}

function handlePlayAgain() {
  resetChallenge();
}

function checkAchievements(challengeComplete = false) {
  const stats = {
    correct: state.correctElements.size,
    mistakes: Object.values(state.wrongAttempts).reduce((a, b) => a + b, 0),
    time: state.elapsedTime,
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

// Stats
function updateStats() {
  const correct = state.correctElements.size;
  const total = state.activeElements.size;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
  
  state.accuracy = state.totalAttempts > 0 ? Math.round((state.correctAttempts / state.totalAttempts) * 100) : 100;
  
  correctCountDisplay.textContent = correct;
  totalCountDisplay.textContent = total;
  streakDisplay.textContent = state.streak;
  accuracyDisplay.textContent = state.totalAttempts > 0 ? `${state.accuracy}%` : '—';
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
  safeSetItem('totalChallenges', state.totalChallengesCompleted);
}

function loadTotalChallenges() {
  const saved = safeGetItem('totalChallenges');
  if (saved) {
    state.totalChallengesCompleted = parseInt(saved);
  }
}

// Modals
function closeModal(modal) {
  modal.classList.add('hidden');
}

function dismissCompleteModal() {
  closeModal(completeModal);
  // Show leaderboard guide after first completion
  const shouldShowLeaderboardGuide = !safeGetItem('leaderboardGuideShown');
  // Show recall guide for users who played 3+ games but never tried recall
  const shouldShowRecallGuide = !shouldShowLeaderboardGuide
    && state.totalChallengesCompleted >= 3
    && state.gameMode === 'classic'
    && !safeGetItem('recallModeGuideShown');
  resetChallenge();
  if (state.isMobile) {
    const firstElement = findFirstActiveElement();
    if (firstElement) {
      openMobileInput(firstElement);
    }
  }
  if (shouldShowLeaderboardGuide) {
    setTimeout(() => showLeaderboardGuide(), 400);
  } else if (shouldShowRecallGuide) {
    setTimeout(() => showRecallModeGuide(), 400);
  }
}

function openInfoModal() {
  infoModal.classList.remove('hidden');
}

function openDonateModal() {
  donateModal.classList.remove('hidden');
}

function toggleViewTable() {
  // Block reveal while a challenge is in progress; allow hide toggle when already viewing
  if (state.totalAttempts > 0 && state.correctElements.size < state.activeElements.size && !viewTableBtn.classList.contains('viewing')) {
    showHintToast('Can\'t reveal the table during a challenge. Finish or reset first!');
    return;
  }

  const legend = document.querySelector('.category-legend');

  // If currently viewing, just hide
  if (viewTableBtn.classList.contains('viewing')) {
    viewTableBtn.classList.remove('viewing');
    const icon = viewTableBtn.querySelector('i');

    document.querySelectorAll('.element').forEach(el => {
      if (el.classList.contains('placeholder')) return;

      const symbolSpan = el.querySelector('.element-symbol');
      const nameSpan = el.querySelector('.element-name');
      if (!symbolSpan || !nameSpan) return;

      symbolSpan.textContent = '';
      nameSpan.textContent = '';
    });

    icon.className = 'ri-eye-line';
    viewTableBtn.querySelector('span').textContent = 'Reveal Table';
    if (legend) legend.classList.add('hidden');
    return;
  }

  // Reset the challenge first, then reveal
  resetChallenge();

  viewTableBtn.classList.add('viewing');
  const icon = viewTableBtn.querySelector('i');

  document.querySelectorAll('.element').forEach(el => {
    if (el.classList.contains('placeholder')) return;

    const symbolSpan = el.querySelector('.element-symbol');
    const nameSpan = el.querySelector('.element-name');
    if (!symbolSpan || !nameSpan) return;

    symbolSpan.textContent = el.dataset.symbol;
    nameSpan.textContent = el.dataset.name;
  });

  icon.className = 'ri-eye-off-line';
  viewTableBtn.querySelector('span').textContent = 'Hide Table';
  if (legend) legend.classList.remove('hidden');
}

function openHistoryModal() {
  loadHistory();
  historyModal.classList.remove('hidden');
}

function loadHistory() {
  const history = JSON.parse(safeGetItem('history') || '[]');
  
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
          <div class="history-mode">${record.elementsCount || 118}/118 Elements</div>
          <div class="history-score">Score: ${scoringSystem.formatScore(record.score || 0)}</div>
          <div class="history-details">
            <span><i class="ri-calendar-line"></i> ${dateStr} ${timeStr}</span>
            <span><i class="ri-close-circle-line"></i> ${record.wrongAttempts} errors</span>
            <span><i class="ri-fire-line"></i> ${record.maxStreak || 0} streak</span>
          </div>
        </div>
        <div class="history-time">${durationStr}</div>
      </div>
    `;
  }).join('');
}

// ===== DATA MANAGEMENT (Export / Import / Reset) =====

// All localStorage keys used by the app — keep in sync when adding new keys
const DATA_KEYS = ['history', 'leaderboard', 'achievements', 'totalChallenges', 'darkMode', 'navDirection', 'gameMode', 'guideDismissed', 'leaderboardGuideShown', 'recallModeSuggested', 'recallModeGuideShown'];

function exportData() {
  const data = {};
  DATA_KEYS.forEach(key => {
    const val = safeGetItem(key);
    if (val !== null) data[key] = val;
  });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `atomicmemory-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showHintToast('Data exported successfully!');
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (typeof data !== 'object' || data === null) {
        showHintToast('Invalid backup file.');
        return;
      }
      DATA_KEYS.forEach(key => {
        if (data[key] !== undefined) {
          safeSetItem(key, data[key]);
        }
      });
      // Reload state
      state.totalChallengesCompleted = parseInt(safeGetItem('totalChallenges') || '0');
      state.gameMode = safeGetItem('gameMode') || 'classic';
      state.navDirection = safeGetItem('navDirection') || 'horizontal';
      achievementManager.load();
      achievementManager.updateBadge();
      loadHistory();
      showHintToast('Data imported successfully!');
    } catch (err) {
      showHintToast('Failed to read backup file.');
    }
  };
  reader.readAsText(file);
}

async function resetAllData() {
  if (!await showConfirmDialog('Delete all data? This will erase your history, scores, achievements, and settings. This cannot be undone.')) {
    return;
  }
  DATA_KEYS.forEach(key => {
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
  });
  state.totalChallengesCompleted = 0;
  state.gameMode = 'classic';
  state.navDirection = 'horizontal';
  achievementManager.load();
  achievementManager.updateBadge();
  loadHistory();
  showHintToast('All data has been reset.');
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
          <div class="leaderboard-mode">${entry.rank || 'Novice'}</div>
          <div class="leaderboard-date">${dateStr} • ${entry.elementsCount || 118}/118 • ${formatTime(entry.time)} • ${entry.accuracy}% acc</div>
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
  
  // Show "Try Recall Mode" suggestion after 3 challenges
  const recallSuggestion = document.getElementById('recallSuggestion');
  if (recallSuggestion) {
    if (state.totalChallengesCompleted >= 3 && !safeGetItem('recallModeSuggested') && state.gameMode === 'classic') {
      recallSuggestion.classList.remove('hidden');
      safeSetItem('recallModeSuggested', 'true');
    } else {
      recallSuggestion.classList.add('hidden');
    }
  }
  
  // Save to history
  saveToHistory();
}

function shareScore() {
  const rank = scoringSystem.getRank();
  const minutes = Math.floor(state.elapsedTime / 60);
  const seconds = String(state.elapsedTime % 60).padStart(2, '0');
  const completed = state.correctElements.size;
  const total = state.activeElements.size;
  
  const text = `🧪 I just scored ${scoringSystem.formatScore(scoringSystem.score)} points on AtomicMemory!\n\n🏆 Rank: ${rank.name}\n🧩 Elements: ${completed}/${total}\n⏱️ Time: ${minutes}:${seconds}\n🎯 Accuracy: ${state.accuracy}%\n🔥 Best Streak: ${state.maxStreak}\n\nCan you beat my score?\nPlay now → ${APP_URL}`;
  
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
  const history = JSON.parse(safeGetItem('history') || '[]');
  
  const wrongAttempts = Object.values(state.wrongAttempts).reduce((a, b) => a + b, 0);
  
  const record = {
    mode: state.gameMode === 'recall' ? 'Recall' : 'Full Table',
    time: state.elapsedTime,
    wrongAttempts: wrongAttempts,
    elementsCount: state.correctElements.size,
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
  
  safeSetItem('history', JSON.stringify(history));
}

// ===== QWERTY KEYBOARD HANDLER =====

function handleQwertyKey(key) {
  if (!state.currentElement) return;
  
  const cellSymbolDisplay = document.getElementById('cellSymbolDisplay');
  
  if (key === 'SHIFT') {
    state.shiftActive = !state.shiftActive;
    const shiftBtn = document.querySelector('.qwerty-shift');
    if (shiftBtn) shiftBtn.classList.toggle('active', state.shiftActive);
    return;
  }
  
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
    const letter = state.shiftActive ? key.toUpperCase() : key.toLowerCase();
    mobileInput.value += letter;
    formatSymbolInput(mobileInput);
    if (cellSymbolDisplay) {
      cellSymbolDisplay.textContent = mobileInput.value;
      cellSymbolDisplay.classList.remove('empty');
    }
    updateGcInputState();
    dismissGuide();
    // Auto-deactivate shift after typing a letter
    if (state.shiftActive) {
      state.shiftActive = false;
      const shiftBtn = document.querySelector('.qwerty-shift');
      if (shiftBtn) shiftBtn.classList.remove('active');
    }
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
  if (bottomAccuracy) bottomAccuracy.textContent = state.totalAttempts > 0 ? `${accuracy}%` : '—';
}

// ===== MOBILE PERSISTENT MODAL =====

function findFirstActiveElement() {
  const elements = Array.from(document.querySelectorAll('.element'))
    .filter(el => !el.classList.contains('placeholder'))
    .filter(el => state.activeElements.has(parseInt(el.dataset.atomic)))
    .filter(el => !el.classList.contains('correct'))
    .filter(el => !(state.gameMode === 'recall' && el.classList.contains('pending')))
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
  } else if (status === 'pending') {
    cell.classList.add('mini-pending');
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
  
  const cellAtomicNum = document.getElementById('cellAtomicNumber');
  const cellSymbolDisplay = document.getElementById('cellSymbolDisplay');
  const cellNameDisplay = document.getElementById('cellNameDisplay');
  const cellPosition = document.getElementById('cellPositionDisplay');
  if (cellAtomicNum) cellAtomicNum.textContent = element.dataset.atomic;
  
  const isCorrect = element.classList.contains('correct');
  const atomic = parseInt(element.dataset.atomic);
  
  if (isCorrect) {
    // Show the answered element info, disable input
    const elData = ELEMENTS_MAP[atomic];
    mobileInput.value = elData ? elData.symbol : '';
    mobileInput.readOnly = true;
    if (cellSymbolDisplay) {
      cellSymbolDisplay.textContent = elData ? elData.symbol : '';
      cellSymbolDisplay.classList.remove('empty');
    }
    if (cellNameDisplay) cellNameDisplay.textContent = elData ? elData.name : '';
  } else if (state.gameMode === 'recall' && state.pendingAnswers[atomic]) {
    mobileInput.value = state.pendingAnswers[atomic];
    mobileInput.readOnly = false;
    if (cellSymbolDisplay) {
      cellSymbolDisplay.textContent = state.pendingAnswers[atomic];
      cellSymbolDisplay.classList.remove('empty');
    }
    if (cellNameDisplay) cellNameDisplay.textContent = '';
  } else {
    mobileInput.value = '';
    mobileInput.readOnly = false;
    if (cellSymbolDisplay) {
      cellSymbolDisplay.textContent = '—';
      cellSymbolDisplay.classList.add('empty');
    }
    if (cellNameDisplay) cellNameDisplay.textContent = '';
  }
  
  if (cellPosition) cellPosition.textContent = formatCellPosition(element);
  
  updateGcInputState();
  mobileInputModal.querySelector('.mobile-input-hint').classList.add('hidden');
  
  updateMiniTable(parseInt(element.dataset.atomic), isCorrect ? 'correct' : 'current');
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
  if (accuracyEl) accuracyEl.textContent = state.totalAttempts > 0 ? `${accuracy}%` : '—';
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
  
  // Determine what counts as "answered" - in recall mode, pending elements count too
  const isAnswered = (el) => {
    if (el.classList.contains('correct') || el.classList.contains('disabled')) return true;
    if (state.gameMode === 'recall' && el.classList.contains('pending')) return true;
    return false;
  };
  
  if (!nextElement || isAnswered(nextElement)) {
    nextElement = findFirstActiveElement();
  }
  
  if (!nextElement || isAnswered(nextElement)) {
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
    // Navigate within the same row visually
    let sameRow;
    if (currentCategory === 'lanthanide' || currentCategory === 'actinide') {
      // Stay within the f-block series
      sameRow = allElements
        .filter(el => el.dataset.category === currentCategory)
        .sort((a, b) => parseInt(a.dataset.atomic) - parseInt(b.dataset.atomic));
    } else {
      // Stay within the same period, excluding f-block (they're in a separate visual row)
      sameRow = allElements
        .filter(el => parseInt(el.dataset.period) === currentPeriod && el.dataset.category !== 'lanthanide' && el.dataset.category !== 'actinide')
        .sort((a, b) => parseInt(a.dataset.atomic) - parseInt(b.dataset.atomic));
    }
    
    const currentIndex = sameRow.findIndex(el => parseInt(el.dataset.atomic) === currentAtomic);
    if (currentIndex !== -1) {
      const step = direction === 'left' ? -1 : 1;
      const nextIndex = currentIndex + step;
      if (nextIndex >= 0 && nextIndex < sameRow.length) {
        targetElement = sameRow[nextIndex];
      }
    }
  } else if (direction === 'up' || direction === 'down') {
    if (currentCategory === 'lanthanide' || currentCategory === 'actinide') {
      const offset = currentCategory === 'lanthanide' ? currentAtomic - 57 : currentAtomic - 89;
      const visualGroup = offset + 4; // f-block columns 4-18
      
      if (direction === 'down' && currentCategory === 'lanthanide') {
        // Lanthanide → Actinide (same offset)
        const targetAtomic = 89 + offset;
        targetElement = allElements.find(el => parseInt(el.dataset.atomic) === targetAtomic);
      } else if (direction === 'up' && currentCategory === 'actinide') {
        // Actinide → Lanthanide (same offset)
        const targetAtomic = 57 + offset;
        targetElement = allElements.find(el => parseInt(el.dataset.atomic) === targetAtomic);
      } else if (direction === 'up' && currentCategory === 'lanthanide') {
        // Lanthanide → main table period 7 element in same visual column
        targetElement = allElements.find(el =>
          parseInt(el.dataset.period) === 7 && parseInt(el.dataset.group) === visualGroup
          && el.dataset.category !== 'actinide');
      } else if (direction === 'down' && currentCategory === 'actinide') {
        // Actinide → nothing below (bottom of table)
      }
    } else if (currentGroup) {
      // Navigate within the same group (column)
      const sameCol = allElements
        .filter(el => parseInt(el.dataset.group) === currentGroup &&
                      el.dataset.category !== 'lanthanide' && el.dataset.category !== 'actinide')
        .sort((a, b) => parseInt(a.dataset.period) - parseInt(b.dataset.period));
      
      const currentIndex = sameCol.findIndex(el => parseInt(el.dataset.atomic) === currentAtomic);
      if (currentIndex !== -1) {
        const step = direction === 'up' ? -1 : 1;
        const nextIndex = currentIndex + step;
        if (nextIndex >= 0 && nextIndex < sameCol.length) {
          targetElement = sameCol[nextIndex];
        }
      }
      
      // Down from bottom of main table (period 7) into f-block
      if (!targetElement && direction === 'down' && currentPeriod === 7 && currentGroup >= 4 && currentGroup <= 18) {
        const fOffset = currentGroup - 4;
        const targetAtomic = 57 + fOffset; // Lanthanide row (visually first f-block row)
        targetElement = allElements.find(el => parseInt(el.dataset.atomic) === targetAtomic);
      }
      // Up from period 7 with group < 4 (s-block): no f-block connection (groups 1-3)
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
  // In Recall mode, check all answers
  if (state.gameMode === 'recall') {
    const pendingCount = Object.keys(state.pendingAnswers).length;
    if (pendingCount === 0) {
      showHintToast('Please enter at least one answer before checking.');
      return;
    }
    if (!await showConfirmDialog(`Check ${pendingCount} answer${pendingCount === 1 ? '' : 's'}? Your score will be calculated.`)) {
      return;
    }
    checkAllAnswers();
    return;
  }
  
  if (state.correctElements.size === 0) {
    showHintToast('Please answer at least one element before finishing.');
    return;
  }
  
  if (!await showConfirmDialog(`Finish with ${state.correctElements.size}/${state.activeElements.size} elements? Your score will be calculated based on what you've completed.`)) {
    return;
  }
  
  completeChallenge();
}

// ===== IN-GAME MODE TOGGLE =====

function initInGameModeToggle() {
  // Desktop mode toggle in bottom bar
  const desktopClassic = document.getElementById('desktopModeClassic');
  const desktopRecall = document.getElementById('desktopModeRecall');
  // Mobile mode toggle in mobile input modal
  const mobileClassic = document.getElementById('mobileModeClassic');
  const mobileRecall = document.getElementById('mobileModeRecall');
  
  const allBtns = [desktopClassic, desktopRecall, mobileClassic, mobileRecall].filter(Boolean);
  
  function setMode(mode) {
    state.gameMode = mode;
    safeSetItem('gameMode', mode);
    // Sync all toggle buttons
    [desktopClassic, mobileClassic].forEach(btn => {
      if (btn) btn.classList.toggle('active', mode === 'classic');
    });
    [desktopRecall, mobileRecall].forEach(btn => {
      if (btn) btn.classList.toggle('active', mode === 'recall');
    });
    updateFinishButtonForMode();
  }
  
  // Set initial state
  if (state.gameMode === 'recall') {
    setMode('recall');
  }
  
  // Click handlers
  if (desktopClassic) desktopClassic.addEventListener('click', () => setMode('classic'));
  if (desktopRecall) desktopRecall.addEventListener('click', () => setMode('recall'));
  if (mobileClassic) mobileClassic.addEventListener('click', () => setMode('classic'));
  if (mobileRecall) mobileRecall.addEventListener('click', () => setMode('recall'));
}

function updateFinishButtonForMode() {
  if (state.gameMode === 'recall') {
    finishBtn.querySelector('i').className = 'ri-check-double-line';
    finishBtn.querySelector('span').textContent = 'Check Answers';
    const mobileFinish = document.getElementById('mobileFinishBtn');
    if (mobileFinish) {
      mobileFinish.innerHTML = '<i class="ri-check-double-line"></i> Check Answers';
    }
  } else {
    finishBtn.querySelector('i').className = 'ri-flag-line';
    finishBtn.querySelector('span').textContent = 'Finish';
    const mobileFinish = document.getElementById('mobileFinishBtn');
    if (mobileFinish) {
      mobileFinish.innerHTML = '<i class="ri-flag-line"></i> Finish Game';
    }
  }
}

// ===== RECALL MODE: CHECK ALL ANSWERS =====

function checkAllAnswers() {
  const pendingEntries = Object.entries(state.pendingAnswers);
  
  pendingEntries.forEach(([atomicStr, userInput]) => {
    const atomic = parseInt(atomicStr);
    const el = document.querySelector(`.element[data-atomic="${atomic}"]`);
    if (!el) return;
    
    const correctSymbol = el.dataset.symbol;
    const isCorrect = userInput.toLowerCase() === correctSymbol.toLowerCase();
    
    state.totalAttempts++;
    el.classList.remove('pending');
    
    if (isCorrect) {
      state.correctAttempts++;
      state.correctElements.add(atomic);
      el.classList.add('correct');
      
      const symbolSpan = el.querySelector('.element-symbol');
      const nameSpan = el.querySelector('.element-name');
      if (symbolSpan) symbolSpan.textContent = correctSymbol;
      if (nameSpan) nameSpan.textContent = el.dataset.name;
      
      const attemptCount = 1;
      scoringSystem.addCorrectAnswer(atomic, attemptCount, 0);
      
      state.streak++;
      if (state.streak > state.maxStreak) {
        state.maxStreak = state.streak;
      }
      
      // Update mini table for mobile
      updateMiniTable(atomic, 'correct');
    } else {
      el.classList.add('incorrect');
      
      // Show what user typed vs correct
      const symbolSpan = el.querySelector('.element-symbol');
      if (symbolSpan) symbolSpan.textContent = correctSymbol;
      const nameSpan = el.querySelector('.element-name');
      if (nameSpan) nameSpan.textContent = el.dataset.name;
      
      if (!state.wrongAttempts[atomic]) state.wrongAttempts[atomic] = 0;
      state.wrongAttempts[atomic]++;
      
      scoringSystem.addMistake(atomic, 1);
      state.streak = 0;
      
      updateMiniTable(atomic, 'incorrect');
    }
  });
  
  state.pendingAnswers = {};
  updateStats();
  
  // Close mobile input modal if open
  if (!mobileInputModal.classList.contains('hidden')) {
    closeMobileInput();
  }
  
  completeChallenge();
}

// ===== GUIDE SYSTEM (SVG connector line + message) =====

function showGuide(targetEl, text, storageKey) {
  const overlay = document.getElementById('guideOverlay');
  const svg = document.getElementById('guideSvg');
  const path = document.getElementById('guidePath');
  const messageEl = document.getElementById('guideMessage');
  const textEl = document.getElementById('guideText');
  const dismissBtn = document.getElementById('guideDismissBtn');
  if (!overlay || !svg || !path || !messageEl || !textEl || !dismissBtn) return;
  
  textEl.textContent = text;
  overlay.classList.remove('hidden');
  
  // Position the message near center of viewport
  const viewW = window.innerWidth;
  const viewH = window.innerHeight;
  const msgW = Math.min(280, viewW - 40);
  const msgX = (viewW - msgW) / 2;
  const msgY = viewH * 0.55;
  
  messageEl.style.left = msgX + 'px';
  messageEl.style.top = msgY + 'px';
  messageEl.style.maxWidth = msgW + 'px';
  
  // Wait for layout, then draw connector using actual rendered positions
  requestAnimationFrame(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Set viewBox to match the viewport so SVG coordinates map 1:1
    svg.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
    
    if (targetEl) {
      const targetRect = targetEl.getBoundingClientRect();
      const msgRect = messageEl.getBoundingClientRect();
      const x1 = targetRect.left + targetRect.width / 2;
      const y1 = targetRect.bottom + 4;
      const x2 = msgRect.left + msgRect.width / 2;
      // Use the CSS-set top position (not animated) for accurate endpoint
      const y2 = parseFloat(messageEl.style.top) || msgRect.top;
      
      const midY = (y1 + y2) / 2;
      path.setAttribute('d', `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`);
    } else {
      path.setAttribute('d', '');
    }
  });
  
  // Dismiss handler
  function dismiss() {
    overlay.classList.add('hidden');
    if (storageKey) safeSetItem(storageKey, 'true');
    dismissBtn.removeEventListener('click', dismiss);
  }
  dismissBtn.addEventListener('click', dismiss);
}

function dismissGuide() {
  const overlay = document.getElementById('guideOverlay');
  if (overlay && !overlay.classList.contains('hidden')) {
    overlay.classList.add('hidden');
    safeSetItem('guideDismissed', 'true');
  }
}

function showDesktopGuide(element) {
  showGuide(element, 'Type the symbol (e.g. "H") and press Enter to submit.', 'guideDismissed');
}

function showMobileGuide() {
  const inputCard = document.querySelector('.gc-info-card');
  showGuide(inputCard, 'Type the symbol using the keyboard below, then tap Enter ✓ to submit.', 'guideDismissed');
}

function showLeaderboardGuide() {
  if (safeGetItem('leaderboardGuideShown')) return;
  const btn = document.getElementById('leaderboardBtn');
  if (!btn) return;
  showGuide(btn, 'You can view your top scores and track your progress here!', 'leaderboardGuideShown');
}

function showRecallModeGuide() {
  if (safeGetItem('recallModeGuideShown')) return;
  // Point at the desktop or mobile mode toggle
  const toggle = state.isMobile
    ? document.getElementById('mobileModeRecall')
    : document.getElementById('desktopModeRecall');
  if (!toggle) return;
  showGuide(toggle, 'Try Recall Mode — enter all elements from memory, then check your answers at once!', 'recallModeGuideShown');
}

// ===== CONFETTI ANIMATION =====

const CONFETTI_PARTICLE_COUNT = 120;
const CONFETTI_MAX_FRAMES = 180;

function launchConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';
  
  const colors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#8b5cf6'];
  const particles = [];
  
  for (let i = 0; i < CONFETTI_PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * -1,
      w: Math.random() * 8 + 4,
      h: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.2,
      opacity: 1
    });
  }
  
  let frame = 0;
  
  function animate() {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let alive = false;
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.rot += p.vr;
      if (frame > CONFETTI_MAX_FRAMES * 0.6) {
        p.opacity -= 0.02;
      }
      if (p.opacity <= 0 || p.y > canvas.height + 20) return;
      alive = true;
      
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    
    if (alive && frame < CONFETTI_MAX_FRAMES) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'none';
    }
  }
  
  requestAnimationFrame(animate);
}