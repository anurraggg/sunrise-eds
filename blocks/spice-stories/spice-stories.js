export default function decorate(block) {
    const rows = [...block.children];
    block.innerHTML = "";
  
    const slides = rows.map((row) => {
      const cells = [...row.children].map((c) => c.textContent.trim());
      const [type, image, title, subtitle, desc, ctaText, ctaLink, bgColor] = cells;
  
      const slide = document.createElement("div");
      slide.className = "spice-slide";
      slide.style.background = bgColor || "#EEE";
  
      if (type === "intro") {
        slide.innerHTML = `
          <div class="intro-wrapper">
            <div class="intro-title">${title}</div>
            <div class="intro-subtitle">${subtitle}</div>
            <div class="intro-desc">${desc}</div>
          </div>
        `;
      } else {
        slide.innerHTML = `
          <div class="spice-wrapper">
            <div class="spice-image">
              <img src="${image}" alt="${title}">
            </div>
            <div class="spice-text">
              <h2>${title}</h2>
              <h3>${subtitle}</h3>
              <p>${desc}</p>
              <a href="${ctaLink}" target="_blank" class="cta">${ctaText}</a>
            </div>
          </div>
        `;
      }
  
      return slide;
    });
  
    // Create track
    const track = document.createElement("div");
    track.className = "spice-track";
    slides.forEach((s) => track.appendChild(s));
    block.appendChild(track);
  
    // Pagination dots
    const dots = document.createElement("div");
    dots.className = "spice-dots";
  
    slides.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.dataset.index = i;
      dots.appendChild(dot);
    });
  
    block.appendChild(dots);
  
    let index = 0;
    const update = () => {
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.querySelectorAll(".dot").forEach((d) => d.classList.remove("active"));
      dots.children[index].classList.add("active");
    };
  
    // Dot click
    dots.addEventListener("click", (e) => {
      if (e.target.classList.contains("dot")) {
        index = Number(e.target.dataset.index);
        update();
      }
    });
  
    // Swipe / Drag
    let startX = 0;
    let isDown = false;
  
    block.addEventListener("mousedown", (e) => {
      isDown = true;
      startX = e.clientX;
    });
  
    block.addEventListener("mouseup", (e) => {
      if (!isDown) return;
      const diff = e.clientX - startX;
      if (diff < -50 && index < slides.length - 1) index++;
      if (diff > 50 && index > 0) index--;
      update();
      isDown = false;
    });
  
    // Touch
    block.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    });
  
    block.addEventListener("touchend", (e) => {
      const diff = e.changedTouches[0].clientX - startX;
      if (diff < -50 && index < slides.length - 1) index++;
      if (diff > 50 && index > 0) index--;
      update();
    });
  
    update();
  }
  