/* ═══════════════════════════════════════════════════════════
   LUMÉRA · интерактив сайта
   header · меню · reveal · scrollspy · слайдер · счётчики ·
   магнитные кнопки · параллакс · FAB · жидкий шёлк (Canvas) ·
   форма записи
   ═══════════════════════════════════════════════════════════ */
'use strict';

(() => {
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ─────────── 1. Header: стекло при скролле ─────────── */
  const header = $('#header');
  const onScrollHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 14);
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ─────────── 2. Мобильное меню ─────────── */
  const burger = $('#burger');
  const menu   = $('#mobileMenu');

  const setMenu = (open) => {
    burger.classList.toggle('is-open', open);
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('no-scroll', open);
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  };

  burger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  $$('.mobile-menu a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ─────────── 3. Появление блоков при скролле ─────────── */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  $$('.reveal').forEach((el) => revealObserver.observe(el));

  /* ─────────── 4. Scrollspy для навигации ─────────── */
  const navLinks = $$('.nav__link');
  const spyTargets = ['hero', 'services', 'offers', 'about', 'reviews', 'contacts']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = `#${entry.target.id}`;
      navLinks.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === id));
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  spyTargets.forEach((s) => spy.observe(s));

  /* ─────────── 5. Слайдер услуг (scroll-snap) ─────────── */
  const track = $('#servicesTrack');
  if (track) {
    const prev    = $('#sliderPrev');
    const next    = $('#sliderNext');
    const counter = $('#sliderCount');
    const cards   = $$('.service-card', track);
    const behavior = prefersReduced ? 'auto' : 'smooth';

    const gap  = () => parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = () => cards[0].getBoundingClientRect().width + gap();
    const maxScroll = () => track.scrollWidth - track.clientWidth;

    const update = () => {
      const s   = step();
      const cur = Math.min(cards.length, Math.round(track.scrollLeft / s) + 1);
      counter.textContent =
        `${String(cur).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft >= maxScroll() - 4;
    };

    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior }));
    next.addEventListener('click', () => track.scrollBy({ left:  step(), behavior }));

    let ticking = false;
    track.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { update(); ticking = false; });
    }, { passive: true });

    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); track.scrollBy({ left:  step(), behavior }); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); track.scrollBy({ left: -step(), behavior }); }
    });

    /* drag-to-scroll для десктопа */
    let dragging = false, startX = 0, startLeft = 0;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      dragging = true; startX = e.clientX; startLeft = track.scrollLeft;
    });
    window.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      track.scrollLeft = startLeft - (e.clientX - startX);
    });
    window.addEventListener('pointerup', () => { dragging = false; });

    window.addEventListener('resize', update);
    update();
  }

  /* ─────────── 6. Счётчики статистики (старт и финиш синхронно) ─────────── */
  const fmt = (n) => n.toLocaleString('ru-RU');
  const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const COUNTER_DURATION = 1200; /* общая длительность, можно подкрутить */

  const runCounters = () => {
    const els = $$('[data-count]');
    if (!els.length) return;
    if (prefersReduced) {
      els.forEach((el) => { el.textContent = fmt(+el.dataset.count) + (el.dataset.suffix || ''); });
      return;
    }
    const t0 = performance.now(); /* единый момент старта для всех цифр */
    const tick = (now) => {
      const p = Math.min((now - t0) / COUNTER_DURATION, 1);
      const eased = easeOutExpo(p);
      els.forEach((el) => {
        el.textContent = fmt(Math.round(+el.dataset.count * eased)) + (el.dataset.suffix || '');
      });
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const statsBlock = $('.why__stats');
  if (statsBlock) {
    const counterObserver = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        counterObserver.disconnect();
        runCounters();
      }
    }, { threshold: 0.35 });
    counterObserver.observe(statsBlock);
  }

  /* ─────────── 7. Магнитные кнопки (десктоп) ─────────── */
  if (!prefersReduced && finePointer) {
    $$('.btn--primary, .btn--light, .fab__main').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / r.width;
        const y = (e.clientY - r.top - r.height / 2) / r.height;
        btn.style.transform = `translate(${x * 8}px, ${y * 6}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ─────────── 8. Параллакс hero-контента ─────────── */
  const heroContent = $('.hero__content');
  if (heroContent && !prefersReduced) {
    let pTick = false;
    window.addEventListener('scroll', () => {
      if (pTick) return;
      pTick = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y <= window.innerHeight) {
          heroContent.style.transform = `translateY(${y * 0.14}px)`;
          heroContent.style.opacity = String(Math.max(1 - y / (window.innerHeight * 0.9), 0));
        }
        pTick = false;
      });
    }, { passive: true });
  }

  /* ─────────── 9. FAB: связь в один клик ─────────── */
  const fab = $('#fabWrap');
  const fabToggle = $('#fabToggle');
  const isMobile = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  const setFab = (open) => {
    fab.classList.toggle('is-open', open);
    fabToggle.setAttribute('aria-expanded', String(open));
  };

  fabToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    setFab(!fab.classList.contains('is-open'));
  });

  /* закрытие по клику вне FAB (десктоп) или по тапу вне (мобильный) */
  document.addEventListener('click', (e) => {
    if (fab.classList.contains('is-open') && !fab.contains(e.target)) {
      setFab(false);
    }
  });

  /* на мобильных: закрытие при начале скролла */
  if (isMobile) {
    let fabScrollTimer = null;
    window.addEventListener('scroll', () => {
      if (!fab.classList.contains('is-open')) return;
      clearTimeout(fabScrollTimer);
      fabScrollTimer = setTimeout(() => setFab(false), 120);
    }, { passive: true });
  }

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setFab(false); });

  /* ─────────── 10. Год в подвале ─────────── */
  $('#year').textContent = new Date().getFullYear();

  /* ═══════════════════════════════════════════════════════
     11. «Жидкий шёлк» — Canvas-анимация первого экрана
     ═══════════════════════════════════════════════════════ */
  class LiquidSilk {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.isMobile = window.matchMedia('(max-width: 820px)').matches;
      this.dpr = Math.min(window.devicePixelRatio || 1, this.isMobile ? 1.25 : 1.75);
      this.time = Math.random() * 60;
      this.p  = { x: 0.5, y: 0.42 };
      this.pt = { x: 0.5, y: 0.42 };
      this.running = false;
      this.raf = null;

      this.layers = [
        { y: 0.34, amp: 0.060, f: 1.6, s:  0.22, rgb: [247, 240, 231], a: 0.85, bend: 0.35 },
        { y: 0.48, amp: 0.085, f: 1.2, s: -0.18, rgb: [236, 222, 206], a: 0.72, bend: 0.55 },
        { y: 0.60, amp: 0.090, f: 1.45,s:  0.16, rgb: [226, 205, 185], a: 0.64, bend: 0.80 },
        { y: 0.72, amp: 0.100, f: 1.0, s: -0.13, rgb: [210, 186, 163], a: 0.60, bend: 1.00 },
        { y: 0.84, amp: 0.085, f: 1.7, s:  0.20, rgb: [191, 164, 142], a: 0.62, bend: 1.15 },
      ];

      window.addEventListener('resize', this.debounce(() => this.resize(), 180));
      window.addEventListener('pointermove', (e) => this.onPointer(e), { passive: true });
      this.resize();
    }

    debounce(fn, ms) {
      let t;
      return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.w = rect.width;
      this.h = rect.height;
      this.canvas.width  = Math.round(this.w * this.dpr);
      this.canvas.height = Math.round(this.h * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.buildGradients();
      if (!this.running) this.draw();
    }

    buildGradients() {
      this.layers.forEach((layer) => {
        const g = this.ctx.createLinearGradient(0, 0, this.w, 0);
        const [r, gr, b] = layer.rgb;
        g.addColorStop(0,   this.rgba([Math.min(r + 26, 255), Math.min(gr + 22, 255), Math.min(b + 18, 255)], layer.a));
        g.addColorStop(0.5, this.rgba(layer.rgb, layer.a));
        g.addColorStop(1,   this.rgba([Math.max(r - 22, 0), Math.max(gr - 24, 0), Math.max(b - 26, 0)], layer.a));
        layer.grad = g;
      });
    }

    rgba([r, g, b], a) { return `rgba(${r}, ${g}, ${b}, ${a})`; }

    onPointer(e) {
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width) return;
      this.pt.x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      this.pt.y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    }

    drawRibbon(layer, i) {
      const { ctx, w, h, p, time } = this;
      const TAU = Math.PI * 2;
      const seg = this.isMobile ? 46 : 34;
      const breathe = 1 + Math.sin(time * 0.3 + i * 1.4) * 0.12;
      const pts = [];

      for (let x = -seg; x <= w + seg; x += seg) {
        const nx = x / w + (p.x - 0.5) * 0.05;
        const bend =
          Math.exp(-Math.pow(nx - p.x, 2) * 18) *
          (p.y - 0.5) * h * 0.34 * layer.bend;

        const y =
          layer.y * h +
          Math.sin(nx * TAU * layer.f + time * layer.s) * layer.amp * h * breathe +
          Math.sin(nx * TAU * layer.f * 2.3 + time * layer.s * 1.6 + i) * layer.amp * h * 0.3 +
          bend;

        pts.push({ x, y });
      }

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let k = 1; k < pts.length - 1; k++) {
        const xc = (pts[k].x + pts[k + 1].x) / 2;
        const yc = (pts[k].y + pts[k + 1].y) / 2;
        ctx.quadraticCurveTo(pts[k].x, pts[k].y, xc, yc);
      }
      ctx.lineTo(w + seg, h + seg);
      ctx.lineTo(-seg, h + seg);
      ctx.closePath();
      ctx.fillStyle = layer.grad;
      ctx.fill();
    }

    draw() {
      this.ctx.clearRect(0, 0, this.w, this.h);
      this.layers.forEach((layer, i) => this.drawRibbon(layer, i));
    }

    frame(now) {
      if (!this.running) return;
      const dt = Math.min((now - this.last) / 1000, 0.05);
      this.last = now;
      this.time += dt;

      const k = 1 - Math.exp(-dt * 2.4);
      this.p.x += (this.pt.x - this.p.x) * k;
      this.p.y += (this.pt.y - this.p.y) * k;

      this.draw();
      this.raf = requestAnimationFrame((t) => this.frame(t));
    }

    play() {
      if (this.running || prefersReduced) return;
      this.running = true;
      this.last = performance.now();
      this.raf = requestAnimationFrame((t) => this.frame(t));
    }

    pause() {
      this.running = false;
      if (this.raf) cancelAnimationFrame(this.raf);
    }

    boot() {
      if (prefersReduced) { this.draw(); return; }

      new IntersectionObserver(([entry]) => {
        entry.isIntersecting ? this.play() : this.pause();
      }, { rootMargin: '120px' }).observe(this.canvas);

      document.addEventListener('visibilitychange', () => {
        document.hidden ? this.pause() : this.play();
      });
    }
  }

  const silkCanvas = $('#silkCanvas');
  if (silkCanvas && silkCanvas.getContext) {
    new LiquidSilk(silkCanvas).boot();
  }

  /* ═══════════════════════════════════════════════════════
     12. Страница записи: маска, валидация, статус-окно
     ═══════════════════════════════════════════════════════ */
  const bookingForm = $('#bookingForm');
  if (bookingForm) {
    const nameInput   = $('#bookName');
    const phoneInput  = $('#bookPhone');
    const dateInput   = $('#bookDate');
    const checksWrap  = $('#bookServices');
    const agreeInput  = $('#bookAgree');
    const submitBtn   = $('#bookSubmit');
    const statusBox   = $('#formStatus');
    const statusTitle = statusBox.querySelector('.form__status-title');
    const statusText  = statusBox.querySelector('.form__status-text');
    const hpInput     = bookingForm.querySelector('.form__hp');

    const OPERATOR_CODES = ['17', '25', '29', '33', '44'];
    const NAME_RE = /^[A-Za-zА-Яа-яЁёІіЎў'’\- ]+$/;

    /* ── дата: не раньше сегодня и не дальше +90 дней ── */
    const isoDate = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const setMinDate = () => {
      const today = new Date();
      const max = new Date();
      max.setDate(max.getDate() + 90);
      dateInput.min = isoDate(today);
      dateInput.max = isoDate(max);
    };
    setMinDate();

    /* ── маска телефона: +375 (XX) XXX-XX-XX ── */
    const formatPhone = (value) => {
      let d = value.replace(/\D/g, '');
      if (d.startsWith('375')) d = d.slice(3);
      d = d.slice(0, 9);
      if (!d.length) return '';
      let out = `+375 (${d.slice(0, 2)}`;
      if (d.length >= 3) out += `) ${d.slice(2, 5)}`;
      if (d.length >= 6) out += `-${d.slice(5, 7)}`;
      if (d.length >= 8) out += `-${d.slice(7, 9)}`;
      return out;
    };
    phoneInput.addEventListener('input', () => {
      phoneInput.value = formatPhone(phoneInput.value);
    });

    /* ── ошибки рядом с полем ── */
    const setError = (el, msg) => {
      const wrap = el.closest('.field');
      if (!wrap) return;
      wrap.classList.add('is-error');
      const err = wrap.querySelector('.field__error');
      if (err && msg) err.textContent = msg;
      if (el.matches('input, select')) el.setAttribute('aria-invalid', 'true');
    };
    const clearError = (el) => {
      const wrap = el.closest('.field');
      if (!wrap) return;
      wrap.classList.remove('is-error');
      if (el.matches('input, select')) el.removeAttribute('aria-invalid');
    };

    /* ── валидаторы: возвращают текст ошибки или '' ── */
    const validateName = () => {
      const v = nameInput.value.trim().replace(/\s+/g, ' ');
      if (!v) return 'Пожалуйста, укажите ваше имя.';
      if (/\d/.test(v)) return 'В имени попали цифры — проверьте, пожалуйста.';
      if (!NAME_RE.test(v)) return 'Имя — только буквы, пробелы и дефисы, без спецсимволов.';
      if (v.length < 2) return 'Слишком короткое имя — минимум 2 символа.';
      return '';
    };
    const validatePhone = () => {
      const digits = phoneInput.value.replace(/\D/g, '');
      if (!digits) return 'Пожалуйста, укажите номер телефона.';
      if (digits.length !== 12) return 'Введите номер полностью: +375 (XX) XXX-XX-XX.';
      const code = digits.slice(3, 5);
      if (!OPERATOR_CODES.includes(code)) return 'Проверьте код оператора — например 29, 33 или 44.';
      return '';
    };
    const validateDate = () => {
      if (!dateInput.value) return '';
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const chosen = new Date(`${dateInput.value}T00:00:00`);
      if (chosen < today) return 'Выбранная дата уже в прошлом — выберите другой день.';
      return '';
    };
    const validateServices = () =>
      checksWrap.querySelector('input:checked') ? '' : 'Выберите хотя бы одно направление.';
    const validateAgree = () =>
      agreeInput.checked ? '' : 'Без согласия на обработку данных отправить заявку нельзя.';

    /* ── статус-окно под кнопкой ── */
    let statusTimer = null;
    const showStatus = (type, title, text) => {
      clearTimeout(statusTimer);
      statusBox.classList.remove('form__status--ok', 'form__status--err');
      statusBox.classList.add(type === 'ok' ? 'form__status--ok' : 'form__status--err');
      statusTitle.textContent = title;
      statusText.textContent = text;
      statusBox.hidden = false;
      /* перезапуск анимации выпадения */
      statusBox.style.animation = 'none';
      void statusBox.offsetWidth;
      statusBox.style.animation = '';
    };
    const hideStatus = () => { statusBox.hidden = true; };

    /* если все ошибки исправлены — убираем красное окно */
    const refreshStatus = () => {
      if (!statusBox.hidden &&
          statusBox.classList.contains('form__status--err') &&
          !bookingForm.querySelector('.field.is-error')) {
        hideStatus();
      }
    };

    /* ── живая проверка: ошибка гаснет, как только поле исправлено ── */
    nameInput.addEventListener('input', () => { if (!validateName()) clearError(nameInput); refreshStatus(); });
    phoneInput.addEventListener('input', () => { if (!validatePhone()) clearError(phoneInput); refreshStatus(); });
    dateInput.addEventListener('change', () => { if (!validateDate()) clearError(dateInput); refreshStatus(); });
    checksWrap.addEventListener('change', () => { if (!validateServices()) clearError(checksWrap); refreshStatus(); });
    agreeInput.addEventListener('change', () => { if (!validateAgree()) clearError(agreeInput); refreshStatus(); });

    /* мягкая проверка при уходе из поля (если оно не пустое) */
    nameInput.addEventListener('blur', () => {
      if (nameInput.value.trim()) { const m = validateName(); m ? setError(nameInput, m) : clearError(nameInput); }
    });
    phoneInput.addEventListener('blur', () => {
      if (phoneInput.value.trim()) { const m = validatePhone(); m ? setError(phoneInput, m) : clearError(phoneInput); }
    });

    /* ── полный прогон валидации ── */
    const runValidation = () => {
      const errors = [];
      const check = (el, msg) => {
        clearError(el);
        if (msg) { setError(el, msg); errors.push({ el, msg }); }
      };
      check(nameInput, validateName());
      check(phoneInput, validatePhone());
      check(dateInput, validateDate());
      check(checksWrap, validateServices());
      check(agreeInput, validateAgree());
      return errors;
    };

    /* ── отправка ── */
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (submitBtn.disabled) return; /* защита от двойного клика */

      /* бот попал в ловушку — тихо «отправляем» */
      if (hpInput && hpInput.value) {
        showStatus('ok', 'Заявка отправлена!', 'Спасибо! Мы скоро свяжемся с вами.');
        bookingForm.reset();
        setMinDate();
        return;
      }

      const errors = runValidation();

      if (errors.length) {
        showStatus(
          'err',
          'Пока не всё готово',
          errors.length === 1
            ? errors[0].msg
            : `Проверьте выделенные поля — их ${errors.length}.`
        );
        const first = errors[0].el;
        first.focus({ preventScroll: true });
        first.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'center' });
        return;
      }

      hideStatus();
      submitBtn.classList.add('is-loading');
      submitBtn.disabled = true;

      /* сюда позже подключится реальная отправка (backend / Telegram-бот) */
      setTimeout(() => {
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
        showStatus(
          'ok',
          'Заявка отправлена!',
          'Спасибо! Администратор свяжется с вами в течение часа в рабочее время (10:00–22:00).'
        );
        bookingForm.reset();
        setMinDate();
        statusBox.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'nearest' });
        statusTimer = setTimeout(hideStatus, 10000); /* авто-скрытие успеха */
      }, 1100);
    });
  }
})();
/* Безопасный плавный скролл для якорных ссылок (взамен багованного CSS) */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#' || targetId === '#main') return;
    const targetEl = document.querySelector(targetId);
    if (targetEl) {
      e.preventDefault();
      targetEl.scrollIntoView({ behavior: 'smooth' });
    }
  });
});