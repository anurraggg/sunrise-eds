/* video-tab.js
   DIV-based parsing, 4 columns per row, unlimited rows
   - Parses EDS / Google Docs DIV output (rows[0] = block name)
   - YouTube iframe playback (autoplay on click)
   - Auto-generate YouTube thumbnails (maxresdefault -> fallback chain)
   - Uses createOptimizedPicture when available (aem.js)
   - Swipe, keyboard, arrow controls, pagination dots
   - Follows project style (vanilla DOM, :scope selectors)
*/

/* eslint-disable import/no-unresolved */
import { createOptimizedPicture } from '../../scripts/aem.js';

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function extractYouTubeId(url) {
  if (!url) return null;
  // try standard watch?v=, short youtu.be/, embed/
  const m1 = url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (m1) return m1[1];
  const m2 = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (m2) return m2[1];
  const m3 = url.match(/\/embed\/([A-Za-z0-9_-]{11})/);
  if (m3) return m3[1];
  // fallback: maybe the cell contains only the id
  const idOnly = url.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(idOnly)) return idOnly;
  return null;
}

function isUsableImageSrc(src) {
  if (!src) return false;
  if (src.startsWith('blob:') || src.startsWith('data:')) return false;
  return true;
}

/* attempts to append a picture element using createOptimizedPicture, fallback to <img> */
function appendPicture(parent, src, alt = '') {
  if (!src) return null;
  try {
    const pic = createOptimizedPicture(src, alt || '', false, [{ width: '1200' }]);
    parent.appendChild(pic);
    return pic;
  } catch (err) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt || '';
    img.loading = 'lazy';
    parent.appendChild(img);
    return img;
  }
}

