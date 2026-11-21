/* =========================================================
   OURELA-IA · navbar recolhível + HUDs · V001.1.0 · 21.11.2026
   Estilo: css/ourela-nav.css. O abrir/fechar do menu continua
   em js/ourela.js; aqui só o recolhimento, os HUDs e os rótulos.
   ========================================================= */
(() => {
  'use strict';

  const bar = document.querySelector('.topbar');
  if (!bar) return;

  const nav = bar.querySelector('#main-nav');
  const toggle = bar.querySelector('.menu-toggle');
  const diag = document.querySelector('.hud-diag');
  const contato = document.querySelector('#contato');

  const TOPO = 80;     // px: até aqui a barra fica sempre aberta
  const LIMIAR = 8;    // px: ignora tremidas pequenas de rolagem
  let ultimoY = window.scrollY;
  let pendente = false;
  let contatoNaTela = false;

  function fecharMenu() {
    if (!nav || !toggle) return;
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu');
  }

  function setRecolhido(recolhido) {
    if (bar.classList.contains('is-collapsed') === recolhido) return;
    bar.classList.toggle('is-collapsed', recolhido);
    fecharMenu();
  }

  /* O HUD de diagnóstico entra depois da abertura e sai quando a seção
     de contato (que tem o mesmo botão) está na tela. */
  function atualizarDiag() {
    if (!diag) return;
    diag.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.4 && !contatoNaTela);
  }

  function avaliar() {
    pendente = false;
    const y = window.scrollY;
    if (y <= TOPO) { setRecolhido(false); ultimoY = y; }
    else if (y > ultimoY + LIMIAR) { setRecolhido(true); ultimoY = y; }
    else if (y < ultimoY - LIMIAR) { setRecolhido(false); ultimoY = y; }
    atualizarDiag();
  }

  window.addEventListener('scroll', () => {
    if (!pendente) { pendente = true; requestAnimationFrame(avaliar); }
  }, { passive: true });

  if (contato && diag && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entrada]) => {
      contatoNaTela = entrada.isIntersecting;
      atualizarDiag();
    }, { threshold: 0.2 }).observe(contato);
  }

  /* Menu aberto pelo HUD: fecha com clique fora ou Esc */
  document.addEventListener('click', (e) => {
    if (nav && toggle && nav.classList.contains('open') && !nav.contains(e.target) && !toggle.contains(e.target)) fecharMenu();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharMenu(); });

  /* No celular não há "passar o mouse": o rótulo aparece ao tocar */
  const timers = new WeakMap();
  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    const alvo = e.target.closest('.topbar.is-collapsed .brand, .topbar.is-collapsed .menu-toggle, .hud-diag');
    if (!alvo) return;
    alvo.classList.add('show-label');
    clearTimeout(timers.get(alvo));
    timers.set(alvo, setTimeout(() => alvo.classList.remove('show-label'), 1800));
  });

  avaliar();
})();
