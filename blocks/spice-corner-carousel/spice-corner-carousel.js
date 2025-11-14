export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  // Extract slide data
  const cards = rows.map((row) => {
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

  // ----------- GROUP CARDS INTO SLIDES OF 2 -----------
  const groupedSlides = [];
  for (let i = 0; i < cards.length; i += 2) {
    const pair = [cards[i], cards[i + 1] || cards[0]]; // duplicate first card if odd
    groupedSlides.push(pair);
  }

  // Track
  const track = document.createElement('div');
  track.className = 'spice-carousel__track';

  const bgColors = ['#7a1209', '#005c37', '#ffd027'];

  // ----------- Build each SLIDE (which contains 2 cards) -----------
  groupedSlides.forEach((pair, slideIndex) => {
    const slide = document.createElement('div');
    slide.className = 'spice-slide';

    pair.forEach((slideData, cardIndex) => {
      const card = document.createElement('div');
      card.className = 'spice-carousel__card';

      const bg = document.createElement('div');
      bg.className = 'spice-carousel__bg';
      bg.style.background = bgColors[(slideIndex * 2 + cardIndex) % bgColors.length];

      const imgWrap = document.createElement('div');
      imgWrap.className = 'spice-carousel__img';
      imgWrap.innerHTML = `<img src="${slideData.img}" alt="${slideData.title}"/>`;

      const content = document.createElement('div');
      content.className = 'spice-carousel__content';
      content.innerHTML = `
        <h3>${slideData.title}</h3>
        <p>${slideData.desc}</p>
        ${slideData.ctaText ? `<a class="cta-btn" href="${slideData.ctaLink}">${slideData.ctaText}</a>` : ''}
      `;

      card.append(bg, imgWrap, content);
      slide.append(card);
    });

    track.appendChild(slide);
  });

  block.appendChild(track);

  // Arrows
  const prev = document.createElement('button');
  prev.className = 'spice-carousel__nav prev';
  prev.innerHTML = '&#10094;';

  const next = document.createElement('button');
  next.className = 'spice-carousel__nav next';
  next.innerHTML = '&#10095;';

  block.append(prev, next);

  // Dots
  const dots = document.createElement('div');
  dots.className = 'spice-carousel__dots';
  groupedSlides.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.dataset.index = i;
    dots.append(dot);
  });
  block.append(dots);

  // Logic
  let current = 0;
  let slideWidth;

  function updateSlideWidth() {
    slideWidth = block.querySelector('.spice-slide').offsetWidth;
  }

  function updateUI() {
    track.style.transform = `translateX(-${current * slideWidth}px)`;

    dots.querySelectorAll('.dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  function move(dir) {
    current = (current + dir + groupedSlides.length) % groupedSlides.length;
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

  window.addEventListener('resize', () => {
    updateSlideWidth();
    updateUI();
  });

  updateSlideWidth();
  updateUI();
}
