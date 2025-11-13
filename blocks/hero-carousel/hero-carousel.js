export default function decorate(block) {
    const rows = [...block.children];
    if (!rows.length) return;
  
    // Extract slide data
    const slides = rows.map((row) => {
      const [bg, title, desc] = [...row.children].map((c) => c.innerText.trim());
      return { bg, title, desc };
    });
  
    block.innerHTML = '';
    block.classList.add('hero-carousel');
  
    // Wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'hero-carousel__track';
  
    // Build slides
    slides.forEach((slide, i) => {
      const s = document.createElement('div');
      s.className = 'hero-carousel__slide';
      s.style.backgroundImage = `url("${slide.bg}")`;
      s.dataset.index = i;
  
      const content = document.createElement('div');
      content.className = 'hero-carousel__content';
  
      if (slide.title) {
        const h2 = document.createElement('h2');
        h2.textContent = slide.title;
        content.appendChild(h2);
      }
  
      if (slide.desc) {
        const p = document.createElement('p');
        p.textContent = slide.desc;
        content.appendChild(p);
      }
  
      s.appendChild(content);
      wrapper.appendChild(s);
    });
  
    block.appendChild(wrapper);
  
    // Arrows
    const prev = document.createElement('button');
    prev.className = 'hero-carousel__arrow hero-carousel__prev';
    prev.innerHTML = '&#x276E;';
  
    const next = document.createElement('button');
    next.className = 'hero-carousel__arrow hero-carousel__next';
    next.innerHTML = '&#x276F;';
  
    block.append(prev, next);
  
    // Dots
    const dots = document.createElement('div');
    dots.className = 'hero-carousel__dots';
  
    slides.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'hero-carousel__dot';
      d.dataset.index = i;
      dots.appendChild(d);
    });
  
    block.appendChild(dots);
  
    // Logic
    let current = 0;
    const total = slides.length;
    let transitioning = false;
  
    function updateSlides() {
      [...wrapper.children].forEach((slide, i) => {
        slide.classList.toggle('active', i === current);
      });
  
      [...dots.children].forEach((dot, i) => {
        dot.classList.toggle('active', i === current);
      });
    }
  
    function goTo(index) {
      if (transitioning) return;
      transitioning = true;
  
      current = (index + total) % total;
      updateSlides();
  
      setTimeout(() => {
        transitioning = false;
      }, 600);
    }
  
    prev.addEventListener('click', () => goTo(current - 1));
    next.addEventListener('click', () => goTo(current + 1));
  
    dots.querySelectorAll('button').forEach((d) => {
      d.addEventListener('click', () => {
        goTo(parseInt(d.dataset.index, 10));
      });
    });
  
    // Autoplay (optional)
    let auto = setInterval(() => goTo(current + 1), 6000);
  
    block.addEventListener('mouseenter', () => clearInterval(auto));
    block.addEventListener('mouseleave', () => {
      auto = setInterval(() => goTo(current + 1), 6000);
    });
  
    updateSlides();
  }
  