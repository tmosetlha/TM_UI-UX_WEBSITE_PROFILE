/* ============================================
   TM_UI/UX — GSAP Ember Stagger
   STEP 2 of the GSAP sequence.
   Cards rise into place one after another, like
   embers settling, as their grid scrolls into view.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('TM_UI/UX: GSAP or ScrollTrigger not loaded — ember stagger skipped.');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const grids = document.querySelectorAll('.grid');

  grids.forEach((grid) => {
    const cards = grid.querySelectorAll('.card');
    if (!cards.length) return;

    gsap.set(cards, {
      opacity: 0,
      y: 34,
      filter: 'brightness(0.6) saturate(0.4)'
    });

    gsap.to(cards, {
      opacity: 1,
      y: 0,
      filter: 'brightness(1) saturate(1)',
      duration: 0.85,
      ease: 'power2.out',
      stagger: 0.16,
      scrollTrigger: {
        trigger: grid,
        start: 'top 88%',
        toggleActions: 'play none none none'
      }
    });
  });
});
