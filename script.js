(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");

  /* ---------- header on scroll ---------- */
  var header = document.getElementById("header");
  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Закрити меню" : "Відкрити меню");
    document.body.style.overflow = open ? "hidden" : "";
  }
  burger.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
  nav.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });

  /* ---------- reveal + counters ---------- */
  function countUp(el) {
    var target = +el.dataset.count, start = null, dur = 1600;
    function step(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
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
        e.target.style.transitionDelay = Math.min(siblings.indexOf(e.target), 5) * 90 + "ms";
        e.target.classList.add("is-in");
        e.target.querySelectorAll("[data-count]").forEach(countUp);
        io.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-in"); });
    document.querySelectorAll("[data-count]").forEach(function (el) { el.textContent = el.dataset.count; });
  }

  /* ---------- schedule ---------- */
  var schedule = [
    [["07:30", "Функціональний тренінг", "Ранкова група"], ["12:00", "Важка атлетика", "Техніка ривка"], ["18:30", "Пауерліфтинг", "Присід"], ["20:00", "Мобільність", "Відновлення"]],
    [["08:00", "Важка атлетика", "Техніка поштовху"], ["17:00", "Функціональний тренінг", "Інтенсив"], ["19:00", "Пауерліфтинг", "Жим лежачи"]],
    [["07:30", "Функціональний тренінг", "Ранкова група"], ["12:00", "Важка атлетика", "Силова база"], ["18:30", "Пауерліфтинг", "Станова тяга"], ["20:00", "Мобільність", "Відновлення"]],
    [["08:00", "Важка атлетика", "Техніка ривка"], ["17:00", "Функціональний тренінг", "Інтенсив"], ["19:00", "Пауерліфтинг", "Присід"]],
    [["07:30", "Функціональний тренінг", "Ранкова група"], ["12:00", "Важка атлетика", "Комплекси"], ["18:30", "Функціональний тренінг", "Командний WOD"]],
    [["10:00", "Важка атлетика", "Відкритий помост"], ["12:00", "Функціональний тренінг", "Партнерське тренування"]],
    [["11:00", "Мобільність", "Розтяжка та відновлення"]]
  ];
  var timetable = document.getElementById("timetable");
  var tabs = document.querySelectorAll(".tab");

  function renderDay(i) {
    timetable.innerHTML = schedule[i].map(function (r, idx) {
      return '<li style="animation-delay:' + idx * 60 + 'ms"><time>' + r[0] + "</time><strong>" + r[1] + "</strong><span>" + r[2] + "</span></li>";
    }).join("");
    tabs.forEach(function (t, ti) {
      t.classList.toggle("is-active", ti === i);
      t.setAttribute("aria-selected", String(ti === i));
    });
  }
  tabs.forEach(function (t) { t.addEventListener("click", function () { renderDay(+t.dataset.day); }); });
  renderDay((new Date().getDay() + 6) % 7); // today, Monday = 0

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
})();
