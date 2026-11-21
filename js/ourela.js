(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Abrir menu' : 'Fechar menu');
      nav.classList.toggle('open', !open);
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Abrir menu');
    }));
  }
  const items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, instance) => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); instance.unobserve(entry.target); }
    }), { threshold: .12, rootMargin: '0px 0px -30px 0px' });
    items.forEach(item => observer.observe(item));
  } else items.forEach(item => item.classList.add('visible'));
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
