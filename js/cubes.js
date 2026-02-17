// Animated Periodic Table for Intro
(function() {
  const container = document.getElementById('introPeriodicTable');
  if (!container) return;

  const FLASH_COLORS = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#eab308'];

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
      const elData = elemMap[item];
      if (elData) {
        cell.dataset.category = elData.category;
      }
      cells.push(cell);
      container.appendChild(cell);
    }
  });

  // Animation state — persistent timer list for proper cleanup
  let stopped = false;
  const activeTimers = [];

  function addTimer(fn, delay) {
    const id = setTimeout(function() {
      const idx = activeTimers.indexOf(id);
      if (idx > -1) activeTimers.splice(idx, 1);
      fn();
    }, delay);
    activeTimers.push(id);
    return id;
  }

  function clearAllTimers() {
    activeTimers.forEach(function(t) { clearTimeout(t); });
    activeTimers.length = 0;
  }

  // Phase 1: Random color flashes on random cells
  // Phase 2: All cells settle to proper category colors
  function runCycle() {
    if (stopped) return;

    // Phase 1: Random flashes for ~3 seconds
    let flashCount = 0;
    const maxFlashes = 40;

    function scheduleFlash() {
      if (stopped || flashCount >= maxFlashes) return;
      flashCount++;
      const delay = Math.random() * 75;
      addTimer(function() {
        if (stopped) return;
        const cell = cells[Math.floor(Math.random() * cells.length)];
        const color = FLASH_COLORS[Math.floor(Math.random() * FLASH_COLORS.length)];
        cell.style.background = color;
        cell.style.borderColor = color;
        scheduleFlash();
      }, delay);
    }

    // Start several flash chains in parallel
    for (let i = 0; i < 6; i++) {
      scheduleFlash();
    }

    // Phase 2: After random phase, settle to proper colors
    addTimer(function() {
      if (stopped) return;

      // Settle cells to proper colors with staggered timing
      cells.forEach(function(cell, index) {
        const delay = index * 8;
        addTimer(function() {
          if (stopped) return;
          const elData = elemMap[cell.dataset.atomic];
          if (elData) {
            const properColor = CATEGORY_COLORS[elData.category] || '#334155';
            cell.style.background = properColor;
            cell.style.borderColor = properColor;
          }
        }, delay);
      });

      // Hold proper colors for 2 seconds, then reset and cycle
      addTimer(function() {
        if (stopped) return;
        // Reset all cells to dim
        cells.forEach(function(cell) {
          cell.style.background = '#334155';
          cell.style.borderColor = '#475569';
        });
        // Start next cycle after brief pause
        addTimer(function() {
          runCycle();
        }, 500);
      }, 2500);
    }, 3000);
  }

  // Start animation only on desktop (mobile has its own intro)
  var MOBILE_BREAKPOINT = 768;
  if (window.innerWidth > MOBILE_BREAKPOINT) {
    runCycle();
  }

  // Cleanup on start
  document.getElementById('startBtn').addEventListener('click', function() {
    stopped = true;
    clearAllTimers();
    setTimeout(function() {
      container.innerHTML = '';
    }, 600);
  });
})();

// Logo Grid Animation (nav header mini periodic table)
(function() {
  var LOGO_COLORS = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#eab308', '#f97316', '#84cc16'];

  // Original colors for each cell (matches HTML inline styles)
  var ORIGINAL_COLORS = [
    '#ef4444', null, null, null, '#ec4899',
    '#f97316', null, '#10b981', '#3b82f6', '#8b5cf6',
    '#06b6d4', '#eab308', '#ec4899', '#f59e0b', '#84cc16',
    null, '#3b82f6', '#ef4444', '#f97316', null
  ];

  var logoGrid = document.querySelector('.logo-grid');
  if (!logoGrid) return;

  var cells = logoGrid.querySelectorAll('.lg-cell');
  if (!cells.length) return;

  var animId = null;

  function runLogoAnimation() {
    // Phase 1: Random flashes
    var flashCount = 0;
    var maxFlashes = 15;

    function scheduleFlash() {
      if (flashCount >= maxFlashes) {
        // Phase 2: Settle back to original colors
        animId = setTimeout(function() {
          var allSpans = logoGrid.querySelectorAll('.lg-cell, .lg-empty');
          var cellIdx = 0;
          allSpans.forEach(function(span, i) {
            if (span.classList.contains('lg-cell')) {
              // Find this cell's index among lg-cell elements
              var origColor = null;
              var ci = 0;
              var allChildren = logoGrid.children;
              for (var j = 0; j < allChildren.length; j++) {
                if (allChildren[j] === span) {
                  origColor = ORIGINAL_COLORS[j];
                  break;
                }
              }
              if (origColor) {
                span.style.background = origColor;
              }
            }
          });
          // Wait then restart cycle
          animId = setTimeout(runLogoAnimation, 2000);
        }, 200);
        return;
      }
      flashCount++;
      animId = setTimeout(function() {
        var cell = cells[Math.floor(Math.random() * cells.length)];
        var color = LOGO_COLORS[Math.floor(Math.random() * LOGO_COLORS.length)];
        cell.style.background = color;
        scheduleFlash();
      }, Math.random() * 150 + 50);
    }

    scheduleFlash();
  }

  // Start after a brief delay (after intro transition)
  var started = false;
  document.getElementById('startBtn').addEventListener('click', function() {
    if (started) return;
    started = true;
    setTimeout(runLogoAnimation, 800);
  });
})();