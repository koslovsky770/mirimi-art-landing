(() => {
  const S = window.SITE || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const wa = (msg) => `https://wa.me/${S.waNumber}?text=${encodeURIComponent(msg || S.waDefault)}`;

  /* ---------- WhatsApp + payment links ---------- */
  $$('[data-wa]').forEach(a => {
    a.href = wa(a.dataset.msg);
    a.target = '_blank';
    a.rel = 'noopener';
  });
  $$('[data-pay]').forEach(a => {
    if (S.payUrl) {
      a.href = S.payUrl; a.target = '_blank'; a.rel = 'noopener';
    } else {
      /* עד שיש קישור תשלום — פותח וואטסאפ עם הודעת הרשמה */
      a.href = wa('היי מרימי, אשמח להירשם לחוג הציור בזום');
      a.target = '_blank'; a.rel = 'noopener';
    }
  });

  /* ---------- menu ---------- */
  const menu = $('#menu'), burger = $('#burger');
  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(true));
  $('#menuClose').addEventListener('click', () => setMenu(false));
  $$('#menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* ---------- reveal on scroll ---------- */
  const rv = $$('.rv');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    rv.forEach(el => io.observe(el));
  } else rv.forEach(el => el.classList.add('is-in'));

  /* ---------- about: read more ---------- */
  const aboutBtn = $('#aboutToggle'), aboutMore = $('#aboutMore');
  aboutBtn.addEventListener('click', () => {
    const open = aboutMore.classList.toggle('is-open');
    aboutBtn.setAttribute('aria-expanded', String(open));
    $('span', aboutBtn).textContent = open ? 'הסתירו' : 'קראו עוד עליי';
  });

  /* ---------- groups accordion + hover image ---------- */
  const rows = $$('[data-row]');
  rows.forEach(row => {
    const btn = $('.row__btn', row), pic = $('.row__pic', row);
    btn.addEventListener('click', () => {
      const open = !row.classList.contains('is-open');
      rows.forEach(r => { r.classList.remove('is-open'); $('.row__btn', r).setAttribute('aria-expanded', 'false'); });
      row.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
    btn.addEventListener('mousemove', (e) => {
      const r = row.getBoundingClientRect();
      pic.style.left = `${e.clientX - r.left}px`;
      row.classList.add('is-hover');
    });
    btn.addEventListener('mouseleave', () => row.classList.remove('is-hover'));
  });

  /* ---------- FAQ ---------- */
  $$('.qa').forEach(qa => {
    const q = $('.qa__q', qa);
    q.addEventListener('click', () => {
      const open = qa.classList.toggle('is-open');
      q.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- lightbox ---------- */
  const lb = $('#lb'), lbImg = $('#lbImg'), lbCount = $('#lbCount');
  let lbItems = [], lbIdx = 0, lastFocus = null;
  const lbShow = () => {
    const it = lbItems[lbIdx];
    lbImg.src = it.src; lbImg.alt = it.alt || '';
    lbCount.textContent = `${lbIdx + 1} / ${lbItems.length}`;
  };
  const lbOpen = (items, i) => {
    lbItems = items; lbIdx = i; lastFocus = document.activeElement;
    lbShow(); lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; $('#lbClose').focus();
  };
  const lbClose = () => {
    lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  };
  const lbMove = (d) => { lbIdx = (lbIdx + d + lbItems.length) % lbItems.length; lbShow(); };
  $('#lbClose').addEventListener('click', lbClose);
  $('#lbPrev').addEventListener('click', () => lbMove(-1));
  $('#lbNext').addEventListener('click', () => lbMove(1));
  lb.addEventListener('click', (e) => { if (e.target === lb) lbClose(); });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('is-open')) { if (e.key === 'Escape') setMenu(false); return; }
    if (e.key === 'Escape') lbClose();
    /* RTL: חץ שמאלה = הבא */
    if (e.key === 'ArrowLeft') lbMove(1);
    if (e.key === 'ArrowRight') lbMove(-1);
  });
  let tx = null;
  lb.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 50) lbMove(dx < 0 ? 1 : -1);
  });

  /* ---------- gallery ---------- */
  const GROUP_NAME = { a: 'מתחילים', b: 'מתקדמים', c: 'בוגרים' };
  const masonry = $('#masonry'), moreBtn = $('#moreBtn');
  const PAGE = 16;
  let all = [], filter = 'all', shown = PAGE, current = [];

  const interleave = (list) => {
    const by = { a: [], b: [], c: [] };
    list.forEach(i => by[i.g].push(i));
    const out = []; const max = Math.max(by.a.length, by.b.length, by.c.length);
    for (let i = 0; i < max; i++) ['a', 'b', 'c'].forEach(k => by[k][i] && out.push(by[k][i]));
    return out;
  };

  const colCount = () => (matchMedia('(max-width: 860px)').matches ? 2 : matchMedia('(max-width: 1100px)').matches ? 3 : 4);
  let cols = colCount();

  const render = (animate = true) => {
    current = filter === 'all' ? all : all.filter(i => i.g === filter);
    const slice = current.slice(0, shown);
    masonry.innerHTML = '';
    const colEls = Array.from({ length: cols }, () => { const c = document.createElement('div'); c.className = 'mcol'; masonry.appendChild(c); return c; });
    const heights = new Array(cols).fill(0);
    slice.forEach((it, idx) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'shot';
      if (animate) b.style.animationDelay = `${Math.min(idx, 12) * 35}ms`; else b.style.animation = 'none';
      b.setAttribute('aria-label', `פתיחת ציור, קבוצת ${GROUP_NAME[it.g]}`);
      const img = new Image();
      img.src = `assets/img/gallery/${it.id}-t.webp`;
      img.width = it.w; img.height = it.h; img.loading = 'lazy'; img.decoding = 'async';
      img.alt = `ציור של תלמיד בקבוצת ${GROUP_NAME[it.g]}`;
      b.appendChild(img);
      b.addEventListener('click', () => lbOpen(
        current.map(c => ({ src: `assets/img/gallery/${c.id}.webp`, alt: `ציור של תלמיד בקבוצת ${GROUP_NAME[c.g]}` })), idx));
      const k = heights.indexOf(Math.min(...heights));
      colEls[k].appendChild(b);
      heights[k] += it.h / it.w;
    });
    moreBtn.parentElement.hidden = current.length <= shown;
  };
  window.addEventListener('resize', () => { const c = colCount(); if (c !== cols) { cols = c; render(false); } });

  const setFilter = (f, scroll) => {
    filter = f; shown = PAGE;
    $$('.chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.f === f)));
    render();
    if (scroll) $('#gallery').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  $$('.chip').forEach(c => c.addEventListener('click', () => setFilter(c.dataset.f)));
  $$('[data-filter-jump]').forEach(b => b.addEventListener('click', () => setFilter(b.dataset.filterJump, true)));
  moreBtn.addEventListener('click', () => { shown += PAGE; render(false); });

  fetch('assets/gallery.json').then(r => r.json()).then(list => {
    all = interleave(list);
    const n = { all: list.length, a: 0, b: 0, c: 0 };
    list.forEach(i => n[i.g]++);
    Object.keys(n).forEach(k => { const el = $(`#n-${k}`); if (el) el.textContent = n[k]; });
    render(false);
  }).catch(() => { masonry.innerHTML = '<p style="text-align:center;grid-column:1/-1">לא הצלחנו לטעון את הגלריה. נסו לרענן את הדף.</p>'; });

  /* ---------- reviews strip ---------- */
  const REVIEWS = [
    ['r02', 900, 935], ['r16', 900, 784], ['r10', 900, 952], ['r09', 900, 1180], ['r15', 900, 596], ['r03', 900, 1200],
    ['r13', 900, 1367], ['r07', 900, 1247], ['r01', 900, 501], ['r14', 900, 1237], ['r08', 900, 542], ['r12', 900, 497],
    ['r11', 900, 378], ['r05', 900, 663], ['r04', 900, 671], ['r06', 900, 429]
  ];
  const strip = $('#strip');
  const revItems = REVIEWS.map(([id]) => ({ src: `assets/img/reviews/${id}.webp`, alt: 'המלצה של הורה או תלמיד, צילום מסך' }));
  REVIEWS.forEach(([id, w, h], i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('aria-label', `הגדלת המלצה ${i + 1}`);
    const img = new Image(); img.src = revItems[i].src; img.width = w; img.height = h; img.loading = 'lazy'; img.alt = revItems[i].alt;
    b.appendChild(img);
    b.addEventListener('click', () => { if (!moved) lbOpen(revItems, i); });
    strip.appendChild(b);
  });
  /* drag to scroll */
  let down = false, sx = 0, sl = 0, moved = false;
  strip.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = strip.scrollLeft; });
  window.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - sx;
    if (Math.abs(dx) > 4) { moved = true; strip.classList.add('is-drag'); }
    strip.scrollLeft = sl - dx;
  });
  window.addEventListener('pointerup', () => { if (!down) return; down = false; strip.classList.remove('is-drag'); setTimeout(() => { moved = false; }, 0); });
})();
