// ===== MARIN — Premium Bådpleje JS =====

document.addEventListener('DOMContentLoaded', () => {

  // --- NAV SCROLL ---
  const nav = document.querySelector('.nav');
  const stickyCta = document.querySelector('.sticky-cta');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
    if (stickyCta) stickyCta.classList.toggle('visible', window.scrollY > 600);
  });

  // --- MOBILE MENU ---
  const hamburger = document.querySelector('.nav-hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }

  // --- SCROLL REVEAL ---
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealElements.forEach(el => revealObserver.observe(el));

  // --- COUNTER ANIMATION ---
  const counters = document.querySelectorAll('[data-count]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        let current = 0;
        const step = Math.ceil(target / 60);
        const timer = setInterval(() => {
          current += step;
          if (current >= target) { current = target; clearInterval(timer); }
          el.textContent = current.toLocaleString('da-DK') + suffix;
        }, 25);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(el => counterObserver.observe(el));

  // --- PRICING CALCULATOR ---
  const calcType = document.getElementById('calc-type');
  const calcSize = document.getElementById('calc-size');
  const calcResult = document.getElementById('calc-price');

  const prices = {
    'motor': { 'small': 2500, 'medium': 3800, 'large': 5200 },
    'sejl':  { 'small': 2800, 'medium': 4200, 'large': 5800 },
    'yacht': { 'small': 4800, 'medium': 6500, 'large': 8500 }
  };

  function updateCalc() {
    if (!calcType || !calcSize || !calcResult) return;
    const type = calcType.value;
    const size = calcSize.value;
    const price = prices[type]?.[size] || 0;
    calcResult.textContent = price.toLocaleString('da-DK') + ' DKK';
  }

  if (calcType) calcType.addEventListener('change', updateCalc);
  if (calcSize) calcSize.addEventListener('change', updateCalc);
  updateCalc();

  // --- SMOOTH SCROLL ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // --- PARALLAX HERO (subtle) ---
  const heroBg = document.querySelector('.hero-bg');
  if (heroBg) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < window.innerHeight) {
        heroBg.style.transform = `translateY(${y * 0.3}px)`;
      }
    });
  }

  // --- PROOF BAR DUPLICATION FOR INFINITE SCROLL ---
  const proofTrack = document.querySelector('.proof-track');
  if (proofTrack) {
    proofTrack.innerHTML += proofTrack.innerHTML;
  }
});
