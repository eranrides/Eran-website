/* ==========================================================================
   ERAN — interactions & motion
   Motion tokens follow the ERAN Design System (07 — Motion):
   fast 200ms · base 600ms · slow 1000ms · stagger 300ms · ambient 8s
   ========================================================================== */
(() => {
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  gsap.registerPlugin(ScrollTrigger, CustomEase);
  CustomEase.create('eOut', '.22,1,.36,1');
  CustomEase.create('ePop', '.175,.885,.32,1');
  CustomEase.create('eAmb', '.37,0,.63,1');
  const T = { fast: .2, base: .6, slow: 1, stagger: .3, ambient: 8 };

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!RM) {
    lenis = new Lenis({ lerp: .1, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const scrollToTarget = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    else (typeof target === 'number' ? window.scrollTo(0, target) : target.scrollIntoView({ behavior: 'smooth' }));
  };
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id === '#') return e.preventDefault();
    const el = id === '#top' ? 0 : $(id);
    if (el === null) return;
    e.preventDefault();
    document.body.classList.remove('menu-open');
    scrollToTarget(el);
  }));

  /* ---------- split text ---------- */
  function split(el, chars) {
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) return frag.append(document.createTextNode(' '));
            const w = document.createElement('span'); w.className = 'w';
            const wi = document.createElement('span'); wi.className = 'wi';
            if (chars) [...part].forEach(c => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; wi.append(s); });
            else wi.textContent = part;
            w.append(wi); frag.append(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) walk(child);
      });
    };
    walk(el);
  }
  $$('.split-chars').forEach(el => split(el, true));
  $$('[data-split]').forEach(el => split(el, false));

  /* ---------- marquee strips: fill the width with copies ---------- */
  $$('[data-marquee]').forEach(strip => {
    const track = $('.strip-track', strip);
    const need = Math.ceil(strip.offsetWidth / Math.max(track.offsetWidth, 1)) + 1;
    for (let i = 0; i < need; i++) {
      const c = track.cloneNode(true); c.setAttribute('aria-hidden', 'true'); strip.append(c);
    }
  });
  const marquees = RM ? [] : $$('[data-marquee]').map(strip => {
    const dir = strip.hasAttribute('data-reverse') ? -1 : 1;
    const tw = gsap.fromTo($$('.strip-track', strip), { xPercent: dir > 0 ? 0 : -100 }, { xPercent: dir > 0 ? -100 : 0, duration: 40, ease: 'none', repeat: -1 });
    return tw;
  });

  /* ==========================================================================
     Preloader → hero intro
     ========================================================================== */
  const loader = $('.loader');
  const ready = Promise.race([
    Promise.all([document.fonts ? document.fonts.ready : 0, new Promise(r => window.addEventListener('load', r, { once: true }))]),
    new Promise(r => setTimeout(r, 3500))
  ]);

  function runLoader() {
    const trail = $('.loader-trail path');
    const plane = $('.loader-plane');
    const sky = $('.loader-sky');
    const count = $('.loader-count span');
    trail.setAttribute('pathLength', '1');
    gsap.set(trail, { strokeDasharray: 1, strokeDashoffset: 1 });
    const len = trail.getTotalLength();
    const st = { p: 0 };
    const place = () => {
      const pt = trail.getPointAtLength(st.p * len);
      const r = sky.getBoundingClientRect();
      gsap.set(plane, { x: pt.x / 600 * r.width - plane.offsetWidth * .5, y: pt.y / 400 * r.height - plane.offsetHeight * .5 });
      trail.style.strokeDashoffset = 1 - st.p;
      count.textContent = Math.round(st.p * 100);
    };
    place();
    const tl = gsap.timeline();
    tl.to(st, { p: .82, duration: 1.3, ease: 'eOut', onUpdate: place });
    return ready.then(() => new Promise(res => {
      tl.to(st, { p: 1, duration: .5, ease: 'power2.in', onUpdate: place })
        .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: T.slow, ease: 'eOut', onStart: res }, '+=.1')
        .set(loader, { display: 'none' });
    }));
  }

  function heroIntro() {
    document.body.classList.remove('is-loading');
    lenis && lenis.start();
    if (RM) {
      gsap.from('.hero-copy > *, .hero-stage > *', { opacity: 0, duration: T.base, stagger: .05 });
      return;
    }
    // Entrances follow "Asset entrances (v2)": pop-in for characters, drive-in for the bike,
    // float-in + tilt for objects (120ms stagger), fade-up for copy.
    const tl = gsap.timeline({ defaults: { ease: 'eOut' }, onComplete: ambient });
    tl.from('.nav', { y: -100, opacity: 0, duration: T.slow }, 0)
      .from('.hero-title .ch', { yPercent: 115, rotate: 8, duration: T.slow, stagger: .028 }, .05)
      .from('[data-hero-fade]', { y: 24, opacity: 0, duration: T.base, stagger: .15 }, .4)
      .from('.hero-circle', { scale: 0, duration: T.slow, ease: 'back.out(1.4)' }, .1)
      .from('.orbit', { scale: .6, opacity: 0, rotate: -90, duration: T.slow }, .3)
      .from('.h-rider', { xPercent: -120, duration: .7, ease: 'ePop' }, .55)
      .from('.h-courier', { scale: .6, opacity: 0, y: 30, duration: .5, ease: 'back.out(1.8)', transformOrigin: '50% 100%' }, .8)
      .from('.h-obj', { y: 24, rotate: i => (i % 2 ? 8 : -8), opacity: 0, scale: .7, duration: .4, ease: 'back.out(2)', stagger: .12 }, 1)
      .from('.badge', { scale: 0, rotate: -180, duration: T.base, ease: 'back.out(1.6)' }, 1.2)
      .from('.orbit-plane', { opacity: 0, duration: T.base }, 1.3)
      .from('.pill-lime', { scale: 0, rotate: -30, duration: T.base, ease: 'back.out(2.4)' }, 1.1)
      .from('.strip', { yPercent: 120, opacity: 0, duration: T.slow }, .8);
  }

  // bounce loop (2s, y ±6) for objects, breathing for characters
  function ambient() {
    $$('.h-obj').forEach((o, i) => gsap.to(o, { y: '-=8', rotation: i % 2 ? 4 : -4, duration: 1, ease: 'eAmb', yoyo: true, repeat: -1, delay: i * .25 }));
    gsap.to('.h-courier img', { scaleY: 1.015, y: -4, duration: 2, ease: 'eAmb', yoyo: true, repeat: -1, transformOrigin: '50% 100%' });
    gsap.to('.h-rider img', { y: -3, rotation: .6, duration: .28, ease: 'eAmb', yoyo: true, repeat: -1, transformOrigin: '50% 100%' });
  }

  if (RM) { loader.style.display = 'none'; heroIntro(); }
  else runLoader().then(heroIntro);

  /* ==========================================================================
     Hero: orbit, parallax, magnetic letters, fly-apart on scroll
     ========================================================================== */
  if (!RM) {
    gsap.to('.orbit-plane', { rotation: 360, duration: 18, ease: 'none', repeat: -1 });
    gsap.to('.orbit', { rotation: -360, duration: 120, ease: 'none', repeat: -1 });

    if (FINE) {
      const stage = $('.hero-stage');
      const layers = $$('[data-depth]', stage).map(el => [el, +el.dataset.depth]);
      const chars = $$('.hero-title .ch').map(ch => ({ ch, y: gsap.quickTo(ch, 'y', { duration: .5, ease: 'eOut' }), s: gsap.quickTo(ch, 'scale', { duration: .5, ease: 'eOut' }) }));
      $('.hero').addEventListener('mousemove', e => {
        const r = stage.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        layers.forEach(([el, d]) => gsap.to(el, { '--px': -dx * d, '--py': -dy * d, duration: .9, ease: 'eOut', overwrite: 'auto' }));
        // letters lift away from the cursor
        chars.forEach(c => {
          const b = c.ch.getBoundingClientRect();
          const dist = Math.hypot(e.clientX - (b.left + b.width / 2), e.clientY - (b.top + b.height / 2));
          const f = Math.max(0, 1 - dist / 180);
          c.y(-f * 26); c.s(1 + f * .12);
        });
      });
      $('.hero').addEventListener('mouseleave', () => chars.forEach(c => { c.y(0); c.s(1); }));
    }

    // scroll: rider rides off, courier walks out, objects scatter
    const out = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6 };
    const tl = gsap.timeline({ scrollTrigger: out, defaults: { ease: 'none' } });
    tl.to('.hero-title .line:first-child', { xPercent: -10 }, 0)
      .to('.hero-title .line.accent', { xPercent: 8 }, 0)
      .to('.h-rider', { xPercent: 140, ease: 'power2.in' }, 0)
      .to('.h-courier', { xPercent: 70, yPercent: -10 }, 0)
      .to('.hero-circle', { scale: 1.25, yPercent: -8 }, 0)
      .to('.badge', { rotate: 220, yPercent: -60 }, 0)
      .to('.h-obj', { x: () => gsap.utils.random(-260, 260), y: () => gsap.utils.random(-320, -80), rotation: () => gsap.utils.random(-90, 90), stagger: 0 }, 0);
  }

  // quick track
  $('.track-quick').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.currentTarget, v = f.id.value.trim().toUpperCase();
    if (!v) { f.classList.remove('is-shake'); void f.offsetWidth; f.classList.add('is-shake'); return; }
    $('.tcard-id b').textContent = v.startsWith('ERN') ? v : 'ERN-' + v;
    scrollToTarget($('#track'));
  });

  /* ==========================================================================
     Reveals
     ========================================================================== */
  $$('[data-split]').forEach(el => {
    const words = $$('.wi', el);
    if (RM) return gsap.from(el, { opacity: 0, duration: T.base, scrollTrigger: { trigger: el, start: 'top 80%', once: true } });
    gsap.from(words, { yPercent: 110, rotate: 4, duration: T.slow, ease: 'eOut', stagger: .06, scrollTrigger: { trigger: el, start: 'top 80%', once: true } });
  });

  gsap.set('[data-reveal], [data-pop]', { opacity: 0 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 80%', once: true,
    onEnter: els => gsap.fromTo(els, { opacity: 0, y: RM ? 0 : 24 }, { opacity: 1, y: 0, duration: T.base, ease: 'eOut', stagger: T.stagger, overwrite: true })
  });

  ScrollTrigger.batch('[data-pop]', {
    start: 'top 85%', once: true,
    onEnter: els => gsap.fromTo(els, { opacity: 0, scale: RM ? 1 : .8 }, { opacity: 1, scale: 1, duration: T.base, ease: 'back.out(1.5)', stagger: .15, overwrite: true, clearProps: 'transform' })
  });

  // category cards: 3D tilt toward the cursor, figure does the "cheer" (scale 1→1.06→1, 450ms overshoot)
  $$('.cat').forEach(c => {
    const ch = $('.cat-char', c);
    c.addEventListener('mouseenter', () => !RM && gsap.fromTo(ch, { scale: 1 }, { scale: 1.06, duration: .225, ease: 'ePop', yoyo: true, repeat: 1 }));
    if (!FINE || RM) return;
    const rx = gsap.quickTo(c, 'rotationX', { duration: .5, ease: 'eOut' }), ry = gsap.quickTo(c, 'rotationY', { duration: .5, ease: 'eOut' });
    const ty = gsap.quickTo(c, 'y', { duration: .4, ease: 'eOut' });
    c.addEventListener('mousemove', e => {
      const r = c.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - .5) * 18); rx(-((e.clientY - r.top) / r.height - .5) * 14); ty(-8);
    });
    c.addEventListener('mouseleave', () => { rx(0); ry(0); ty(0); });
  });

  /* ==========================================================================
     Ride-through: the rider paints the headline violet
     ========================================================================== */
  (() => {
    const rider = $('.ride-rider'), fill = $('.ride-fill'), words = $('.ride-words'), pin = $('.ride-pin-drop');
    if (RM) { gsap.set(rider, { x: () => innerWidth * .5 - rider.offsetWidth / 2 }); return; }
    const paint = () => {
      const fr = fill.getBoundingClientRect();
      const rr = rider.getBoundingClientRect();
      const nose = rr.left + rr.width * .82;
      const pct = gsap.utils.clamp(0, 100, (fr.right - nose) / fr.width * 100);
      fill.style.clipPath = `inset(0 ${pct}% 0 0)`;
    };
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      onUpdate: paint,
      scrollTrigger: { trigger: '.ride', start: 'top top', end: 'bottom bottom', scrub: .6, invalidateOnRefresh: true, onRefresh: paint }
    });
    tl.fromTo(rider, { x: () => -rider.offsetWidth * 1.1 }, { x: () => innerWidth + 40, duration: 1 }, 0)
      .fromTo(words, { xPercent: 4 }, { xPercent: -4, duration: 1 }, 0)
      .fromTo(pin, { scale: 0, y: -120 }, { scale: 1, y: 0, duration: .1, ease: 'back.out(2.4)' }, .78)
      .fromTo('.ride-copy', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .12, ease: 'eOut' }, .1);
  })();


  /* ==========================================================================
     Unbox: parcels burst out, then we dive into the violet inside
     ========================================================================== */
  (() => {
    const say = $('.unbox-say');
    if (RM) { gsap.set('.ub-item', { opacity: 1, x: i => (i - 2) * 90, y: -160 }); return; }
    const spots = [[-34, -46, -24], [30, -52, 18], [-18, -78, 10], [40, -20, -30], [-44, -14, 20]];
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.unbox', start: 'top top', end: 'bottom bottom', scrub: .7 } });
    tl.fromTo('.ub-box', { scale: .7, rotate: -6 }, { scale: 1, rotate: 0, duration: .15, ease: 'back.out(2)' }, 0);
    $$('.ub-item').forEach((it, i) => {
      const [x, y, r] = spots[i];
      tl.fromTo(it, { opacity: 0, xPercent: 0, yPercent: 40, scale: .3, rotate: 0 },
        { opacity: 1, x: () => innerWidth * x / 100, y: () => innerHeight * y / 100, scale: 1.1, rotate: r, duration: .22, ease: 'back.out(1.6)' }, .08 + i * .035)
        .to(it, { x: () => innerWidth * x / 40, y: () => innerHeight * y / 40, scale: 2.4, opacity: 0, duration: .25, ease: 'power2.in' }, .5);
    });
    tl.to('.unbox-q', { yPercent: -80, opacity: 0, duration: .12 }, .42)
      .to('.ub-box', { scale: 16, duration: .4, ease: 'power3.in' }, .46)
      .to('.unbox-flood', { opacity: 1, duration: .08 }, .76)
      .set(say, { visibility: 'visible' }, .8)
      .fromTo('.unbox-say > *', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: .1, stagger: .03, ease: 'back.out(1.6)' }, .8)
      .to({}, { duration: .1 });
  })();

  /* ==========================================================================
     How it works: pinned horizontal (desktop)
     ========================================================================== */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1101px) and (prefers-reduced-motion: no-preference)', () => {
    const track = $('.how-track');
    const stops = $$('.how-rail .stop');
    const chips = $$('.step .chip');
    const lit = new Set();
    const dist = () => track.scrollWidth - innerWidth + parseFloat(getComputedStyle(track).paddingLeft);
    const tw = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '.how', pin: '.how-pin', start: 'top top', end: () => '+=' + dist(), scrub: .8, invalidateOnRefresh: true,
        onUpdate: self => {
          const p = self.progress;
          gsap.set('.rail-fill', { scaleX: p });
          gsap.set('.rail-plane', { left: p * 100 + '%' });
          stops.forEach((s, i) => {
            const on = p >= i / 2 - .02;
            s.classList.toggle('is-on', on);
            if (on && !lit.has(i)) { lit.add(i); gsap.fromTo(chips[i], { scale: .8 }, { scale: 1, duration: T.base, ease: 'back.out(2.2)' }); }
            if (!on) lit.delete(i);
          });
        }
      }
    });
    $$('.step-art img').forEach(img => {
      gsap.fromTo(img, { xPercent: 14, rotate: 4 }, { xPercent: -14, rotate: -4, ease: 'none', scrollTrigger: { trigger: img.closest('.step'), containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } });
    });
  });
  mm.add('(max-width: 1100px)', () => {
    $$('.step').forEach(s => gsap.from(s, { opacity: 0, y: RM ? 0 : 40, duration: T.base, ease: 'eOut', scrollTrigger: { trigger: s, start: 'top 85%', once: true } }));
  });

  /* ==========================================================================
     Live tracking demo
     ========================================================================== */
  (() => {
    const route = $('.route-fg'), marker = $('.marker');
    const len = route.getTotalLength();
    route.style.strokeDasharray = len; route.style.strokeDashoffset = len;
    const eta = $('.eta-n'), bar = $('.tbar i'), steps = $$('.tsteps li');
    const chip = $('.tcard-chip'), stack = $('.notif-stack');
    const STAGES = [
      { chip: 'pending', label: 'Pending', title: 'Order confirmed', body: 'Finding you a rider.', icon: 'ncard-icon--amber', sym: 'midnight' },
      { chip: 'picked', label: 'Picked up', title: 'Picked up', body: 'Tobi has your parcel.', icon: '', sym: 'white' },
      { chip: 'transit', label: 'In transit', title: 'Your parcel is on the move', body: 'Your rider is heading to you.', icon: '', sym: 'white' },
      { chip: 'delivered', label: 'Delivered', title: 'Delivered', body: 'Your parcel has arrived.', icon: 'ncard-icon--lime', sym: 'midnight' }
    ];
    let stage = -1;
    const notify = s => {
      const n = document.createElement('div');
      n.className = 'ncard';
      n.innerHTML = `<div class="ncard-icon ${s.icon}"><img src="assets/brand/symbol-${s.sym}.svg" width="250" height="200" alt=""></div>
        <div class="ncard-body"><small>ERAN · now</small><b>${s.title}</b><span class="chip chip--${s.chip}"><i></i><em>${s.label}</em></span></div>`;
      $$('.ncard', stack).forEach(old => gsap.to(old, { y: -24, scale: .92, opacity: 0, duration: T.base, ease: 'eOut', onComplete: () => old.remove() }));
      stack.append(n);
      gsap.fromTo(n, { scale: .8, opacity: 0, y: 20 }, { scale: 1, opacity: 1, y: 0, duration: T.base, ease: 'back.out(1.7)' });
    };
    const setStage = s => {
      if (s === stage) return;
      stage = s;
      const st = STAGES[s];
      chip.className = 'chip tcard-chip chip--' + st.chip;
      $('em', chip).textContent = st.label;
      gsap.fromTo(chip, { scale: .8 }, { scale: 1, duration: T.base, ease: 'back.out(2.2)' });
      steps.forEach((li, i) => {
        li.classList.toggle('is-done', i < s || (s === 3 && i === 3) || (i === 0));
        li.classList.toggle('is-now', i === s && s < 3 && i !== 0);
      });
      $('time', steps[3]).textContent = s === 3 ? '12:34' : '—';
      notify(st);
    };
    const st = { p: 0 };
    const render = () => {
      const p = st.p;
      const pt = route.getPointAtLength(p * len);
      marker.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
      route.style.strokeDashoffset = len * (1 - p);
      bar.style.transform = `scaleX(${p})`;
      eta.textContent = Math.max(0, Math.round(24 * (1 - p)));
      setStage(p >= .999 ? 3 : p >= .22 ? 2 : p >= .08 ? 1 : 0);
    };
    render();
    const loop = gsap.timeline({ repeat: -1, paused: true, onRepeat: () => { stage = -1; } })
      .set(st, { p: 0, onComplete: render })
      .to(st, { p: .1, duration: RM ? 0 : 2, ease: 'eAmb', onUpdate: render }, '+=1')
      .to(st, { p: 1, duration: RM ? 0 : 11, ease: 'none', onUpdate: render }, '+=.8')
      .to({}, { duration: 3 });
    if (RM) { st.p = 1; stage = -1; render(); return; }
    ScrollTrigger.create({ trigger: '.track', start: 'top 70%', end: 'bottom top', onToggle: self => self.isActive ? loop.play() : loop.pause() });
  })();

  /* ==========================================================================
     Estimator + "sent" plane
     ========================================================================== */
  (() => {
    const km = $('#km'), kmOut = $('#km-out'), priceEl = $('#price'), sizeEl = $('#q-size'), etaEl = $('#q-eta');
    const sizes = $$('.size'), toggle = $('.toggle');
    let base = 1200, speed = 1;
    const shown = { v: 0 };
    const fmt = n => Math.round(n).toLocaleString('en-NG');
    const setP = r => r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%');
    const calc = (animate = true) => {
      const d = +km.value;
      const price = Math.round(((base + d * 120) * speed) / 10) * 10;
      kmOut.textContent = d + ' km';
      etaEl.textContent = '~' + Math.round(14 + d * 2 / (speed > 1 ? 1.7 : 1)) + ' min';
      setP(km);
      gsap.to(shown, { v: price, duration: animate ? T.base : 0, ease: 'eOut', onUpdate: () => (priceEl.textContent = fmt(shown.v)) });
    };
    sizes.forEach(b => b.addEventListener('click', () => {
      sizes.forEach(x => { x.classList.toggle('is-active', x === b); x.setAttribute('aria-checked', x === b); });
      base = +b.dataset.base; sizeEl.textContent = b.dataset.name;
      if (!RM) gsap.fromTo('.price', { scale: .92 }, { scale: 1, duration: T.base, ease: 'back.out(2)' });
      calc();
    }));
    km.addEventListener('input', () => calc());
    $$('button', toggle).forEach((b, i) => b.addEventListener('click', () => {
      $$('button', toggle).forEach(x => { x.classList.toggle('is-active', x === b); x.setAttribute('aria-selected', x === b); });
      toggle.classList.toggle('is-right', i === 1);
      speed = +b.dataset.speed; calc();
    }));
    calc(false);

    $('.swap').addEventListener('click', () => {
      const [a, b] = $$('.route-fields input');
      [a.value, b.value] = [b.value, a.value];
      if (!RM) gsap.fromTo($$('.route-fields .field'), { y: i => (i ? -8 : 8) }, { y: 0, duration: T.base, ease: 'back.out(2)' });
    });

    // riders earnings
    const trips = $('#trips'), tripsOut = $('#trips-out'), earn = $('#earn'), e = { v: 54000 };
    const calcEarn = () => {
      setP(trips); tripsOut.textContent = trips.value;
      gsap.to(e, { v: trips.value * 6 * 750, duration: T.base, ease: 'eOut', onUpdate: () => (earn.textContent = fmt(e.v)) });
    };
    trips.addEventListener('input', calcEarn); setP(trips);

    // "sent" confirmation: the plane flies in from bottom-left with a Lime trail
    const go = $('.quote-go'), plane = $('.sent-plane'), toast = $('.toast');
    let busy = false;
    go.addEventListener('click', () => {
      if (busy) return; busy = true;
      const r = go.getBoundingClientRect();
      const txt = $('.btn-text', go);
      go.classList.add('is-sent'); txt.textContent = 'Sent!';
      if (!RM) {
        gsap.timeline()
          .set(plane, { opacity: 1, x: r.left + 20, y: r.top - 10, scale: .6, rotate: 0 })
          .to(plane, { duration: 1.2, ease: 'power2.in',
            keyframes: { x: [r.left + 20, r.left + r.width * .5, innerWidth * .8, innerWidth + 120], y: [r.top - 10, r.top - 80, innerHeight * .2, -140], scale: [.6, 1, 1.15, 1.2], easeEach: 'none' } })
          .set(plane, { opacity: 0 });
      }
      setTimeout(() => toast.classList.add('is-on'), RM ? 0 : 900);
      setTimeout(() => { toast.classList.remove('is-on'); go.classList.remove('is-sent'); txt.textContent = 'Send a package'; busy = false; }, 4600);
    });
  })();

  /* ---------- stats ---------- */
  $$('[data-count]').forEach(el => {
    const to = +el.dataset.count, dec = +(el.dataset.dec || 0), o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: () => gsap.to(o, { v: to, duration: RM ? 0 : 1.6, ease: 'eOut', onUpdate: () => (el.textContent = o.v.toLocaleString('en-NG', { minimumFractionDigits: dec, maximumFractionDigits: dec })) })
    });
  });

  /* ---------- riders art ---------- */
  if (!RM) {
    gsap.fromTo('.riders-art .big', { xPercent: -30, rotate: -4 }, { xPercent: 0, rotate: 0, ease: 'none', scrollTrigger: { trigger: '.riders', start: 'top bottom', end: 'center center', scrub: .6 } });
    gsap.fromTo('.riders-art .sun', { scale: .5 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.riders', start: 'top bottom', end: 'center center', scrub: .6 } });
    gsap.to('.riders-art .helmet', { y: -10, rotation: 6, duration: T.ambient / 2, ease: 'eAmb', yoyo: true, repeat: -1 });
    gsap.to('.riders-art .bag', { y: -8, rotation: -5, duration: T.ambient / 2, ease: 'eAmb', yoyo: true, repeat: -1, delay: .5 });
    gsap.fromTo('.cta-art .cust', { yPercent: 20 }, { yPercent: -4, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    gsap.fromTo('.cta-art .phone', { yPercent: 30, rotate: 4 }, { yPercent: 0, rotate: -8, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    gsap.fromTo('.foot-mark img', { yPercent: 100 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.foot-mark', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  }

  /* ==========================================================================
     Testimonials: drag with inertia
     ========================================================================== */
  (() => {
    const vp = $('.q-viewport'), track = $('.q-track');
    let x = 0, start = 0, sx = 0, vel = 0, last = 0, lastT = 0, down = false, moved = false;
    const xTo = gsap.quickTo(track, 'x', { duration: .6, ease: 'eOut' });
    const min = () => Math.min(0, vp.offsetWidth - track.scrollWidth);
    const clamp = v => gsap.utils.clamp(min(), 0, v);
    vp.addEventListener('pointerdown', e => { down = true; moved = false; start = e.clientX; sx = x; last = e.clientX; lastT = performance.now(); vel = 0; vp.classList.add('is-dragging'); });
    window.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - start;
      if (Math.abs(dx) > 4) moved = true;
      const now = performance.now();
      vel = (e.clientX - last) / Math.max(now - lastT, 1); last = e.clientX; lastT = now;
      const raw = sx + dx, lo = min();
      x = raw > 0 ? raw * .35 : raw < lo ? lo + (raw - lo) * .35 : raw;
      xTo(x);
    });
    window.addEventListener('pointerup', () => {
      if (!down) return; down = false; vp.classList.remove('is-dragging');
      x = clamp(x + vel * 320); xTo(x);
    });
    vp.addEventListener('click', e => { if (moved) e.preventDefault(); }, true);
    const step = () => ($('.q', track).offsetWidth + 24);
    $('.q-prev').addEventListener('click', () => { x = clamp(x + step()); xTo(x); });
    $('.q-next').addEventListener('click', () => { x = clamp(x - step()); xTo(x); });
    window.addEventListener('resize', () => { x = clamp(x); xTo(x); });
  })();

  /* ---------- FAQ ---------- */
  $$('.qa').forEach(qa => {
    const a = $('.qa-a', qa), q = $('.qa-q', qa);
    if (qa.classList.contains('is-open')) a.style.height = 'auto';
    a.addEventListener('transitionend', () => { if (qa.classList.contains('is-open')) a.style.height = 'auto'; });
    q.addEventListener('click', () => {
      const open = qa.classList.contains('is-open');
      $$('.qa.is-open').forEach(o => {
        const oa = $('.qa-a', o);
        oa.style.height = oa.scrollHeight + 'px'; void oa.offsetHeight; oa.style.height = '0px';
        o.classList.remove('is-open'); $('.qa-q', o).setAttribute('aria-expanded', 'false');
      });
      if (!open) {
        qa.classList.add('is-open'); q.setAttribute('aria-expanded', 'true');
        a.style.height = a.scrollHeight + 'px';
      }
      setTimeout(() => ScrollTrigger.refresh(), 650);
    });
  });

  /* ---------- promo + confetti ---------- */
  const canvas = $('.confetti'), ctx = canvas.getContext('2d');
  let parts = [], raf = 0;
  const COLORS = ['#BAEE3F', '#7E4CFD', '#0F0934', '#FFD36B', '#D9C9FF', '#FFFFFF'];
  const resizeCanvas = () => { const d = Math.min(devicePixelRatio, 2); canvas.width = innerWidth * d; canvas.height = innerHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  resizeCanvas(); window.addEventListener('resize', resizeCanvas);
  function burst(x, y) {
    if (RM) return;
    for (let i = 0; i < 140; i++) {
      const a = -Math.PI / 2 + (Math.random() - .5) * Math.PI * 1.1, s = 6 + Math.random() * 10;
      parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, w: 6 + Math.random() * 8, h: 4 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: COLORS[i % COLORS.length], life: 0 });
    }
    if (!raf) tick();
  }
  function tick() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(p => p.life < 160 && p.y < innerHeight + 40);
    parts.forEach(p => {
      p.life++; p.vy += .32; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      ctx.strokeStyle = '#0F0934'; ctx.lineWidth = 1.2;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    });
    raf = parts.length ? requestAnimationFrame(tick) : (ctx.clearRect(0, 0, innerWidth, innerHeight), 0);
  }
  $('.promo-copy').addEventListener('click', async e => {
    const b = e.currentTarget, r = b.getBoundingClientRect();
    try { await navigator.clipboard.writeText('ERANFIRST'); } catch (_) { /* clipboard blocked; still celebrate */ }
    b.textContent = 'Copied!';
    burst(r.left + r.width / 2, r.top + r.height / 2);
    setTimeout(() => (b.textContent = 'Copy code'), 2200);
  });


  /* ---------- scroll velocity: marquees surge + flip ---------- */
  if (!RM) {
    let dir = 1;
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: self => {
        const v = self.getVelocity();
        if (self.direction) dir = self.direction;
        marquees.forEach(tw => {
          tw.timeScale(dir * (1 + Math.min(Math.abs(v) / 120, 14)));
          gsap.to(tw, { timeScale: dir, duration: 1.2, ease: 'power2.out', overwrite: true });
        });
      }
    });
  }

  /* ---------- click anywhere: launch a paper plane ---------- */
  if (!RM) {
    let live = 0;
    document.addEventListener('click', e => {
      if (live > 12 || e.target.closest('a, button, input, label, form, .q-viewport, .nav, .mmenu, .size, .toggle')) return;
      const dark = !!e.target.closest('[data-nav-dark], .quote, .help, .unbox-say');
      const el = document.createElement('div');
      el.className = 'fly';
      el.innerHTML = `<i></i><img src="assets/brand/symbol-${dark ? 'lime' : 'violet'}.svg" alt="">`;
      document.body.append(el); live++;
      const sx = e.clientX - 22, sy = e.clientY - 18, tx = sx + gsap.utils.random(260, 520), ty = sy - gsap.utils.random(320, 560);
      gsap.timeline({ onComplete: () => { el.remove(); live--; } })
        .fromTo(el, { x: sx, y: sy, scale: 0, rotate: -20 }, { scale: 1, rotate: 0, duration: .25, ease: 'back.out(3)' })
        .to(el, { keyframes: { x: [sx, sx - 30, (sx + tx) / 2, tx], y: [sy, sy + 20, sy - 120, ty] }, duration: 1.1, ease: 'power2.in' }, .15)
        .to(el, { opacity: 0, duration: .25 }, 1);
    });
  }

  /* ---------- waving crew card ---------- */
  if (!RM) gsap.to('.q--wave img', { rotation: 3, scale: 1.03, duration: 1, ease: 'eAmb', yoyo: true, repeat: -1, transformOrigin: '50% 100%' });

  /* ==========================================================================
     Chrome: nav, progress, menu, cursor, magnetic
     ========================================================================== */
  const nav = $('#nav');
  let lastY = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => {
      gsap.set('.progress', { scaleX: self.progress });
      const y = self.scroll();
      nav.classList.toggle('is-hidden', y > 300 && y > lastY && !document.body.classList.contains('menu-open'));
      nav.classList.toggle('is-compact', y > 80);
      lastY = y;
    }
  });
  const dark = new Set();
  $$('[data-nav-dark]').forEach(sec => ScrollTrigger.create({
    trigger: sec, start: 'top 46px', end: 'bottom 46px',
    onToggle: self => { self.isActive ? dark.add(sec) : dark.delete(sec); nav.classList.toggle('is-dark', dark.size > 0); }
  }));

  // sliding lime highlight inside the nav pill
  (() => {
    const pill = $('.nav-pill'), ind = $('.nav-ind'), links = $$('.nav-links a');
    const moveTo = a => {
      const pr = pill.getBoundingClientRect(), r = a.getBoundingClientRect();
      ind.style.width = r.width + 'px'; ind.style.transform = `translateX(${r.left - pr.left}px)`; ind.style.opacity = 1;
      links.forEach(l => l.classList.toggle('is-hot', l === a));
    };
    links.forEach(a => a.addEventListener('mouseenter', () => moveTo(a)));
    pill.addEventListener('mouseleave', () => { ind.style.opacity = 0; links.forEach(l => l.classList.remove('is-hot')); });
  })();

  // riders-live counter drifts like a real feed
  (() => {
    const el = $('[data-live]'), o = { v: 1204 };
    setInterval(() => {
      if (document.hidden) return;
      gsap.to(o, { v: gsap.utils.clamp(1100, 1320, o.v + gsap.utils.random(-14, 18, 1)), duration: 1.2, ease: 'eOut', onUpdate: () => (el.textContent = Math.round(o.v).toLocaleString('en-NG')) });
    }, 2600);
  })();

  const burger = $('.nav-burger');
  burger.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', open);
    $('.mmenu').setAttribute('aria-hidden', !open);
    if (lenis) open ? lenis.stop() : lenis.start();
  });
  $$('.mmenu a').forEach(a => a.addEventListener('click', () => { burger.setAttribute('aria-expanded', 'false'); lenis && lenis.start(); }));

  if (FINE && !RM) {
    const cur = $('.cursor'), ring = $('.cursor-ring'), dot = $('.cursor-dot');
    const rx = gsap.quickTo(ring, 'x', { duration: .45, ease: 'eOut' }), ry = gsap.quickTo(ring, 'y', { duration: .45, ease: 'eOut' });
    const dx = gsap.quickTo(dot, 'x', { duration: .08 }), dy = gsap.quickTo(dot, 'y', { duration: .08 });
    window.addEventListener('mousemove', e => { rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY); });
    document.addEventListener('mouseover', e => {
      const t = e.target;
      cur.classList.toggle('is-drag', !!t.closest('[data-cursor="drag"]'));
      cur.classList.toggle('is-link', !t.closest('[data-cursor="drag"]') && !!t.closest('a, button, input[type=range], .size'));
      cur.classList.toggle('on-dark', !!t.closest('[data-nav-dark], .quote, .help, .loader'));
    });
    document.addEventListener('mouseleave', () => gsap.to(cur, { opacity: 0, duration: T.fast }));
    document.addEventListener('mouseenter', () => gsap.to(cur, { opacity: 1, duration: T.fast }));

    $$('[data-magnetic]').forEach(el => {
      const xTo = gsap.quickTo(el, 'x', { duration: .5, ease: 'eOut' }), yTo = gsap.quickTo(el, 'y', { duration: .5, ease: 'eOut' });
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * .25); yTo((e.clientY - r.top - r.height / 2) * .35);
      });
      el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
    });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
