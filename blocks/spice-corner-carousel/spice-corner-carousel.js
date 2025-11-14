export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  // Extract slide data
  const slides = rows.map((row) => {
    const img = row.querySelector('img')?.src || '';
    const cols = [...row.children].map(c => c.innerText.trim());
    return {
      img,
      title: cols[1],
      desc: cols[2],
      ctaText: cols[3] || '',
      ctaLink: cols[4] || '#'
    };
  });

  block.innerHTML = '';
  block.classList.add('spice-carousel');

  // Wrapper
  const track = document.createElement('div');
  track.className = 'spice-carousel__track';

  // Auto-color backgrounds (yellow → green → red)
  const bgColors = ['#ffd027', '#005c37', '#7a1209'];

  // Build Slides
  slides.forEach((slide, i) => {
    const card = document.createElement('div');
    card.className = 'spice-carousel__card';

    const bg = document.createElement('div');
    bg.className = 'spice-carousel__bg';
    bg.style.background = bgColors[i % bgColors.length];

    const imgWrap = document.createElement('div');
    imgWrap.className = 'spice-carousel__img';
    imgWrap.innerHTML = `<img src="${slide.img}" alt="${slide.title}"/>`;

    const content = document.createElement('div');
    content.className = 'spice-carousel__content';
    content.innerHTML = `
      <h3>${slide.title}</h3>
      <p>${slide.desc}</p>
      ${slide.ctaText ? `<a class="cta-btn" href="${slide.ctaLink}">${slide.ctaText}</a>` : ''}
    `;

    card.append(bg, imgWrap, content);
    track.appendChild(card);
  });

  block.appendChild(track);

  // Navigation arrows
  const prev = document.createElement('button');
  prev.className = 'spice-carousel__nav prev';
  prev.innerHTML = '&#10094;';

  const next = document.createElement('button');
  next.className = 'spice-carousel__nav next';
  next.innerHTML = '&#10095;';

  block.append(prev, next);

  // Pagination dots
  const dots = document.createElement('div');
  dots.className = 'spice-carousel__dots';
  slides.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.dataset.index = i;
    dots.append(dot);
  });
  block.append(dots);

  // Carousel Logic
  let current = 0;
  let cardWidth;

  function updateCardWidth() {
    cardWidth = block.querySelector('.spice-carousel__card').offsetWidth;
  }

  function updateUI() {
    track.style.transform = `translateX(-${current * cardWidth}px)`;

    dots.querySelectorAll('.dot').forEach((d, i) => {
      d.classList.toggle('active', i === current % slides.length);
    });
  }

  function move(dir) {
    current = (current + dir + slides.length) % slides.length;
    updateUI();
  }

  prev.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));

  dots.querySelectorAll('.dot').forEach(dot => {
    dot.addEventListener('click', () => {
      current = parseInt(dot.dataset.index);
      updateUI();
    });
  });

  // Resize recalculation
  window.addEventListener('resize', () => {
    updateCardWidth();
    updateUI();
  });

  updateCardWidth();
  updateUI();
}
