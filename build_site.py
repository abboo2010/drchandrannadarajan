#!/usr/bin/env python3
"""
Builds the public website pages (index, about, conditions, treatments, videos,
contact) from src/partials/*.html so the header, footer and modals live in ONE
place. Run:  python3 build_site.py     (no dependencies)
The generated .html files are committed; Netlify just serves them.
"""
import re, pathlib

ROOT = pathlib.Path(__file__).parent
P = lambda name: (ROOT / 'src' / 'partials' / f'{name}.html').read_text(encoding='utf-8')
SITE = 'https://drchandranir.info'

LD = ('<script type="application/ld+json">{"@context":"https://schema.org","@type":"Physician","name":"Dr. Chandran Nadarajan",'
      '"alternateName":"IR@SABAH","medicalSpecialty":"Radiology","description":"Consultant Clinical & Interventional Radiologist offering '
      'minimally invasive, image-guided treatments in Sabah, Malaysia.","telephone":"+60124775257","email":"drnchandran23@gmail.com",'
      '"url":"https://drchandranir.info/","image":"https://drchandranir.info/images/doctor.jpg","sameAs":['
      '"https://www.instagram.com/drchandrannadarajan/","https://www.facebook.com/drchandrannadarajan/",'
      '"https://www.linkedin.com/in/chandran-nadarajan-5aa71911/"]}</script>')

NAV = [  # key, href, i18n key, label
    ('home',       '/',           'nav_home',       'Home'),
    ('about',      '/about',      'nav_doctor',     'About the Doctor'),
    ('conditions', '/conditions', 'nav_conditions', 'Conditions'),
    ('treatments', '/treatments', 'nav_treatments', 'Treatments'),
    ('videos',     '/videos',     'nav_videos',     'Videos'),
    ('contact',    '/contact',    'nav_contact',    'Contact'),
]

PAGES = {
    'home': dict(file='index.html', path='/',
        title='IR@SABAH — Dr. Chandran Nadarajan | Consultant Clinical & Interventional Radiologist',
        desc='Dr. Chandran Nadarajan, Consultant Clinical & Interventional Radiologist in Sabah. Precision care through minimally invasive, image-guided treatments — tumour ablation, fibroid embolization, varicose veins, thyroid nodules and more.'),
    'about': dict(file='about.html', path='/about',
        title='About Dr. Chandran Nadarajan | IR@SABAH',
        desc='Meet Dr. Chandran Nadarajan — Consultant Clinical & Interventional Radiologist. MD (USM), M.Med (Rad) (USM). 19 years as a medical doctor, 8 as an interventional radiologist.'),
    'conditions': dict(file='conditions.html', path='/conditions',
        title='Conditions We Treat | IR@SABAH — Dr. Chandran Nadarajan',
        desc='Liver and kidney tumours, uterine fibroids, thyroid nodules, varicose veins, peripheral artery disease and more — symptoms, causes and treatment options explained in plain language.'),
    'treatments': dict(file='treatments.html', path='/treatments',
        title='Treatments & Procedures | IR@SABAH — Dr. Chandran Nadarajan',
        desc='Minimally invasive, image-guided procedures explained simply: microwave ablation, radiofrequency ablation, fibroid embolization, angioplasty and stenting, biopsy and more.'),
    'videos': dict(file='videos.html', path='/videos',
        title='Patient Education Videos | IR@SABAH — Dr. Chandran Nadarajan',
        desc='Short, easy-to-understand patient education videos, including microwave ablation for thyroid nodules.'),
    'contact': dict(file='contact.html', path='/contact',
        title='Contact & Book an Appointment | IR@SABAH — Dr. Chandran Nadarajan',
        desc='Book an appointment with Dr. Chandran Nadarajan via WhatsApp (+60 12-477 5257) or email.'),
}

# banner text per inner page: (i18n title key, i18n sub key)
BANNERS = {
    'about': ('b_about', 'bs_about'), 'conditions': ('b_conditions', 'bs_conditions'),
    'treatments': ('b_treatments', 'bs_treatments'), 'videos': ('b_videos', 'bs_videos'),
    'contact': ('b_contact', 'bs_contact'),
}
BANNER_EN = {
    'b_about': 'About the Doctor', 'bs_about': 'Board-certified expertise, patient-first care',
    'b_conditions': 'Conditions We Treat', 'bs_conditions': 'Tap a condition to learn about symptoms, causes, diagnosis and treatment options.',
    'b_treatments': 'Treatments & Procedures', 'bs_treatments': 'Image-guided procedures that treat the problem directly.',
    'b_videos': 'Patient Education Videos', 'bs_videos': 'Short, easy-to-understand explainers.',
    'b_contact': 'Contact & Appointments', 'bs_contact': 'Reach the clinic directly on WhatsApp.',
}


