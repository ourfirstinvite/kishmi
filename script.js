(() => {
  // Start each load at the sealed invitation, even if the browser would
  // otherwise restore a scroll position from the previously opened page.
  if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  const cover = document.querySelector('#cover');
  const invitation = document.querySelector('#invitation');
  const openButton = document.querySelector('#openInvitation');
  const audio = document.querySelector('#weddingAudio');
  const musicButton = document.querySelector('#musicToggle');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The wedding muhurtham is 9:30 AM IST on 20 November 2026.
  const weddingMoment = new Date('2026-11-20T09:30:00+05:30').getTime();
  const countdownParts = {
    days: document.querySelector('#days'),
    hours: document.querySelector('#hours'),
    minutes: document.querySelector('#minutes'),
    seconds: document.querySelector('#seconds')
  };
  function updateCountdown() {
    const remaining = Math.max(0, weddingMoment - Date.now());
    const values = {
      days: Math.floor(remaining / 86400000),
      hours: Math.floor((remaining % 86400000) / 3600000),
      minutes: Math.floor((remaining % 3600000) / 60000),
      seconds: Math.floor((remaining % 60000) / 1000)
    };
    Object.entries(values).forEach(([part, value]) => {
      countdownParts[part].textContent = String(value).padStart(2, '0');
    });
  }
  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  function makePetals() {
    if (reduceMotion) return;
    const field = document.querySelector('.petal-field');
    for (let i = 0; i < 22; i += 1) {
      const petal = document.createElement('span');
      petal.className = 'petal';
      petal.textContent = i % 3 === 0 ? '♥' : '❀';
      petal.style.left = `${Math.random() * 100}%`;
      petal.style.setProperty('--drift', `${Math.random() * 180 - 90}px`);
      petal.style.animationDuration = `${7 + Math.random() * 10}s`;
      petal.style.animationDelay = `${Math.random() * 8}s`;
      petal.style.fontSize = `${10 + Math.random() * 13}px`;
      field.append(petal);
    }
  }
  makePetals();

  openButton.addEventListener('click', () => {
    document.body.classList.remove('is-locked');
    invitation.inert = false;
    invitation.classList.add('is-open');
    cover.classList.add('cover-opening');
    window.setTimeout(() => {
      cover.hidden = true;
      document.querySelector('#home').scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth' });
    }, reduceMotion ? 0 : 1950);
    audio.play().then(() => setMusicState(true)).catch(() => {});
  });

  function setMusicState(playing) {
    musicButton.classList.toggle('is-playing', playing);
    musicButton.setAttribute('aria-pressed', String(playing));
    musicButton.setAttribute('aria-label', playing ? 'Pause wedding music' : 'Play wedding music');
    musicButton.querySelector('.music-label').textContent = playing ? 'Pause our song' : 'Play our song';
  }
  musicButton.addEventListener('click', async () => {
    if (audio.paused) {
      try { await audio.play(); setMusicState(true); } catch { setMusicState(false); }
    } else {
      audio.pause();
      setMusicState(false);
    }
  });
  audio.addEventListener('pause', () => setMusicState(false));
  audio.addEventListener('play', () => setMusicState(true));

  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.13, rootMargin: '0px 0px -30px 0px' });
    reveals.forEach(el => observer.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('visible'));
  }

  const dialog = document.querySelector('#photoDialog');
  const dialogImage = document.querySelector('#dialogImage');
  document.querySelectorAll('.gallery-photo').forEach(button => {
    button.addEventListener('click', () => {
      dialogImage.src = button.dataset.image;
      dialogImage.alt = button.querySelector('img').alt;
      dialog.showModal();
    });
  });
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });

  const eventInfo = {
    reception: { name: 'Kishore & Laxmi — Reception', start: '20261119T140000Z', end: '20261119T173000Z', description: 'Reception celebration, 7:30 PM onwards (IST). Shivanna Parvathi Kalyana Mantapa.' },
    wedding: { name: 'Kishore & Laxmi — Muhurtham', start: '20261120T040000Z', end: '20261120T050000Z', description: 'Auspicious muhurtham, 9:30 AM–10:30 AM (IST). Shivanna Parvathi Kalyana Mantapa.' }
  };
  document.querySelectorAll('.calendar-link').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const item = eventInfo[link.dataset.event];
      const escapeICS = value => value.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
      const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kishmi//Wedding Invitation//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:${link.dataset.event}-kishmi-2026@kishmi`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`, `DTSTART:${item.start}`, `DTEND:${item.end}`, `SUMMARY:${escapeICS(item.name)}`, `DESCRIPTION:${escapeICS(item.description)}`, 'LOCATION:Shivanna Parvathi Kalyana Mantapa', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      const file = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(file);
      const download = document.createElement('a');
      download.href = url;
      download.download = `kishmi-${link.dataset.event}-2026.ics`;
      download.click();
      URL.revokeObjectURL(url);
    });
  });
})();
