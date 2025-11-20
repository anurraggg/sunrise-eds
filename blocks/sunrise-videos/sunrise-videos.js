/* Minimal Sunrise Videos Block
   - Authors provide ONLY YouTube IDs in a table
   - Exactly 2 videos per slide
   - Clicking thumbnail replaces it with an inline YouTube iframe
*/

function createThumbnail(id) {
    const thumb = document.createElement('div');
    thumb.className = 'sv-thumb';
  
    const img = document.createElement('img');
    img.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    img.alt = 'Video thumbnail';
  
    const play = document.createElement('div');
    play.className = 'sv-play-btn';
  
    thumb.appendChild(img);
    thumb.appendChild(play);
  
    return thumb;
  }
  
  function createIframe(id) {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    iframe.allow =
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.frameBorder = 0;
    return iframe;
  }
  
  export default function decorate(block) {
    const table = block.querySelector('table');
    const ids = [];
  
    if (table) {
      [...table.querySelectorAll('tr')].forEach((row) => {
        const cell = row.querySelector('td, th');
        if (cell && cell.textContent.trim()) {
          ids.push(cell.textContent.trim());
        }
      });
    }
  
    block.innerHTML = `
      <div class="sv-slider-wrapper">
        <button class="sv-arrow sv-left">‹</button>
        <div class="sv-slider"><div class="sv-track"></div></div>
        <button class="sv-arrow sv-right">›</button>
      </div>
    `;
  
    const track = block.querySelector('.sv-track');
  
    // Build slides (2 IDs per slide)
    for (let i = 0; i < ids.length; i += 2) {
      const slide = document.createElement('div');
      slide.className = 'sv-slide';
  
      const id1 = ids[i];
      const id2 = ids[i + 1];
  
      if (id1) {
        const v1 = createThumbnail(id1);
        v1.dataset.id = id1;
        slide.appendChild(v1);
      }
      if (id2) {
        const v2 = createThumbnail(id2);
        v2.dataset.id = id2;
        slide.appendChild(v2);
      }
  
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
  
    // Inline playback
    track.addEventListener('click', (e) => {
      const thumb = e.target.closest('.sv-thumb');
      if (!thumb) return;
  
      const id = thumb.dataset.id;
      if (!id) return;
  
      const iframe = createIframe(id);
      thumb.replaceWith(iframe);
    });
  }
  