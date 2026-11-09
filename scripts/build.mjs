import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(await readFile(path.join(root, 'site.config.json'), 'utf8'));
const { contact, services, founders, faqs } = config;
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const emailDisplay = contact.email || '[EMAIL ADDRESS]';
const quoteBody = "Company name:\r\nIndustry:\r\nCountry:\r\nWhat we'd like help with:";
const emailHref = (subject = 'Enquiry: Trinetra Consultancy') => {
  const recipient = encodeURIComponent(contact.email).replace(/%40/g, '@');
  return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(quoteBody)}`;
};
const icons = {
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  northeast: '<path d="M6 18 18 6M6 6h12v12"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r=".8" fill="currentColor" stroke="none"/><path d="M8 11v6m4 0v-6m0 3c0-4 5-4 5 0v3"/>',
  chart: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 16v-3m5 3V8m5 8v-6"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2m2-15a3 3 0 0 1 0 6m1 3a5 5 0 0 1 3 4v2"/>',
  trend: '<path d="M3 4v16h18M6 15l5-5 4 3 6-8m-6 0h6v6"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6 6-2Z"/>',
  megaphone: '<path d="M4 9h4l10-5v16L8 15H4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2Zm4 6 2 6H6l-2-6m16-6 2-1m-2 7 2 1M8 9v6"/>',
  ai: '<path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3ZM20 2v4m-2-2h4"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
};
const icon = (name, className = '') => `<svg class="icon ${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icons[name]}</svg>`;
// SVG viewports display the supplied JPEG without changing its artwork.
const logoArtwork = '<image href="assets/images/trinetra-logo.jpeg" width="1680" height="944"/>';
const mark = () => `<svg class="brand-emblem" viewBox="570 120 535 380" aria-hidden="true" focusable="false">${logoArtwork}</svg>`;
const brand = () => `<a class="brand" href="index.html" aria-label="Trinetra Consultancy home">${mark()}<svg class="brand-wordmark" viewBox="440 515 800 220" aria-hidden="true" focusable="false">${logoArtwork}</svg></a>`;
const fullBrand = () => `<a class="brand brand-full" href="index.html" aria-label="Trinetra Consultancy home"><svg viewBox="440 120 800 620" aria-hidden="true" focusable="false">${logoArtwork}</svg></a>`;
const emailButton = (label = 'Email Us', subject, extraClass = '') => `<a class="button ${extraClass}" href="${esc(emailHref(subject))}">${esc(label)}${icon('northeast')}</a>`;
const pages = [ ['index.html', 'Home'], ['services.html', 'Services'], ['about.html', 'About'], ['contact.html', 'Contact'] ];
const header = current => `<a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header"><div class="container header-inner">
    ${brand()}
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-navigation" aria-label="Open navigation">${icon('menu', 'menu-icon')}${icon('close', 'close-icon')}</button>
    <nav class="main-navigation" id="main-navigation" aria-label="Main navigation">
      ${pages.map(([file, name]) => `<a href="${file}"${current === file ? ' aria-current="page"' : ''}>${name}</a>`).join('\n')}
      ${emailButton()}
    </nav>
  </div></header>`;
const footer = current => `<footer class="site-footer"><div class="container">
  <div class="footer-main">
    <div class="footer-brand">${fullBrand()}<p class="footer-tagline">A vision beyond ordinary</p></div>
    <div class="footer-explore"><h2 class="footer-heading">Explore</h2><nav class="footer-links" aria-label="Footer navigation">${pages.map(([file, name]) => `<a href="${file}"${current === file ? ' aria-current="page"' : ''}><span>${name}</span>${icon('arrow')}</a>`).join('')}</nav></div>
    <div class="footer-contact"><p class="footer-label">Start a conversation</p><h2>Let’s talk about<br>your business.</h2><p class="footer-contact-copy">Tell us what you’d like to improve.</p><a class="footer-email" href="${esc(emailHref())}">${icon('mail')}<span>${esc(emailDisplay)}</span></a>${emailButton()}</div>
  </div>
  <div class="footer-bottom"><span>® 2026 Trinetra Consultancy. All rights reserved.</span><span>${icon('ai')}AI-enabled Business Consultancy</span></div>
  </div></footer>
  ${emailButton('Email Us', undefined, 'mobile-email')}`;
