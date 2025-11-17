export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const slides = rows.map((row) => {
    const img = row.querySelector('img')?.src || '';
    const cols = [...row.children].map((c) => c.innerText.trim());
    return {
      img,
      title: cols[1],
      desc: cols[2],
      ctaText: cols[3],
      ctaLink: cols[4],
    };
  });

  block.innerHTML = '';
  block.classList.add('spice-corner-carousel');

  const track = document.createElement('div');
  track.className = 'spice-carousel__track';

  const bgColors = ['#7a1209', '#005c37', '#ffd027'];

  slides.forEach((slide, i) => {
    const slideWrap = document.createElement('div');
    slideWrap.className = 'spice-slide';

    const card = document.createElement('div');
    card.className = 'spice-carousel__card';

    const bg = document.createElement('div');
    bg.className = 'spice-carousel__bg';
    bg.style.background = bgColors[i % bgColors.length];

    const imgWrap = document.createElement('div');
    imgWrap.className = 'spice-carousel__img';
    imgWrap.innerHTML = `<img src="${slide.img}" alt="${slide.title}">`;

    card.append(bg, imgWrap);

    const content = document.createElement('div');
    content.className = 'spice-carousel__content';

    content.innerHTML = `
      <h3>${slide.title}</h3>
      <p>${slide.desc}</p>
      <a class="cta-btn" href="${slide.ctaLink}">${slide.ctaText}</a>
    `;

    slideWrap.append(card, content);
    track.append(slideWrap);
  });

  block.append(track);

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

  slides.forEach((_, i) => {
    const d = document.createElement('span');
    d.className = 'dot';
    d.dataset.index = i;
    dots.appendChild(d);
  });

  block.append(dots);

  let current = 0;

  function updateUI() {
    const slideWidth = block.querySelector('.spice-slide').offsetWidth;
    const move = current * (slideWidth + 40); // 40px gap
    track.style.transform = `translateX(-${move}px)`;

    [...dots.children].forEach((dot, i) => {
      dot.classList.toggle('active', i === current);
    });
  }

  function moveSlide(dir) {
    current = (current + dir + slides.length) % slides.length;
    updateUI();
  }

  prev.addEventListener('click', () => moveSlide(-1));
  next.addEventListener('click', () => moveSlide(1));

  dots.querySelectorAll('.dot').forEach((dot) => {
    dot.addEventListener('click', () => {
      current = Number(dot.dataset.index);
      updateUI();
    });
  });

  window.addEventListener('resize', updateUI);

  updateUI();
}
