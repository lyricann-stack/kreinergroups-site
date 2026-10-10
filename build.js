#!/usr/bin/env node
/* ============================================================
   build.js — 由 src/content.json 產生整站靜態 HTML
   執行：node build.js
   產出：英文在根目錄，中文在 zh/，兩邊頁面一一對應。
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const CONTENT = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'content.json'), 'utf8'));
const SALES_EMAIL = 'sales@shengchang-ind.com';
const LANGS = [
  { code: 'en', dir: '', html: 'en' },
  { code: 'zh', dir: 'zh/', html: 'zh-CN' }
];
const NAV = [
  { key: 'factory', page: 'factory.html' },
  { key: 'products', page: 'products.html' },
  { key: 'oem', page: 'oem.html' },
  { key: 'quality', page: 'quality.html' },
  { key: 'markets', page: 'markets.html' },
  { key: 'contact', page: 'contact.html' }
];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const reveal = (inner, delay, cls, tag) => `<${tag || 'div'} class="reveal ${cls || ''}" style="transition-delay:${delay || 0}ms">${inner}</${tag || 'div'}>`;

/* ---------- 路徑工具 ---------- */
function makeCtx(lang, pagePath) {
  const full = lang.dir + pagePath;                 // e.g. zh/products/tray.html
  const dir = path.posix.dirname(full);             // e.g. zh/products
  const rel = target => {
    let r = path.posix.relative(dir === '.' ? '' : dir, target);
    return r === '' ? './' : r;
  };
  const other = LANGS.find(l => l.code !== lang.code);
  return {
    lang, page: pagePath, full,
    t: CONTENT[lang.code],
    asset: p => rel('assets/' + p),
    link: p => rel(lang.dir + p),                  // 同語言其他頁
    altLink: rel(other.dir + pagePath),           // 另一語言同一頁
    selfLink: rel(full),                          // 本頁（給 hreflang 用）
    other,
    rootUrl: rel(''),
    tourUrl: lang.code === 'zh' ? rel('factory-tour/zh.html') : rel('factory-tour') + '/', // 3D 工廠導覽（factory-tour/ 是另外產生的靜態檔，不經 build.js）
  };
}

/* ---------- 共用：頁首 / 導覽 / 頁尾 ---------- */
function head(ctx, meta) {
  const t = ctx.t;
  const title = meta.titleOnly ? meta.title : (meta.title ? `${meta.title} — ${t.site.titleTag}` : t.site.titleTag);
  return `<!DOCTYPE html>
<html lang="${ctx.lang.html}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(meta.desc || '')}">
  <link rel="alternate" hreflang="${ctx.lang.html}" href="${ctx.selfLink}">
  <link rel="alternate" hreflang="${ctx.other.html}" href="${ctx.altLink}">
  <link rel="icon" type="image/svg+xml" href="${ctx.asset('favicon.svg')}">
  <link rel="stylesheet" href="${ctx.asset('style.css')}">
  <link rel="stylesheet" href="${ctx.asset('site.css')}">
</head>
<body>`;
}

function nav(ctx, current, opts) {
  opts = opts || {};
  const t = ctx.t;
  const links = NAV.map(n =>
    `<a href="${ctx.link(n.page)}" class="u-link nav-link text-[13px] font-medium tracking-wide${current === n.key ? ' is-active' : ''}"${current === n.key ? ' aria-current="page"' : ''}>${esc(t.nav[n.key])}</a>`).join('');
  const mobile = NAV.map(n =>
    `<a href="${ctx.link(n.page)}" class="block border-b border-[#efede7] py-3 text-sm font-medium text-[#1e2b41]">${esc(t.nav[n.key])}</a>`).join('');
  const zhOn = ctx.lang.code === 'zh';
  return `
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-nav fixed top-0 left-0 right-0 z-50${opts.solid ? ' nav-solid' : ''}">
  <div class="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4 md:px-10 md:py-5">
    <a href="${ctx.link('index.html')}" class="flex flex-col leading-none" aria-label="${esc(t.site.home)}">
      <span class="nav-fg font-display text-lg tracking-wide">${t.site.name}</span>
      <span class="nav-fg-sub mt-1 text-[10px] tracking-[0.3em]">${t.site.cn}</span>
    </a>
    <nav class="hidden items-center gap-8 lg:flex" aria-label="Primary">${links}</nav>
    <div class="flex items-center gap-3 md:gap-5">
      <a href="${ctx.altLink}" hreflang="${ctx.other.html}" class="nav-fg flex items-center gap-1 text-[12px] font-semibold tracking-widest" aria-label="${esc(t.site.langLabel)}">
        <span class="${zhOn ? 'opacity-100' : 'opacity-40'}">中</span><span class="opacity-40">/</span><span class="${zhOn ? 'opacity-40' : 'opacity-100'}">EN</span>
      </a>
      <a href="${ctx.link('contact.html')}" class="nav-cta hidden rounded-full px-5 py-2 text-[12px] font-semibold tracking-widest md:inline-block">${esc(t.nav.cta)}</a>
      <button type="button" class="burger nav-fg flex h-9 w-9 flex-col items-center justify-center gap-[5px] lg:hidden" aria-label="Menu" aria-expanded="false"><span></span><span></span></button>
    </div>
  </div>
  <nav class="mobile-nav border-t border-[#e5e2db] px-5 pb-6 pt-2" aria-label="Mobile">
    ${mobile}
    <a href="${ctx.link('contact.html')}" class="mt-4 inline-block rounded-full bg-[#1e2b41] px-6 py-2.5 text-[12px] font-semibold tracking-widest text-white">${esc(t.nav.cta)}</a>
  </nav>
</header>
<main id="main">`;
}

