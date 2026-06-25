/* ============================================
   TM_UI/UX — Parallax Ember Field
   Multi-depth background that drifts at different
   rates as the page scrolls. Shared across every page.
   ============================================ */

function createParallaxField(canvas) {
  const ctx = canvas.getContext('2d');
  let w, h, docHeight;

  function isLight() {
    return document.documentElement.getAttribute('data-theme') === 'light';
  }

  function bgColor() {
    return isLight() ? '#f5ede1' : '#0a0503';
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    docHeight = Math.max(document.documentElement.scrollHeight, window.innerHeight);
  }

  function colorAt(t) {
    const darkStops = [
      { p: 0, c: [255, 244, 224] },
      { p: 0.25, c: [232, 192, 116] },
      { p: 0.55, c: [224, 140, 60] },
      { p: 1, c: [180, 70, 45] }
    ];
    const lightStops = [
      { p: 0, c: [184, 134, 47] },
      { p: 0.25, c: [196, 106, 31] },
      { p: 0.55, c: [184, 84, 32] },
      { p: 1, c: [110, 32, 23] }
    ];
    const stops = isLight() ? lightStops : darkStops;
    for (let i = 0; i < stops.length - 1; i++) {
      if (t >= stops[i].p && t <= stops[i + 1].p) {
        const lt = (t - stops[i].p) / (stops[i + 1].p - stops[i].p);
        const c0 = stops[i].c, c1 = stops[i + 1].c;
        return [
          c0[0] + (c1[0] - c0[0]) * lt,
          c0[1] + (c1[1] - c0[1]) * lt,
          c0[2] + (c1[2] - c0[2]) * lt
        ];
      }
    }
    return stops[stops.length - 1].c;
  }

  // Three depth layers: far (slow, small, dim), mid, near (faster, bigger, brighter)
  const layers = [
    { speed: 0.05, count: 40, sizeMin: 0.6, sizeMax: 1.6, alpha: 0.25, blurMul: 2 },
    { speed: 0.12, count: 28, sizeMin: 1.0, sizeMax: 2.4, alpha: 0.35, blurMul: 3 },
    { speed: 0.22, count: 16, sizeMin: 1.4, sizeMax: 3.2, alpha: 0.45, blurMul: 4 }
  ];

  let particles = [];
  function seedParticles() {
    particles = [];
    layers.forEach((layer, li) => {
      for (let i = 0; i < layer.count; i++) {
        particles.push({
          layer: li,
          x: Math.random() * w,
          yBase: Math.random() * docHeight,
          size: layer.sizeMin + Math.random() * (layer.sizeMax - layer.sizeMin),
          t: Math.random(),
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 0.002 + Math.random() * 0.004,
          twinkle: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.01 + Math.random() * 0.02
        });
      }
    });
  }

  resize();
  seedParticles();

  // ---- Comet layer: smaller, more frequent streaks ----
  const comets = [];
  function spawnComet() {
    const angle = (Math.PI * 0.18) + (Math.random() - 0.5) * 0.25;
    const speed = 0.9 + Math.random() * 1.3;
    return {
      x: Math.random() * w * 1.3 - w * 0.15,
      y: -50 - Math.random() * 200,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      len: 60 + Math.random() * 90,
      headSize: 1.8 + Math.random() * 2.4,
      t: Math.random(),
      depth: 0.4 + Math.random() * 0.6,
      flickerPhase: Math.random() * Math.PI * 2
    };
  }
  for (let i = 0; i < 7; i++) {
    const c = spawnComet();
    c.y = Math.random() * h;
    comets.push(c);
  }
  let cometSpawnTimer = 0;

  window.addEventListener('resize', () => {
    resize();
    seedParticles();
  });

  let scrollY = window.scrollY || window.pageYOffset || 0;
  let scrollVelocity = 0;
  window.addEventListener('scroll', () => {
    const newScrollY = window.scrollY || window.pageYOffset || 0;
    scrollVelocity = newScrollY - scrollY;
    scrollY = newScrollY;
  }, { passive: true });

  let frameCount = 0;
  let rafId = null;
  let stopped = false;

  function frame() {
    if (stopped) return;
    frameCount++;

    ctx.fillStyle = bgColor();
    ctx.fillRect(0, 0, w, h);

    particles.forEach(p => {
      const layer = layers[p.layer];
      p.sway += p.swaySpeed;
      p.twinkle += p.twinkleSpeed;

      // Parallax offset: layer moves slower than actual scroll
      const parallaxOffset = scrollY * layer.speed;
      let y = (p.yBase - parallaxOffset) % docHeight;
      if (y < 0) y += docHeight;
      // Wrap into the current viewport-relative space
      y = y % h;

      const x = p.x + Math.sin(p.sway) * 10;
      const c = colorAt(p.t);
      const alpha = layer.alpha * (0.6 + 0.4 * Math.sin(p.twinkle));

      ctx.beginPath();
      ctx.fillStyle = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${alpha})`;
      ctx.shadowColor = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},0.6)`;
      ctx.shadowBlur = p.size * layer.blurMul;
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // ---- Comets: smaller, more frequent streaking light ----
    cometSpawnTimer++;
    if (cometSpawnTimer > 35 && comets.length < 10) {
      comets.push(spawnComet());
      cometSpawnTimer = 0;
    }

    const scrollBoost = 1 + Math.min(Math.abs(scrollVelocity) * 0.05, 3);

    for (let i = comets.length - 1; i >= 0; i--) {
      const c = comets[i];
      c.x += c.vx * c.depth * scrollBoost;
      c.y += c.vy * c.depth * scrollBoost;

      if (c.y > h + c.len || c.x > w + c.len) {
        comets.splice(i, 1);
        continue;
      }

      const dirLen = Math.hypot(c.vx, c.vy);
      const dirX = c.vx / dirLen;
      const dirY = c.vy / dirLen;
      const tailX = c.x - dirX * c.len * c.depth;
      const tailY = c.y - dirY * c.len * c.depth;
      const col = colorAt(c.t);
      const light = isLight();
      const headRgb = light ? '90,30,20' : '255,250,235';
      const glowRgb = light ? '140,60,30' : '255,200,120';

      const grad = ctx.createLinearGradient(c.x, c.y, tailX, tailY);
      grad.addColorStop(0, `rgba(${headRgb},${0.95 * c.depth})`);
      grad.addColorStop(0.25, `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${0.75 * c.depth})`);
      grad.addColorStop(1, `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},0)`);

      ctx.strokeStyle = grad;
      ctx.lineWidth = c.headSize * c.depth * 1.4;
      ctx.lineCap = 'round';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();

      // bright head
      ctx.beginPath();
      ctx.fillStyle = `rgba(${headRgb},${0.95 * c.depth})`;
      ctx.shadowColor = `rgba(${glowRgb},0.9)`;
      ctx.shadowBlur = c.headSize * 5 * c.depth;
      ctx.arc(c.x, c.y, c.headSize * c.depth, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    scrollVelocity *= 0.9;

    rafId = requestAnimationFrame(frame);
  }

  frame();

  return {
    stop() {
      stopped = true;
      if (rafId) cancelAnimationFrame(rafId);
    },
    refresh() {
      resize();
      seedParticles();
    }
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const existing = document.getElementById('parallaxCanvas');
  if (existing) {
    createParallaxField(existing);
  }
});