def head(key):
    pg = PAGES[key]
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<script>document.documentElement.className+=" js"</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>{pg['title'].replace('&', '&amp;')}</title>
<meta name="description" content="{pg['desc'].replace('&', '&amp;')}">
<link rel="canonical" href="{SITE}{pg['path']}">
<meta name="theme-color" content="#06162e">
<meta property="og:type" content="website">
<meta property="og:title" content="{pg['title'].replace('&', '&amp;')}">
<meta property="og:description" content="{pg['desc'].replace('&', '&amp;')}">
<meta property="og:url" content="{SITE}{pg['path']}">
<meta property="og:image" content="{SITE}/icon-512.png">
<link rel="icon" href="/icon-192.png">
<link rel="apple-touch-icon" href="/icon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/splash.css">
<link rel="stylesheet" href="/site.css">
{LD}
</head>
<body class="page-{key}{' splash-open' if key == 'home' else ''}">
'''


def header(key):
    ACTIVE = ' class="active" aria-current="page"'
    links = '\n'.join(
        '      <a href="%s" data-i18n="%s"%s>%s</a>' % (href, i18n, ACTIVE if k == key else '', label)
        for k, href, i18n, label in NAV)
    solid = '' if key == 'home' else ' solid'
    return f'''<!-- ============ HEADER ============ -->
<header class="site-header{solid}" id="siteHeader">
  <div class="wrap header-inner">
    <a href="/" class="brand" aria-label="IR@SABAH home">
      <img data-img-src="logo" src="/images/logo.png" alt="" class="brand-logo">
      <span class="brand-text">
        <span class="brand-name">IR<span>@SABAH</span></span>
        <span class="brand-sub">Dr. Chandran Nadarajan</span>
      </span>
    </a>

    <nav class="main-nav" id="mainNav" aria-label="Main">
{links}
      <a class="nav-book" href="#" data-wa data-i18n="book">Book Appointment</a>
    </nav>

    <div class="header-tools">
      <div class="lang" role="group" aria-label="Language">
        <button class="lang-btn active" data-lang="en">EN</button>
        <button class="lang-btn" data-lang="bm">BM</button>
        <button class="lang-btn" data-lang="zh">中文</button>
      </div>
      <button class="burger" id="burger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>
'''


def banner(key):
    t, s = BANNERS[key]
    return f'''<section class="page-banner">
  <div class="banner-bg" aria-hidden="true"></div>
  <div class="wrap banner-inner">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/" data-i18n="nav_home">Home</a><span>/</span><span data-i18n="{t}">{BANNER_EN[t]}</span></nav>
    <h1 class="banner-title" data-i18n="{t}">{BANNER_EN[t]}</h1>
    <p class="banner-sub" data-i18n="{s}">{BANNER_EN[s]}</p>
  </div>
</section>
'''


CTA = '''<section class="cta-band">
  <div class="wrap cta-inner">
    <div>
      <h2 data-i18n="cta_title">Ready to book your consultation?</h2>
      <p data-i18n="cta_text">Message the clinic on WhatsApp — the fastest way to request an appointment.</p>
    </div>
    <div class="cta-actions">
      <a class="btn btn-gold" href="#" data-wa><span class="ico" data-icon="whatsapp"></span><span data-i18n="wa_open">Open WhatsApp Chat</span></a>
      <a class="btn btn-ghost" href="/contact" data-i18n="cta_more">Contact details</a>
    </div>
  </div>
</section>
'''

FOOTER = '''<footer class="site-footer">
  <div class="wrap foot-grid">
    <div class="foot-brand">
      <a href="/" class="brand"><img data-img-src="logo" src="/images/logo.png" alt="" class="brand-logo"><span class="brand-text"><span class="brand-name">IR<span>@SABAH</span></span><span class="brand-sub" style="display:block">Dr. Chandran Nadarajan</span></span></a>
      <p data-i18n="tagline">Precision Care. Minimally Invasive.</p>
    </div>
    <nav class="foot-links" aria-label="Footer">
      <a href="/about" data-i18n="nav_doctor">About the Doctor</a>
      <a href="/conditions" data-i18n="nav_conditions">Conditions</a>
      <a href="/treatments" data-i18n="nav_treatments">Treatments</a>
      <a href="/videos" data-i18n="nav_videos">Videos</a>
      <a href="/contact" data-i18n="nav_contact">Contact</a>
    </nav>
    <div class="foot-social">
      <a href="https://www.instagram.com/drchandrannadarajan/" target="_blank" rel="noopener" aria-label="Instagram"><span class="ico" data-icon="instagram"></span></a>
      <a href="https://www.facebook.com/drchandrannadarajan/" target="_blank" rel="noopener" aria-label="Facebook"><span class="ico" data-icon="facebook"></span></a>
      <a href="https://www.linkedin.com/in/chandran-nadarajan-5aa71911/" target="_blank" rel="noopener" aria-label="LinkedIn"><span class="ico" data-icon="linkedin"></span></a>
    </div>
  </div>
  <div class="wrap foot-note">
    <p data-i18n="disclaimer">The information on this website is for general education only and does not replace advice from a qualified doctor. Please consult a doctor about your own health.</p>
    <p>© <span id="yr"></span> IR@SABAH · Dr. Chandran Nadarajan</p>
  </div>