function buildCard(item) {
  const card = document.createElement('div');
  card.className = 'vt-card';

  const thumbWrap = document.createElement('div');
  thumbWrap.className = 'vt-thumb';

  // If thumb exists, append picture; else leave empty (we will fill on click)
  if (item.thumb) {
    appendPicture(thumbWrap, item.thumb, item.title || '');
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

  // Play handler: YouTube iframe if YT id found; otherwise HTML5 video if direct source
  play.addEventListener('click', () => {
    play.style.display = 'none';
    const ytId = extractYouTubeId(item.video);
    if (ytId) {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`;
      iframe.allow = 'autoplay; encrypted-media';
      iframe.allowFullscreen = true;
      iframe.setAttribute('title', item.title || 'video');
      iframe.style.border = '0';
      iframe.loading = 'eager';
      thumbWrap.innerHTML = '';
      thumbWrap.appendChild(iframe);
      return;
    }

    // fallback to HTML5
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

function enableSwipe(el, onMove, onEnd) {
  let startX = 0; let startY = 0; let dragging = false; let pid = null;
  function down(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true; pid = e.pointerId;
    try { el.setPointerCapture(pid); } catch (e) {}
    startX = e.clientX; startY = e.clientY;
  }
  function move(e) {
    if (!dragging || e.pointerId !== pid) return;
    const dx = e.clientX - startX; const dy = e.clientY - startY;
    if (Math.abs(dy) > Math.abs(dx)) return; // vertical scroll
    e.preventDefault();
    onMove(dx);
  }
  function up(e) {
    if (!dragging || e.pointerId !== pid) return;
    dragging = false;
    try { el.releasePointerCapture(pid); } catch (e) {}
    const dx = e.clientX - startX;
    onEnd(dx);
  }
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  return () => {
    el.removeEventListener('pointerdown', down);
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerup', up);
    el.removeEventListener('pointercancel', up);
  };
}

function cardsPerSlide() {
  return window.matchMedia('(min-width: 880px)').matches ? 2 : 1;
}

export default function decorate(block) {
  block.classList.add('video-tab-wrapper');

  // Build wrapper & header area (we'll preserve headings if any)
  const wrapper = document.createElement('div');
  wrapper.className = 'video-tab';

  const head = document.createElement('div');
  head.className = 'vt-head';

  const possibleTitle = block.querySelector('h2, h3, strong, b');
  if (possibleTitle) {
    const t = document.createElement('h2');
    t.className = 'vt-title';
    t.textContent = possibleTitle.textContent.trim();
    head.appendChild(t);
    possibleTitle.remove();
  }

  const possibleSub = block.querySelector('p');
  if (possibleSub) {
    const s = document.createElement('p');
    s.className = 'vt-sub';
    s.textContent = possibleSub.textContent.trim();
    head.appendChild(s);
    possibleSub.remove();
  }

  wrapper.appendChild(head);

  // Parse DIV-based rows produced by Google Docs / EDS
  const rows = Array.from(block.querySelectorAll(':scope > div'));
  const items = [];

  for (let i = 1; i < rows.length; i += 1) {
    const cells = Array.from(rows[i].querySelectorAll(':scope > div'));
    if (cells.length < 2) continue;

    const title = (cells[0] && cells[0].textContent.trim()) || '';
    const desc = (cells[1] && cells[1].textContent.trim()) || '';

    // thumbnail: prefer <picture>/<img> in cell[2], otherwise text URL
    let thumb = '';
    if (cells[2]) {
      const picImg = cells[2].querySelector('img');
      if (picImg && isUsableImageSrc(picImg.src)) thumb = picImg.src;
      else {
        const txt = cells[2].textContent.trim();
        if (isUsableImageSrc(txt)) thumb = txt;
      }
    }

    const videoRaw = (cells[3] && cells[3].textContent.trim()) || '';
    const ytId = extractYouTubeId(videoRaw);

    // auto-generate YouTube thumbnail if missing
    if (!thumb && ytId) thumb = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;

    if (title && (ytId || thumb)) {
      items.push({
        title,
        desc,
        thumb,
        video: videoRaw,
      });
    }
  }

  // fallback examples for dev preview if no items
  const fallback = [
    { title: 'Example Campaign 1', desc: 'Tap to play', thumb: '/mnt/data/000e9284-d85e-43af-b363-0dcd12d99b3e.png', video: '' },
    { title: 'Example Campaign 2', desc: 'Tap to play', thumb: '/mnt/data/000e9284-d85e-43af-b363-0dcd12d99b3e.png', video: '' },
  ];
  const data = items.length ? items : fallback;

  // build cards -> slides -> DOM
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
  const prev = document.createElement('button');
  prev.className = 'vt-arrow vt-arrow--prev';
  prev.setAttribute('aria-label', 'Previous');
  prev.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.4 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>';
  const next = document.createElement('button');
  next.className = 'vt-arrow vt-arrow--next';
  next.setAttribute('aria-label', 'Next');
  next.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6z"/></svg>';
  wrapper.appendChild(prev);
  wrapper.appendChild(next);

  const pagination = document.createElement('div');
  pagination.className = 'vt-pagination';

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
      dot.addEventListener('click', () => { current = i; updateTrack(); });
      dot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); current = i; updateTrack(); }
      });
      pagination.appendChild(dot);
    }
  }

  function updateTrack() {
    track.style.transform = `translateX(-${current * 100}%)`;
    Array.from(pagination.children).forEach((d, idx) => d.classList.toggle('vt-dot--active', idx === current));
  }

  function goNext() { current = clamp(current + 1, 0, slideCount - 1); updateTrack(); }
  function goPrev() { current = clamp(current - 1, 0, slideCount - 1); updateTrack(); }

  next.addEventListener('click', goNext);
  prev.addEventListener('click', goPrev);

  // keyboard
  wrapper.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') goPrev();
  });

  // swipe
  const cleanupSwipe = enableSwipe(trackOuter, (dx) => {
    track.style.transition = 'none';
    const pct = (dx / (trackOuter.offsetWidth || 1)) * 100;
    track.style.transform = `translateX(${-(current * 100) + pct}%)`;
  }, (dx) => {
    track.style.transition = '';
    const threshold = (trackOuter.offsetWidth || 1) * 0.18;
    if (dx > threshold) goPrev();
    else if (dx < -threshold) goNext();
    else updateTrack();
  });

  // responsive: rebuild slides if cardsPerSlide change
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

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(rebuildIfNeeded, 120);
  });

  // initial render
  slideCount = slides.length;
  renderPagination();
  updateTrack();

  // cleanup observer when removed
  const mo = new MutationObserver(() => {
    if (!document.body.contains(block)) {
      cleanupSwipe();
      window.removeEventListener('resize', rebuildIfNeeded);
      mo.disconnect();
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  // expose small API for debugging
  // eslint-disable-next-line no-param-reassign
  block.__videoTab = { rebuildIfNeeded, goNext, goPrev };
}
