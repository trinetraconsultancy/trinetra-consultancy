// Direct contact links and native form submission also work without JavaScript.
const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('#main-navigation');

if (menuButton && menu) {
  document.documentElement.classList.add('has-menu');
  const setMenu = (open, restoreFocus = false) => {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    menu.classList.toggle('is-open', open);
    if (restoreFocus) menuButton.focus();
  };
  menuButton.addEventListener('click', () => {
    setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenu(false, true);
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) setMenu(false);
  });
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('focusin', event => {
    if (!event.target.closest('.site-header')) setMenu(false);
  });
  matchMedia('(min-width: 801px)').addEventListener('change', () => setMenu(false));
}

const enquiryForm = document.querySelector('#enquiry-form');
if (enquiryForm) {
  const firstName = enquiryForm.elements.namedItem('firstName');
  const message = enquiryForm.elements.namedItem('message');
  const feedback = enquiryForm.querySelector('.form-feedback');
  const emailFallback = enquiryForm.querySelector('.form-email-fallback');
  const status = enquiryForm.querySelector('#enquiry-status');
  const submitButton = enquiryForm.querySelector('[type="submit"]');
  const submitLabel = enquiryForm.querySelector('[data-submit-label]');
  const editableFields = [...enquiryForm.querySelectorAll('.form-fields input, .form-fields textarea, .form-fields select')];
  let submitting = false;
  const showFeedback = (state, text) => {
    feedback.hidden = false;
    feedback.dataset.state = state;
    status.textContent = text;
    emailFallback.hidden = state !== 'error';
  };
  enquiryForm.addEventListener('input', event => {
    event.target.setCustomValidity?.('');
    feedback.hidden = true;
    status.textContent = '';
  });
  enquiryForm.addEventListener('change', () => { feedback.hidden = true; });
  enquiryForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting) return;
    firstName.setCustomValidity(firstName.value.trim() ? '' : 'Please enter your first name.');
    message.setCustomValidity(message.value.trim() ? '' : 'Please enter a short message.');
    if (!enquiryForm.reportValidity()) return;
    const fields = new FormData(enquiryForm);
    if (fields.get('_honey') || !['http:', 'https:'].includes(location.protocol)) {
      showFeedback('error', fields.get('_honey')
        ? 'Unable to submit. Please reload the page and try again.'
        : 'Please use the website preview or published web address to submit your enquiry.');
      return;
    }
    const payload = {
      name: [fields.get('firstName').trim(), fields.get('lastName').trim()].filter(Boolean).join(' '),
      email: fields.get('email').trim(),
      service: fields.get('service'),
      message: fields.get('message').trim(),
      _replyto: fields.get('email').trim(),
      _subject: `New enquiry: ${fields.get('service')}`,
      _template: 'table',
      _captcha: 'false',
      _honey: '',
      _url: `${location.origin}${location.pathname}`,
    };
    submitting = true;
    feedback.hidden = true;
    enquiryForm.setAttribute('aria-busy', 'true');
    editableFields.forEach(field => { field.disabled = true; });
    submitButton.disabled = true;
    submitLabel.textContent = 'Sending…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(enquiryForm.dataset.submitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || ![true, 'true'].includes(result?.success)) {
        const reason = typeof result?.message === 'string' ? result.message.trim().slice(0, 500) : '';
        if (reason) {
          const activationNeeded = /activat|confirm.*email|verify.*email/i.test(reason);
          showFeedback('error', activationNeeded
            ? 'Email delivery needs activation. Open trinetraconsultancy1@gmail.com, check Inbox and Spam for FormSubmit, and confirm the activation link. Then submit again.'
            : `The email service could not accept this enquiry: ${reason} Your message has been kept.`);
        } else {
          showFeedback('error', `The email service returned an unexpected response (HTTP ${response.status}). Your message has been kept. Please try again shortly.`);
        }
        return;
      }
      enquiryForm.reset();
      showFeedback('success', 'Thank you. Your enquiry has been submitted.');
    } catch (error) {
      showFeedback('error', error.name === 'AbortError'
        ? 'The email service took too long to respond. We couldn’t confirm submission. Your message is still here; please try again.'
        : 'The email service could not be reached. Check your connection or browser blocking settings and try again. Your message is still here.');
    } finally {
      clearTimeout(timeout);
      submitting = false;
      enquiryForm.removeAttribute('aria-busy');
      editableFields.forEach(field => { field.disabled = false; });
      submitButton.disabled = false;
      submitLabel.textContent = 'Submit';
    }
  });
}

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const motionButton = document.querySelector('[data-motion-toggle]');
if (motionButton) {
  motionButton.hidden = false;
  motionButton.addEventListener('click', () => {
    const paused = document.documentElement.classList.toggle('motion-paused');
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.querySelector('span').textContent = paused ? 'Play motion' : 'Pause motion';
  });
}

if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.remove('reveal-pending');
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.08 });
  document.querySelectorAll('[data-reveal]').forEach(element => {
    if (element.getBoundingClientRect().top > window.innerHeight) {
      element.classList.add('reveal-pending');
      observer.observe(element);
    }
  });
  // Focused content must remain visible when a visitor navigates with a keyboard.
  document.addEventListener('focusin', event => {
    event.target.closest('.reveal-pending')?.classList.remove('reveal-pending');
  });
  reducedMotion.addEventListener('change', event => {
    if (event.matches) {
      document.querySelectorAll('.reveal-pending').forEach(element => element.classList.remove('reveal-pending'));
      observer.disconnect();
    }
  });
}
