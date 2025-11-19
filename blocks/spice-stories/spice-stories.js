export default function decorate(block) {
    const rows = [...block.children];
    block.innerHTML = "";
  
    // Main container becomes horizontal scroll strip
    block.classList.add("spice-stories");
  
    const slides = [];
  
    rows.forEach((row) => {
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
            <div class="spice-text">
              <h2>${title}</h2>
              <h3>${subtitle}</h3>
              <p>${desc}</p>
              <a href="${ctaLink}" target="_blank" class="cta">${ctaText}</a>
            </div>
            <div class="spice-image">
              <img src="${image}" alt="${title}">
            </div>
          </div>
        `;
      }
  
      block.appendChild(slide);
      slides.push(slide);
    });
  
    /* -------------------------------
       PAGINATION DOTS
    --------------------------------*/
    const dots = document.createElement("div");
    dots.className = "spice-dots";
  
    slides.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.dataset.index = i;
      dots.appendChild(dot);
    });
  
    block.after(dots);
  
    /* -------------------------------
       DOT CLICK → SCROLL TO SLIDE
    --------------------------------*/
    dots.addEventListener("click", (e) => {
      if (!e.target.classList.contains("dot")) return;
  
      const index = Number(e.target.dataset.index);
      const targetSlide = slides[index];
      targetSlide.scrollIntoView({ behavior: "smooth", inline: "start" });
    });
  
    /* -------------------------------
       UPDATE DOTS ON SCROLL
    --------------------------------*/
    const updateDots = () => {
      const scrollLeft = block.scrollLeft;
      const width = block.clientWidth;
  
      let activeIndex = Math.round(scrollLeft / width);
  
      dots.querySelectorAll(".dot").forEach((d) => d.classList.remove("active"));
      if (dots.children[activeIndex]) {
        dots.children[activeIndex].classList.add("active");
      }
    };
  
    block.addEventListener("scroll", () => {
      requestAnimationFrame(updateDots);
    });
  
    // Highlight dot #0 at start
    updateDots();
  
    /* -------------------------------
       DESKTOP DRAG SCROLL
    --------------------------------*/
    let isDown = false;
    let startX = 0;
    let scrollStart = 0;
  
    block.addEventListener("mousedown", (e) => {
      isDown = true;
      block.classList.add("dragging");
      startX = e.pageX - block.offsetLeft;
      scrollStart = block.scrollLeft;
    });
  
    window.addEventListener("mouseup", () => {
      isDown = false;
      block.classList.remove("dragging");
    });
  
    block.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - block.offsetLeft;
      const walk = (x - startX) * -1;
      block.scrollLeft = scrollStart + walk;
    });
  }
  