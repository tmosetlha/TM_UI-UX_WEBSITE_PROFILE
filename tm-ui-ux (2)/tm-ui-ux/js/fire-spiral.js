/* ============================================
   TM_UI/UX — Fire Spiral Engine
   Shared animation core for splash + ambient use
   ============================================ */

function createFireSpiral(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  let w, h;

  const config = {
    loops: opts.loops ?? 2.5,
    nameText: opts.nameText ?? 'TM_UI/UX',
    showName: opts.showName ?? true,
    autoCycle: opts.autoCycle ?? true,
    interactive: opts.interactive ?? true,
    nameSize: opts.nameSize ?? 46,
    centerYRatio: opts.centerYRatio ?? 0.46,
    idle: opts.idle ?? false,
    onCycleComplete: opts.onCycleComplete ?? null
  };

  function isLight() {
    return document.documentElement.getAttribute('data-theme') === 'light';
  }

  function bgColor() {
    return isLight() ? '#f5ede1' : '#0a0503';
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    w = canvas.width = rect.width;
    h = canvas.height = rect.height;
  }
  resize();
  window.addEventListener('resize', resize);

  // Guard against a zero-size measurement on first paint (some browsers
  // haven't finished layout yet when this script runs). Retry on the
  // next couple of frames until we get a real size.
  let sizeRetries = 0;
  function ensureSized() {
    if ((w === 0 || h === 0) && sizeRetries < 30) {
      sizeRetries++;
      resize();
      requestAnimationFrame(ensureSized);
    }
  }
  requestAnimationFrame(ensureSized);

  const mouse = { x: -1000, y: -1000 };
  if (config.interactive) {
    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    canvas.addEventListener('mouseleave', () => { mouse.x = -1000; mouse.y = -1000; });
  }

  const cx = () => w / 2;
  const cy = () => h * config.centerYRatio;
  const maxAngle = config.loops * Math.PI * 2;
  const baseMaxRadius = () => Math.min(w, h) * 0.36;
  const minRadius = () => 30;

  function colorAt(t) {
    const stops = [
      { p: 0, c: [232, 192, 116] },
      { p: 0.35, c: [224, 140, 60] },
      { p: 0.65, c: [214, 90, 40] },
      { p: 1, c: [160, 45, 35] }
    ];
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

  const travelers = [];
  for (let i = 0; i < 60; i++) {
    travelers.push({
      offset: Math.random() * maxAngle,
      speed: 0.006 + Math.random() * 0.01,
      jitterX: (Math.random() - 0.5) * 10,
      jitterY: (Math.random() - 0.5) * 10,
      radius: 0.8 + Math.random() * 2.2,
      blur: 1 + Math.random() * 3
    });
  }

  const flareParticles = [];
  function spawnFlare() {
    flareParticles.length = 0;
    for (let i = 0; i < 140; i++) {
      const ang = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 7;
      flareParticles.push({
        x: cx(), y: cy(),
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        life: 1,
        decay: 0.01 + Math.random() * 0.02,
        size: 1.5 + Math.random() * 3.5,
        colorT: Math.random()
      });
    }
  }

  let rot = 0;
  let cyclePhase = 0;
  let cycleT = 0;
  const LEN = { forward: 36, reverse: 36, compress: 18, flare: 18, hold: 8, fadein: 10 };
  let scale = 1;
  let flareAlpha = 0;
  let rotDir = 1;
  let hasFlared = false;
  let spiralAlpha = 1;
  let rafId = null;
  let stopped = false;

  function phaseLenFor(phase) {
    return [LEN.forward, LEN.reverse, LEN.compress, LEN.flare, LEN.hold, LEN.fadein][phase];
  }

  function step() {
    if (config.idle) {
      // Frozen resting frame: full spiral, no rotation, no flare cycle.
      scale = 1;
      spiralAlpha = 1;
      flareAlpha = 0;
      return;
    }

    cycleT++;
    const phaseLen = phaseLenFor(cyclePhase);

    if (cyclePhase === 0) { rotDir = 1; scale = 1; spiralAlpha = 1; }
    else if (cyclePhase === 1) { rotDir = -1; scale = 1; spiralAlpha = 1; }
    else if (cyclePhase === 2) {
      rotDir = -1;
      scale = 1 - 0.85 * (cycleT / phaseLen);
      spiralAlpha = Math.max(0, 1 - (cycleT / phaseLen) * 1.3);
    } else if (cyclePhase === 3) {
      if (!hasFlared) { spawnFlare(); hasFlared = true; }
      scale = 0.15;
      spiralAlpha = 0;
      flareAlpha = 1;
    } else if (cyclePhase === 4) {
      scale = 0.15;
      spiralAlpha = 0;
      flareAlpha = Math.max(0, 1 - cycleT / phaseLen);
    } else {
      scale = 0.15 + 0.85 * (cycleT / phaseLen);
      spiralAlpha = cycleT / phaseLen;
      flareAlpha = 0;
    }

    if (config.autoCycle) rot += 0.014 * rotDir;

    if (cycleT >= phaseLen) {
      cycleT = 0;
      cyclePhase = (cyclePhase + 1) % 6;
      if (cyclePhase === 0) {
        hasFlared = false;
        if (config.onCycleComplete) config.onCycleComplete();
      }
    }
  }

  function draw() {
    ctx.fillStyle = bgColor();
    ctx.fillRect(0, 0, w, h);

    const maxRadius = baseMaxRadius() * scale;

    const glowGrad = ctx.createRadialGradient(cx(), cy(), 10, cx(), cy(), Math.max(40, maxRadius * 1.3));
    glowGrad.addColorStop(0, `rgba(220,150,70,${(0.16 * spiralAlpha) + flareAlpha * 0.3})`);
    glowGrad.addColorStop(1, 'rgba(10,5,3,0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, w, h);

    if (spiralAlpha > 0.01) {
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      const segs = 360;
      let prev = null;
      for (let i = 0; i <= segs; i++) {
        const baseAngle = (i / segs) * maxAngle;
        const angle = baseAngle + rot;
        const t = baseAngle / maxAngle;
        const r = minRadius() * scale + (maxRadius - minRadius() * scale) * t;
        const pt = { x: cx() + Math.cos(angle) * r, y: cy() + Math.sin(angle) * r * 0.92, t };
        if (prev) {
          const c = colorAt(t);
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${0.9 * spiralAlpha})`;
          ctx.shadowColor = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${0.7 * spiralAlpha})`;
          ctx.shadowBlur = 7;
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(pt.x, pt.y);
          ctx.stroke();
        }
        prev = pt;
      }

      travelers.forEach(p => {
        if (!config.idle) {
          p.offset += p.speed * rotDir;
          if (p.offset > maxAngle) p.offset -= maxAngle;
          if (p.offset < 0) p.offset += maxAngle;
        }
        const angle = p.offset + rot;
        const t = p.offset / maxAngle;
        const r = minRadius() * scale + (maxRadius - minRadius() * scale) * t;
        let x = cx() + Math.cos(angle) * r + p.jitterX;
        let y = cy() + Math.sin(angle) * r * 0.92 + p.jitterY;

        if (config.interactive) {
          const mdx = x - mouse.x, mdy = y - mouse.y;
          const dist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (dist < 60) {
            const force = (60 - dist) / 60;
            x += (mdx / dist) * force * 16;
            y += (mdy / dist) * force * 16;
          }
        }

        const c = colorAt(t);
        const alpha = (0.55 + 0.35 * Math.sin(p.offset * 8)) * spiralAlpha;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${alpha})`;
        ctx.shadowColor = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},0.9)`;
        ctx.shadowBlur = p.blur * 3;
        ctx.arc(x, y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (cyclePhase === 3 || cyclePhase === 4) {
      for (let i = flareParticles.length - 1; i >= 0; i--) {
        const p = flareParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.life -= p.decay;
        if (p.life <= 0) continue;
        const c = colorAt(p.colorT);
        ctx.beginPath();
        ctx.fillStyle = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${p.life})`;
        ctx.shadowColor = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},0.9)`;
        ctx.shadowBlur = 8;
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (config.showName) {
      const textScale = (cyclePhase === 3 || cyclePhase === 4) ? 1 + flareAlpha * 0.5 : scale;
      ctx.save();
      ctx.translate(cx(), cy() + 14);
      ctx.scale(textScale, textScale);
      ctx.textAlign = 'center';
      ctx.font = `700 ${config.nameSize}px Georgia, serif`;
      ctx.lineJoin = 'round';
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(10,5,3,0.9)';
      ctx.shadowBlur = 0;
      ctx.strokeText(config.nameText, 0, 0);

      ctx.shadowBlur = 16 + flareAlpha * 20;
      ctx.shadowColor = 'rgba(255,200,120,0.9)';
      const grad = ctx.createLinearGradient(-160, -20, 160, 20);
      grad.addColorStop(0, '#ffe9b8');
      grad.addColorStop(0.45, '#ffb24d');
      grad.addColorStop(1, '#e85a3a');
      ctx.fillStyle = grad;
      ctx.fillText(config.nameText, 0, 0);
      ctx.restore();
    }

    ctx.shadowBlur = 0;
  }

  function frame() {
    if (stopped) return;
    step();
    draw();
    rafId = requestAnimationFrame(frame);
  }

  frame();

  return {
    stop() { stopped = true; if (rafId) cancelAnimationFrame(rafId); window.removeEventListener('resize', resize); },
    resize
  };
}
