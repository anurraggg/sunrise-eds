// blocks/spice-stories/spice-stories.js
export default function decorate(block) {
    const rows = [...block.children].map((r) => [...r.children].map(c => c.innerText.trim()));
    if (!rows.length) return;
  
    // Parse rows into slide objects
    const slides = rows.map((cells) => {
      // Accept both orders (some editors might use first column as TYPE or second)
      // We'll detect TYPE by searching for 'intro'/'spice' in any cell position 0..1
      const type = (cells[0] || '').toLowerCase() === 'intro' || (cells[1] || '').toLowerCase() === 'intro'
        ? 'intro'
        : (cells[0] || '').toLowerCase() === 'spice' || (cells[1] || '').toLowerCase() === 'spice'
        ? 'spice'
        : 'spice';
  
      // Attempt to find fields based on common column positions:
      // If TYPE is in col 0 -> shift indexes by 1
      const offset = (cells[0] && (cells[0].toLowerCase() === 'intro' || cells[0].toLowerCase() === 'spice')) ? 1 : 0;
  
      const image = cells[offset + 0] || '';      // IMAGE
      const title = cells[offset + 1] || '';      // TITLE
      const desc = cells[offset + 2] || '';       // DESCRIPTION
      const ctaText = cells[offset + 3] || '';    // CTA TEXT
      const ctaLink = cells[offset + 4] || '#';   // CTA LINK
      const bg = (cells[offset + 5] && cells[offset + 5].startsWith('#')) ? cells[offset + 5] : null;
  
      return { type, image, title, desc, ctaText, ctaLink, bg };
    });
  
    // Preset fallback colors if no bg specified
    const defaultColors = ['#0F6A55', '#1F1A19', '#7D2625', '#2F5B3F', '#5B2D2A', '#7A3A2F'];
  
    // Build DOM
    block.innerHTML = '';
    block.classList.add('spice-stories-block');
  
    const wrapper = document.createElement('div');
    wrapper.className = 'ss-wrapper';
  
    const track = document.createElement('div');
    track.className = 'ss-track';
  
    slides.forEach((s, i) => {
      const slide = document.createElement('div');
      slide.className = 'ss-slide';
      slide.style.background = s.bg || defaultColors[i % defaultColors.length];
  
      // Slide inner layout: left = intro content (for `intro` or generic title lines), right = content
      // For intro slide we render the exact intro layout; for spice slide we render image + copy.
      slide.innerHTML = `
        <div class="ss-slide-inner">
          <div class="ss-left">
            <div class="ss-left-inner">
              <div class="ss-underline"></div>
              <p class="ss-label">${s.type === 'intro' ? (s.title || 'Tales of Spices') : 'Tales of Spices'}</p>
              <h2 class="ss-main">${s.type === 'intro' ? (s.desc || 'OF SPICES') : 'OF SPICES'}</h2>
              ${s.type === 'intro' ? `<p class="ss-swipe">${s.ctaText || 'Swipe to Learn'}</p>` : ''}
            </div>
          </div>
          <div class="ss-right">
            <div class="ss-right-inner">
              ${s.type === 'spice' ? `<img class="ss-image" src="${s.image}" alt="${s.title}">` : ''}
              ${s.type === 'spice' ? `<h3 class="ss-title">${s.title}</h3>` : ''}
              ${s.type === 'spice' ? `<p class="ss-desc">${s.desc}</p>` : ''}
              ${s.type === 'spice' ? `<a class="ss-cta" href="${s.ctaLink}" target="_blank" rel="noopener">${s.ctaText || 'View Now →'}</a>` : ''}
            </div>
          </div>
        </div>
      `;
  
      track.appendChild(slide);
    });
  
    wrapper.appendChild(track);
  
    // Dots
    const dots = document.createElement('div');
    dots.className = 'ss-dots';
    slides.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'ss-dot';
      d.dataset.index = i;
      d.setAttribute('aria-label', `Go to slide ${i + 1}`);
      if (i === 0) d.classList.add('active');
      dots.appendChild(d);
    });
  
    wrapper.appendChild(dots);
    block.appendChild(wrapper);
  
    /* Slider logic: support desktop drag and mobile touch */
    let current = 0;
    let isDragging = false;
    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationID = 0;
    const slidesCount = slides.length;
  
    const getSlideWidth = () => wrapper.offsetWidth;
  
    // set initial sizes
    const setPositionByIndex = () => {
      const width = getSlideWidth();
      currentTranslate = -current * width;
      prevTranslate = currentTranslate;
      track.style.transform = `translateX(${currentTranslate}px)`;
      updateDots();
    };
  
    const updateDots = () => {
      [...dots.children].forEach((d, i) => d.classList.toggle('active', i === current));
    };
  
    // click dots
    dots.addEventListener('click', (e) => {
      const btn = e.target.closest('.ss-dot');
      if (!btn) return;
      current = Number(btn.dataset.index);
      setPositionByIndex();
    });
  
    // Pointer / mouse events for desktop drag
    track.addEventListener('pointerdown', pointerStart);
    window.addEventListener('pointerup', pointerEnd);
    window.addEventListener('pointermove', pointerMove);
  
    // Touch fallback (pointer should cover most)
    track.addEventListener('touchstart', pointerStart, { passive: true });
    track.addEventListener('touchend', pointerEnd);
    track.addEventListener('touchmove', pointerMove, { passive: true });
  
    function pointerStart(e) {
      isDragging = true;
      startX = getClientX(e);
      animationID = requestAnimationFrame(animation);
      track.classList.add('grabbing');
    }
  
    function pointerMove(e) {
      if (!isDragging) return;
      const currentX = getClientX(e);
      const dx = currentX - startX;
      currentTranslate = prevTranslate + dx;
    }
  
    function pointerEnd() {
      if (!isDragging) return;
      isDragging = false;
      cancelAnimationFrame(animationID);
      track.classList.remove('grabbing');
  
      const movedBy = currentTranslate - prevTranslate; // negative if moved left
      const threshold = getSlideWidth() * 0.2;
  
      if (movedBy < -threshold && current < slidesCount - 1) {
        current += 1;
      } else if (movedBy > threshold && current > 0) {
        current -= 1;
      }
      setPositionByIndex();
    }
  
    function animation() {
      track.style.transform = `translateX(${currentTranslate}px)`;
      if (isDragging) requestAnimationFrame(animation);
    }
  
    function getClientX(e) {
      if (e.touches && e.touches[0]) return e.touches[0].clientX;
      return e.clientX;
    }
  
    // Responsive: recalc on resize
    window.addEventListener('resize', () => {
      setPositionByIndex();
    });
  
    // Keyboard navigation (optional)
    block.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' && current > 0) {
        current -= 1; setPositionByIndex();
      } else if (e.key === 'ArrowRight' && current < slidesCount - 1) {
        current += 1; setPositionByIndex();
      }
    });
  
    // initial layout
    setPositionByIndex();
  }
  