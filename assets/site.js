/* site.js — 多頁版共用互動：導覽列、手機選單、進場動畫、詢盤表單、平滑捲動 */
(function () {
  'use strict';
  var nav = document.querySelector('.site-nav');

  // 導覽列：捲超過 40px 變淺底；超過 400px 且往下捲就藏起來
  if (nav) {
    var lastY = window.scrollY;
    var onScroll = function () {
      var y = window.scrollY;
      nav.classList.toggle('is-scrolled', y > 40);
      nav.classList.toggle('nav-hidden', y > 400 && y > lastY && !nav.classList.contains('is-open'));
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var burger = nav.querySelector('.burger');
    if (burger) {
      burger.addEventListener('click', function () {
        nav.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', nav.classList.contains('is-open') ? 'true' : 'false');
      });
      nav.querySelectorAll('.mobile-nav a').forEach(function (a) {
        a.addEventListener('click', function () { nav.classList.remove('is-open'); });
      });
    }
  }

  // 進場動畫（同原站：threshold .15、下緣 -40px）
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // 詢盤表單：目前用 mailto 開郵件客戶端（之後換 Web3Forms / Formspree）
  var form = document.getElementById('inquiry-form');
  if (form) {
    var status = form.querySelector('.form-status');
    var to = form.getAttribute('data-to');
    // 從產品頁帶過來的 ?product=... 自動選好
    var q = new URLSearchParams(location.search).get('product');
    if (q && form.elements.product) {
      Array.prototype.forEach.call(form.elements.product.options, function (o) { if (o.value === q) o.selected = true; });
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements;
      var name = f.name.value.trim(), email = f.email.value.trim();
      if (!name || !email) {
        status.textContent = form.getAttribute('data-msg-invalid');
        status.className = 'form-status text-[13px] status-err';
        return;
      }
      var subject = encodeURIComponent('Inquiry — ' + (f.product.value || 'Bathtub') + ' — ' + name);
      var body = encodeURIComponent([
        'Name: ' + name, 'Company: ' + f.company.value, 'Email: ' + email,
        'Country: ' + f.country.value, 'Product: ' + f.product.value, '', f.message.value
      ].join('\n'));
      window.location.href = 'mailto:' + to + '?subject=' + subject + '&body=' + body;
      status.textContent = form.getAttribute('data-msg-sent');
      status.className = 'form-status text-[13px] status-ok';
    });
  }

  // Lenis 平滑捲動（同原站 lerp 0.1）
  if (typeof Lenis === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
  }
})();