function footer(ctx) {
  const t = ctx.t;
  const links = NAV.map(n => `<li><a href="${ctx.link(n.page)}" class="u-link text-[13px] text-white/75">${esc(t.nav[n.key])}</a></li>`).join('');
  return `</main>
<footer class="bg-[#141d2c] py-16 text-white">
  <div class="mx-auto max-w-[1400px] px-5 md:px-10">
    <div class="grid gap-12 md:grid-cols-12">
      <div class="md:col-span-5">
        <p class="font-display text-2xl tracking-wide">${t.site.name}</p>
        <p class="mt-1 text-[11px] tracking-[0.3em] text-white/50">${t.site.cn}</p>
        <p class="mt-6 max-w-xs text-[13px] leading-relaxed text-white/60">${esc(t.footer.tagline)}</p>
      </div>
      <div class="md:col-span-3">
        <p class="caption-label text-white/50">${esc(t.footer.linksTitle)}</p>
        <ul class="mt-6 space-y-3">${links}</ul>
      </div>
      <div class="md:col-span-4">
        <p class="caption-label text-white/50">${esc(t.footer.contactTitle)}</p>
        <ul class="mt-6 space-y-3 text-[13px] text-white/75">
          <li>Dongguan, Guangdong, China</li>
          <li><a href="mailto:${SALES_EMAIL}" class="u-link">${SALES_EMAIL}</a></li>
          <li>${esc(t.inquiry.contact.phone)}</li>
        </ul>
      </div>
    </div>
    <div class="mt-14 border-t border-white/10 pt-6 text-[11px] tracking-wide text-white/40">${esc(t.footer.rights)}</div>
  </div>
</footer>
<script src="${ctx.asset('lenis.min.js')}"></script>
<script src="${ctx.asset('site.js')}"></script>
</body>
</html>
`;
}

/* ---------- 共用區塊 ---------- */
function pageHero(ctx, p, opts) {
  opts = opts || {};
  const crumbs = [`<a href="${ctx.link('index.html')}">${esc(ctx.t.site.home)}</a>`]
    .concat((opts.crumbs || []).map(c => c.href ? `<span>/</span><a href="${c.href}">${esc(c.label)}</a>` : `<span>/</span><span>${esc(c.label)}</span>`))
    .join('');
  return `
<section class="page-hero">
  ${opts.image ? `<img class="page-hero__img" src="${ctx.asset(opts.image)}" alt=""><div class="page-hero__overlay"></div>` : ''}
  <div class="page-hero__inner mx-auto max-w-[1400px] px-5 md:px-10">
    <nav class="breadcrumb" aria-label="Breadcrumb">${crumbs}</nav>
    <p class="caption-label mt-8 text-[#9db1c7]">${esc(p.caption)}</p>
    <h1>${esc(opts.h1 || p.h1)}</h1>
    ${p.sub ? `<p class="sub">${esc(opts.sub || p.sub)}</p>` : ''}
  </div>
</section>`;
}

function ctaBand(ctx, product) {
  const c = ctx.t.common.cta;
  const href = ctx.link('contact.html') + (product ? '?product=' + encodeURIComponent(product) : '');
  return `
<section class="cta-band">
  <div class="mx-auto max-w-[1400px] px-5 md:px-10">
    <div class="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
      <div>${reveal(`<h2>${esc(c.title)}</h2>`, 0)}${reveal(`<p>${esc(c.desc)}</p>`, 100)}</div>
      ${reveal(`<a href="${href}" class="btn-light">${esc(c.button)}</a>`, 200)}
    </div>
  </div>
</section>`;
}

function productCard(ctx, p, i) {
  return reveal(`<a href="${ctx.link('products/' + p.slug + '.html')}" class="group block">
      <div class="overflow-hidden bg-[#f3f1ec]"><img src="${ctx.asset('img/product-' + p.slug + '.jpg')}" alt="${esc(p.name)}" loading="lazy" class="aspect-[3/2] w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"></div>
      <div class="mt-5 flex items-baseline justify-between gap-3">
        <h3 class="font-display text-xl font-medium text-[#1e2b41]">${esc(p.name)}</h3>
        <span class="whitespace-nowrap text-[11px] font-semibold tracking-widest text-[#687c95]">${esc(p.moq)}</span>
      </div>
      <p class="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#999]">${esc(p.en)}</p>
      <p class="mt-3 text-[13px] leading-relaxed text-[#555]">${esc(p.spec)}</p>
      <span class="mt-4 block h-px w-full bg-[#e5e2db] transition-colors group-hover:bg-[#1e2b41]"></span>
    </a>`, i * 120);
}

function chips(list) {
  return `<ul class="mt-10 flex max-w-md flex-wrap gap-x-2 gap-y-3">${list.map(c => `<li class="border border-[#1e2b41]/20 px-4 py-2 text-[12px] font-medium tracking-wide text-[#1e2b41]">${esc(c)}</li>`).join('')}</ul>`;
}

