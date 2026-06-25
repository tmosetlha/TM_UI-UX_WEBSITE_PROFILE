/* ============================================
   TM_UI/UX — GSAP Ignition Reveals
   STEP 1 of the GSAP sequence.
   Headings start dim/desaturated, then "ignite"
   into full fire-gradient color as they scroll
   into view.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('TM_UI/UX: GSAP or ScrollTrigger not loaded — ignition reveals skipped.');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const targets = document.querySelectorAll('h1, h2');

  targets.forEach((el) => {
    // Start state: dim, slightly desaturated, a touch lower
    gsap.set(el, {
      opacity: 0,
      y: 18,
      filter: 'saturate(0.3) brightness(0.7)'
    });

    gsap.to(el, {
      opacity: 1,
      y: 0,
      filter: 'saturate(1) brightness(1)',
      duration: 1.1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none'
      }
    });
  });
});