const closing = () => `<section class="closing-section" aria-labelledby="closing-title"><div class="container"><div class="closing-banner" data-reveal><div><h2 id="closing-title">Ready to see beyond ordinary?</h2><p>Email us to request a quote.</p></div>${emailButton()}</div></div></section>`;
const visual = () => `<figure class="ai-visual" aria-label="AI-enabled Business Consultancy">
  <div class="visual-topline" aria-hidden="true"><span>A clearer perspective</span>${icon('ai')}</div>
  <div class="ai-canvas" aria-hidden="true">
    <svg class="ai-triangle" viewBox="0 0 540 540" focusable="false">
      <defs><linearGradient id="ai-triangle-fill" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f8fcff"/><stop offset="1" stop-color="#e6f2fa"/></linearGradient></defs>
      <path d="M270 38 8 478H532Z" fill="none" stroke="#d8e7f2" stroke-width="1" stroke-dasharray="2 7"/>
      <path d="M270 82 42 442H498Z" fill="url(#ai-triangle-fill)" stroke="#a9cde5" stroke-width="1.2"/>
      <path d="M270 82 42 442 270 116Z" fill="#a5d9f2"/>
      <path d="M270 82 498 442 270 116Z" fill="#71b4df" fill-opacity=".6"/>
      <path d="M270 116 66 426H474Z" fill="none" stroke="#c8e2f1" stroke-width="1"/>
      <path class="ai-triangle-signal" d="M270 82 42 442H498Z" pathLength="100" fill="none" stroke="#407fae" stroke-width="2" stroke-linecap="round"/>
    </svg>
    <div class="ai-core"><span class="ai-kicker">AI-enabled</span><strong>Business<br>Consultancy</strong></div>
  </div>
  <figcaption class="visual-caption"><span>Insight you can act on.</span><button type="button" class="motion-toggle" data-motion-toggle aria-pressed="false" hidden>${icon('pause')}<span>Pause motion</span></button></figcaption>
</figure>`;
const serviceCards = () => services.map((service, index) => `<article class="service-card" data-reveal>
  <div class="service-top"><div class="icon-box">${icon(service.icon)}</div><span>0${index + 1}</span></div>
  <h3>${esc(service.name)}</h3><p>${esc(service.description)}</p>
  <a class="text-link" href="services.html#${service.id}" aria-label="Explore ${esc(service.name)}">Explore service${icon('arrow')}</a>
</article>`).join('\n');

