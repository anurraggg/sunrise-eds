export default function decorate(block) {
    const rows = [...block.children];
  
    // First row = static left panel
    const staticRow = rows.shift();
    const [staticLabel, staticTitle, staticCTA] = [...staticRow.children].map(c => c.innerText.trim());
  
    // Predefined background colors for slides
    const colors = [
      "#0f6a53",
      "#2b1c1c",
      "#7a2b28",
      "#3a6d4b",
      "#5b2d2a",
    ];
  
    block.innerHTML = "";
  
    /* WRAPPER (2 columns layout) */
    const wrapper = document.createElement("div");
    wrapper.className = "spice-stories-layout";
  
    /* LEFT STATIC PANEL -------------------------- */
    const left = document.createElement("div");
    left.className = "spice-static-panel";
    left.innerHTML = `
      <div class="spice-static-inner">
        <div class="static-underline"></div>
        <p class="static-label">${staticLabel}</p>
        <h2 class="static-title">${staticTitle}</h2>
        <p class="static-cta">${staticCTA}</p>
      </div>
    `;
  
    /* RIGHT SLIDER PANEL -------------------------- */
    const sliderWrapper = document.createElement("div");
    sliderWrapper.className = "spice-slider-wrapper";
  
    const track = document.createElement("div");
    track.className = "spice-slider-track";
  
    rows.forEach((row, i) => {
      const cells = [...row.children];
      const img = cells[0]?.querySelector("img")?.src || "";
      const title = cells[1]?.innerText || "";
      const desc = cells[2]?.innerText || "";
      const ctaText = cells[3]?.innerText || "";
      const ctaLink = cells[4]?.innerText || "#";
  
      const slide = document.createElement("div");
      slide.className = "spice-slide";
      slide.style.background = colors[i % colors.length];
  
      slide.innerHTML = `
        <div class="slide-inner">
          <img class="slide-img" src="${img}" alt="${title}">
          <h3>${title}</h3>
          <p class="slide-desc">${desc}</p>
          <a href="${ctaLink}" class="slide-cta" target="_blank">${ctaText}</a>
        </div>
      `;
  
      track.appendChild(slide);
    });
  
    sliderWrapper.appendChild(track);
  
    /* DOT PAGINATION -------------------------- */
    const dots = document.createElement("div");
    dots.className = "spice-dots";
  
    rows.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.className = "spice-dot";
      if (i === 0) dot.classList.add("active");
      dot.dataset.index = i;
      dots.appendChild(dot);
    });
  
    sliderWrapper.appendChild(dots);
  
    /* Append panels */
    wrapper.append(left);
    wrapper.append(sliderWrapper);
    block.append(wrapper);
  
    /* SLIDER LOGIC */
    let current = 0;
  
    const updateSlider = () => {
      track.style.transform = `translateX(-${current * 100}%)`;
      [...dots.children].forEach((d, i) =>
        d.classList.toggle("active", i === current)
      );
    };
  
    dots.querySelectorAll(".spice-dot").forEach((dot) => {
      dot.addEventListener("click", () => {
        current = Number(dot.dataset.index);
        updateSlider();
      });
    });
  
    /* TOUCH SWIPE */
    let startX = 0;
  
    track.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    });
  
    track.addEventListener("touchend", (e) => {
      const endX = e.changedTouches[0].clientX;
      const diff = startX - endX;
  
      if (diff > 50) current = (current + 1) % rows.length;
      if (diff < -50) current = (current - 1 + rows.length) % rows.length;
  
      updateSlider();
    });
  
    updateSlider();
  }
  