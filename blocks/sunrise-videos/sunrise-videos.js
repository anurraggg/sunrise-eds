/* eslint-disable import/no-unresolved */
/* eslint-disable no-continue */
/*
  sunrise-videos.js
  AEM EDS block: reads a table of YouTube links from the authored document and
  turns it into a two-up slider with play overlay and a modal inline YouTube player.

  Authoring (Option A):
  - Insert a 2-column table where each row represents one video:
    | youtube | thumbnail(optional) |
    e.g.
    | https://youtu.be/abc123 | /path/to/thumb.jpg
    | https://www.youtube.com/watch?v=xyz789 | (leave blank)

  Notes:
  - If no table found, sample data is used (includes the uploaded image path as a sample thumbnail).
  - Uses createOptimizedPicture if available in aem.js; otherwise falls back to a regular <img>.
*/

import { createOptimizedPicture } from '../../scripts/aem.js';

function getYouTubeId(url) {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.slice(1);
    }
    if (u.hostname.includes('youtube.com')) {
      return u.searchParams.get('v');
    }
    return null;
  } catch (e) {
    // not a full URL, maybe an id was supplied
    return url.trim();
  }
}

function buildThumbnailElement(src, alt = '') {
  // prefer createOptimizedPicture if available (project convention)
  try {
    if (typeof createOptimizedPicture === 'function') {
      const pic = createOptimizedPicture(src, alt, false, [{ width: '750' }]);
      return pic;
    }
  } catch (e) {
    // fall through
  }
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.loading = 'lazy';
  return img;
}

function createSlideItem(item) {
  const slide = document.createElement('div');
  slide.className = 'sv-slide';

  const thumbWrap = document.createElement('div');
  thumbWrap.className = 'sv-thumb';

  const thumbnailUrl = item.thumbnail || item.youtubeThumbnail || '';
  if (thumbnailUrl) {
    const thumb = buildThumbnailElement(thumbnailUrl, item.title || 'video thumbnail');
    thumbWrap.appendChild(thumb);
  } else {
    // fallback: use youtube's default thumbnail if no custom one provided
    const ytThumb = `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`;
    const thumb = buildThumbnailElement(ytThumb, item.title || 'video thumbnail');
    thumbWrap.appendChild(thumb);
  }

  // overlay play button
  const play = document.createElement('button');
  play.type = 'button';
  play.className = 'sv-play';
  play.setAttribute('aria-label', 'Play video');
  play.innerHTML = '<span class="sv-play-circle" aria-hidden="true"></span>';
  thumbWrap.appendChild(play);

  slide.appendChild(thumbWrap);

  // caption/title (optional)
  if (item.title) {
    const caption = document.createElement('div');
    caption.className = 'sv-caption';
    caption.textContent = item.title;
    slide.appendChild(caption);
  }

  // attach video id on dataset for click handler
  slide.dataset.videoId = item.id;

  return slide;
}

function openModal(playerContainer, videoId) {
  playerContainer.innerHTML = ''; // clear previous
  const iframe = document.createElement('iframe');
  iframe.width = '100%';
  iframe.height = '100%';
  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  iframe.title = 'YouTube video player';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;
  playerContainer.appendChild(iframe);
  document.documentElement.classList.add('sv-modal-open');
}

function closeModal(playerContainer) {
  playerContainer.innerHTML = '';
  document.documentElement.classList.remove('sv-modal-open');
}

