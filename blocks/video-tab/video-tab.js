/* video-tab.js
   DIV-based parsing, 4 columns per row, unlimited rows
   - parses EDS/Google-Docs DIV output
   - supports YouTube iframe playback + auto thumbnails
   - swipe, keyboard, arrows, pagination
*/

/* eslint-disable import/no-unresolved */
import { createOptimizedPicture } from '../../scripts/aem.js';

/* helpers */
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function extractYouTubeId(url) {
  if (!url) return null;
  const standard = url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (standard) return standard[1];
  const short = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (short) return short[1];
  const embed = url.match(/\/embed\/([A-Za-z0-9_-]{11})/);
  if (embed) return embed[1];
  return null;
}

function isUsableImageSrc(src) {
  if (!src) return false;
  // ignore Google Docs blob: urls and data: URIs
  if (src.startsWith('blob:') || src.startsWith('data:')) return false;
  return true;
}

/* build a single card from item {title, desc, thumb, video} */
function buildCard(item) {
  const card = document.createElement('div');
  card.className = 'vt-card';

  const thumbWrap = document.createElement('div');
  thumbWrap.className = 'vt-thumb';

  if (item.thumb) {
    try {
      const pic = createOptimizedPicture(item.thumb, item.title || '', false, [{ width: '1200' }]);
      thumbWrap.appendChild(pic);
    } catch (err) {
      const img = document.createElement('img');
      img.src = item.thumb;
      img.alt = item.title || '';
      thumbWrap.appendChild(img);
    }
  } else {
    // placeholder background will show — leave empty for lazy-load thumbnail or iframe to replace
  }

  const play = document.createElement('button');
  play.className = 'vt-play';
  play.setAttribute('aria-label', `Play ${item.title || 'video'}`);
  play.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg>';

  const body = document.createElement('div');
  body.className = 'vt-body';
  const h = document.createElement('h3');
  h.className = 'vt-card-title';
  h.textContent = item.title || '';
  const p = document.createElement('p');
  p.className = 'vt-card-desc';
  p.textContent = item.desc || '';

  body.appendChild(h);
  body.appendChild(p);

  card.appendChild(thumbWrap);
  card.appendChild(play);
  card.appendChild(body);

  play.addEventListener('click', () => {
    // hide play button
    play.style.display = 'none';
    const ytId = extractYouTubeId(item.video);
    if (ytId) {
      // load youtube iframe with autoplay
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`;
      iframe.allow = 'autoplay; encrypted-media';
      iframe.allowFullscreen = true;
      iframe.setAttribute('title', item.title || 'video');
      iframe.style.border = '0';
      thumbWrap.innerHTML = '';
      thumbWrap.appendChild(iframe);
      return;
    }

    // fallback to HTML5 video (if a direct mp4 is supplied)
    const video = document.createElement('video');
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    if (item.video) {
      const s = document.createElement('source');
      s.src = item.video;
      video.appendChild(s);
    }
    thumbWrap.innerHTML = '';
    thumbWrap.appendChild(video);
    video.play().catch(() => {});
  });

  return card;
}

/* group cards into slides given cardsPerSlide */
function makeSlides(cards, cardsPerSlide) {
  const slides = [];
  for (let i = 0; i < cards.length; i += cardsPerSlide) {
    const slide = document.createElement('div');
    slide.className = 'vt-slide';
    for (let j = i; j < i + cardsPerSlide && j < cards.length; j += 1) {
      slide.appendChild(cards[j]);
    }
    slides.push(slide);
  }
  return slides;
}

/* pointer swipe helper */
function enableSwipe(el, onMove, onEnd) {
  let startX = 0;
  let startY = 0;
  let dragging = false;
  let pointerId = null;

  function onDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true;
    pointerId = e.pointerId;
    try { el.setPointerCapture(pointerId); } catch (err) {}
    startX = e.clientX;
    startY = e.clientY;
  }

  function onMoveWrap(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dy) > Math.abs(dx)) return;
    e.preventDefault();
    onMove(dx);
  }

  function onUp(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    try { el.releasePointerCapture(pointerId); } catch (err) {}
    const dx = e.clientX - startX;
    onEnd(dx);
  }

  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', onMoveWrap);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);

  return () => {
    el.removeEventListener('pointerdown', onDown);
    el.removeEventListener('pointermove', onMoveWrap);
    el.removeEventListener('pointerup', onUp);
    el.removeEventListener('pointercancel', onUp);
  };
}

/* decide cards per slide */
function cardsPerSlide() {
  return window.matchMedia('(min-width: 880px)').matches ? 2 : 1;
}

/* main decorate */
export default function decorate(block) {
  block.classList.add('video-tab-wrapper');

  // Build basic structure
  const wrapper = document.createElement('div');
  wrapper.className = 'video-tab';

  const head = document.createElement('div');
  head.className = 'vt-head';

  // If the author placed headings or a short intro inside the first child(s) of the block (besides block-name),
  // preserve them as title/sub. We'll prefer explicit heading elements.
  const possibleTitle = block.querySelector('h2, h3, strong, b');
  if (possibleTitle) {
    const t = document.createElement('h2');
    t.className = 'vt-title';
    t.textContent = possibleTitle.textContent.trim();
    head.appendChild(t);
    possibleTitle.remove();
  }

  // capture a possible short paragraph (sub) if present inside the block (not in the data rows)
  const possibleSub = block.querySelector('p');
  if (possibleSub) {
    const s = document.createElement('p');
    s.className = 'vt-sub';
    s.textContent = possibleSub.textContent.trim();
    head.appendChild(s);
    possibleSub.remove();
  }

  wrapper.appendChild(head);

  // DIV-based parser (EDS/Google Docs conversion)
  const rows = Array.from(block.querySelectorAll(':scope > div'));
  const items = [];

  // rows[0] = block name (video-tab) — start at 1
  for (let i = 1; i < rows.length; i += 1) {
    const cells = Array.from(rows[i].querySelectorAll(':scope > div'));
    // We expect exactly 4 columns (title, desc, thumb, video)
    if (cells.length < 2) continue; // skip malformed rows

    const title = (cells[0] && cells[0].textContent.trim()) || '';
    const desc = (cells[1] && cells[1].textContent.trim()) || '';
    // thumb: try to find an <img> then fallback to text content (if it contains a usable src)
    let thumb = '';
    if (cells[2]) {
      const imgEl = cells[2].querySelector('img');
      if (imgEl && isUsableImageSrc(imgEl.src)) {
        thumb = imgEl.src;
      } else {
        const txt = cells[2].textContent.trim();
        if (isUsableImageSrc(txt)) thumb = txt;
      }
    }
    const videoRaw = (cells[3] && cells[3].textContent.trim()) || '';
    const ytId = extractYouTubeId(videoRaw);

    // if no thumb but youtube id exists, create auto-thumb
    if (!thumb && ytId) {
      thumb = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
    }

    // only include rows that have either a title + ytId OR a thumb
    if (title && (ytId || thumb)) {
      items.push({
        title,
        desc,
        thumb,
        video: videoRaw,
      });
    }
  }

  // If no items found, leave block alone (or show fallback) — we'll use fallback examples to avoid blank UI
  const fallback = [
    { title: 'Example Campaign 1', desc: 'Tap to play', thumb: '/mnt/data/000e9284-d85e-43af-b363-0dcd12d99b3e.png', video: '' },
    { title: 'Example Campaign 2', desc: 'Tap to play', thumb: '/mnt/data/000e9284-d85e-43af-b363-0dcd12d99b3e.png', video: '' },
  ];
  const data = items.length ? items : fallback;

  // build cards and slides
  const cards = data.map((it) => buildCard(it));
  const trackOuter = document.createElement('div');
  trackOuter.className = 'vt-track-outer';
  const track = document.createElement('div');
  track.className = 'vt-track';

  let per = cardsPerSlide();
  let slides = makeSlides(cards, per);
  slides.forEach((s) => track.appendChild(s));
  trackOuter.appendChild(track);
  wrapper.appendChild(trackOuter);

  // arrows
  const prevBtn = document.createElement('button');
  prevBtn.className = 'vt-arrow vt-arrow--prev';
  prevBtn.setAttribute('aria-label', 'Previous');
  prevBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.4 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>';
  const nextBtn = document.createElement('button');
  nextBtn.className = 'vt-arrow vt-arrow--next';
  nextBtn.setAttribute('aria-label', 'Next');
  nextBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6z"/></svg>';
  wrapper.appendChild(prevBtn);
  wrapper.appendChild(nextBtn);

  // pagination
  const pagination = document.createElement('div');
  pagination.className = 'vt-pagination';

  // render
  block.textContent = '';
  block.appendChild(wrapper);
  block.appendChild(pagination);

  // state
  let current = 0;
  let slideCount = slides.length;

  function renderPagination() {
    pagination.innerHTML = '';
    for (let i = 0; i < slideCount; i += 1) {
      const dot = document.createElement('div');
      dot.className = 'vt-dot';
      if (i === current) dot.classList.add('vt-dot--active');
      dot.setAttribute('role', 'button');
      dot.tabIndex = 0;
      dot.addEventListener('click', () => {
        current = i;
        updateTrack();
      });
      dot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          current = i;
          updateTrack();
        }
      });
      pagination.appendChild(dot);
    }
  }

  function updateTrack() {
    track.style.transform = `translateX(-${current * 100}%)`;
    // update dots
    const dots = Array.from(pagination.children);
    dots.forEach((d, idx) => d.classList.toggle('vt-dot--active', idx === current));
  }

  function goNext() {
    current = clamp(current + 1, 0, slideCount - 1);
    updateTrack();
  }
  function goPrev() {
    current = clamp(current - 1, 0, slideCount - 1);
    updateTrack();
  }

  nextBtn.addEventListener('click', goNext);
  prevBtn.addEventListener('click', goPrev);

  // keyboard nav
  wrapper.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') goPrev();
  });

  // swipe handling
  let cleanupSwipe = enableSwipe(trackOuter, (dx) => {
    track.style.transition = 'none';
    const percent = (dx / (trackOuter.offsetWidth || 1)) * 100;
    track.style.transform = `translateX(${-(current * 100) + percent}%)`;
  }, (dx) => {
    track.style.transition = '';
    const threshold = (trackOuter.offsetWidth || 1) * 0.18;
    if (dx > threshold) goPrev();
    else if (dx < -threshold) goNext();
    else updateTrack();
  });

  // responsive rebuild
  function rebuildIfNeeded() {
    const newPer = cardsPerSlide();
    if (newPer === per) return;
    per = newPer;
    track.innerHTML = '';
    slides = makeSlides(cards, per);
    slides.forEach((s) => track.appendChild(s));
    slideCount = slides.length;
    current = clamp(current, 0, slideCount - 1);
    renderPagination();
    updateTrack();
  }

  window.addEventListener('resize', () => {
    // debounced-ish
    clearTimeout(window.__vt_resize_timer);
    window.__vt_resize_timer = setTimeout(rebuildIfNeeded, 120);
  });

  // initial render
  slideCount = slides.length;
  renderPagination();
  updateTrack();

  // cleanup observer when block removed
  const mo = new MutationObserver(() => {
    if (!document.body.contains(block)) {
      cleanupSwipe();
      window.removeEventListener('resize', rebuildIfNeeded);
      mo.disconnect();
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  // expose helper for debugging
  // eslint-disable-next-line no-param-reassign
  block.__videoTab = { rebuildIfNeeded, goNext, goPrev };
}