function home() {
  const steps = [
    ['Discover', 'We understand your business, your goals and the questions that matter.'],
    ['Analyse', 'We bring your data into focus with business thinking and AI-powered analysis.'],
    ['Recommend', 'We turn findings into clear, practical recommendations.'],
    ['Hand Over', 'You receive useful deliverables and guidance to put them to work.'],
  ];
  const reasons = [
    'Faster turnaround, powered by AI',
    'Affordable for growing businesses',
    'A founding team covering Finance, Marketing and Operations',
    'Clear, practical deliverables you can actually use',
    'Founders directly involved in every project',
  ];
  return `<section class="hero" aria-labelledby="hero-title"><div class="container hero-grid">
    <div class="hero-copy"><p class="eyebrow">Trinetra Consultancy</p>
      <h1 id="hero-title"><span>A vision</span> <span>beyond</span> <span class="accent-text">ordinary</span></h1>
      <p class="lead"><strong>AI-enabled Business Consultancy.</strong><br>Clear insights and practical recommendations for growing businesses.</p>
      <div class="button-row">${emailButton()}<a class="button button-secondary" href="services.html">Explore Services${icon('arrow')}</a></div>
      <p class="hero-note">${icon('ai')}AI-powered analysis. Expert-led recommendations.</p>
    </div>${visual()}
  </div></section>
  <div class="intro-strip"><div class="container"><p><strong>Built for growing businesses.</strong> AI-enabled business consultancy for startups and small and mid-sized companies in India and around the world.</p><a class="text-link" href="about.html">Get to know Trinetra${icon('arrow')}</a></div></div>
  <section class="section" aria-labelledby="approach-title"><div class="container approach-grid">
    <div data-reveal><p class="eyebrow">Our Approach</p><h2 id="approach-title">AI-enabled insight.<br>Practical business advice.</h2></div>
    <div class="approach-copy" data-reveal><p>We use AI to analyse information, research markets and uncover opportunities faster.</p><p>Our founding team reviews every insight and shapes practical recommendations around your business.</p><a class="text-link" href="about.html">Meet the team behind the work${icon('arrow')}</a></div>
  </div></section>
  <section class="section section-soft" aria-labelledby="services-title"><div class="container">
    <div class="section-heading" data-reveal><div><p class="eyebrow">Our Services</p><h2 id="services-title">Make your next move<br>an informed one.</h2></div><a class="text-link" href="services.html">Explore all services${icon('arrow')}</a></div>
    <div class="service-grid">${serviceCards()}</div>
  </div></section>
  <section class="section" aria-labelledby="process-title"><div class="container">
    <div class="section-heading" data-reveal><div><p class="eyebrow">How We Work</p><h2 id="process-title">From questions to clarity.</h2></div><p>A straightforward process, with your business at the centre.</p></div>
    <div class="process-grid">${steps.map(([name, description], index) => `<article class="process-step" data-reveal><span class="step-number">0${index + 1}</span>${index < 3 ? icon('arrow') : icon('check')}<h3>${name}</h3><p>${description}</p></article>`).join('')}</div>
  </div></section>
  <section class="section section-soft" aria-labelledby="why-title"><div class="container why-grid">
    <div class="why-copy" data-reveal><p class="eyebrow">Why Trinetra</p><h2 id="why-title">Fresh thinking.<br>Practical outcomes.</h2><p class="lead">The analytical power of AI, guided by people who understand business.</p><div class="why-signature">${mark()}A vision beyond ordinary</div></div>
    <ul class="reason-list" data-reveal>${reasons.map(reason => `<li>${icon('check')}<span>${reason}</span></li>`).join('')}</ul>
  </div></section>${closing()}`;
}

function servicesPage() {
  const list = items => `<ul>${items.map(item => `<li>${icon('check')}<span>${esc(item)}</span></li>`).join('')}</ul>`;
  // Keep category names inline while using the same checklist for every service.
  const deliverables = service => list(service.deliverables ?? service.deliverableGroups.flatMap(group =>
    group.items.map((item, index) => index === 0 ? `${group.name}: ${item}` : item)
  ));
  return `<section class="page-hero"><div class="container"><div class="page-title-row"><div><p class="eyebrow">Our Services</p><h1>Clarity for the decisions<br>that move you forward.</h1><p class="lead">Six focused packages. Practical deliverables. Business insight shaped around the questions you need to answer.</p></div>${mark()}</div></div></section>
  <nav class="service-index" aria-label="Service packages"><div class="container">${services.map((service, index) => `<a href="#${service.id}"><span>0${index + 1}</span>${esc(service.shortName || service.name)}</a>`).join('')}</div></nav>
  <div class="packages">${services.map((service, index) => `<section class="package-section${service.deliverableGroups ? ' package-section-grouped' : ''}" id="${service.id}" aria-labelledby="package-${index}-title"><div class="container package-grid">
    <div class="package-intro" data-reveal><p class="eyebrow">Service 0${index + 1}</p><h2 id="package-${index}-title">${esc(service.name)}</h2><p class="description">${esc(service.description)}</p>
      <div class="package-audience"><h3>Who it’s for</h3><p>${esc(service.audience)}</p></div>
      ${emailButton('Request a Quote', `Quote Request: ${service.name}`)}
    </div>
    <div class="deliverables" data-reveal><h3>What you’ll receive</h3>${deliverables(service)}</div>
  </div></section>`).join('')}</div>
  <section class="service-help"><div class="container" data-reveal><h2>Not sure where to start?</h2><p>Tell us about your challenge. We’ll help you find the right package.</p>${emailButton()}</div></section>`;
}