export default async function decorate(block) {
  // read the table (Option A)
  const table = block.querySelector('table');
  const videos = [];

  if (table) {
    // iterate rows
    const rows = Array.from(table.querySelectorAll('tr'));
    rows.forEach((row) => {
      const cells = Array.from(row.querySelectorAll('td, th'));
      if (!cells.length) return;
      const urlCell = cells[0] ? cells[0].textContent.trim() : '';
      const thumbCell = cells[1] ? cells[1].textContent.trim() : '';
      const youtubeId = getYouTubeId(urlCell);
      if (!youtubeId) return;
      const title = cells[0].querySelector('a') ? cells[0].querySelector('a').textContent.trim() : '';
      videos.push({
        id: youtubeId,
        url: urlCell,
        thumbnail: thumbCell || '', // authors may supply a path or leave blank
        title: title || '',
      });
    });
  }

  // fallback sample data (includes uploaded image path)
  if (videos.length === 0) {
    videos.push({
      id: 'dQw4w9WgXcQ',
      url: 'https://youtu.be/dQw4w9WgXcQ',
      thumbnail: '/mnt/data/6f24b24c-eb45-4ee8-8375-3506d7aa2768.png',
      title: 'Sample video 1',
    });
    videos.push({
      id: 'M7lc1UVf-VE',
      url: 'https://youtu.be/M7lc1UVf-VE',
      thumbnail: '',
      title: 'Sample video 2',
    });
  }

  // build block DOM
  block.textContent = '';
  block.classList.add('sunrise-videos-wrapper');

  // header (hardcoded)
  const header = document.createElement('div');
  header.className = 'sv-header';
  header.innerHTML = `
    <div class="sv-eyebrow">CATCH</div>
    <h2 class="sv-headline">A GLIMPSE OF SUNRISE</h2>
    <p class="sv-sub">Explore our campaigns and commercials</p>
  `;
  block.appendChild(header);

  // slider area
  const slider = document.createElement('div');
  slider.className = 'sv-slider';

  const track = document.createElement('div');
  track.className = 'sv-track';

  videos.forEach((v) => {
    const slide = createSlideItem(v);
    track.appendChild(slide);
  });

  slider.appendChild(track);

  // arrows
  const leftArrow = document.createElement('button');
  leftArrow.type = 'button';
  leftArrow.className = 'sv-arrow sv-arrow-left';
  leftArrow.setAttribute('aria-label', 'Previous');
  leftArrow.innerHTML = '<span aria-hidden="true">‹</span>';

  const rightArrow = document.createElement('button');
  rightArrow.type = 'button';
  rightArrow.className = 'sv-arrow sv-arrow-right';
  rightArrow.setAttribute('aria-label', 'Next');
  rightArrow.innerHTML = '<span aria-hidden="true">›</span>';

  // pagination dots
  const dots = document.createElement('div');
  dots.className = 'sv-dots';

  // slide sizing: 2 per view on desktop, 1 per view on mobile
  let index = 0;
  const slides = Array.from(track.children);
  const total = slides.length;
  const getPerView = () => (window.innerWidth >= 900 ? 2 : 1);
  let perView = getPerView();
  let maxIndex = Math.max(0, Math.ceil(total / perView) - 1);

  const buildDots = () => {
    dots.innerHTML = '';
    const pages = Math.ceil(total / perView);
    for (let i = 0; i < pages; i += 1) {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'sv-dot';
      d.dataset.page = i;
      d.setAttribute('aria-label', `Go to page ${i + 1}`);
      if (i === index) d.classList.add('active');
      dots.appendChild(d);
    }
  };

  const update = () => {
    perView = getPerView();
    maxIndex = Math.max(0, Math.ceil(total / perView) - 1);
    if (index > maxIndex) index = maxIndex;
    const offset = -(index * (100 / perView));
    track.style.transform = `translateX(${offset}%)`;
    // update active dot
    const ds = Array.from(dots.children);
    ds.forEach((d) => d.classList.remove('active'));
    const activeDot = dots.querySelector(`.sv-dot[data-page="${index}"]`);
    if (activeDot) activeDot.classList.add('active');
  };

  buildDots();
  update();

  // arrow handlers
  leftArrow.addEventListener('click', () => {
    index = Math.max(0, index - 1);
    update();
  });

  rightArrow.addEventListener('click', () => {
    index = Math.min(maxIndex, index + 1);
    update();
  });

  // dot handlers
  dots.addEventListener('click', (e) => {
    const btn = e.target.closest('.sv-dot');
    if (!btn) return;
    index = Number(btn.dataset.page);
    update();
  });

  // click handler to open modal and load iframe
  const modal = document.createElement('div');
  modal.className = 'sv-modal';
  modal.innerHTML = `
    <div class="sv-modal-backdrop" role="dialog" aria-hidden="true"></div>
    <div class="sv-modal-panel" role="document">
      <button type="button" class="sv-modal-close" aria-label="Close video">×</button>
      <div class="sv-player" aria-live="polite"></div>
    </div>
  `;

  const playerContainer = modal.querySelector('.sv-player');
  const closeBtn = modal.querySelector('.sv-modal-close');
  closeBtn.addEventListener('click', () => closeModal(playerContainer));
  modal.querySelector('.sv-modal-backdrop').addEventListener('click', () => closeModal(playerContainer));

  // open on slide click / play button click
  track.addEventListener('click', (e) => {
    const slide = e.target.closest('.sv-slide');
    if (!slide) return;
    const vid = slide.dataset.videoId;
    if (!vid) return;
    openModal(playerContainer, vid);
  });

  // keyboard escape to close modal
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      closeModal(playerContainer);
    }
  });

  // assemble
  const controls = document.createElement('div');
  controls.className = 'sv-controls';
  controls.appendChild(leftArrow);
  controls.appendChild(dots);
  controls.appendChild(rightArrow);

  block.appendChild(slider);
  block.appendChild(controls);
  document.body.appendChild(modal);

  // responsive: recalc on resize
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      buildDots();
      update();
    }, 120);
  });
}
