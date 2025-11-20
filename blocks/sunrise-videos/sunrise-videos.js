/* Minimal Sunrise Videos Block
   - Authors provide ONLY YouTube IDs in a table
   - Exactly 2 videos per slide
   - Clicking thumbnail replaces it with an inline YouTube iframe
*/

function createThumbnail(id) {
    const wrapper = document.createElement('div');
    wrapper.className = 'sv-thumb';
    wrapper.dataset.id = id;
  
    const img = document.createElement('img');
    img.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    img.alt = 'Video thumbnail';
  
    const play = document.createElement('div');
    play.className = 'sv-play-btn';
  
    wrapper.appendChild(img);
    wrapper.appendChild(play);
    return wrapper;
  }
  
  function createIframe(id) {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.frameBorder = 0;
    return iframe;
  }
  
  function parseIds(block) {
    const table = block.querySelector('table');
    const ids = [];
  
    if (!table) return ids;
  
    [...table.querySelectorAll('tr')].forEach((row) => {
      const cell = row.querySelector('td, th');
      if (!cell) return;
  
      let id = cell.innerText.trim().replace(/\s+/g, '');
      if (id) ids.push(id);
    });
  
    return ids;
  }
  
  export default function decorate(block) {
    // 1. Read & save IDs BEFORE modifying block content
    const ids = parseIds(block);
  
    // 2. Remove table entirely
    const tbl = block.querySelector('table');
    if (tbl) tbl.remove();
  
    // 3. Build slider layout
    block.innerHTML = `
      <div class="sv-slider-wrapper">
        <button class="sv-arrow sv-left">‹</button>
        <div class="sv-slider"><div class="sv-track"></div></div>
        <button class="sv-arrow sv-right">›</button>
      </div>
    `;
  
    const track = block.querySelector('.sv-track');
  
    // 4. Create slides (2 per slide)
    for (let i = 0; i < ids.length; i += 2) {
      const slide = document.createElement('div');
      slide.className = 'sv-slide';
  
      const id1 = ids[i];
      const id2 = ids[i + 1];
  
      if (id1) slide.appendChild(createThumbnail(id1));
      if (id2) slide.appendChild(createThumbnail(id2));
  
      track.appendChild(slide);
    }
  
    // 5. Slider movement
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
  
    // 6. Inline embed click
    track.addEventListener('click', (e) => {
      const t = e.target.closest('.sv-thumb');
      if (!t) return;
  
      const id = t.dataset.id;
      const iframe = createIframe(id);
      t.replaceWith(iframe);
    });
  }
  