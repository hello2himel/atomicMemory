// Animated Periodic Table for Intro
(function() {
  const container = document.getElementById('introPeriodicTable');
  if (!container) return;

  const RANDOM_COLORS = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#eab308'];

  const CATEGORY_COLORS = {
    'alkali metal': '#ef4444',
    'alkaline earth metal': '#f97316',
    'transition metal': '#3b82f6',
    'post-transition metal': '#06b6d4',
    'metalloid': '#8b5cf6',
    'nonmetal': '#10b981',
    'halogen': '#eab308',
    'noble gas': '#ec4899',
    'lanthanide': '#f59e0b',
    'actinide': '#84cc16'
  };

  // Build layout (same as getMiniTableLayout in script.js)
  function getLayout() {
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

  // Build element map
  const elemMap = {};
  if (typeof ELEMENTS !== 'undefined') {
    ELEMENTS.forEach(function(el) { elemMap[el.atomicNumber] = el; });
  }

  // Create cells
  const layout = getLayout();
  const cells = [];

  layout.forEach(function(item) {
    if (item === 'spacer' || item === 'label' || item === 'placeholder') {
      const spacer = document.createElement('div');
      spacer.className = 'intro-table-spacer';
      container.appendChild(spacer);
    } else {
      const cell = document.createElement('div');
      cell.className = 'intro-table-cell';
      cell.dataset.atomic = item;
      var elData = elemMap[item];
      if (elData) {
        cell.dataset.category = elData.category;
      }
      cells.push(cell);
      container.appendChild(cell);
    }
  });

  // Animation state
  var animationId = null;
  var stopped = false;

  // Phase 1: Random color flashes on random cells
  // Phase 2: All cells settle to proper category colors
  function runCycle() {
    if (stopped) return;

    // Phase 1: Random flashes for ~3 seconds
    var flashTimers = [];
    var flashCount = 0;
    var maxFlashes = 40;

    function scheduleFlash() {
      if (stopped || flashCount >= maxFlashes) return;
      flashCount++;
      var delay = Math.random() * 75;
      var timer = setTimeout(function() {
        if (stopped) return;
        // Pick a random cell
        var cell = cells[Math.floor(Math.random() * cells.length)];
        var color = RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)];
        cell.style.background = color;
        cell.style.borderColor = color;
        scheduleFlash();
      }, delay);
      flashTimers.push(timer);
    }

    // Start several flash chains in parallel
    for (var i = 0; i < 6; i++) {
      scheduleFlash();
    }

    // Phase 2: After random phase, settle to proper colors
    var settleTimer = setTimeout(function() {
      if (stopped) return;
      // Clear any remaining flash timers
      flashTimers.forEach(function(t) { clearTimeout(t); });

      // Settle cells to proper colors with staggered timing
      cells.forEach(function(cell, index) {
        var delay = index * 8;
        setTimeout(function() {
          if (stopped) return;
          var elData = elemMap[cell.dataset.atomic];
          if (elData) {
            var properColor = CATEGORY_COLORS[elData.category] || '#334155';
            cell.style.background = properColor;
            cell.style.borderColor = properColor;
          }
        }, delay);
      });

      // Hold proper colors for 2 seconds, then reset and cycle
      var holdTimer = setTimeout(function() {
        if (stopped) return;
        // Reset all cells to dim
        cells.forEach(function(cell) {
          cell.style.background = '#334155';
          cell.style.borderColor = '#475569';
        });
        // Start next cycle after brief pause
        var nextTimer = setTimeout(function() {
          runCycle();
        }, 500);
        flashTimers.push(nextTimer);
      }, 2500);
      flashTimers.push(holdTimer);
    }, 3000);
    flashTimers.push(settleTimer);
  }

  // Start animation
  runCycle();

  // Cleanup on start
  document.getElementById('startBtn').addEventListener('click', function() {
    stopped = true;
    setTimeout(function() {
      container.innerHTML = '';
    }, 600);
  });
})();