function certsGrid(t) {
  return `<div class="mt-8 grid grid-cols-4 gap-px border border-[#e5e2db] bg-[#e5e2db]">${t.quality.certs.map(c => `<div class="flex min-h-[72px] items-center justify-center bg-white px-2 text-center text-[11px] font-semibold tracking-widest text-[#1e2b41]">${esc(c)}</div>`).join('')}</div>
  <p class="mt-3 text-[12px] leading-relaxed text-[#888]">${esc(t.quality.certsNote)}</p>`;
}

function processSteps(t) {
  return t.oem.steps.map((s, i) => reveal(`<div class="grid grid-cols-[64px_1fr] items-start gap-6 border-t border-white/12 py-8 md:grid-cols-[120px_280px_1fr] md:gap-10">
      <span class="font-display text-2xl font-light text-[#9db1c7] md:text-3xl">${s.n}</span>
      <h3 class="font-display text-xl font-medium md:text-2xl">${esc(s.t)}</h3>
      <p class="col-span-2 max-w-2xl text-[14px] leading-[1.85] text-white/65 md:col-span-1">${esc(s.d)}</p>
    </div>`, i * 80)).join('');
}

function qualityGates(t) {
  return `<div class="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">${t.quality.items.map((it, i) => reveal(`<div>
      <span class="font-display text-lg text-[#687c95]">${('0' + (i + 1)).slice(-2)}</span>
      <h3 class="mt-2 text-[16px] font-semibold text-[#1e2b41]">${esc(it.t)}</h3>
      <p class="mt-2 text-[13.5px] leading-[1.85] text-[#555]">${esc(it.d)}</p></div>`, i * 100)).join('')}</div>`;
}

function regions(t) {
  return `<div class="mt-14 grid grid-cols-2 gap-px border-t border-white/15 pt-10 md:grid-cols-4">${t.markets.regions.map((r, i) => reveal(`<div>
      <h3 class="font-display text-xl font-medium md:text-2xl">${esc(r.name)}</h3>
      <p class="mt-2 text-[12px] tracking-[0.12em] text-white/60">${esc(r.detail)}</p></div>`, i * 100)).join('')}</div>`;
}

