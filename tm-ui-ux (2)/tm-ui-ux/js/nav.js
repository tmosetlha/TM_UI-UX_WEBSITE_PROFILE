/* ============================================
   TM_UI/UX — Shared navigation behavior
   Flame menu toggle + leave-site transition + theme toggle
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const flameToggle = document.querySelector('.flame-toggle');
  const overlay = document.querySelector('.nav-overlay');
  const overlayClose = document.querySelector('.nav-overlay-close');
  const leaveBtn = document.querySelector('.leave-site');
  const themeToggle = document.querySelector('.theme-toggle');
  const navList = document.querySelector('.nav-links');

  // Mark current page link as active
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) link.classList.add('active');
  });

  // ---- Swipe carousel: one nav link visible at a time ----
  if (navList) {
    const items = Array.from(navList.querySelectorAll('li'));
    let index = 0;

    // Wrap the list with left/right arrow buttons
    const track = document.createElement('div');
    track.className = 'nav-track';
    const prevArrow = document.createElement('button');
    prevArrow.className = 'nav-arrow nav-arrow-prev';
    prevArrow.setAttribute('aria-label', 'Previous page');
    prevArrow.innerHTML = '&#10094;';
    const nextArrow = document.createElement('button');
    nextArrow.className = 'nav-arrow nav-arrow-next';
    nextArrow.setAttribute('aria-label', 'Next page');
    nextArrow.innerHTML = '&#10095;';

    navList.insertAdjacentElement('beforebegin', track);
    track.appendChild(prevArrow);
    track.appendChild(navList);
    track.appendChild(nextArrow);

    // Build dots indicator once
    const dotsWrap = document.createElement('div');
    dotsWrap.className = 'nav-dots';
    items.forEach((_, i) => {
      const dot = document.createElement('span');
      if (i === 0) dot.classList.add('dot-active');
      dotsWrap.appendChild(dot);
    });
    track.insertAdjacentElement('afterend', dotsWrap);

    const hint = document.createElement('div');
    hint.className = 'nav-hint';
    hint.textContent = 'Swipe, scroll, or use the arrows';
    dotsWrap.insertAdjacentElement('afterend', hint);

    function render(direction) {
      items.forEach((li, i) => {
        li.classList.remove('nav-current', 'nav-leaving-next', 'nav-leaving-prev');
        if (i === index) {
          li.classList.add('nav-current');
        } else if (direction === 1 && i === (index - 1 + items.length) % items.length) {
          li.classList.add('nav-leaving-next');
        } else if (direction === -1 && i === (index + 1) % items.length) {
          li.classList.add('nav-leaving-prev');
        }
      });
      Array.from(dotsWrap.children).forEach((dot, i) => {
        dot.classList.toggle('dot-active', i === index);
      });
    }

    function goTo(newIndex, direction) {
      index = (newIndex + items.length) % items.length;
      render(direction);
    }

    function next() { goTo(index + 1, 1); }
    function prev() { goTo(index - 1, -1); }

    // Reset to Home (index 0) every time the menu opens
    function resetToHome() {
      index = 0;
      items.forEach((li, i) => {
        li.classList.remove('nav-current', 'nav-leaving-next', 'nav-leaving-prev');
        if (i === 0) li.classList.add('nav-current');
      });
      Array.from(dotsWrap.children).forEach((dot, i) => {
        dot.classList.toggle('dot-active', i === 0);
      });
    }
    resetToHome();

    prevArrow.addEventListener('click', prev);
    nextArrow.addEventListener('click', next);

    let startX = null;
    overlay.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });
    overlay.addEventListener('touchend', (e) => {
      if (startX === null) return;
      const diff = e.changedTouches[0].clientX - startX;
      if (Math.abs(diff) > 40) {
        if (diff < 0) next(); else prev();
      }
      startX = null;
    });

    let mouseStartX = null;
    overlay.addEventListener('mousedown', (e) => {
      if (e.target.closest('.nav-arrow') || e.target.closest('a')) return;
      mouseStartX = e.clientX;
    });
    overlay.addEventListener('mouseup', (e) => {
      if (mouseStartX === null) return;
      const diff = e.clientX - mouseStartX;
      if (Math.abs(diff) > 40) {
        if (diff < 0) next(); else prev();
      }
      mouseStartX = null;
    });

    // Trackpad horizontal scroll / wheel support, with a short cooldown
    // so one physical swipe gesture doesn't fire multiple page changes.
    let wheelCooldown = false;
    overlay.addEventListener('wheel', (e) => {
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (!horizontal) return;
      if (Math.abs(e.deltaX) < 12) return;
      e.preventDefault();
      if (wheelCooldown) return;
      wheelCooldown = true;
      if (e.deltaX > 0) next(); else prev();
      setTimeout(() => { wheelCooldown = false; }, 450);
    }, { passive: false });

    document.addEventListener('keydown', (e) => {
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    });

    if (flameToggle && overlay) {
      flameToggle.addEventListener('click', () => {
        resetToHome();
        overlay.classList.add('open');
      });
    }
  } else if (flameToggle && overlay) {
    flameToggle.addEventListener('click', () => {
      overlay.classList.add('open');
    });
  }

  if (overlayClose && overlay) {
    overlayClose.addEventListener('click', () => {
      overlay.classList.remove('open');
    });
  }

  if (leaveBtn) {
    leaveBtn.addEventListener('click', () => {
      window.location.href = 'leaving.html';
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      document.documentElement.setAttribute('data-theme', isLight ? 'dark' : 'light');
      localStorage.setItem('tmui_theme', isLight ? 'dark' : 'light');
      themeToggle.textContent = isLight ? 'Light' : 'Dark';
    });
    const saved = localStorage.getItem('tmui_theme');
    themeToggle.textContent = saved === 'light' ? 'Dark' : 'Light';
  }
});

// Apply saved theme as early as possible, before first paint, to avoid a flash
(function () {
  const saved = localStorage.getItem('tmui_theme');
  if (saved === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
