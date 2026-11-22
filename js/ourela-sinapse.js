/* =========================================================
   OURELA-IA · Painel SINAPSE · V001.0.0 · 21.11.2026
   Abas de modelos, janelas nomeadas, HUD de prompts, copiar.

   Princípio: a página só DIRECIONA. Ela não lê nem escreve nada
   nas páginas dos modelos (o navegador proíbe e a OURELA não
   quer), não guarda nada (sem cookies, sem localStorage) e não
   envia nada (a CSP da página bloqueia qualquer conexão).
   ========================================================= */
(() => {
  'use strict';

  document.documentElement.classList.replace('no-js', 'js');

  /* ---------- modelos: só endereços oficiais ---------- */
  const MODELOS = {
    claude:   { nome: 'Claude',   base: 'https://claude.ai/new',        prefill: t => 'https://claude.ai/new?q=' + encodeURIComponent(t) },
    chatgpt:  { nome: 'ChatGPT',  base: 'https://chatgpt.com/',         prefill: t => 'https://chatgpt.com/?q=' + encodeURIComponent(t) },
    gemini:   { nome: 'Gemini',   base: 'https://gemini.google.com/app', prefill: null },
    deepseek: { nome: 'DeepSeek', base: 'https://chat.deepseek.com/',   prefill: null },
    /* Outros: escolha livre do cliente. Sem endereço: o painel só copia. */
    outros:   { nome: 'seu modelo', base: null,                          prefill: null },
  };
  let atual = 'claude';

  /* ---------- aviso ---------- */
  const toast = document.querySelector('.sx-toast');
  let toastTimer;
  function avisar(html, ms = 5200) {
    if (!toast) return;
    toast.innerHTML = html;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), ms);
  }

  /* ---------- abrir ao lado ----------
     Janela nomeada: clicar de novo reaproveita a mesma janela do modelo,
     como uma aba persistente. No desktop, abre na metade direita da tela. */
  function abrir(id, url) {
    const m = MODELOS[id];
    const nome = 'ourela_' + id;
    let w = null;
    if (window.matchMedia('(min-width: 1000px)').matches) {
      const largura = Math.round(screen.availWidth / 2);
      const altura = screen.availHeight;
      const esquerda = (screen.availLeft || 0) + screen.availWidth - largura;
      const topo = screen.availTop || 0;
      w = window.open(url, nome, `popup=yes,width=${largura},height=${altura},left=${esquerda},top=${topo}`);
    } else {
      w = window.open(url, nome);
    }
    if (w) {
      try { w.opener = null; } catch (_) { /* nada */ }
      try { w.focus(); } catch (_) { /* nada */ }
      return true;
    }
    avisar(`O navegador bloqueou a janela. Permita pop-ups para esta página ou <a href="${m.base}" target="${nome}" rel="noopener">abra o ${m.nome} aqui</a>.`, 8000);
    return false;
  }

  /* ---------- abas de modelos ---------- */
  const tabs = [...document.querySelectorAll('.sx-tab')];
  const portas = [...document.querySelectorAll('.sx-porta')];
  const destino = document.querySelector('[data-destino]');

  function selecionar(id, focar) {
    atual = id;
    tabs.forEach(t => {
      const ativo = t.dataset.modelo === id;
      t.setAttribute('aria-selected', String(ativo));
      t.tabIndex = ativo ? 0 : -1;
      if (ativo && focar) t.focus();
    });
    portas.forEach(p => { p.hidden = p.dataset.modelo !== id; });
    if (destino) destino.textContent = id === 'outros' ? 'outro modelo, à sua escolha' : MODELOS[id].nome;
    document.querySelectorAll('.sx-copiar-abrir').forEach(b => {
      b.textContent = id === 'outros' ? 'Copiar para o seu modelo' : 'Copiar e abrir no ' + MODELOS[id].nome;
    });
  }

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selecionar(t.dataset.modelo));
    t.addEventListener('keydown', e => {
      const n = tabs.length;
      let j = null;
      if (e.key === 'ArrowRight') j = (i + 1) % n;
      if (e.key === 'ArrowLeft') j = (i - 1 + n) % n;
      if (e.key === 'Home') j = 0;
      if (e.key === 'End') j = n - 1;
      if (j !== null) { e.preventDefault(); selecionar(tabs[j].dataset.modelo, true); }
    });
  });

  document.querySelectorAll('[data-abrir]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      abrir(a.dataset.abrir, MODELOS[a.dataset.abrir].base);
    });
  });

  /* ---------- copiar ---------- */
  async function copiar(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch (_) {
      const area = document.createElement('textarea');
      area.value = texto;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (__) { ok = false; }
      area.remove();
      return ok;
    }
  }

  document.querySelectorAll('.sx-prompt').forEach(card => {
    const texto = card.querySelector('.sx-texto').textContent.trim();
    const titulo = card.querySelector('summary').textContent.trim();

    card.querySelector('.sx-copiar').addEventListener('click', async () => {
      const ok = await copiar(texto);
      avisar(ok
        ? `<b>Copiado:</b> “${titulo}”. Cole com Ctrl+V (⌘+V no Mac) no modelo que preferir.`
        : 'Não foi possível copiar automaticamente. Abra “ver texto” e copie manualmente.');
    });

    card.querySelector('.sx-copiar-abrir').addEventListener('click', async () => {
      const m = MODELOS[atual];
      const ok = await copiar(texto);
      if (!m.base) {
        avisar(ok
          ? `<b>Copiado:</b> “${titulo}”. Abra o modelo que a sua empresa usa e cole com Ctrl+V (⌘+V no Mac).`
          : 'Não foi possível copiar automaticamente. Abra “ver texto” e copie manualmente.');
        return;
      }
      const url = m.prefill ? m.prefill(texto) : m.base;
      abrir(atual, url);
      if (m.prefill) {
        avisar(`<b>${m.nome} aberto ao lado.</b> O prompt foi colocado no link de abertura e ${ok ? "também copiado" : "não pôde ser copiado"}. Se o campo vier vazio, cole com Ctrl+V.`);
      } else {
        avisar(`<b>${m.nome} aberto ao lado.</b> ${ok ? 'Prompt copiado: cole com Ctrl+V (⌘+V no Mac) no campo de mensagem.' : 'Abra “ver texto” e copie o prompt manualmente.'}`);
      }
    });
  });

  /* ---------- trilhas do HUD ---------- */
  const trilhas = [...document.querySelectorAll('.sx-trilha')];
  const listas = [...document.querySelectorAll('.sx-lista')];
  function trilha(idx, focar) {
    trilhas.forEach((t, i) => {
      t.setAttribute('aria-selected', String(i === idx));
      t.tabIndex = i === idx ? 0 : -1;
      if (i === idx && focar) t.focus();
    });
    listas.forEach((l, i) => { l.hidden = i !== idx; });
  }
  trilhas.forEach((t, i) => {
    t.addEventListener('click', () => trilha(i));
    t.addEventListener('keydown', e => {
      const n = trilhas.length;
      if (e.key === 'ArrowRight') { e.preventDefault(); trilha((i + 1) % n, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); trilha((i - 1 + n) % n, true); }
    });
  });

  /* ---------- HUD abre / fecha ---------- */
  const hud = document.querySelector('.sx-hud');
  const toggle = document.querySelector('.sx-hud-toggle');
  const fechar = document.querySelector('.sx-hud-fechar');
  function hudAberto(aberto) {
    if (!hud || !toggle) return;
    hud.classList.toggle('is-open', aberto);
    toggle.setAttribute('aria-expanded', String(aberto));
    if (aberto) (hud.querySelector('.sx-trilha[aria-selected="true"]') || hud).focus();
    else toggle.focus();
  }
  if (toggle) toggle.addEventListener('click', () => hudAberto(!hud.classList.contains('is-open')));
  if (fechar) fechar.addEventListener('click', () => hudAberto(false));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && hud && hud.classList.contains('is-open')) hudAberto(false);
  });
  /* links do tipo "Escolha um prompt no HUD" */
  document.querySelectorAll('a[href="#prompts"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); hudAberto(true); }));

  /* No celular, o rótulo do HUD aparece ao tocar */
  if (toggle) toggle.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;
    toggle.classList.add('show-label');
    setTimeout(() => toggle.classList.remove('show-label'), 1600);
  });

  /* estado inicial */
  selecionar('claude');
  trilha(0);
})();
