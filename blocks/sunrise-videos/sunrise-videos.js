export default async function decorate(block) {
    // Wait for block content to actually be present
    await new Promise((resolve) => requestAnimationFrame(resolve));
  
    const rows = block.querySelectorAll(':scope > div');
    const ids = [];
  
    // Parse authored rows (skip header)
    for (let i = 1; i < rows.length; i++) {
      const cell = rows[i].querySelector(':scope > div');
      if (!cell) continue;
  
      const raw = cell.textContent.trim();
      const id = extractYouTubeId(raw);
  
      if (id) ids.push(id);
    }
  
    if (ids.length === 0) {
      console.error('No YouTube IDs found in content.');
      return;
    }
  
    // Build slider layout
    block.innerHTML = `
      <div class="sv-slider-wrapper">
        <button class="sv-arrow sv-left">‹</button>
        <div class="sv-slider"><div class="sv-track"></div></div>
        <button class="sv-arrow sv-right">›</button>
      </div>
    `;
  
    const track = block.querySelector('.sv-track');
  
    // 2 per slide
    for (let i = 0; i < ids.length; i += 2) {
      const slide = document.createElement('div');
      slide.className = 'sv-slide';
  
      if (ids[i]) slide.appendChild(createThumbnail(ids[i]));
      if (ids[i + 1]) slide.appendChild(createThumbnail(ids[i + 1]));
  
      track.appendChild(slide);
    }
  
    let index = 0;
    const slides = [...track.children];
    const total = slides.length;
  
    function update() {
      track.style.transform = `translateX(-${index * 100}%)`;
    }
  
    block.querySelector('.sv-left').onclick = () => {
      index = Math.max(0, index - 1);
      update();
    };
  
    block.querySelector('.sv-right').onclick = () => {
      index = Math.min(total - 1, index + 1);
      update();
    };
  
    track.addEventListener('click', (e) => {
      const t = e.target.closest('.sv-thumb');
      if (!t) return;
      t.replaceWith(createIframe(t.dataset.id));
    });
  }
  