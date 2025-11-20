function extractYouTubeId(str) {
    // Raw ID?
    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
  
    // URL?
    const regExp = /^.*(youtu.be\/|v\/|embed\/|watch\?v=)([^#\&\?]*).*/;
    const match = str.match(regExp);
    return match && match[2]?.length === 11 ? match[2] : null;
  }
  
  function createThumb(id) {
    const div = document.createElement("div");
    div.className = "sv-thumb";
    div.dataset.id = id;
  
    const img = document.createElement("img");
    img.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    img.loading = "lazy";
  
    const play = document.createElement("div");
    play.className = "sv-play";
  
    div.append(img, play);
    return div;
  }
  
  function createIframe(id) {
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    return iframe;
  }
  
  export default async function decorate(block) {
    // Allow auto-blocking to finish
    await new Promise((r) => requestAnimationFrame(r));
  
    const rows = [...block.children];
    const ids = [];
  
    rows.forEach((row) => {
      const cell = row.querySelector(":scope > div > p");
      if (!cell) return;
  
      const raw = cell.textContent.trim();
      const id = extractYouTubeId(raw);
      if (id) ids.push(id);
    });
  
    if (ids.length === 0) {
      console.error("sunrise-videos: no valid YouTube IDs found");
      return;
    }
  
    // Clear original content
    block.innerHTML = "";
    block.classList.add("sunrise-videos-slider");
  
    // --- FIXED STRUCTURE ---
    // SLIDER VIEWPORT (overflow hidden)
    const slider = document.createElement("div");
    slider.className = "sv-slider";
  
    // TRACK (slides move left/right)
    const track = document.createElement("div");
    track.className = "sv-track";
  
    // Add track inside slider
    slider.appendChild(track);
  
    // Build slides (2 videos per slide)
    for (let i = 0; i < ids.length; i += 2) {
      const slide = document.createElement("div");
      slide.className = "sv-slide";
  
      if (ids[i]) slide.append(createThumb(ids[i]));
      if (ids[i + 1]) slide.append(createThumb(ids[i + 1]));
  
      track.appendChild(slide);
    }
  
    // Controls
    const prev = document.createElement("button");
    prev.className = "sv-prev";
    prev.innerHTML = "‹";
  
    const next = document.createElement("button");
    next.className = "sv-next";
    next.innerHTML = "›";
  
    // Append everything in correct order
    block.append(prev, slider, next);
  
    // --- SLIDING LOGIC ---
    let index = 0;
    const slides = [...track.children];
    const total = slides.length;
  
    function update() {
      track.style.transform = `translateX(-${index * 100}%)`;
    }
  
    prev.onclick = () => {
      index = Math.max(0, index - 1);
      update();
    };
  
    next.onclick = () => {
      index = Math.min(total - 1, index + 1);
      update();
    };
  
    // --- CLICK THUMB TO PLAY VIDEO ---
    track.addEventListener("click", (e) => {
      const thumb = e.target.closest(".sv-thumb");
      if (!thumb) return;
  
      thumb.replaceWith(createIframe(thumb.dataset.id));
    });
  }
  