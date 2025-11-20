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
    // Wait for auto-block content
    await new Promise(r => requestAnimationFrame(r));
  
    const rows = [...block.children];
    const ids = [];
  
    rows.forEach(row => {
      const cell = row.querySelector(":scope > div > p");
      if (!cell) return;
      const raw = cell.textContent.trim();
      const id = extractYouTubeId(raw);
      if (id) ids.push(id);
    });
  
    if (ids.length === 0) {
      console.error("sunrise-videos: no IDs parsed");
      return;
    }
  
    // Clear block
    block.innerHTML = "";
    block.classList.add("sunrise-videos-slider");
  
    // Slider wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "sv-track";
  
    // Build 2-per-slide videos
    for (let i = 0; i < ids.length; i += 2) {
      const slide = document.createElement("div");
      slide.className = "sv-slide";
  
      if (ids[i]) slide.append(createThumb(ids[i]));
      if (ids[i + 1]) slide.append(createThumb(ids[i + 1]));
  
      wrapper.appendChild(slide);
    }
  
    // Controls
    const prev = document.createElement("button");
    prev.className = "sv-prev";
    prev.innerHTML = "‹";
  
    const next = document.createElement("button");
    next.className = "sv-next";
    next.innerHTML = "›";
  
    block.append(prev, wrapper, next);
  
    // Slider logic
    let index = 0;
    const slides = [...wrapper.children];
    const total = slides.length;
  
    function update() {
      wrapper.style.transform = `translateX(-${index * 100}%)`;
    }
  
    prev.onclick = () => {
      index = Math.max(0, index - 1);
      update();
    };
  
    next.onclick = () => {
      index = Math.min(total - 1, index + 1);
      update();
    };
  
    // Inline video replace
    wrapper.addEventListener("click", (e) => {
      const thumb = e.target.closest(".sv-thumb");
      if (!thumb) return;
  
      thumb.replaceWith(createIframe(thumb.dataset.id));
    });
  }
  