function inquiryForm(ctx) {
  const f = ctx.t.inquiry.form;
  const input = 'w-full border border-[#ddd9d0] bg-white px-4 py-3 text-[14px] text-[#1e2b41] outline-none transition-colors placeholder:text-[#aaa] focus:border-[#1e2b41]';
  return `<form id="inquiry-form" class="grid gap-5 sm:grid-cols-2" novalidate data-to="${SALES_EMAIL}" data-msg-invalid="${esc(f.invalid)}" data-msg-sent="${esc(f.sent)}">
      <label class="sr-only" for="f-name">${esc(f.name)}</label><input id="f-name" name="name" class="${input}" placeholder="${esc(f.name)}" autocomplete="name">
      <label class="sr-only" for="f-company">${esc(f.company)}</label><input id="f-company" name="company" class="${input}" placeholder="${esc(f.company)}" autocomplete="organization">
      <label class="sr-only" for="f-email">${esc(f.email)}</label><input id="f-email" name="email" type="email" class="${input}" placeholder="${esc(f.email)}" autocomplete="email">
      <label class="sr-only" for="f-country">${esc(f.country)}</label><input id="f-country" name="country" class="${input}" placeholder="${esc(f.country)}" autocomplete="country-name">
      <label class="sr-only" for="f-product">${esc(f.product)}</label>
      <select id="f-product" name="product" class="${input} sm:col-span-2"><option value="">${esc(f.product)}</option>${f.productOptions.map(o => `<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select>
      <label class="sr-only" for="f-message">${esc(f.message)}</label><textarea id="f-message" name="message" class="${input} min-h-[140px] resize-y sm:col-span-2" placeholder="${esc(f.message)}"></textarea>
      <div class="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <button type="submit" class="rounded-full bg-[#1e2b41] px-10 py-3.5 text-[12px] font-semibold tracking-widest text-white transition-colors hover:bg-[#687c95]">${esc(f.submit)}</button>
        <p class="form-status text-[13px]" role="status" aria-live="polite"></p>
      </div>
    </form>`;
}

function contactInfo(ctx) {
  const c = ctx.t.inquiry.contact;
  return `<div class="mt-12 border-t border-[#e5e2db] pt-8">
      <h3 class="caption-label text-[#1e2b41]">${esc(c.title)}</h3>
      <ul class="mt-6 space-y-4 text-[14px] leading-relaxed text-[#444]">
        <li>${esc(c.addr)}</li>
        <li><a href="mailto:${esc(c.email)}" class="u-link font-medium text-[#1e2b41]">${esc(c.email)}</a></li>
        <li>${esc(c.phone)}</li>
        <li>${esc(c.whatsapp)}</li>
        <li class="text-[#888]">${esc(c.hours)}</li>
      </ul>
    </div>`;
}

/* ---------- 各頁 ---------- */
function pageHome(ctx) {
  const t = ctx.t, h = t.hero, a = t.about, P = t.pages.home;
  const marquee = t.marquee.concat(t.marquee).map(m => `<span class="flex items-center whitespace-nowrap text-[13px] font-medium tracking-[0.18em] text-white"><span class="px-6">${esc(m)}</span><span class="text-white/40">·</span></span>`).join('');
  let b = head(ctx, Object.assign({ titleOnly: true }, P)) + nav(ctx, 'home');
  // Hero
  b += `
<section id="top" class="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-[#1e2b41]">
  <div class="absolute inset-0"><img src="${ctx.asset('img/hero.jpg')}" alt="Acrylic bathtub" class="hero-zoom h-full w-full object-cover"><div class="absolute inset-0 bg-gradient-to-t from-[#1e2b41]/90 via-[#1e2b41]/30 to-[#1e2b41]/40"></div></div>
  <div class="relative z-10 mx-auto w-full max-w-[1400px] px-5 pb-10 md:px-10 md:pb-16">
    <p class="caption-label mb-5 text-white/70">${esc(h.caption)}</p>
    <h1 class="font-display text-white"><span class="mask-line"><span class="text-[13vw] font-light leading-[1.04] tracking-tight md:text-[7.5vw]">${esc(h.line1)}</span></span><span class="mask-line"><span class="text-[13vw] font-light leading-[1.04] tracking-tight md:text-[7.5vw]">${esc(h.line2)}</span></span></h1>
    <div class="mt-8 flex flex-col gap-8 md:mt-10 md:flex-row md:items-end md:justify-between">
      <p class="max-w-xl text-[15px] leading-relaxed text-white/80">${esc(h.sub)}</p>
      <div class="flex flex-wrap gap-4">
        <a href="${ctx.link('products.html')}" class="rounded-full bg-white px-7 py-3 text-[12px] font-semibold tracking-widest text-[#1e2b41] transition-colors hover:bg-white/85">${esc(h.ctaPrimary)}</a>
        <a href="${ctx.link('contact.html')}" class="rounded-full border border-white/60 px-7 py-3 text-[12px] font-semibold tracking-widest text-white transition-colors hover:bg-white/10">${esc(h.ctaSecondary)}</a>
      </div>
    </div>
    <div class="mt-12 grid grid-cols-2 gap-px overflow-hidden border-t border-white/15 pt-8 md:grid-cols-4">
      ${h.stats.map(s => `<div class="pr-6"><div class="font-display text-3xl font-light text-white md:text-4xl">${esc(s.value)}</div><div class="mt-2 text-[12px] tracking-wide text-white/60">${esc(s.label)}</div></div>`).join('')}
    </div>
  </div>
</section>
<div class="overflow-hidden border-y border-[#e5e2db] bg-[#687c95] py-4"><div class="marquee-track">${marquee}</div></div>`;
  // Factory teaser
  b += `
<section class="bg-[#faf9f6] py-24 md:py-36">
  <div class="mx-auto max-w-[1400px] px-5 md:px-10">
    ${reveal(`<p class="caption-label text-[#687c95]">${esc(a.caption)}</p>`, 0)}
    <div class="mt-6 grid gap-12 md:grid-cols-12 md:gap-8">
      <div class="md:col-span-5">
        ${reveal(`<h2 class="font-display max-w-md text-4xl font-light leading-[1.15] text-[#1e2b41] md:text-5xl">${esc(a.title)}</h2>`, 100)}
        ${reveal(`<p class="mt-8 max-w-md text-[15px] leading-[1.9] text-[#444]">${esc(a.p1)}</p>`, 200)}
        ${reveal(chips(a.chips), 300)}
        ${reveal(`<a href="${ctx.link('factory.html')}" class="mt-10 inline-block text-[13px] font-semibold tracking-widest text-[#1e2b41] u-link">${esc(t.common.learnMore)}</a>`, 350)}
      </div>
      <div class="md:col-span-7 md:pl-8">
        ${reveal(`<div class="overflow-hidden"><img src="${ctx.asset('img/factory.jpg')}" alt="Factory" loading="lazy" class="aspect-[3/2] w-full object-cover transition-transform duration-700 hover:scale-[1.03]"></div>
        <figcaption class="mt-3 flex items-center gap-3 text-[11px] tracking-[0.2em] text-[#687c95]"><span class="h-px w-8 bg-[#687c95]"></span>${esc(a.imageCaption)}</figcaption>`, 150, 'relative md:mt-20', 'figure')}
      </div>
    </div>
  </div>
</section>`;
  // Products
  b += `
<section class="border-t border-[#e5e2db] bg-white py-24 md:py-36">
  <div class="mx-auto max-w-[1400px] px-5 md:px-10">
    <div class="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div>${reveal(`<p class="caption-label text-[#687c95]">${esc(t.products.caption)}</p>`, 0)}${reveal(`<h2 class="font-display mt-6 max-w-xl text-4xl font-light leading-[1.15] text-[#1e2b41] md:text-5xl">${esc(t.products.title)}</h2>`, 100)}</div>
      ${reveal(`<p class="max-w-sm text-[14px] leading-[1.8] text-[#666]">${esc(t.products.desc)}</p>`, 200)}
    </div>
    <div class="mt-14 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">${t.products.items.map((p, i) => productCard(ctx, p, i)).join('')}</div>
    ${reveal(`<a href="${ctx.link('products.html')}" class="mt-14 inline-block text-[13px] font-semibold tracking-widest text-[#1e2b41] u-link">${esc(t.common.viewAll)}</a>`, 200)}
  </div>
</section>`;
  // OEM teaser
  b += `
<section class="bg-[#1e2b41] py-24 text-white md:py-36">
  <div class="mx-auto max-w-[1400px] px-5 md:px-10">
    ${reveal(`<p class="caption-label text-[#9db1c7]">${esc(t.oem.caption)}</p>`, 0)}
    ${reveal(`<h2 class="font-display mt-6 max-w-2xl text-4xl font-light leading-[1.15] md:text-5xl">${esc(t.oem.title)}</h2>`, 100)}
    ${reveal(`<div class="steps-mini">${t.oem.steps.map(s => `<div><div class="n">${s.n}</div><h3>${esc(s.t)}</h3></div>`).join('')}</div>`, 200)}
    ${reveal(`<p class="mt-10 text-[12px] tracking-[0.15em] text-[#9db1c7]">${esc(t.oem.note)}</p><a href="${ctx.link('oem.html')}" class="mt-8 inline-block text-[13px] font-semibold tracking-widest text-white u-link">${esc(t.common.learnMore)}</a>`, 250)}
  </div>
</section>`;
  // Quality teaser
  b += `
<section class="bg-[#faf9f6] py-24 md:py-36">
  <div class="mx-auto max-w-[1400px] px-5 md:px-10">
    <div class="grid gap-12 md:grid-cols-12 md:gap-8">
      <div class="order-2 md:order-1 md:col-span-5">
        ${reveal(`<div class="overflow-hidden"><img src="${ctx.asset('img/qc.jpg')}" alt="Quality control" loading="lazy" class="aspect-[3/2] w-full object-cover transition-transform duration-700 hover:scale-[1.03]"></div>`, 0, '', 'figure')}
        ${reveal(certsGrid(t), 150)}
      </div>
      <div class="order-1 md:order-2 md:col-span-7 md:pl-10">
        ${reveal(`<p class="caption-label text-[#687c95]">${esc(t.quality.caption)}</p>`, 0)}
        ${reveal(`<h2 class="font-display mt-6 max-w-lg text-4xl font-light leading-[1.15] text-[#1e2b41] md:text-5xl">${esc(t.quality.title)}</h2>`, 100)}
        ${qualityGates(t)}
        ${reveal(`<a href="${ctx.link('quality.html')}" class="mt-12 inline-block text-[13px] font-semibold tracking-widest text-[#1e2b41] u-link">${esc(t.common.learnMore)}</a>`, 200)}
      </div>
    </div>
  </div>
</section>`;
  // Markets teaser
  b += `
<section class="relative overflow-hidden py-24 md:py-36">
  <div class="absolute inset-0"><img src="${ctx.asset('img/warehouse.jpg')}" alt="" loading="lazy" class="h-full w-full object-cover"><div class="absolute inset-0 bg-[#1e2b41]/85"></div></div>
  <div class="relative z-10 mx-auto max-w-[1400px] px-5 text-white md:px-10">
    ${reveal(`<p class="caption-label text-white/60">${esc(t.markets.caption)}</p>`, 0)}
    ${reveal(`<h2 class="font-display mt-6 max-w-2xl text-4xl font-light leading-[1.15] md:text-5xl">${esc(t.markets.title)}</h2>`, 100)}
    ${reveal(`<p class="mt-6 max-w-xl text-[15px] leading-[1.9] text-white/70">${esc(t.markets.desc)}</p>`, 200)}
    ${regions(t)}
    ${reveal(`<a href="${ctx.link('markets.html')}" class="mt-12 inline-block text-[13px] font-semibold tracking-widest text-white u-link">${esc(t.common.learnMore)}</a>`, 250)}
  </div>
</section>`;
  b += ctaBand(ctx) + footer(ctx);
  return b;
}

function pageFactory(ctx) {
  const t = ctx.t, a = t.about, P = t.pages.factory;
  let b = head(ctx, P) + nav(ctx, 'factory') + pageHero(ctx, P, { image: 'img/factory.jpg', crumbs: [{ label: t.nav.factory }] });
  b += `
<section class="bg-[#faf9f6] py-24 md:py-36">
  <div class="mx-auto max-w-[1400px] px-5 md:px-10">
    <div class="grid gap-12 md:grid-cols-12 md:gap-8">
      <div class="md:col-span-5">
        ${reveal(`<p class="lede">${esc(a.p1)}</p>`, 0)}
        ${reveal(`<p class="mt-5 max-w-md text-[15px] leading-[1.9] text-[#444]">${esc(a.p2)}</p>`, 100)}
        ${reveal(`<div class="mt-12 grid grid-cols-2 gap-px overflow-hidden border-t border-[#e5e2db] pt-8">${t.hero.stats.map(s => `<div class="pr-6"><div class="font-display text-3xl font-light text-[#1e2b41] md:text-4xl">${esc(s.value)}</div><div class="mt-2 text-[12px] tracking-wide text-[#687c95]">${esc(s.label)}</div></div>`).join('')}</div>`, 200)}
      </div>
      <div class="md:col-span-7 md:pl-8">
        ${reveal(`<div class="overflow-hidden"><img src="${ctx.asset('img/factory.jpg')}" alt="Factory" class="aspect-[3/2] w-full object-cover transition-transform duration-700 hover:scale-[1.03]"></div>
        <figcaption class="mt-3 flex items-center gap-3 text-[11px] tracking-[0.2em] text-[#687c95]"><span class="h-px w-8 bg-[#687c95]"></span>${esc(a.imageCaption)}</figcaption>`, 150, 'relative', 'figure')}
      </div>
    </div>
  </div>
</section>
<section class="border-t border-[#e5e2db] bg-white py-24 md:py-36">
  <div class="mx-auto max-w-[1400px] px-5 md:px-10">
    ${reveal(`<p class="caption-label text-[#687c95]">${esc(P.capTitle)}</p>`, 0)}
    ${reveal(`<h2 class="font-display mt-6 max-w-xl text-4xl font-light leading-[1.15] text-[#1e2b41] md:text-5xl">${esc(P.capTitle)}</h2>`, 100)}
    ${reveal(`<p class="mt-6 max-w-xl text-[15px] leading-[1.9] text-[#444]">${esc(P.capDesc)}</p>`, 200)}
    <div class="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">${a.chips.map((c, i) => reveal(`<div class="border-t border-[#e5e2db] pt-6"><span class="font-display text-lg text-[#687c95]">${('0' + (i + 1)).slice(-2)}</span><h3 class="mt-2 text-[16px] font-semibold text-[#1e2b41]">${esc(c)}</h3></div>`, i * 80)).join('')}</div>
  </div>
</section>
<section class="border-t border-[#e5e2db] bg-[#faf9f6] py-24 md:py-36">
  <div class="mx-auto max-w-[1400px] px-5 md:px-10">
    <div class="grid gap-12 md:grid-cols-12 md:gap-8">
      <div class="md:col-span-5">
        ${reveal(`<p class="caption-label text-[#687c95]">${esc(P.tour.label)}</p>`, 0)}
        ${reveal(`<h2 class="font-display mt-6 max-w-xl text-4xl font-light leading-[1.15] text-[#1e2b41] md:text-5xl">${esc(P.tour.title)}</h2>`, 100)}
        ${reveal(`<p class="mt-6 max-w-md text-[15px] leading-[1.9] text-[#444]">${esc(P.tour.desc)}</p>`, 200)}
        ${reveal(`<a href="${ctx.tourUrl}" class="btn-dark mt-10">${esc(P.tour.button)}</a><p class="tour-note">${esc(P.tour.note)}</p>`, 300)}
      </div>
      <div class="md:col-span-7 md:pl-8">
        ${reveal(`<a href="${ctx.tourUrl}" class="tour-cover"><img src="${ctx.asset('img/factory-tour.jpg')}" alt="${esc(P.tour.title)}" loading="lazy" class="aspect-[3/2] w-full object-cover"><span class="tour-play" aria-hidden="true"></span></a>`, 150)}
      </div>
    </div>
  </div>
</section>` + ctaBand(ctx) + footer(ctx);
  return b;
}

function pageProducts(ctx) {
  const t = ctx.t, P = t.pages.products;
  let b = head(ctx, P) + nav(ctx, 'products') + pageHero(ctx, P, { image: 'img/product-freestanding.jpg', crumbs: [{ label: t.nav.products }] });
  b += `
<section class="bg-white py-24 md:py-36">
  <div class="mx-auto max-w-[1400px] px-5 md:px-10">
    ${reveal(`<p class="lede">${esc(t.products.desc)}</p>`, 0)}
    <div class="mt-14 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">${t.products.items.map((p, i) => productCard(ctx, p, i)).join('')}</div>
  </div>
</section>
<section class="border-t border-[#e5e2db] bg-[#faf9f6] py-24 md:py-36">
  <div class="mx-auto max-w-[1400px] px-5 md:px-10">
    <div class="grid gap-12 md:grid-cols-12 md:gap-8">
      <div class="md:col-span-5">${reveal(`<p class="caption-label text-[#687c95]">${esc(t.common.customization)}</p><h2 class="font-display mt-6 max-w-md text-4xl font-light leading-[1.15] text-[#1e2b41] md:text-5xl">${esc(t.common.customization)}</h2>`, 0)}</div>
      <div class="md:col-span-7 md:pl-10">${reveal(`<ul class="bullet-list">${t.common.customItems.map(c => `<li>${esc(c)}</li>`).join('')}</ul><p class="mt-8 text-[12px] tracking-[0.15em] text-[#687c95]">${esc(t.oem.note)}</p>`, 100)}</div>
    </div>
  </div>
</section>` + ctaBand(ctx) + footer(ctx);
  return b;
}

function pageProduct(ctx, p) {
  const t = ctx.t, P = { title: p.name, desc: p.detail, caption: t.products.caption, h1: p.name, sub: p.en };
  const others = t.products.items.filter(o => o.slug !== p.slug);
  let b = head(ctx, P) + nav(ctx, 'products') + pageHero(ctx, P, { image: 'img/product-' + p.slug + '.jpg', crumbs: [{ label: t.nav.products, href: ctx.link('products.html') }, { label: p.name }] });
  b += `
<section class="bg-white py-24 md:py-36">
  <div class="mx-auto max-w-[1400px] px-5 md:px-10">
    <div class="grid gap-12 md:grid-cols-12 md:gap-8">
      <div class="md:col-span-7">
        ${reveal(`<div class="overflow-hidden bg-[#f3f1ec]"><img src="${ctx.asset('img/product-' + p.slug + '.jpg')}" alt="${esc(p.name)}" class="aspect-[3/2] w-full object-cover"></div>`, 0, '', 'figure')}
      </div>
      <div class="md:col-span-5 md:pl-8">
        ${reveal(`<p class="caption-label text-[#687c95]">${esc(p.en)}</p><h2 class="font-display mt-4 text-4xl font-light leading-[1.15] text-[#1e2b41]">${esc(p.name)}</h2>`, 0)}
        ${reveal(`<p class="mt-6 text-[15px] leading-[1.9] text-[#444]">${esc(p.detail)}</p>`, 100)}
        ${reveal(`<dl class="spec-list">
          <div><dt>${esc(t.common.features)}</dt><dd><ul class="feature-list" style="margin-top:0">${p.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul></dd></div>
          <div><dt>${esc(t.common.moqLabel)}</dt><dd>${esc(p.moq)}</dd></div>
          <div><dt>${esc(t.common.customization)}</dt><dd>${t.common.customItems.map(esc).join(' · ')}</dd></div>
        </dl>`, 200)}
        ${reveal(`<a href="${ctx.link('contact.html')}?product=${encodeURIComponent(p.name)}" class="btn-dark mt-10">${esc(t.common.askThis)}</a>`, 300)}
      </div>
    </div>
  </div>
</section>
<section class="border-t border-[#e5e2db] bg-[#faf9f6] py-24 md:py-36">
  <div class="mx-auto max-w-[1400px] px-5 md:px-10">
    ${reveal(`<p class="caption-label text-[#687c95]">${esc(t.common.otherProducts)}</p>`, 0)}
    <div class="related-grid">${others.map((o, i) => productCard(ctx, o, i)).join('')}</div>
    ${reveal(`<a href="${ctx.link('products.html')}" class="mt-14 inline-block text-[13px] font-semibold tracking-widest text-[#1e2b41] u-link">${esc(t.common.backToProducts)}</a>`, 200)}
  </div>
</section>` + ctaBand(ctx, p.name) + footer(ctx);
  return b;
}

function pageOem(ctx) {
  const t = ctx.t, P = t.pages.oem;
  let b = head(ctx, P) + nav(ctx, 'oem') + pageHero(ctx, P, { image: 'img/warehouse.jpg', crumbs: [{ label: t.nav.oem }] });
  b += `
<section class="bg-[#1e2b41] py-24 text-white md:py-36">
  <div class="mx-auto max-w-[1400px] px-5 md:px-10">
    ${processSteps(t)}
    ${reveal(`<p class="mt-10 border-t border-white/12 pt-8 text-[12px] tracking-[0.15em] text-[#9db1c7]">${esc(t.oem.note)}</p>`, 200)}
  </div>
</section>
<section class="bg-[#faf9f6] py-24 md:py-36">
  <div class="mx-auto max-w-[1400px] px-5 md:px-10">
    <div class="grid gap-12 md:grid-cols-12 md:gap-8">
      <div class="md:col-span-5">${reveal(`<p class="caption-label text-[#687c95]">${esc(t.common.customization)}</p><h2 class="font-display mt-6 max-w-md text-4xl font-light leading-[1.15] text-[#1e2b41] md:text-5xl">${esc(t.common.customization)}</h2>`, 0)}</div>
      <div class="md:col-span-7 md:pl-10">${reveal(`<ul class="bullet-list">${t.common.customItems.map(c => `<li>${esc(c)}</li>`).join('')}</ul>`, 100)}${reveal(chips(t.about.chips), 200)}</div>
    </div>
  </div>
</section>` + ctaBand(ctx) + footer(ctx);
  return b;
}

function pageQuality(ctx) {
  const t = ctx.t, P = t.pages.quality;
  let b = head(ctx, P) + nav(ctx, 'quality') + pageHero(ctx, P, { image: 'img/qc.jpg', crumbs: [{ label: t.nav.quality }] });
  b += `
<section class="bg-[#faf9f6] py-24 md:py-36">
  <div class="mx-auto max-w-[1400px] px-5 md:px-10">
    <div class="grid gap-12 md:grid-cols-12 md:gap-8">
      <div class="order-2 md:order-1 md:col-span-5">
        ${reveal(`<div class="overflow-hidden"><img src="${ctx.asset('img/qc.jpg')}" alt="Quality control" class="aspect-[3/2] w-full object-cover transition-transform duration-700 hover:scale-[1.03]"></div>`, 0, '', 'figure')}
      </div>
      <div class="order-1 md:order-2 md:col-span-7 md:pl-10">
        ${reveal(`<p class="caption-label text-[#687c95]">${esc(t.quality.caption)}</p>`, 0)}
        ${reveal(`<h2 class="font-display mt-6 max-w-lg text-4xl font-light leading-[1.15] text-[#1e2b41] md:text-5xl">${esc(t.quality.title)}</h2>`, 100)}
        ${qualityGates(t)}
      </div>
    </div>
  </div>
</section>
<section class="border-t border-[#e5e2db] bg-white py-24 md:py-36">
  <div class="mx-auto max-w-[1400px] px-5 md:px-10">
    <div class="grid gap-12 md:grid-cols-12 md:gap-8">
      <div class="md:col-span-5">${reveal(`<p class="caption-label text-[#687c95]">${esc(P.certsTitle)}</p><h2 class="font-display mt-6 max-w-md text-4xl font-light leading-[1.15] text-[#1e2b41] md:text-5xl">${esc(P.certsTitle)}</h2>`, 0)}</div>
      <div class="md:col-span-7 md:pl-10">${reveal(certsGrid(t), 100)}</div>
    </div>
  </div>
</section>` + ctaBand(ctx) + footer(ctx);
  return b;
}

function pageMarkets(ctx) {
  const t = ctx.t, P = t.pages.markets;
  let b = head(ctx, P) + nav(ctx, 'markets') + pageHero(ctx, P, { image: 'img/warehouse.jpg', crumbs: [{ label: t.nav.markets }] });
  b += `
<section class="bg-[#1e2b41] py-24 text-white md:py-36">
  <div class="mx-auto max-w-[1400px] px-5 md:px-10">
    ${reveal(`<p class="max-w-xl text-[15px] leading-[1.9] text-white/70">${esc(t.markets.desc)}</p>`, 0)}
    ${regions(t)}
    ${reveal(`<p class="mt-12 flex items-center gap-3 text-[11px] tracking-[0.2em] text-white/50"><span class="h-px w-8 bg-white/40"></span>${esc(t.markets.imageCaption)}</p>`, 250)}
  </div>
</section>
<section class="bg-[#faf9f6] py-24 md:py-36">
  <div class="mx-auto max-w-[1400px] px-5 md:px-10">
    <div class="grid gap-12 md:grid-cols-12 md:gap-8">
      <div class="md:col-span-5">${reveal(`<p class="caption-label text-[#687c95]">${esc(t.pages.quality.certsTitle)}</p><h2 class="font-display mt-6 max-w-md text-4xl font-light leading-[1.15] text-[#1e2b41] md:text-5xl">${esc(t.quality.certsNote)}</h2>`, 0)}</div>
      <div class="md:col-span-7 md:pl-10">${reveal(certsGrid(t), 100)}${reveal(`<div class="mt-10 overflow-hidden"><img src="${ctx.asset('img/warehouse.jpg')}" alt="" loading="lazy" class="aspect-[3/2] w-full object-cover"></div>`, 200)}</div>
    </div>
  </div>
</section>` + ctaBand(ctx) + footer(ctx);
  return b;
}

function pageContact(ctx) {
  const t = ctx.t, P = t.pages.contact;
  let b = head(ctx, P) + nav(ctx, 'contact') + pageHero(ctx, P, { image: 'img/hero.jpg', crumbs: [{ label: t.nav.contact }] });
  b += `
<section class="bg-white py-24 md:py-36">
  <div class="mx-auto max-w-[1400px] px-5 md:px-10">
    <div class="grid gap-14 md:grid-cols-12 md:gap-10">
      <div class="md:col-span-5">
        ${reveal(`<p class="max-w-md text-[14.5px] leading-[1.85] text-[#555]">${esc(t.inquiry.desc)}</p>`, 0)}
        ${reveal(contactInfo(ctx), 100)}
      </div>
      <div class="md:col-span-7">${reveal(inquiryForm(ctx), 150)}</div>
    </div>
  </div>
</section>` + footer(ctx);
  return b;
}

function page404(ctx) {
  const t = ctx.t, P = t.pages.notFound;
  return head(ctx, P) + nav(ctx, '', { solid: true }) + `
<section class="not-found bg-[#faf9f6]">
  <div class="mx-auto max-w-[1400px] px-5 md:px-10">
    <p class="caption-label text-[#687c95]">404</p>
    <h1 class="font-display mt-6 text-4xl font-light leading-[1.15] text-[#1e2b41] md:text-5xl">${esc(P.h1)}</h1>
    <p class="mt-6 max-w-md text-[15px] leading-[1.9] text-[#444]">${esc(P.sub)}</p>
    <a href="${ctx.link('index.html')}" class="btn-dark mt-10">${esc(P.back)}</a>
  </div>
</section>` + footer(ctx);
}

/* ---------- 產生 ---------- */
const PAGES = [
  ['index.html', pageHome], ['factory.html', pageFactory], ['products.html', pageProducts],
  ['oem.html', pageOem], ['quality.html', pageQuality], ['markets.html', pageMarkets],
  ['contact.html', pageContact], ['404.html', page404]
];
let written = [];
for (const lang of LANGS) {
  for (const [p, fn] of PAGES) {
    const ctx = makeCtx(lang, p);
    const out = path.join(ROOT, ctx.full);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, fn(ctx));
    written.push(ctx.full);
  }
  for (const prod of CONTENT[lang.code].products.items) {
    const p = 'products/' + prod.slug + '.html';
    const ctx = makeCtx(lang, p);
    const out = path.join(ROOT, ctx.full);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, pageProduct(ctx, prod));
    written.push(ctx.full);
  }
}
console.log('built ' + written.length + ' pages:\n  ' + written.join('\n  '));

/* ---------- 檢查：用到的 Tailwind 類別是否真的存在於 style.css ---------- */
const css = fs.readFileSync(path.join(ROOT, 'assets', 'style.css'), 'utf8') + fs.readFileSync(path.join(ROOT, 'assets', 'site.css'), 'utf8');
const cssEsc = c => c.replace(/([^A-Za-z0-9_-])/g, '\\$1');
const missing = new Set();
for (const f of written) {
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const m of html.matchAll(/class="([^"]*)"/g)) {
    for (const c of m[1].split(/\s+/).filter(Boolean)) {
      if (['reveal', 'is-visible', 'sr-only'].includes(c)) { if (!css.includes('.' + c)) missing.add(c); continue; }
      const sel = '.' + cssEsc(c);
      if (!(css.includes(sel + '{') || css.includes(sel + ',') || css.includes(sel + ':') || css.includes(sel + ' ') || css.includes(sel + '>') || css.includes(sel + '.'))) missing.add(c);
    }
  }
}
if (missing.size) { console.log('\nMISSING CSS CLASSES:\n  ' + [...missing].join('\n  ')); process.exitCode = 1; } else console.log('\nall classes present');
