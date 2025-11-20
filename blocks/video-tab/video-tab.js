/* video-tab.js
   EDS block with YouTube support
   - Detects YouTube links and loads iframe player
   - Swipeable carousel
*/

/* eslint-disable import/no-unresolved */
import { createOptimizedPicture } from '../../scripts/aem.js';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Detect YouTube URL and extract video ID
 * @param {string} url
 * @returns {string|null}
 */
function extractYouTubeID(url) {
  if (!url) return null;

  // Standard format
  const standard = url.match(/v=([a-zA-Z0-9_-]{11})/);
  if (standard) return standard[1];

  // Short format
  const short = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (short) return short[1];

  return null;
}

/**
 * Build video card
 */
function buildCard(item) {
  const card = document.createElement('div');
  card.className = 'vt-card';

  // Wrapper for thumbnail
  const thumb = document.createElement('div');
  thumb.className = 'vt-thumb';

  if (item.thumb) {
    try {
      const pic = createOptimizedPicture(item.thumb, item.title || '', false, [{ width: '1200' }]);
      thumb.appendChild(pic);
    } catch (e) {
      const img = document.createElement('img');
      img.src = item.thumb;
      img.alt = item.title || '';
      thumb.appendChild(img);
    }
  }

  // Play button overlay
  const play = document.createElement('button');
  play.className = 'vt-play';
  play.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5v14l11-7z"></path>
    </svg>
  `;

  // Body
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

  card.appendChild(thumb);
  card.appendChild(play);
  card.appendChild(body);

  /**
   * CLICK → load YouTube iframe or HTML5 video
   */
  play.addEventListener('click', () => {
    play.style.display = 'none';

    const ytID = extractYouTubeID(item.video);

    if (ytID) {
      // Load YouTube iframe
      const iframe = document.createElement('iframe');
      iframe.width = '100%';
      iframe.height = '100%';
      iframe.src = `https://www.youtube.com/embed/${ytID}?autoplay=1&rel=0`;
      iframe.allow = 'autoplay; encrypted-media';
      iframe.allowFullscreen = true;
      iframe.style.border = '0';

      thumb.innerHTML = '';
      thumb.appendChild(iframe);
      return;
    }

    // Fallback: HTML5 video if not YouTube
    const video = document.createElement('video');
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;

    if (item.video) {
      const src = document.createElement('source');
      src.src = item.video;
      video.appendChild(src);
    }

    thumb.innerHTML = '';
    thumb.appendChild(video);

    video.play().catch(() => {});
  });

  return card;
}

/**
 * Build slides
 */
function makeSlides(cards, per) {
  const slides = [];
  for (let i = 0; i < cards.length; i += per) {
    const slide = document.createElement('div');
    slide.className = 'vt-slide';
    for (let j = i; j < i + per && j < cards.length; j += 1) {
      slide.appendChild(cards[j]);
    }
    slides.push(slide);
  }
  return slides;
}

function calculateCardsPerSlide() {
  return window.matchMedia('(min-width: 880px)').matches ? 2 : 1;
}

/**
 * Enable swipe
 */
function enableSwipe(el, onMove, onEnd) {
  let startX = 0;
  let startY = 0;
  let dragging = false;
  let pointerId = null;

  function down(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true;
    pointerId = e.pointerId;
    el.setPointerCapture(pointerId);
    startX = e.clientX;
    startY = e.clientY;
  }

  function move(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dy) > Math.abs(dx)) return;
    e.preventDefault();
    onMove(dx);
  }

  function up(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    el.releasePointerCapture(pointerId);
    const dx = e.clientX - startX;
    onEnd(dx);
  }

  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
}

/**
 * Main decorate function
 */
export default function decorate(block) {
  block.classList.add('video-tab-wrapper');

  const wrapper = document.createElement('div');
  wrapper.className = 'video-tab';

  // HEADER
  const head = document.createElement('div');
  head.className = 'vt-head';

  const title = block.querySelector('h2, strong, b');
  if (title) {
    const h = document.createElement('h2');
    h.className = 'vt-title';
    h.textContent = title.textContent.trim();
    head.appendChild(h);
    title.remove();
  }

  const sub = block.querySelector('p');
  if (sub) {
    const s = document.createElement('p');
    s.className = 'vt-sub';
    s.textContent = sub.textContent.trim();
    head.appendChild(s);
    sub.remove();
  }

  wrapper.appendChild(head);

  // PARSE TABLE
  const table = block.querySelector('table');
  const items = [];

  if (table) {
    const rows = Array.from(table.querySelectorAll('tr'));
    rows.forEach((tr) => {
      const td = tr.querySelectorAll('td');
      const item = {
        title: td[0]?.textContent.trim(),
        desc: td[1]?.textContent.trim(),
        thumb: td[2]?.querySelector('img')?.src || td[2]?.textContent.trim(),
        video: td[3]?.textContent.trim(),
      };
      if (item.title || item.thumb) items.push(item);
    });
  }

  const cards = items.map((i) => buildCard(i));

  // TRACK
  const trackOuter = document.createElement('div');
  trackOuter.className = 'vt-track-outer';

  const track = document.createElement('div');
  track.className = 'vt-track';

  let perSlide = calculateCardsPerSlide();
  let slides = makeSlides(cards, perSlide);

  slides.forEach((s) => track.appendChild(s));
  trackOuter.appendChild(track);
  wrapper.appendChild(trackOuter);

  // ARROWS
  const prevBtn = document.createElement('button');
  prevBtn.className = 'vt-arrow vt-arrow--prev';
  prevBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M15.4 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`;

  const nextBtn = document.createElement('button');
  nextBtn.className = 'vt-arrow vt-arrow--next';
  nextBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6z"/></svg>`;

  wrapper.appendChild(prevBtn);
  wrapper.appendChild(nextBtn);

  // PAGINATION
  const pagination = document.createElement('div');
  pagination.className = 'vt-pagination';

  block.textContent = '';
  block.appendChild(wrapper);
  block.appendChild(pagination);

  // STATE
  let current = 0;
  let slideCount = slides.length;

  function updateTrack() {
    track.style.transform = `translateX(-${current * 100}%)`;
  }

  function renderPagination() {
    pagination.innerHTML = '';
    for (let i = 0; i < slideCount; i += 1) {
      const dot = document.createElement('div');
      dot.className = 'vt-dot';
      if (i === current) dot.classList.add('vt-dot--active');
      dot.addEventListener('click', () => {
        current = i;
        updateTrack();
        renderPagination();
      });
      pagination.appendChild(dot);
    }
  }

  function next() {
    current = clamp(current + 1, 0, slideCount - 1);
    updateTrack();
    renderPagination();
  }

  function prev() {
    current = clamp(current - 1, 0, slideCount - 1);
    updateTrack();
    renderPagination();
  }

  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);

  // SWIPE
  enableSwipe(trackOuter, (dx) => {
    track.style.transition = 'none';
    const percent = dx / trackOuter.offsetWidth * 100;
    track.style.transform = `translateX(${-(current * 100) + percent}%)`;
  }, (dx) => {
    const threshold = trackOuter.offsetWidth * 0.15;
    track.style.transition = '';
    if (dx > threshold) prev();
    else if (dx < -threshold) next();
    else updateTrack();
  });

  renderPagination();
  updateTrack();
}
