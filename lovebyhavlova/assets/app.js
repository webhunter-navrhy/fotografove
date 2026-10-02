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
