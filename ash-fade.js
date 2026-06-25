/* ============================================
   TM_UI/UX — Ash Fade Engine
   Embers cooling to ash. Used on the "leave site" exit screen.
   ============================================ */

function createAshFade(canvas) {
  const ctx = canvas.getContext('2d');
  let w, h;

  function isLight() {
    return document.documentElement.getAttribute('data-theme') === 'light';
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    w = canvas.width = rect.width;
    h = canvas.height = rect.height;
  }
  resize();
  window.addEventListener('resize', resize);

  const particles = [];
  const count = 110;
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * 1000,
      y: Math.random() * -400,
      vy: 0.15 + Math.random() * 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      size: 0.6 + Math.random() * 2.6,
      heat: Math.random(),
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.01 + Math.random() * 0.02
    });
  }

  let t = 0;
  let coolProgress = 0;
  let rafId = null;
  let stopped = false;

  function colorForHeat(heat, cool) {
    const warmth = heat * (1 - cool);
    if (isLight()) {
      // Light mode: warm embers read as deep ember-ink, cooling toward soft grey ash
      const r = 200 - warmth * 60;
      const g = 150 - warmth * 90;
      const b = 130 - warmth * 100;
      return [r, g, b];
    }
    const r = 90 + warmth * 130;
    const g = 80 + warmth * 70;
    const b = 78 + warmth * 30;
    return [r, g, b];
  }

  function frame() {
    if (stopped) return;
    t++;
    coolProgress = Math.min(1, t / 420);

    if (isLight()) {
      // Light mode: starts warm parchment, cools toward a soft ash-grey
      const from = [245, 237, 225];
      const to = [214, 210, 203];
      const r = from[0] + (to[0] - from[0]) * coolProgress;
      const g = from[1] + (to[1] - from[1]) * coolProgress;
      const b = from[2] + (to[2] - from[2]) * coolProgress;
      ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
    } else {
      const bgVal = 10 - coolProgress * 4;
      ctx.fillStyle = `rgb(${bgVal},${bgVal * 0.8},${bgVal * 0.7})`;
    }
    ctx.fillRect(0, 0, w, h);

    particles.forEach(p => {
      p.y += p.vy * (1 - coolProgress * 0.5);
      p.sway += p.swaySpeed;
      const x = (p.x / 1000) * w + Math.sin(p.sway) * 12;
      const y = p.y;

      if (p.y > h + 10) {
        p.y = -20;
        p.x = Math.random() * 1000;
      }

      const [r, g, b] = colorForHeat(p.heat, coolProgress);
      const alpha = isLight()
        ? 0.4 + p.heat * 0.35 * (1 - coolProgress * 0.5)
        : 0.5 + p.heat * 0.3 * (1 - coolProgress * 0.6);
      ctx.beginPath();
      ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${alpha})`;
      ctx.shadowColor = `rgba(${r | 0},${g | 0},${b | 0},0.6)`;
      ctx.shadowBlur = 4;
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    rafId = requestAnimationFrame(frame);
  }

  frame();

  return {
    stop() { stopped = true; if (rafId) cancelAnimationFrame(rafId); window.removeEventListener('resize', resize); }
  };
}
