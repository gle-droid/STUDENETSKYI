(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.remove("no-js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- text splitting for motion ---------- */
  function wrapWords(el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            var m = document.createElement("span"); m.className = "wm";
            var w = document.createElement("span"); w.className = "wi"; w.textContent = part;
            w.style.setProperty("--i", i++); m.appendChild(w); frag.appendChild(m);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
      });
    })(el);
  }
  document.querySelectorAll(".split").forEach(wrapWords);

  var ci = 0;
  document.querySelectorAll(".hero__title .line > span").forEach(function (span) {
    var text = span.textContent; span.textContent = "";
    span.setAttribute("aria-hidden", "true");
    for (var k = 0; k < text.length; k++) {
      var c = document.createElement("span"); c.className = "ch"; c.textContent = text[k];
      c.style.setProperty("--i", ci++); span.appendChild(c);
    }
  });
  var h1 = document.querySelector(".hero__title");
  if (h1) h1.setAttribute("aria-label", "Сила без компромісів");

  document.querySelectorAll(".btn, .nav a").forEach(function (el) {
    var t = el.textContent.trim(); el.textContent = "";
    var r = document.createElement("span"); r.className = "roll";
    var s = document.createElement("span"); s.textContent = t;
    r.appendChild(s); el.appendChild(r);
  });

  /* ---------- intro: lights on ---------- */
  requestAnimationFrame(function () { requestAnimationFrame(function () { document.body.classList.add("is-loaded"); }); });

  /* ---------- smooth wheel scrolling (desktop) ---------- */
  var smooth = { on: false, y: window.scrollY, target: window.scrollY, raf: 0 };
  function maxScroll() { return document.documentElement.scrollHeight - window.innerHeight; }
  function smoothStep() {
    smooth.y += (smooth.target - smooth.y) * 0.085;
    if (Math.abs(smooth.target - smooth.y) < 0.4) smooth.y = smooth.target;
    window.scrollTo(0, smooth.y);
    smooth.raf = smooth.y !== smooth.target ? requestAnimationFrame(smoothStep) : 0;
  }
  function smoothTo(y) {
    smooth.target = Math.max(0, Math.min(maxScroll(), y));
    if (!smooth.raf) { smooth.y = window.scrollY; smooth.raf = requestAnimationFrame(smoothStep); }
  }
  if (finePointer && !reduce) {
    smooth.on = true;
    root.classList.add("has-smooth");
    window.addEventListener("wheel", function (e) {
      if (e.ctrlKey || document.body.style.overflow === "hidden") return;
      e.preventDefault();
      var d = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY;
      if (!smooth.raf) smooth.target = window.scrollY;
      smoothTo(smooth.target + d);
    }, { passive: false });
    // keep in sync with keyboard / scrollbar
    window.addEventListener("scroll", function () { if (!smooth.raf) { smooth.y = smooth.target = window.scrollY; } }, { passive: true });
  }

  /* anchors with easing */
  function goTo(id) {
    var el = id === "#top" ? document.body : document.querySelector(id);
    if (!el) return;
    var y = id === "#top" ? 0 : el.getBoundingClientRect().top + window.scrollY - 60;
    if (smooth.on) smoothTo(y); else window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
  }
  document.querySelectorAll('a[href^="#"]:not(.cm__cta)').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      var el = id === "#top" ? document.body : document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var y = id === "#top" ? 0 : el.getBoundingClientRect().top + window.scrollY - 60;
      if (smooth.on) smoothTo(y); else window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    });
  });

  /* ---------- header, progress, statement ---------- */
  var header = document.getElementById("header");
  var progress = document.getElementById("progress");
  var statement = document.querySelector(".statement__text");
  var words = [];
  if (statement) {
    (function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement("span"); s.className = "w"; s.textContent = part; frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) split(n);
      });
    })(statement);
    words = statement.querySelectorAll(".w");
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 40);
      progress.style.transform = "scaleX(" + (y / Math.max(1, maxScroll())) + ")";
      if (words.length) {
        var r = statement.getBoundingClientRect(), vh = window.innerHeight;
        var p = reduce ? 1 : (vh * 0.85 - r.top) / (vh * 0.55);
        var lit = Math.round(Math.max(0, Math.min(1, p)) * words.length);
        var sec = statement.closest(".statement");
        sec.style.setProperty("--sp", Math.max(-0.5, Math.min(1.5, p)).toFixed(3));
        sec.classList.toggle("is-lit", p > 0.02);
        for (var i = 0; i < words.length; i++) words[i].classList.toggle("is-lit", i < lit);
      }
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------- mobile menu ---------- */
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Закрити меню" : "Відкрити меню");
    document.body.style.overflow = open ? "hidden" : "";
  }
  burger.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
  nav.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });

  /* ---------- reveal + counters ---------- */
  function countUp(el) {
    var target = +el.dataset.count, start = null, dur = target >= 1000 ? 2400 : 2000;
    function fmt(v) { return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F"); }
    if (reduce) { el.textContent = fmt(target); return; }
    function step(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / dur, 1);
      el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - p, 4))));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var siblings = Array.prototype.filter.call(e.target.parentElement.children, function (c) { return c.classList.contains("reveal"); });
        e.target.style.transitionDelay = Math.min(siblings.indexOf(e.target), 5) * 110 + "ms";
        e.target.classList.add("is-in");
        e.target.querySelectorAll("[data-count]").forEach(countUp);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-in"); });
    document.querySelectorAll("[data-count]").forEach(function (el) { el.textContent = el.dataset.count.replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F"); });
  }

  /* ---------- pointer light: cursor glow + card spotlights ---------- */
  if (finePointer && !reduce) {
    var glow = document.getElementById("cursorGlow");
    var gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy, glowRaf = 0;
    function glowStep() {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      glow.style.transform = "translate3d(" + gx + "px," + gy + "px,0)";
      glowRaf = (Math.abs(tx - gx) + Math.abs(ty - gy) > 0.5) ? requestAnimationFrame(glowStep) : 0;
    }
    window.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      glow.classList.add("is-on");
      if (!glowRaf) glowRaf = requestAnimationFrame(glowStep);
    }, { passive: true });
    document.addEventListener("pointerleave", function () { glow.classList.remove("is-on"); });

    document.querySelectorAll(".program, .price, .coach__photo, .form, .result").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (e.clientX - r.left) + "px");
        el.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  /* ---------- hero light: dust in the beam + parallax ---------- */
  var hero = document.getElementById("hero");
  var canvas = document.getElementById("heroFx");
  var beam = document.querySelector(".hero__beam");
  if (canvas && canvas.getContext && !reduce) {
    var ctx = canvas.getContext("2d"), W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var motes = [], smoke = [], heroVisible = true, fxRaf = 0, mouseX = 0.5;
    function beamGeom() {
      var r = beam.getBoundingClientRect(), hr = hero.getBoundingClientRect();
      return { cx: r.left - hr.left + r.width / 2, top: r.top - hr.top, w: r.width, h: r.height };
    }
    var geom = null;
    function resize() {
      if (hero.clientWidth === W && Math.abs(hero.clientHeight - H) < 120) return;
      W = hero.clientWidth; H = hero.clientHeight; geom = null;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function makeMote() { return { u: rnd(-1, 1), v: rnd(0, 1), s: rnd(0.4, 1.8), sp: rnd(0.0002, 0.0009), dr: rnd(-0.0006, 0.0006), tw: rnd(0, 6.28) }; }
    function makeSmoke() { return { u: rnd(-0.8, 0.8), v: rnd(0.25, 1), r: rnd(120, 300), sp: rnd(0.00008, 0.0002), a: rnd(0.04, 0.09), ph: rnd(0, 6.28) }; }
    var lite = !finePointer;
    for (var i = 0; i < (lite ? 60 : 110); i++) motes.push(makeMote());
    for (var j = 0; j < (lite ? 5 : 9); j++) smoke.push(makeSmoke());
    // one pre-rendered soft puff instead of a new gradient per puff per frame
    var puff = document.createElement("canvas"); puff.width = puff.height = 128;
    var pg = puff.getContext("2d"), pgr = pg.createRadialGradient(64, 64, 0, 64, 64, 64);
    pgr.addColorStop(0, "rgba(200,30,30,1)"); pgr.addColorStop(1, "rgba(200,30,30,0)");
    pg.fillStyle = pgr; pg.fillRect(0, 0, 128, 128);
    resize();
    window.addEventListener("resize", resize);

    var t0 = performance.now();
    function frame(now) {
      fxRaf = 0;
      if (!heroVisible) return;
      var t = now - t0, g = geom || (geom = beamGeom());
      var intro = Math.min(1, Math.max(0, (t - 1800) / 1500));
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      // smoke
      smoke.forEach(function (s) {
        s.v -= s.sp; if (s.v < 0.15) { s.v = 1.05; s.u = rnd(-0.8, 0.8); }
        var y = g.top + s.v * g.h, half = g.w / 2 * (0.12 + 0.88 * s.v);
        var x = g.cx + s.u * half + Math.sin(t / 3000 + s.ph) * 40;
        ctx.globalAlpha = s.a * intro; ctx.drawImage(puff, x - s.r, y - s.r, s.r * 2, s.r * 2); ctx.globalAlpha = 1;
      });
      // dust motes inside the cone
      motes.forEach(function (m) {
        m.v -= m.sp; m.u += m.dr;
        if (m.v < 0 || Math.abs(m.u) > 1) { var n = makeMote(); n.v = 1; Object.assign(m, n); }
        var y = g.top + m.v * g.h, half = g.w / 2 * (0.12 + 0.88 * m.v);
        var x = g.cx + m.u * half;
        var edge = 1 - Math.abs(m.u);
        var a = (0.25 + 0.75 * Math.abs(Math.sin(t / 900 + m.tw))) * edge * (1 - m.v * 0.6) * intro;
        ctx.fillStyle = "rgba(255," + (190 + (m.s * 30 | 0)) + ",170," + a.toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(x, y, m.s, 0, 6.283); ctx.fill();
      });
      ctx.globalCompositeOperation = "source-over";
      fxRaf = requestAnimationFrame(frame);
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        heroVisible = en[0].isIntersecting;
        if (heroVisible && !fxRaf) fxRaf = requestAnimationFrame(frame);
      }).observe(hero);
    }
    fxRaf = requestAnimationFrame(frame);
  }


  /* ---------- coach modal: the photo glides out of the card ---------- */
  var cm = document.getElementById("coachModal");
  if (cm) {
    var cmPhoto = document.getElementById("cmPhoto"), cmRole = document.getElementById("cmRole"),
        cmName = document.getElementById("cmName"), cmBody = document.getElementById("cmBody"),
        cmCta = document.getElementById("cmCta"), cmClose = cm.querySelector(".cm__close");
    var activeCard = null, busy = false;
    var EASE_OUT = "cubic-bezier(.22, 1, .36, 1)", EASE_IO = "cubic-bezier(.65, 0, .35, 1)";
    function delta(from, to) {
      return "translate(" + (from.left - to.left) + "px," + (from.top - to.top) + "px) scale(" + (from.width / to.width) + ")";
    }
    function openCoach(card) {
      if (busy || activeCard) return;
      busy = true; activeCard = card;
      var src = card.querySelector(".coach__photo");
      cmPhoto.innerHTML = src.innerHTML;
      cmRole.textContent = card.querySelector(".coach__role").textContent;
      cmName.textContent = card.querySelector(".coach__name").textContent;
      cmBody.innerHTML = card.querySelector(".coach__more").innerHTML;
      cm.hidden = false; cm.scrollTop = 0;
      document.body.style.overflow = "hidden";
      var from = src.getBoundingClientRect(), to = cmPhoto.getBoundingClientRect();
      src.style.visibility = "hidden";
      requestAnimationFrame(function () { cm.classList.add("is-open"); });
      var anim = cmPhoto.animate([{ transform: delta(from, to) }, { transform: "none" }],
        { duration: reduce ? 1 : 1000, easing: EASE_OUT });
      anim.onfinish = function () { busy = false; try { cmClose.focus({ preventScroll: true }); } catch (e) {} };
    }
    function closeCoach(after) {
      if (busy || !activeCard) return;
      busy = true;
      var card = activeCard, src = card.querySelector(".coach__photo");
      var to = src.getBoundingClientRect(), from = cmPhoto.getBoundingClientRect();
      cm.classList.remove("is-open"); cm.classList.add("is-closing");
      var anim = cmPhoto.animate([{ transform: "none" }, { transform: delta(to, from) }],
        { duration: reduce ? 1 : 800, easing: EASE_IO, fill: "forwards" });
      anim.onfinish = function () {
        src.style.visibility = "";
        cm.hidden = true; cm.classList.remove("is-closing"); anim.cancel();
        document.body.style.overflow = "";
        activeCard = null; busy = false;
        if (after) after(); else { try { card.focus({ preventScroll: true }); } catch (e) {} }
      };
    }
    document.querySelectorAll(".coach").forEach(function (card) {
      card.addEventListener("click", function () { openCoach(card); });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCoach(card); }
      });
    });
    cm.querySelectorAll("[data-close]").forEach(function (el) { el.addEventListener("click", function () { closeCoach(); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && activeCard) closeCoach(); });
    cmCta.addEventListener("click", function (e) { e.preventDefault(); closeCoach(function () { goTo("#signup"); }); });
  }

  /* ---------- schedule ---------- */
  var schedule = [
    [["16:00", "Дитяча група", "Основи та координація"], ["17:30", "Спортивна група", "Ривок"], ["19:00", "Доросла група", "Техніка ривка"]],
    [["16:00", "Дитяча група", "Загальна фізична підготовка"], ["17:30", "Спортивна група", "Поштовх"], ["19:00", "Доросла група", "Присід і тяги"]],
    [["16:00", "Дитяча група", "Основи та координація"], ["17:30", "Спортивна група", "Ривок"], ["19:00", "Доросла група", "Техніка поштовху"]],
    [["16:00", "Дитяча група", "Загальна фізична підготовка"], ["17:30", "Спортивна група", "Поштовх"], ["19:00", "Доросла група", "Присід і тяги"]],
    [["16:00", "Дитяча група", "Ігрове тренування"], ["17:30", "Спортивна група", "Класичні вправи"], ["19:00", "Доросла група", "Ривок і поштовх"]],
    [["10:00", "Спортивна група", "Прикидка, максимальні спроби"], ["12:00", "Доросла група", "Відкритий поміст"]],
    [["—", "Вихідний", "Відновлення"]]
  ];
  var timetable = document.getElementById("timetable");
  var tabs = document.querySelectorAll(".tab");
  function renderDay(i) {
    timetable.innerHTML = schedule[i].map(function (r, idx) {
      return '<li style="animation-delay:' + idx * 70 + 'ms"><time>' + r[0] + "</time><strong>" + r[1] + "</strong><span>" + r[2] + "</span></li>";
    }).join("");
    tabs.forEach(function (t, ti) {
      t.classList.toggle("is-active", ti === i);
      t.setAttribute("aria-selected", String(ti === i));
    });
  }
  tabs.forEach(function (t) { t.addEventListener("click", function () { renderDay(+t.dataset.day); }); });
  renderDay((new Date().getDay() + 6) % 7);

  /* ---------- form ---------- */
  var form = document.getElementById("form");
  var status = document.getElementById("formStatus");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = true;
    ["name", "phone"].forEach(function (n) {
      var f = form.elements[n];
      var valid = n === "phone" ? f.value.replace(/\D/g, "").length >= 10 : f.value.trim().length > 1;
      f.classList.toggle("is-invalid", !valid);
      if (!valid) ok = false;
    });
    if (!ok) {
      status.className = "form__status";
      status.textContent = "Будь ласка, вкажіть ім'я та коректний номер телефону.";
      return;
    }
    // TODO: підключити відправку заявки (Telegram-бот / CRM / email)
    status.className = "form__status is-ok";
    status.textContent = "Дякуємо! Ми зв'яжемося з вами найближчим часом.";
    form.reset();
  });

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- 3D barbell: load three.js only after the page is shown ---------- */
  var bar3d = document.getElementById("bar3d");
  function webglOK() {
    try { var c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl"))); }
    catch (e) { return false; }
  }
  if (bar3d && bar3d.dataset.three && webglOK()) {
    root.classList.add("will-3d");
    var load3D = function () {
      var sc = document.createElement("script");
      sc.src = bar3d.dataset.three; sc.async = true;
      sc.onload = function () { if (window.initBarbell3D) window.initBarbell3D(); };
      sc.onerror = function () { root.classList.remove("will-3d"); };
      document.body.appendChild(sc);
    };
    var whenIdle = function () { (window.requestIdleCallback || function (f) { setTimeout(f, 200); })(load3D, { timeout: 1500 }); };
    if (document.readyState === "complete") whenIdle(); else window.addEventListener("load", whenIdle);
  }
})();
