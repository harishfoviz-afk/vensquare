document.addEventListener('DOMContentLoaded', () => {

  /* --- STICKY HEADER --- */
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('navbar-scrolled');
    } else {
      header.classList.remove('navbar-scrolled');
    }
  });

  /* --- MOBILE NAV TOGGLE --- */
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      navMenu.classList.toggle('mobile-active');
    });

    // Close menu when clicking a link
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        navMenu.classList.remove('mobile-active');
      });
    });
  }

  /* --- SPOTLIGHT CARD EFFECT (MOUSE TRACKING) --- */
  const cards = document.querySelectorAll('.bento-card, .mv-card, .contact-card, .proud-interactive');
  
  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  /* --- SCROLL REVEAL EFFECTS (INTERSECTION OBSERVER) --- */
  const revealElements = document.querySelectorAll('.reveal');
  
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Unobserve once revealed to keep page performance high
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(element => {
    revealObserver.observe(element);
  });

  /* --- INTERACTIVE HARDWARE SANDBOX (PROUD FACTOR) --- */
  const modules = document.querySelectorAll('.visualizer-module');
  const statusDot = document.getElementById('statusDot');
  const statusLabel = document.getElementById('statusLabel');
  const assemblyBtn = document.getElementById('assemblyBtn');
  
  let modulesConnected = {
    core: false,
    sensor: false,
    comm: false,
    power: false
  };

  const moduleGridCoords = {
    core: { x: -45, y: 0 },
    sensor: { x: 0, y: -45 },
    comm: { x: 45, y: 0 },
    power: { x: 0, y: 45 }
  };

  const initialCoords = {
    core: { x: -100, y: 0 },
    sensor: { x: 0, y: -80 },
    comm: { x: 100, y: 0 },
    power: { x: 0, y: 80 }
  };

  function updateSystemStatus() {
    const allConnected = Object.values(modulesConnected).every(val => val === true);
    
    if (allConnected) {
      statusDot.style.backgroundColor = '#007AFF';
      statusDot.style.boxShadow = '0 0 12px #007AFF';
      statusLabel.textContent = 'SYSTEM OPERATIONAL (AUDITED)';
      statusLabel.style.color = '#ffffff';
      assemblyBtn.textContent = 'DISASSEMBLE SYSTEM';
    } else {
      const connectedCount = Object.values(modulesConnected).filter(Boolean).length;
      if (connectedCount > 0) {
        statusDot.style.backgroundColor = '#ff9500';
        statusDot.style.boxShadow = '0 0 10px #ff9500';
        statusLabel.textContent = `CONFIGURING: ${connectedCount}/4 MODULES DOCKED`;
        statusLabel.style.color = '#ff9500';
      } else {
        statusDot.style.backgroundColor = '#8e8e93';
        statusDot.style.boxShadow = 'none';
        statusLabel.textContent = 'MODULES DISCONNECTED (STANDBY)';
        statusLabel.style.color = '#8e8e93';
      }
      assemblyBtn.textContent = 'AUTO-ASSEMBLE PROTO';
    }
  }

  function toggleModuleConnection(moduleElement, type) {
    const isConnected = modulesConnected[type];
    
    if (isConnected) {
      // Disconnect
      modulesConnected[type] = false;
      moduleElement.classList.remove('active');
      const orig = initialCoords[type];
      moduleElement.style.transform = `translate(${orig.x}px, ${orig.y}px)`;
    } else {
      // Connect
      modulesConnected[type] = true;
      moduleElement.classList.add('active');
      const target = moduleGridCoords[type];
      moduleElement.style.transform = `translate(${target.x}px, ${target.y}px)`;
    }
    updateSystemStatus();
  }

  modules.forEach(mod => {
    const type = mod.dataset.module;
    
    // Clicking toggles snap connection
    mod.addEventListener('click', () => {
      toggleModuleConnection(mod, type);
    });
  });

  if (assemblyBtn) {
    assemblyBtn.addEventListener('click', () => {
      const allConnected = Object.values(modulesConnected).every(val => val === true);
      
      modules.forEach(mod => {
        const type = mod.dataset.module;
        if (allConnected) {
          // If all connected, disassemble everything
          if (modulesConnected[type]) {
            toggleModuleConnection(mod, type);
          }
        } else {
          // Connect all disconnected ones
          if (!modulesConnected[type]) {
            toggleModuleConnection(mod, type);
          }
        }
      });
    });
  }

  // Set initial coordinates via CSS transform
  modules.forEach(mod => {
    const type = mod.dataset.module;
    const orig = initialCoords[type];
    mod.style.transform = `translate(${orig.x}px, ${orig.y}px)`;
  });

  updateSystemStatus();

  /* --- FORM SUBMISSION MICRO-FEEDBACK --- */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = contactForm.querySelector('input[type="email"]');
      const button = contactForm.querySelector('button');
      
      if (emailInput.value) {
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'TRANSMITTING...';
        button.style.background = '#2c2c2e';
        button.style.borderColor = '#2c2c2e';
        button.style.boxShadow = 'none';

        setTimeout(() => {
          button.textContent = 'SECURELY SENT';
          button.style.background = '#34c759';
          button.style.borderColor = '#34c759';
          emailInput.value = '';
          
          setTimeout(() => {
            button.disabled = false;
            button.textContent = originalText;
            button.style.background = '';
            button.style.borderColor = '';
            button.style.boxShadow = '';
          }, 3000);
        }, 1500);
      }
    });
  }

});
