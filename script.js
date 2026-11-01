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
  const preweddingVideo = document.querySelector('.video-wrap video');
  const pagePetals = document.querySelector('#pagePetals');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let resumeWeddingAudio = false;
  let heartShowerStarted = false;

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

  function startHeartShower() {
    if (reduceMotion || heartShowerStarted) return;
    heartShowerStarted = true;
    pagePetals.classList.add('is-active');
    const pinks = ['#e87896', '#f3a0b5', '#d9577d', '#ffc1d0', '#ca4d73', '#f58daa'];
    const makeHeart = () => {
      if (document.hidden) return;
      const heart = document.createElement('span');
      heart.className = 'heart-petal';
      heart.textContent = '♥';
      heart.style.left = `${Math.random() * 100}%`;
      heart.style.color = pinks[Math.floor(Math.random() * pinks.length)];
      const drift = Math.random() * 150 - 75;
      const turn = Math.random() * 600 - 300;
      heart.style.setProperty('--fall-duration', `${8 + Math.random() * 6}s`);
      heart.style.setProperty('--fall-x', `${drift}px`);
      heart.style.setProperty('--fall-mid-x', `${drift * 0.55}px`);
      heart.style.setProperty('--fall-turn', `${turn}deg`);
      heart.style.setProperty('--fall-mid-turn', `${turn * 0.55}deg`);
      heart.style.setProperty('--fall-size', `${9 + Math.random() * 13}px`);
      heart.style.setProperty('--fall-alpha', `${0.38 + Math.random() * 0.35}`);
      pagePetals.append(heart);
      heart.addEventListener('animationend', () => heart.remove(), { once: true });
    };
    makeHeart();
    window.setInterval(makeHeart, 620);
  }

  openButton.addEventListener('click', () => {
    document.body.classList.remove('is-locked');
    invitation.inert = false;
    invitation.classList.add('is-open');
    cover.classList.add('cover-opening');
    window.setTimeout(() => {
      cover.hidden = true;
      document.querySelector('#home').scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth' });
      startHeartShower();
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
      if (!preweddingVideo.paused) {
        preweddingVideo.pause();
        resumeWeddingAudio = false;
      }
      try { await audio.play(); setMusicState(true); } catch { setMusicState(false); }
    } else {
      audio.pause();
      setMusicState(false);
    }
  });
  audio.addEventListener('pause', () => setMusicState(false));
  audio.addEventListener('play', () => setMusicState(true));

  function finishVideoAndRestoreMusic() {
    if (!preweddingVideo.paused && !preweddingVideo.ended) preweddingVideo.pause();
    if (!resumeWeddingAudio) return;
    resumeWeddingAudio = false;
    audio.play().then(() => setMusicState(true)).catch(() => setMusicState(false));
  }

  preweddingVideo.addEventListener('play', () => {
    resumeWeddingAudio = !audio.paused;
    if (resumeWeddingAudio) {
      audio.pause();
      setMusicState(false);
    }
  });
  preweddingVideo.addEventListener('ended', finishVideoAndRestoreMusic);

  if ('IntersectionObserver' in window) {
    const videoVisibility = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting && (resumeWeddingAudio || !preweddingVideo.paused)) {
          finishVideoAndRestoreMusic();
        }
      });
    }, { threshold: 0.15 });
    videoVisibility.observe(preweddingVideo);
  }

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
  const photoCounter = document.querySelector('#photoCounter');
  const galleryPhotos = [...document.querySelectorAll('.gallery-photo')];
  let activePhoto = 0;
  function showPhoto(index) {
    activePhoto = (index + galleryPhotos.length) % galleryPhotos.length;
    const button = galleryPhotos[activePhoto];
    dialogImage.classList.add('is-changing');
    dialogImage.alt = button.querySelector('img').alt;
    dialogImage.src = button.dataset.image;
    photoCounter.textContent = `${activePhoto + 1} / ${galleryPhotos.length}`;
    dialogImage.onload = () => dialogImage.classList.remove('is-changing');
  }
  galleryPhotos.forEach((button, index) => {
    button.addEventListener('click', () => {
      showPhoto(index);
      dialog.showModal();
    });
  });
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.dialog-prev').addEventListener('click', () => showPhoto(activePhoto - 1));
  dialog.querySelector('.dialog-next').addEventListener('click', () => showPhoto(activePhoto + 1));
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(activePhoto - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); showPhoto(activePhoto + 1); }
  });
  let swipeStart = null;
  dialog.addEventListener('pointerdown', event => {
    if (event.target.closest('button')) return;
    swipeStart = { x: event.clientX, y: event.clientY };
  });
  dialog.addEventListener('pointerup', event => {
    if (!swipeStart) return;
    const deltaX = event.clientX - swipeStart.x;
    const deltaY = event.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
      showPhoto(activePhoto + (deltaX < 0 ? 1 : -1));
    }
  });
  dialog.addEventListener('pointercancel', () => { swipeStart = null; });

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
