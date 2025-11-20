/* video-tab.js
   EDS block that converts author content into a swipeable video carousel.
   - Exports default decorate(block)
   - No external libraries
   - Accessible, touch + mouse swipe, keyboard navigation
*/

/* eslint-disable import/no-unresolved */
import { createOptimizedPicture } from '../../scripts/aem.js';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * buildCard - create DOM for one video card
 * @param {Object} item { title, desc, thumb, video }
 * @returns {HTMLElement}
 */
function buildCard(item) {
  const card = document.createElement('div');
  card.className = 'vt-card';

  // thumb wrapper
  const thumb = document.createElement('div');
  thumb.className = 'vt-thumb';
  if (item.thumb) {
    try {
      const pic = createOptimizedPicture(item.thumb, item.title || '', false, [{ width: '1200' }]);
      thumb.appendChild(pic);
    } catch (e) {
      // fallback: plain img
      const img = document.createElement('img');
      img.src = item.thumb;
      img.alt = item.title || '';
      thumb.appendChild(img);
    }
  }

  // play overlay
  const play = document.createElement('button');
  play.className = 'vt-play';
  play.setAttribute('aria-label', `Play ${item.title || 'video'}`);
  play.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5v14l11-7z"></path>
    </svg>
  `;

  // body
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

  // assemble
  card.appendChild(thumb);
  card.appendChild(play);
  card.appendChild(body);

  // click -> replace thumbnail with video element (lazy load)
  play.addEventListener('click', async (ev) => {
    ev.preventDefault();
    // create video element
    const video = document.createElement('video');
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute('preload', 'metadata');
    video.style.width = '100%';
    video.style.height = '100%';
    video.setAttribute('aria-label', item.title || 'video');

    // source(s)
    if (item.video) {
      const src = document.createElement('source');
      src.src = item.video;
      // do not guess type; browser will choose
      video.appendChild(src);
    }

    // replace thumb content
    const thumbEl = card.querySelector('.vt-thumb');
    thumbEl.textContent = ''; // remove children
    thumbEl.appendChild(video);

    // remove play button (or hide)
    play.style.display = 'none';

    try {
      await video.play();
    } catch (err) {
      console.warn('Autoplay blocked; user interaction required.', err);
    }
  });

  return card;
}

/**
 * makeSlides - group cards into slide elements based on cardsPerSlide
 * @param {HTMLElement[]} cards
 * @param {number} cardsPerSlide
 * @returns {HTMLElement[]} slides
 */
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

/**
 * enableSwipe - attaches pointer events for swipe + mouse drag
 * @param {HTMLElement} el track element
 * @param {Function} onMove deltaX handler
 */
function enableSwipe(el, onMove, onEnd) {
  let startX = 0;
  let startY = 0;
  let dragging = false;
  let pointerId = null;

  function onPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true;
    pointerId = e.pointerId;
    el.setPointerCapture(pointerId);
    startX = e.clientX;
    startY = e.clientY;
  }

  function onPointerMove(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    // if vertical movement is greater, ignore (allow scroll)
    if (Math.abs(dy) > Math.abs(dx)) return;
    e.preventDefault();
    onMove(dx);
  }

  function onPointerUp(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    el.releasePointerCapture(pointerId);
    const dx = e.clientX - startX;
    onEnd(dx);
  }

  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerup', onPointerUp);
  el.addEventListener('pointercancel', onPointerUp);

  // return a cleanup function
  return () => {
    el.removeEventListener('pointerdown', onPointerDown);
    el.removeEventListener('pointermove', onPointerMove);
    el.removeEventListener('pointerup', onPointerUp);
    el.removeEventListener('pointercancel', onPointerUp);
  };
}

/**
 * calculateCardsPerSlide - returns 2 for wide screens, 1 otherwise
 */
function calculateCardsPerSlide() {
  return window.matchMedia('(min-width: 880px)').matches ? 2 : 1;
}

/**
 * decorate - main entrypoint for EDS block
 * Expects block content in one of two forms:
 * 1) JSON in a data element: <pre class="vt-data">[{"title":"...","thumb":"...","video":"..."}]</pre>
 * 2) Table rows in the authored doc: each row = title | description | thumbnailUrl | videoUrl
 */
export default async function decorate(block) {
  block.classList.add('video-tab-wrapper');

  // create outer structure
  const wrapper = document.createElement('div');
  wrapper.className = 'video-tab';

  // header: if author added H2/H3 as first children keep them as title/sub
  const head = document.createElement('div');
  head.className = 'vt-head';
  // move headings if present inside block
  const possibleTitle = block.querySelector('h2, h3, strong, b');
  if (possibleTitle) {
    const t = document.createElement('h2');
    t.className = 'vt-title';
    t.textContent = possibleTitle.textContent.trim();
    head.appendChild(t);
    possibleTitle.remove();
    const possibleSub = block.querySelector('p');
    if (possibleSub) {
      const s = document.createElement('p');
      s.className = 'vt-sub';
      s.textContent = possibleSub.textContent.trim();
      head.appendChild(s);
      possibleSub.remove();
    }
  }
  wrapper.appendChild(head);

  // parse data
  let items = [];

  // Case A: explicit JSON block
  const jsonPre = block.querySelector('pre.vt-data, pre[data-vt="data"]');
  if (jsonPre) {
    try {
      items = JSON.parse(jsonPre.textContent || '[]');
    } catch (e) {
      // ignore parse error
      items = [];
      // eslint-disable-next-line no-console
      console.warn('video-tab: invalid JSON data', e);
    }
  }

  // Case B: table-based authoring (rows)
  if (items.length === 0) {
    const table = block.querySelector('table');
    if (table) {
      // each TR -> [title, desc, thumb, video]
      const rows = Array.from(table.querySelectorAll('tr'));
      rows.forEach((tr) => {
        const cols = Array.from(tr.children);
        const item = {
          title: (cols[0] && cols[0].textContent.trim()) || '',
          desc: (cols[1] && cols[1].textContent.trim()) || '',
          thumb: (cols[2] && cols[2].textContent.trim()) || '',
          video: (cols[3] && cols[3].textContent.trim()) || '',
        };
        // Only include rows with at least title or thumb
        if (item.title || item.thumb || item.video) items.push(item);
      });
    }
  }

  // Fallback: If no data, add two example cards (developer convenience)
  if (items.length === 0) {
    items = [
      {
        title: 'Example Campaign 1',
        desc: 'Tap to play example video 1.',
        thumb: '/mnt/data/000e9284-d85e-43af-b363-0dcd12d99b3e.png',
        video: '',
      },
      {
        title: 'Example Campaign 2',
        desc: 'Tap to play example video 2.',
        thumb: '/mnt/data/000e9284-d85e-43af-b363-0dcd12d99b3e.png',
        video: '',
      },
    ];
  }

  // build cards
  const cards = items.map((it) => buildCard(it));

  // controls & containers
  const trackOuter = document.createElement('div');
  trackOuter.className = 'vt-track-outer';

  const track = document.createElement('div');
  track.className = 'vt-track';

  // container for slides; we'll compute slides based on cardsPerSlide
  let cardsPerSlide = calculateCardsPerSlide();
  let slides = makeSlides(cards, cardsPerSlide);
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
  nextBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>';

  wrapper.appendChild(prevBtn);
  wrapper.appendChild(nextBtn);

  // pagination area
  const pagination = document.createElement('div');
  pagination.className = 'vt-pagination';

  // render roots
  block.textContent = '';
  block.appendChild(wrapper);
  block.appendChild(document.createElement('div')); // keep spacing stable
  block.appendChild(pagination);

  // state
  let current = 0;
  let slideCount = slides.length;

  function renderPagination() {
    pagination.innerHTML = '';
    for (let i = 0; i < slideCount; i += 1) {
      const d = document.createElement('div');
      d.className = 'vt-dot';
      if (i === current) d.classList.add('vt-dot--active');
      d.setAttribute('role', 'button');
      d.setAttribute('aria-label', `Go to slide ${i + 1}`);
      d.tabIndex = 0;
      d.addEventListener('click', () => goTo(i));
      d.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goTo(i);
        }
      });
      pagination.appendChild(d);
    }
  }

  function updateTrack() {
    const offset = -(current * 100);
    track.style.transform = `translateX(${offset}%)`;
    // update active dot
    const dots = Array.from(pagination.children);
    dots.forEach((d, idx) => {
      d.classList.toggle('vt-dot--active', idx === current);
    });
  }

  function goTo(index) {
    current = clamp(index, 0, slideCount - 1);
    updateTrack();
  }

  function next() {
    goTo(current + 1);
  }

  function prev() {
    goTo(current - 1);
  }

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  // keyboard accessibility
  wrapper.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });

  // swipe handling
  let interimTranslate = 0;
  let cleanupSwipe = null;
  function handleMove(dx) {
    // translate track by dx relative to current slide
    const width = trackOuter.offsetWidth || 1;
    const percent = (dx / width) * 100;
    track.style.transition = 'none';
    track.style.transform = `translateX(${-(current * 100) + percent}%)`;
    interimTranslate = dx;
  }
  function handleEnd(dx) {
    track.style.transition = '';
    const threshold = (trackOuter.offsetWidth || 1) * 0.18;
    if (dx > threshold) {
      prev();
    } else if (dx < -threshold) {
      next();
    } else {
      // snap back
      updateTrack();
    }
    interimTranslate = 0;
  }

  cleanupSwipe = enableSwipe(trackOuter, handleMove, handleEnd);

  // initial rendering for cards-per-slide logic & pagination
  function rebuildSlidesIfNeeded() {
    const newCardsPerSlide = calculateCardsPerSlide();
    if (newCardsPerSlide === cardsPerSlide) {
      // no change
      return;
    }
    cardsPerSlide = newCardsPerSlide;
    // clear track and rebuild slides
    track.innerHTML = '';
    slides = makeSlides(cards, cardsPerSlide);
    slides.forEach((s) => track.appendChild(s));
    slideCount = slides.length;
    current = clamp(current, 0, slideCount - 1);
    renderPagination();
    updateTrack();
  }

  // initial setup
  slideCount = slides.length;
  renderPagination();
  updateTrack();

  // adapt on resize to change cards per slide
  let resizeTimer = null;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      rebuildSlidesIfNeeded();
    }, 120);
  };
  window.addEventListener('resize', onResize);

  // cleanup when block is removed from DOM (best-effort)
  const observer = new MutationObserver((mutations) => {
    const removed = !document.body.contains(block);
    if (removed) {
      // cleanup
      if (cleanupSwipe) cleanupSwipe();
      window.removeEventListener('resize', onResize);
      observer.disconnect();
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // expose a small API on block for debugging if developer wants
  // eslint-disable-next-line no-param-reassign
  block.__videoTab = {
    goTo,
    next,
    prev,
    rebuildSlidesIfNeeded,
  };
}