</footer>
'''

SCRIPTS = '''<script src="/data.js"></script>
<script src="/content-data.js"></script>
<script src="/site.js"></script>
</body>
</html>
'''


def strip_head(html):          # inner pages get their title from the banner
    return re.sub(r'\s*<header class="sec-head.*?</header>', '', html, count=1, flags=re.S)


# ---------- page-specific sections ----------
HOME_ABOUT = '''<section class="section" id="about-teaser">
  <div class="wrap teaser-grid">
    <div class="teaser-photo reveal">
      <img data-img-src="doctor" src="/images/doctor.jpg" alt="Dr. Chandran Nadarajan" loading="lazy">
    </div>
    <div class="teaser-copy reveal">
      <span class="kicker" data-i18n="d_kicker">Meet Your Doctor</span>
      <h2 class="h2">Dr. Chandran <em>Nadarajan</em></h2>
      <p class="cred">MD (USM) · M.Med (Rad) (USM)</p>
      <p class="prose" data-i18n="d_bio">—</p>
      <a class="btn btn-navy" href="/about" data-i18n="ab_more">Read full profile</a>
    </div>
  </div>
</section>
'''

HOME_CONDS = '''<section class="section alt" id="home-conditions">
  <div class="wrap">
    <header class="sec-head reveal">
      <span class="kicker" data-i18n="c_kicker">Conditions We Treat</span>
      <h2 class="h2" data-i18n-html="c_title">Understand your condition, <em>in plain language</em></h2>
    </header>
    <div class="cards" id="homeConds"></div>
    <div class="section-actions"><a class="btn btn-navy" href="/conditions" data-i18n="hc_more">View all conditions</a></div>
  </div>
</section>
'''

HOME_TREATS = '''<section class="section dark" id="home-treatments">
  <div class="dark-bg" aria-hidden="true"></div>
  <div class="wrap">
    <header class="sec-head reveal light">
      <span class="kicker gold" data-i18n="t_kicker">Treatments &amp; Procedures</span>
      <h2 class="h2" data-i18n-html="t_title">Minimally invasive options, <em>explained simply</em></h2>
    </header>
    <div class="cards on-dark" id="homeTreats"></div>
    <div class="section-actions"><a class="btn btn-gold" href="/treatments" data-i18n="ht_more">View all treatments</a></div>
  </div>
</section>
'''

COND_PAGE = '''<section class="section alt page-first" id="conditions">
  <div class="wrap">
    <div class="toolbar">
      <div class="filters" id="condFilters" role="group" aria-label="Filter conditions"></div>
      <label class="search"><span class="ico" data-icon="search"></span><input type="search" id="condSearch" data-i18n-ph="search" placeholder="Search conditions…" autocomplete="off"></label>
    </div>
    <div class="cards" id="condGrid"></div>
    <p class="empty" id="condEmpty" hidden data-i18n="none">Nothing found — try another word.</p>
  </div>
</section>
'''

TREAT_PAGE = '''<section class="section alt page-first" id="treatments">
  <div class="wrap">
    <div class="toolbar">
      <div class="filters" id="treatFilters" role="group" aria-label="Filter treatments"></div>
    </div>
    <div class="cards" id="treatGrid"></div>
  </div>
</section>
'''


def modals():
    return P('detail') + '\n' + P('floatwa') + '\n' + P('videomodal') + '\n'


def build(key, body):
    out = head(key)
    if key == 'home':
        out += P('splash') + '\n'
    out += header(key) + '\n<main id="main">\n' + body + '\n</main>\n\n' + FOOTER + '\n' + modals() + SCRIPTS
    (ROOT / PAGES[key]['file']).write_text(out, encoding='utf-8')


def main():
    build('home', '\n'.join([P('hero'), P('trust'), HOME_ABOUT, HOME_CONDS, HOME_TREATS,
                             P('videos'), P('stories'), CTA]))
    build('about', '\n'.join([banner('about'), P('doctor'), CTA]))
    build('conditions', '\n'.join([banner('conditions'), COND_PAGE, CTA]))
    build('treatments', '\n'.join([banner('treatments'), TREAT_PAGE, CTA]))
    build('videos', '\n'.join([banner('videos'), '<div class="page-first">' + strip_head(P('videos')) + '</div>', CTA]))
    build('contact', '\n'.join([banner('contact'), strip_head(P('contact'))]))

    urls = ''.join(f'  <url><loc>{SITE}{p["path"]}</loc></url>\n' for p in PAGES.values())
    (ROOT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '</urlset>\n')
    (ROOT / 'robots.txt').write_text(f'User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: {SITE}/sitemap.xml\n')
    print('built', ', '.join(p['file'] for p in PAGES.values()))


if __name__ == '__main__':
    main()