function aboutPage() {
  return `<section class="page-hero"><div class="container about-intro"><div><p class="eyebrow">About Trinetra</p><h1>A different way<br>of seeing business.</h1><p class="lead">We’re an AI-enabled business consultancy, founded by four MBA graduates from WeSchool, Mumbai.</p></div>${visual()}</div></section>
  <section class="section section-soft" aria-labelledby="story-title"><div class="container">
    <div class="story-grid"><div data-reveal><p class="eyebrow">The Story of Our Name</p><h2 id="story-title">There’s more<br>than meets the eye.</h2><p class="story-quote">A vision beyond ordinary</p></div>
    <div class="story-copy" data-reveal>
      <p>“Trinetra” is Sanskrit for the three-eyed one — a vision that sees beyond the obvious.</p>
      <p>And that’s exactly how we think.</p>
      <p>Business problems rarely come with a flashing warning sign. Sometimes, the real opportunity is hiding in the data, the numbers or the details everyone else overlooks.</p>
      <p>At Trinetra Consultancy, we bring together AI-powered insights and MBA-trained thinking to help businesses see the bigger picture — and act on it.</p>
      <p>With expertise across Finance, Marketing and Operations, we turn complex business challenges into clearer decisions, smarter strategies and practical solutions.</p>
      <p>Because better decisions shouldn’t come with a traditional consulting price tag.</p>
    </div></div>
    <section class="mission-panel" aria-labelledby="mission-title" data-reveal><p class="eyebrow">Our Mission</p><div class="mission-copy"><h2 id="mission-title">Making business intelligence accessible, not exclusive.</h2><p>To make high-quality business intelligence and actionable insights accessible to growing businesses in India and around the world — so they can make smarter moves, compete confidently and grow beyond the obvious.</p></div></section>
  </div></section>
  <section class="section" aria-labelledby="team-title"><div class="container">
    <div class="section-heading" data-reveal><div><p class="eyebrow">The Team Behind Trinetra</p><h2 id="team-title">Four founders.<br>A shared perspective.</h2></div><p>Finance, Marketing and Operations.<br>Founders directly involved in every project.</p></div>
    <div class="founder-grid">${founders.map(founder => `<article class="founder-card" data-reveal><div class="founder-avatar" aria-hidden="true">${esc(founder.initials)}</div><div><h3>${esc(founder.name)}</h3><p class="founder-title">Co-Founder</p><p class="qualification">MBA (${esc(founder.specialisation)})<br>WeSchool, Mumbai</p></div></article>`).join('')}</div>
  </div></section>${closing()}`;
}

