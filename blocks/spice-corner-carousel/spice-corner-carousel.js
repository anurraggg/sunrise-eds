export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  // ------------------------------
  // 1. Extract slide data
  // ------------------------------
  const slides = rows.map((row) => {
    const imgTag = row.querySelector('img');
    const img = imgTag ? imgTag.src : '';
    const title = row.children[1]?.innerText.trim() || '';
    const desc = row.children[2]?.innerText.trim() || '';
    return { img, title, desc };
  });

  block.innerHTML = '';
  block.classList.add('spice-carousel');

  // ------------------------------
  // 2. Structure
  // ------------------------------
  const track = document.createElement('div');
  track.className = 'spice-carousel__track';

  slides.forEach((slide, i) => {
    const card = document.createElement('div');
    card.className = 'spice-carousel__card';
    card.dataset.index = i;

    const img = document.createElement('img');
    img.src = slide.img;

    const title = document.createElement('h3');
    title.textContent = slide.title;

    const desc = document.createElement('p');
    desc.textContent = slide.desc;

    const btn = document.createElement('a');
    btn.className = 'spice-carousel__btn';
    btn.textContent = 'Explore Now';
    btn.href = '#';

    card.append(img, title, desc, btn);
    track.appendChild(card);
  });

  block.appendChild(track);

  // ------------------------------
  // 3. Arrows
  // ------------------------------
  const prev = document.createElement('button');
  prev.className = 'spice-carousel__arrow spice-carousel__prev';
  prev.innerHTML = '&#10094;';

  const next = document.createElement('button');
  next.className = 'spice-carousel__arrow spice-carousel__next';
  next.innerHTML = '&#10095;';

  block.append(prev, next);

  // ------------------------------
  // 4. Dots
  // ------------------------------
  const dots = document.createElement('div');
  dots.className = 'spice-carousel__dots';

  slides.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'dot';
    d.dataset.index = i;
    dots.appendChild(d);
  });

  block.appendChild(dots);

  // ------------------------------
  // 5. Carousel Logic
  // ------------------------------
  let current = 0;
  let cardWidth = 0;

  function updateCardWidth() {
    const card = block.querySelector(".spice-carousel__card");
    if (!card) return;

    const gap = 40; // same as CSS gap
    cardWidth = card.offsetWidth + gap;
  }

  function updateUI() {
    updateCardWidth();
    const moveX = current * cardWidth;
    track.style.transform = `translateX(-${moveX}px)`;

    dots.querySelectorAll('.dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === (current % slides.length));
    });
  }

  function move(dir) {
    current = (current + dir + slides.length) % slides.length;
    updateUI();
  }

  prev.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));

  dots.querySelectorAll('.dot').forEach((dot) => {
    dot.addEventListener('click', () => {
      current = Number(dot.dataset.index);
      updateUI();
    });
  });

  // ------------------------------
  // 6. Wait for images + render
  // ------------------------------
  window.addEventListener("load", () => {
    updateCardWidth();
    updateUI();
  });

  setTimeout(() => {
    updateCardWidth();
    updateUI();
  }, 80); // ensures layout is ready
}
