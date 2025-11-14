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
      ctaText: cols[3] || 'EXPLORE ALL',
      ctaLink: cols[4] || '#'
    };
  });

  block.innerHTML = '';
  block.classList.add('spice-carousel');

  const track = document.createElement('div');
  track.className = 'spice-carousel__track';

  const bgColors = ['#7a1209', '#005c37', '#ffd027']; // red, green, yellow

  // Build Slides
  slides.forEach((slide, i) => {
    const card = document.createElement('div');
    card.className = 'spice-carousel__card';

    // LEFT PANEL (BG + IMAGE)
    const left = document.createElement('div');
    left.className = 'spice-left';
    left.innerHTML = `
      <div class="spice-bg" style="background:${bgColors[i % bgColors.length]}"></div>
      <img class="spice-img" src="${slide.img}" alt="${slide.title}">
    `;

    // RIGHT PANEL (CONTENT)
    const right = document.createElement('div');
    right.className = 'spice-right';
    right.innerHTML = `
      <h3>${slide.title}</h3>
      <p>${slide.desc}</p>
      <a class="cta-btn" href="${slide.ctaLink}">${slide.ctaText} →</a>
    `;

    card.append(left, right);
    track.appendChild(card);
  });

  block.append(track);

  // ARROWS
  const prev = document.createElement('button');
  prev.className = 'spice-carousel__nav prev';
  prev.innerHTML = '&#10094;';
  const next = document.createElement('button');
  next.className = 'spice-carousel__nav next';
  next.innerHTML = '&#10095;';
  block.append(prev, next);

  // DOTS
  const dots = document.createElement('div');
  dots.className = 'spice-carousel__dots';
  slides.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.classList.add('dot');
    dot.dataset.index = i;
    dots.append(dot);
  });
  block.append(dots);

  // Logic
  let current = 0;
  let cardWidth;

  const updateCardWidth = () => {
    cardWidth = block.querySelector('.spice-carousel__card').offsetWidth;
  };

  const updateUI = () => {
    track.style.transform = `translateX(-${current * cardWidth}px)`;
    dots.querySelectorAll('.dot').forEach((d, i) =>
      d.classList.toggle('active', i === current % slides.length)
    );
  };

  const move = (dir) => {
    current = (current + dir + slides.length) % slides.length;
    updateUI();
  };

  prev.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));

  dots.querySelectorAll('.dot').forEach(dot =>
    dot.addEventListener('click', () => {
      current = parseInt(dot.dataset.index);
      updateUI();
    })
  );

  window.addEventListener('resize', () => {
    updateCardWidth();
    updateUI();
  });

  updateCardWidth();
  updateUI();
}
