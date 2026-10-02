(() => {
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];

  // hlavička: plná po odjetí z hera
  const hdr = $('#hdr');
  const onScroll = () => hdr.classList.toggle('solid', scrollY > innerHeight * .6);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // mobilní menu
  const burger = $('#burger'), nav = $('#nav');
  const setMenu = open => { nav.classList.toggle('open', open); burger.setAttribute('aria-expanded', open); document.body.style.overflow = open ? 'hidden' : ''; };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));

  // odhalení při scrollu
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('[data-r]').forEach(el => io.observe(el));

  // lightbox
  const lb = $('#lb'), lbImg = $('#lb-img'), lbCount = $('#lb-count');
  const list = [...new Set($$('[data-full]').map(b => b.dataset.full))];
  let cur = 0;
  const show = i => { cur = (i + list.length) % list.length; lbImg.src = list[cur]; lbCount.textContent = `${cur + 1} / ${list.length}`; };
  document.addEventListener('click', e => { const b = e.target.closest('[data-full]'); if (!b || b.closest('dialog')) return; show(list.indexOf(b.dataset.full)); lb.showModal(); });
  lb.addEventListener('click', e => {
    const a = e.target.closest('[data-lb]')?.dataset.lb;
    if (a === 'close' || e.target === lb) lb.close();
    if (a === 'prev') show(cur - 1);
    if (a === 'next') show(cur + 1);
  });
  addEventListener('keydown', e => { if (!lb.open) return; if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });

  // náhled fotky u služeb — sleduje kurzor, smyčka běží jen při hoveru
  const prev = $('.svc-prev');
  if (prev && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    const pimg = $('img', prev);
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0, on = false;
    const loop = () => { x += (tx - x) * .16; y += (ty - y) * .16; prev.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
      raf = (on || Math.abs(tx - x) > .5) ? requestAnimationFrame(loop) : 0; };
    $$('[data-prev]').forEach(li => {
      li.addEventListener('pointerenter', e => { pimg.src = li.dataset.prev; if (!on) { x = tx = e.clientX; y = ty = e.clientY; } on = true; prev.classList.add('on'); if (!raf) raf = requestAnimationFrame(loop); });
      li.addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; });
      li.addEventListener('pointerleave', () => { on = false; prev.classList.remove('on'); });
    });
  }

  // vodorovné pásy: tažení myší
  $$('.strip').forEach(s => {
    let down = false, sx = 0, sl = 0, moved = 0;
    s.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = 0; sx = e.clientX; sl = s.scrollLeft; s.classList.add('drag'); });
    addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx)); s.scrollLeft = sl - dx; });
    addEventListener('pointerup', () => { down = false; s.classList.remove('drag'); });
    s.addEventListener('click', e => { if (moved > 6) { e.stopPropagation(); e.preventDefault(); moved = 0; } }, true);
  });

  // formulář → e-mail
  $$('form[data-mail]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    let ok = true;
    ['jmeno', 'email'].forEach(k => { const el = f.elements[k]; const bad = !el.value.trim() || (k === 'email' && !el.validity.valid); el.classList.toggle('bad', bad); if (bad) ok = false; });
    if (!ok) return;
    const body = `Dobrý den,\n\n${d.zprava || ''}\n\nTermín a místo: ${d.termin || '-'}\n\n${d.jmeno}\n${d.email}`;
    location.href = `mailto:${f.dataset.mail}?subject=${encodeURIComponent('Poptávka focení')}&body=${encodeURIComponent(body)}`;
  }));
})();

// ===== efekty v3 =====
(() => {
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // úvodní opona: odpočet podle načtení hero fotek, jen při první návštěvě v relaci
  const pre = $('#pre');
  if (pre) {
    let seen = false;
    try { seen = sessionStorage.getItem('pre') === '1'; sessionStorage.setItem('pre', '1'); } catch (e) {}
    if (seen || calm) pre.classList.add('gone');
    else {
      document.documentElement.classList.add('loading');
      const n = $('#pre-n'), imgs = $$('.hero img').slice(0, 3);
      const t0 = performance.now(); let shown = 0;
      const ready = () => imgs.every(i => i.complete);
      const tick = now => {
        const el = now - t0, target = ready() ? 100 : Math.min(90, el / 22);
        shown += (target - shown) * .12;
        n.textContent = String(Math.min(100, Math.round(shown))).padStart(2, '0');
        if ((shown > 99.4 && el > 900) || el > 3200) {
          n.textContent = '100';
          pre.classList.add('done');
          document.documentElement.classList.remove('loading');
          setTimeout(() => pre.classList.add('gone'), 1200);
        } else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }

  // hero: v každém sloupci se pomalu prolínají fotky (jen když je hero vidět)
  const cols = $$('.tri figure').filter(f => f.querySelectorAll('.fade').length > 1);
  if (cols.length && !calm) {
    cols.forEach(f => { f.classList.add('cyc'); f.querySelector('.fade').classList.add('on'); f._i = 0; });
    let k = 0, vis = true, timer;
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; }).observe($('.hero'));
    const step = () => {
      if (vis && !document.hidden) {
        const f = cols[k % cols.length], fs = f.querySelectorAll('.fade');
        fs[f._i].classList.remove('on');
        f._i = (f._i + 1) % fs.length;
        fs[f._i].classList.add('on', 'kb');
        k++;
      }
      timer = setTimeout(step, 2600);
    };
    timer = setTimeout(step, 4200);
  }

  // nadpisy: slova najíždějí zespodu (zachová <em>)
  $$('.split').forEach(el => {
    let w = 0;
    const walk = node => [...node.childNodes].forEach(ch => {
      if (ch.nodeType === 3) {
        const frag = document.createDocumentFragment();
        ch.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const o = document.createElement('span'), i = document.createElement('span');
          o.className = 'wd'; i.textContent = part; i.style.setProperty('--w', w++); o.append(i); frag.append(o);
        });
        ch.replaceWith(frag);
      } else if (ch.nodeType === 1) walk(ch);
    });
    walk(el);
  });

  // čísla se napočítají
  const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const b = e.target, to = parseInt(b.dataset.count, 10); if (!to || calm) return;
    const plus = b.textContent.includes('+') ? '+' : '', t0 = performance.now(), d = 1600;
    const f = now => { const p = Math.min(1, (now - t0) / d), v = Math.round(to * (1 - Math.pow(1 - p, 4))); b.textContent = fmt(v) + plus; if (p < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  }), { threshold: .6 });
  $$('[data-count]').forEach(b => cio.observe(b));

  if (!fine || calm) return;

  // vlastní kurzor: smyčka běží jen dokud se kurzor hýbe
  const cur = $('#cur');
  if (cur) {
    let x = -100, y = -100, tx = -100, ty = -100, raf = 0;
    const loop = () => { x += (tx - x) * .2; y += (ty - y) * .2; cur.style.transform = `translate3d(${x}px,${y}px,0)`;
      raf = (Math.abs(tx - x) + Math.abs(ty - y) > .3) ? requestAnimationFrame(loop) : 0; };
    addEventListener('pointermove', e => {
      tx = e.clientX; ty = e.clientY; cur.classList.add('on');
      const t = e.target;
      const big = t.closest && t.closest('[data-full], .pas-i');
      const link = !big && t.closest && t.closest('a, button, summary, input, textarea');
      cur.classList.toggle('big', !!big); cur.classList.toggle('link', !!link);
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.remove('on'));
  }

  // tlačítka se přitahují ke kurzoru
  $$('.mag').forEach(b => {
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px,${(e.clientY - r.top - r.height / 2) * .32}px)`; });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
})();
