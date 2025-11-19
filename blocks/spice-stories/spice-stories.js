// spice-stories.js
export default function decorate(block) {
    // read rows (each row -> array of cell texts)
    const rows = [...block.children].map((r) => [...r.children].map(c => c.innerText.trim()));
    if (!rows.length) return;
  
    // parse rows into slide objects
    const slides = rows.map((cells) => {
      // detect TYPE if present in first col or second
      const possibleType = (cells[0] || '').toLowerCase();
      const offset = (possibleType === 'intro' || possibleType === 'spice') ? 1 : 0;
      const type = (cells[offset - 1] && cells[offset - 1].toLowerCase() === 'intro') || (cells[offset] && cells[offset].toLowerCase() === 'intro')
        ? 'intro' : 'spice';
  
      const image = cells[offset + 0] || '';
      const title = cells[offset + 1] || '';
      const desc = cells[offset + 2] || '';
      const ctaText = cells[offset + 3] || '';
      const ctaLink = cells[offset + 4] || '#';
      const bg = (cells[offset + 5] && cells[offset + 5].startsWith('#')) ? cells[offset + 5] : null;
  
      return { type, image, title, desc, ctaText, ctaLink, bg };
    });
  
    const defaultColors = ['#e8d7af', '#0f624f', '#302020', '#7a2b28', '#386b4c', '#b14333'];
  
    // build DOM
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
  
      // each slide contains both left (intro copy) and right (image + copy)
      slide.innerHTML = `
        <div class="ss-slide-inner">
          <div class="ss-left">
            <div class="ss-left-inner">
              <div class="ss-underline"></div>
              <p class="ss-label">${s.type === 'intro' ? (s.title || 'Tales of Spices') : 'Tales of Spices'}</p>
              <h2 class="ss-main">${s.type === 'intro' ? (s.desc || 'OF SPICES') : 'OF SPICES'}</h2>
              ${s.type === 'intro' ? `<p class="ss-swipe">${s.ctaText || 'Swipe to Learn →'}</p>` : ''}
            </div>
          </div>
          <div class="ss-right">
            <div class="ss-right-inner">
              ${s.type === 'spice' && s.image ? `<img class="ss-image" src="${s.image}" alt="${s.title}">` : ''}
              ${s.type === 'spice' ? `<h3 class="ss-title">${s.title}</h3>` : ''}
              ${s.type === 'spice' ? `<p class="ss-desc">${s.desc}</p>` : ''}
              ${s.type === 'spice' ? `<a class="ss-cta" href="${s.ctaLink}" target="_blank" rel="noopener noreferrer">${s.ctaText || 'View Now →'}</a>` : ''}
            </div>
          </div>
        </div>
      `;
      track.appendChild(slide);
    });
  
    // dots
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
  
    wrapper.appendChild(track);
    wrapper.appendChild(dots);
    block.appendChild(wrapper);
  
    // Slider logic
    let current = 0;
    let isDragging = false;
    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationId = 0;
    const slideCount = slides.length;
  
    // Ensure each slide has same width and set track width
    function layoutSlides() {
      const containerWidth = wrapper.clientWidth;
      const slideEls = track.children;
      for (let i = 0; i < slideEls.length; i += 1) {
        slideEls[i].style.width = `${containerWidth}px`;
      }
      track.style.width = `${containerWidth * slideEls.length}px`;
      setPositionByIndex();
    }
  
    function setPositionByIndex() {
      const cw = wrapper.clientWidth;
      currentTranslate = -current * cw;
      prevTranslate = currentTranslate;
      track.style.transform = `translateX(${currentTranslate}px)`;
      updateDots();
    }
  
    function updateDots() {
      [...dots.children].forEach((d, i) => d.classList.toggle('active', i === current));
    }
  
    // dot click
    dots.addEventListener('click', (e) => {
      const btn = e.target.closest('.ss-dot');
      if (!btn) return;
      current = Number(btn.dataset.index);
      setPositionByIndex();
    });
  
    // pointer & touch handling (desktop drag + mobile touch)
    track.addEventListener('pointerdown', startDrag);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointermove', onDrag);
    // touch fallback (pointer covers most browsers but keep touch handlers)
    track.addEventListener('touchstart', startDrag, { passive: true });
    track.addEventListener('touchend', endDrag);
    track.addEventListener('touchmove', onDrag, { passive: true });
  
    function startDrag(e) {
      isDragging = true;
      startX = getClientX(e);
      animationId = requestAnimationFrame(animation);
      track.classList.add('grabbing');
    }
  
    function onDrag(e) {
      if (!isDragging) return;
      const currentX = getClientX(e);
      const dx = currentX - startX;
      currentTranslate = prevTranslate + dx;
    }
  
    function endDrag() {
      if (!isDragging) return;
      isDragging = false;
      cancelAnimationFrame(animationId);
      track.classList.remove('grabbing');
  
      const movedBy = currentTranslate - prevTranslate;
      const threshold = wrapper.clientWidth * 0.18; // 18% threshold
  
      if (movedBy < -threshold && current < slideCount - 1) {
        current += 1;
      } else if (movedBy > threshold && current > 0) {
        current -= 1;
      }
  
      setPositionByIndex();
    }
  
    function animation() {
      track.style.transform = `translateX(${currentTranslate}px)`;
      if (isDragging) animationId = requestAnimationFrame(animation);
    }
  
    function getClientX(e) {
      if (e.touches && e.touches[0]) return e.touches[0].clientX;
      return e.clientX;
    }
  
    // resize handling
    window.addEventListener('resize', () => {
      layoutSlides();
    });
  
    // keyboard navigation
    block.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' && current > 0) {
        current -= 1; setPositionByIndex();
      } else if (e.key === 'ArrowRight' && current < slideCount - 1) {
        current += 1; setPositionByIndex();
      }
    });
  
    // initial layout
    layoutSlides();
  }
  