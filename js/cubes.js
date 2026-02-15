// Floating 3D Cubes for Intro
(function() {
  const container = document.getElementById('floatingCubes');
  if (!container) return;

  // Select 40 random elements to display
  const selectedElements = [];
  const elementCount = 40;
  
  // Get a random selection of elements
  for (let i = 0; i < elementCount; i++) {
    const randomIndex = Math.floor(Math.random() * ELEMENTS.length);
    selectedElements.push(ELEMENTS[randomIndex]);
  }

  // Highlight a few elements in green
  const highlightIndices = new Set();
  for (let i = 0; i < 8; i++) {
    highlightIndices.add(Math.floor(Math.random() * elementCount));
  }

  // Create cubes
  selectedElements.forEach((element, index) => {
    const cube = document.createElement('div');
    cube.className = 'cube';
    if (highlightIndices.has(index)) {
      cube.classList.add('highlight');
    }

    // Random positioning
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    cube.style.left = `${x}%`;
    cube.style.top = `${y}%`;

    // Random cube size between 35-45px
    const size = 35 + Math.random() * 10;
    cube.style.width = `${size}px`;
    cube.style.height = `${size}px`;

    // Random animation duration (20-40 seconds for slow float)
    const duration = 20 + Math.random() * 20;
    cube.style.animationDuration = `${duration}s`;

    // Random drift values
    const driftX = (Math.random() - 0.5) * 100;
    const driftY = (Math.random() - 0.5) * 100;
    const rotateX = Math.random() * 360;
    const rotateY = Math.random() * 360;
    
    cube.style.setProperty('--drift-x', `${driftX}px`);
    cube.style.setProperty('--drift-y', `${driftY}px`);
    cube.style.setProperty('--rotate-x', `${rotateX}deg`);
    cube.style.setProperty('--rotate-y', `${rotateY}deg`);

    // Random animation delay
    cube.style.animationDelay = `${Math.random() * 5}s`;

    // Create 6 faces
    const faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
    faces.forEach(face => {
      const faceDiv = document.createElement('div');
      faceDiv.className = `cube-face ${face}`;
      faceDiv.style.width = `${size}px`;
      faceDiv.style.height = `${size}px`;
      
      // Only show symbol on front face
      if (face === 'front') {
        faceDiv.textContent = element.symbol;
      }
      
      cube.appendChild(faceDiv);
    });

    container.appendChild(cube);
  });

  // Parallax effect on mouse move
  let mouseX = 0;
  let mouseY = 0;
  
  document.addEventListener('mousemove', (e) => {
    if (!document.getElementById('introOverlay').classList.contains('fade-out')) {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 20;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 20;
    }
  });

  // Smooth parallax animation
  function animateParallax() {
    const cubes = container.querySelectorAll('.cube');
    cubes.forEach((cube, index) => {
      const speed = 0.5 + (index % 3) * 0.3; // Different speeds for depth
      const parallaxX = mouseX * speed;
      const parallaxY = mouseY * speed;
      
      cube.style.transform = `translate(${parallaxX}px, ${parallaxY}px)`;
    });
    
    if (!document.getElementById('introOverlay').classList.contains('fade-out')) {
      requestAnimationFrame(animateParallax);
    }
  }

  animateParallax();

  // Cleanup on start
  document.getElementById('startBtn').addEventListener('click', () => {
    setTimeout(() => {
      if (container) {
        container.innerHTML = '';
      }
    }, 600);
  });
})();