function contactPage() {
  const formRecipient = encodeURIComponent(contact.email).replace(/%40/g, '@');
  return `<section class="contact-intro" aria-labelledby="contact-title"><div class="container">
    <div class="contact-heading"><h1 id="contact-title">Contact Us</h1><p class="lead">Tell us about your business and what you’d like to improve. We’ll reply with a tailored quote.</p></div>
    <div class="contact-grid">
      <address class="contact-details" aria-label="Business contact details">
        <div class="contact-info-row">${icon('pin')}<div><p class="contact-label">Location</p><p class="contact-value">${esc(contact.location)}</p></div></div>
        <div class="contact-info-row">${icon('mail')}<div><p class="contact-label">Email</p><a class="contact-email" href="${esc(emailHref())}">${esc(emailDisplay)}</a></div></div>
        <div class="contact-info-row">${icon('linkedin')}<div><p class="contact-label">LinkedIn</p><a class="contact-social" href="${esc(contact.linkedin)}" target="_blank" rel="noopener noreferrer" aria-label="Trinetra Consultancy on LinkedIn (opens in a new tab)">Trinetra Consultancy${icon('northeast')}</a></div></div>
      </address>
      <div class="contact-form-area">
        <form id="enquiry-form" class="enquiry-form" aria-label="Business enquiry" action="https://formsubmit.co/${esc(formRecipient)}" method="POST" data-submit-url="https://formsubmit.co/ajax/${esc(formRecipient)}">
          <input type="hidden" name="_subject" value="New website enquiry: Trinetra Consultancy">
          <input type="hidden" name="_template" value="table">
          <input type="hidden" name="_captcha" value="false">
          <div class="form-honeypot" aria-hidden="true"><label for="enquiry-website">Leave this field empty</label><input id="enquiry-website" name="_honey" tabindex="-1" autocomplete="off"></div>
          <div class="form-fields">
            <div class="form-field"><label for="first-name">First name <span aria-hidden="true">*</span></label><input id="first-name" name="firstName" autocomplete="given-name" maxlength="100" required></div>
            <div class="form-field"><label for="last-name">Last name</label><input id="last-name" name="lastName" autocomplete="family-name" maxlength="100"></div>
            <div class="form-field form-field-wide"><label for="enquiry-email">Email <span aria-hidden="true">*</span></label><input id="enquiry-email" name="email" type="email" autocomplete="email" maxlength="254" required></div>
            <div class="form-field form-field-wide"><label for="enquiry-message">Message <span aria-hidden="true">*</span></label><textarea id="enquiry-message" name="message" rows="5" maxlength="2000" aria-describedby="message-hint" placeholder="What would you like help with?" required></textarea><p class="field-hint" id="message-hint">Up to 2,000 characters.</p></div>
            <div class="form-field form-field-wide"><label for="enquiry-service">Service <span aria-hidden="true">*</span></label><div class="select-wrap"><select id="enquiry-service" name="service" required><option value="" selected disabled>Choose a service</option>${services.map(service => `<option value="${esc(service.name)}">${esc(service.name)}</option>`).join('')}<option value="General enquiry">Not sure yet — let’s discuss</option></select></div></div>
          </div>
          <div class="form-actions"><p id="form-email-note">Send your enquiry directly to Trinetra Consultancy.</p><button class="button" type="submit" aria-describedby="form-email-note"><span data-submit-label>Submit</span>${icon('arrow')}</button></div>
          <div class="form-feedback" hidden><p role="status" id="enquiry-status"></p><a class="text-link form-email-fallback" href="${esc(emailHref())}" hidden>Email us directly${icon('northeast')}</a></div>
        </form>
      </div>
    </div>
  </div></section>
  <section class="section section-soft" aria-labelledby="faq-title"><div class="container faq-grid">
    <div class="faq-intro" data-reveal><p class="eyebrow">A Little More Clarity</p><h2 id="faq-title">Good questions.<br>Clear answers.</h2><p>A few things you might like to know before we get started.</p></div>
    <div class="faq-list" data-reveal>${faqs.map(faq => `<details class="faq-item"><summary>${esc(faq.question)}</summary><p>${esc(faq.answer)}</p></details>`).join('')}</div>
  </div></section>`;
}

const description = 'AI-enabled business consultancy for growing businesses in India and worldwide: business intelligence, HR analytics, financial planning, market intelligence, social media marketing and AI advisory.';
function document(file, content) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#ffffff">
  <title>Trinetra Consultancy | A Vision Beyond Ordinary</title>
  <meta name="description" content="${description}">
  <meta property="og:title" content="Trinetra Consultancy | A Vision Beyond Ordinary">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Trinetra Consultancy">
  <link rel="icon" type="image/svg+xml" href="assets/favicon.svg?v=consultancy-logo-2">
  <link rel="preload" href="assets/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="assets/styles.css">
  <script src="assets/main.js" defer></script>
</head>
<body>
${header(file)}
<main id="main" tabindex="-1">${content}</main>
${footer(file)}
</body>
</html>
`;
}

const output = { 'index.html': home(), 'services.html': servicesPage(), 'about.html': aboutPage(), 'contact.html': contactPage() };
// SVG favicons cannot fetch external images, so embed the supplied JPEG.
const logoData = (await readFile(path.join(root, 'assets/images/trinetra-logo.jpeg'))).toString('base64');
await writeFile(path.join(root, 'assets/favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="565 65 545 545"><image href="data:image/jpeg;base64,${logoData}" width="1680" height="944"/></svg>\n`);
for (const [filename, content] of Object.entries(output)) {
  await writeFile(path.join(root, filename), document(filename, content));
  console.log(`Built ${filename}`);
}
if (!contact.email) console.log('Contact placeholders retained. Email links open a draft with no recipient until contact.email is filled.');
