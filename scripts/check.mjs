import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const base = 'http://127.0.0.1:4174/trinetra-consulting/';
const pages = ['index.html', 'services.html', 'about.html', 'contact.html'];
const preview = path.join(root, 'preview');
await mkdir(preview, { recursive: true });
const server = spawn(process.execPath, ['scripts/serve.mjs'], {
  cwd: root, env: { ...process.env, PORT: '4174' }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('Preview server did not start')), 10000);
  server.stdout.once('data', () => { clearTimeout(timeout); resolve(); });
  server.once('error', reject);
  server.once('exit', code => { if (code) reject(new Error(`Preview server exited with ${code}`)); });
});

let browser;
const report = [];
try {
  browser = await chromium.launch({ headless: true });
  for (const width of [1440, 768, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    for (const file of pages) {
      await page.goto(base + file);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.title(), 'Trinetra Consultancy | A Vision Beyond Ordinary');
      assert.equal(await page.locator('h1').count(), 1, `${file}: one primary heading`);
      assert.equal(await page.locator('nav[aria-label="Main navigation"] [aria-current="page"]').count(), 1);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${file} overflows at ${width}px`);
      assert.equal(await page.locator('.mobile-email').isVisible(), width <= 800);
      assert.equal(await page.locator('.menu-toggle').isVisible(), width <= 800);
      assert(await page.evaluate(() => document.fonts.check('600 24px Manrope') && document.fonts.check('400 16px Inter')), 'Local fonts loaded');
      if (width === 1440 || width === 390) {
        const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        const violations = result.violations.map(item => `${item.id}: ${item.nodes.map(node => node.target.join(' ')).join(', ')}`);
        assert.deepEqual(violations, [], `${file} accessibility at ${width}px`);
        if (width === 1440) {
          await page.screenshot({ path: path.join(preview, file.replace('.html', '-desktop.png')), fullPage: true });
        } else {
          await page.screenshot({ path: path.join(preview, file.replace('.html', '-mobile.png')), fullPage: true });
        }
      }
      report.push(`${file} at ${width}px: layout, navigation, local assets${[1440,390].includes(width) ? ', WCAG A/AA scan' : ''} passed`);
    }
    assert.deepEqual(errors, [], 'No browser errors or failed requests');
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(base);
  const toggle = page.locator('.menu-toggle');
  await toggle.focus();
  await page.keyboard.press('Enter');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  assert(await page.locator('#main-navigation').isVisible());
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').innerText(), 'Home');
  await page.keyboard.press('Escape');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(await page.locator(':focus').getAttribute('class'), 'menu-toggle');
  await toggle.click();
  await page.locator('#main-navigation').getByRole('link', { name: 'Services', exact: true }).click();
  await page.waitForURL('**/services.html');
  const quotes = page.getByRole('link', { name: 'Request a Quote' });
  const config = JSON.parse(await readFile(path.join(root, 'site.config.json'), 'utf8'));
  assert.equal(await quotes.count(), config.services.length);
  for (let i = 0; i < config.services.length; i++) {
    const link = new URL(await quotes.nth(i).getAttribute('href'));
    assert.equal(decodeURIComponent(link.pathname), config.contact.email);
    assert.equal(link.searchParams.get('subject'), `Quote Request: ${config.services[i].name}`);
    assert.equal(link.searchParams.get('body'), "Company name:\r\nIndustry:\r\nCountry:\r\nWhat we'd like help with:");
  }
  await page.goto(base + 'contact.html');
  assert.equal(await page.locator('.faq-item').count(), 5);
  const firstQuestion = page.locator('.faq-item summary').first();
  await firstQuestion.focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.faq-item').first().getAttribute('open'), '');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.faq-item').first().getAttribute('open'), null);
  const enquiryForm = page.locator('#enquiry-form');
  assert(await enquiryForm.isVisible());
  assert.equal(await page.locator('.contact-social').getAttribute('href'), config.contact.linkedin);
  assert.equal(await page.locator('.contact-value').textContent(), 'Lucknow');
  assert.equal(await page.locator('a[href^="tel:"], a[href^="https://wa.me/"]').count(), 0);
  assert.equal(await page.locator('#enquiry-service option').count(), config.services.length + 2);
  const requests = [];
  let responseMode = 'success';
  await page.route('https://formsubmit.co/**', async route => {
    requests.push(route.request().postDataJSON());
    if (responseMode === 'network') return route.abort();
    await route.fulfill({ status: responseMode === 'error' ? 500 : 200, contentType: 'application/json', body: JSON.stringify({success: responseMode === 'success' ? 'true' : 'false'}) });
  });
  const submit = enquiryForm.getByRole('button', { name: 'Submit', exact: true });
  await submit.click();
  assert.equal(requests.length, 0);
  assert(await page.locator('#first-name').evaluate(el => el.validity.valueMissing));
  const fillEnquiry = async () => {
    await page.locator('#first-name').fill('Maya');
    await page.locator('#last-name').fill("O'Neil");
    await page.locator('#enquiry-email').fill('maya+test@example.com');
    await page.locator('#enquiry-message').fill('Please review A&B + expansion #2?');
    await page.locator('#enquiry-service').selectOption(config.services[5].name);
  };
  await fillEnquiry();
  await page.locator('#enquiry-email').fill('invalid');
  await submit.click();
  assert.equal(requests.length, 0);
  await page.locator('#enquiry-email').fill('maya+test@example.com');
  await submit.click();
  await page.waitForFunction(() => document.querySelector('.form-feedback').dataset.state === 'success');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].email, 'maya+test@example.com');
  assert.equal(requests[0]._replyto, 'maya+test@example.com');
  assert.equal(requests[0].name, "Maya O'Neil");
  assert.equal(requests[0].message, 'Please review A&B + expansion #2?');
  assert.equal(requests[0].service, config.services[5].name);
  assert.equal(await page.locator('#enquiry-message').inputValue(), '');
  for (const mode of ['error', 'network']) {
    responseMode = mode;
    await fillEnquiry();
    await submit.click();
    await page.waitForFunction(() => document.querySelector('.form-feedback').dataset.state === 'error' && !document.querySelector('.form-feedback').hidden);
    assert.equal(await page.locator('#enquiry-message').inputValue(), 'Please review A&B + expansion #2?');
    assert(await page.locator('.form-email-fallback').isVisible());
    assert(await submit.isEnabled());
  }
  responseMode = 'success';
  await submit.click();
  await page.waitForFunction(() => document.querySelector('.form-feedback').dataset.state === 'success');
  assert.equal(requests.length, 4);
  assert.equal(await page.locator('#prepared-email').count(), 0);
  report.push('Submit form: validation, correct recipient endpoint and reply-to, accepted response, server/network failure recovery and retry passed using mocked delivery; no live email sent');
  await page.goto(base);
  await page.locator('[data-motion-toggle]').click();
  assert.equal(await page.locator('.ai-triangle-signal').first().evaluate(element => getComputedStyle(element).animationPlayState), 'paused');
  await page.locator('[data-motion-toggle]').click();
  assert.equal(await page.locator('.ai-triangle-signal').first().evaluate(element => getComputedStyle(element).animationPlayState), 'running');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.locator('.ai-triangle-signal').first().evaluate(element => getComputedStyle(element).animationName), 'none');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(preview, 'home-mobile-first-screen.png') });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(preview, 'home-desktop-first-screen.png') });
  report.push(`Keyboard menu, Escape, navigation, five FAQ accordions, ${config.services.length} quote templates, animation controls and reduced motion passed`);

  // Resolve links against a repository subpath: this catches common Pages deployment failures.
  for (const file of pages) {
    await page.goto(base + file);
    const links = await page.locator('a[href]').evaluateAll(elements => elements.map(element => element.getAttribute('href')));
    for (const href of links) {
      if (href.startsWith('mailto:') || href.startsWith('https://') || href.startsWith('tel:')) continue;
      assert(!href.startsWith('/'), 'Static links must be relative for project Pages');
      const [target, hash] = href.split('#');
      const filename = target || file;
      assert((await stat(path.join(root, filename))).isFile(), `Missing target ${href}`);
      if (hash) assert((await readFile(path.join(root, filename), 'utf8')).includes(`id="${hash}"`), `Missing anchor ${href}`);
    }
    const text = await page.locator('body').innerText();
    assert(!/[\p{Sc}]/u.test(text), 'No currency symbols');
  }
  report.push('Every local link and service anchor works beneath a GitHub Pages repository path; no currency symbols');
  await context.close();

  const noScript = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const fallback = await noScript.newPage();
  await fallback.goto(base + 'contact.html');
  assert(await fallback.locator('#main-navigation').isVisible());
  await fallback.locator('.faq-item summary').first().click();
  assert.equal(await fallback.locator('.faq-item').first().getAttribute('open'), '');
  assert(await fallback.locator('.contact-email').isVisible());
  assert(await fallback.locator('#enquiry-form').isVisible());
  assert.equal(await fallback.locator('#enquiry-form').getAttribute('method'), 'POST');
  assert.equal(await fallback.locator('#enquiry-form').getAttribute('action'), 'https://formsubmit.co/' + config.contact.email);
  await noScript.close();
  const local = await browser.newPage();
  await local.goto(pathToFileURL(path.join(root, 'index.html')).href);
  assert.equal(await local.locator('h1').innerText(), 'A vision\nbeyond\nordinary');
  assert(await local.locator('[data-motion-toggle]').isVisible());
  await local.close();
  report.push('No-JavaScript navigation and accordion fallback, plus direct file opening passed');
  await writeFile(path.join(preview, 'verification.txt'), `${new Date().toISOString()}\n\n${report.join('\n')}\n`);
  console.log(report.join('\n'));
} finally {
  await browser?.close();
  server.kill();
}
