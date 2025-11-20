/* Sunrise Videos – Minimal 2-per-slide Inline Player */

function extractYouTubeId(str) {
    // If the author puts just the ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
  
    // If the author puts a full URL
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#?]*).*/;
    const match = str.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }
  
  function createThumbnail(id) {
    const wrapper = document.createElement('div');
    wrapper.className = 'sv-thumb';
    wrapper.dataset.id = id;
  
    const img = document.createElement('img');
    img.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    img.alt = 'Video thumbnail';
    img.loading = 'lazy';
  
    const play = document.createElement('div');
    play.className = 'sv-play-btn';
  
    wrapper.appendChild(img);
    wrapper.appendChild(play);
  
    return wrapper;
  }
  
  function createIframe(id) {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    iframe.allow =
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.frameBorder = '0';
    return iframe;
  }
  
  export default function decorate(block) {
    const rows = block.querySelectorAll(':scope > div');
    const ids = [];
  
    // --- Parse authored content (skip header row) ---
    for (let i = 1; i < rows.length; i++) {
      const cell = rows[i].querySelector(':scope > div');
      if (!cell) continue;
  
      const raw = cell.textContent.trim();
      const id = extractYouTubeId(raw);
  
      if (id) ids.push(id);
    }
  
    if (ids.length === 0) {
      console.error('No valid YouTube IDs found.');
      return;
    }
  
    // --- Build minimal slider ---
    block.innerHTML = `
      <div class="sv-slider-wrapper">
        <button class="sv-arrow sv-left">‹</button>
        <div class="sv-slider"><div class="sv-track"></div></div>
        <button class="sv-arrow sv-right">›</button>
      </div>
    `;
  
    const track = block.querySelector('.sv-track');
  
    // Create slides (2 per slide)
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
  
    // Inline embed (replace thumbnail with iframe on click)
    track.addEventListener('click', (e) => {
      const thumb = e.target.closest('.sv-thumb');
      if (!thumb) return;
      const id = thumb.dataset.id;
      thumb.replaceWith(createIframe(id));
    });
  }
  