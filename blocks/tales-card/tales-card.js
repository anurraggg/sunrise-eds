import { createOptimizedPicture } from '../../scripts/aem.js';

export default async function decorate(block) {
  const cardsContainer = document.createElement('div');
  cardsContainer.classList.add('tales-card-container');

  const dotsContainer = document.createElement('div');
  dotsContainer.classList.add('tales-card-dots');
  let currentCardIndex = 0;

  // Process rows
  Array.from(block.children).forEach((row, index) => {
    const card = document.createElement('div');
    card.classList.add('tales-card-item');
    card.dataset.index = index;

    const cols = Array.from(row.children);
    
    // Extract Data
    const titleEl = cols[0]?.querySelector('h1, h2, h3, h4, h5, h6, p') || cols[0];
    const title = titleEl ? titleEl.innerHTML.trim() : ''; // Use innerHTML for Bold tags
    
    const descEl = cols[1]?.querySelector('p') || cols[1];
    const description = descEl ? descEl.textContent.trim() : '';
    
    const imageEl = cols[2]?.querySelector('img');
    const linkEl = cols[3]?.querySelector('a');
    const linkUrl = linkEl ? linkEl.href : '';
    const bgColor = cols[4]?.textContent.trim();

    // Apply Background Color
    if (bgColor) card.style.setProperty('--tales-card-bg', bgColor);

    // --- 1. INTRO CARD LOGIC ---
    if (index === 0) {
      card.classList.add('tales-card-intro');
      const contentDiv = document.createElement('div');
      contentDiv.classList.add('tales-card-content');

      if (title) {
        const h2 = document.createElement('h2');
        h2.innerHTML = title; // Allows <strong>OF SPICES</strong>
        contentDiv.append(h2);
      }

      // Link
      if (linkUrl) {
        const linkDiv = document.createElement('div');
        linkDiv.classList.add('tales-card-link');
        const a = document.createElement('a');
        a.href = linkUrl;
        a.textContent = linkEl.textContent || 'SWIPE TO LEARN';
        linkDiv.append(a);
        contentDiv.append(linkDiv);
      }
      card.append(contentDiv);

    } else {
      // --- 2. CONTENT CARD LOGIC ---
      if (imageEl) {
        const imgDiv = document.createElement('div');
        imgDiv.classList.add('tales-card-image');
        imgDiv.append(createOptimizedPicture(imageEl.src, 'Spice Image', false, [{ width: '400' }]));
        card.append(imgDiv);
      }

      const contentDiv = document.createElement('div');
      contentDiv.classList.add('tales-card-content');

      if (title) {
        const h3 = document.createElement('h3');
        h3.innerHTML = title;
        contentDiv.append(h3);
      }
      if (description) {
        const p = document.createElement('p');
        p.textContent = description;
        contentDiv.append(p);
      }
      
      // FORCE VIEW NOW LINK
      if (linkUrl) {
        const linkDiv = document.createElement('div');
        linkDiv.classList.add('tales-card-link');
        const a = document.createElement('a');
        a.href = linkUrl;
        a.textContent = 'VIEW NOW';
        linkDiv.append(a);
        contentDiv.append(linkDiv);
      }
      card.append(contentDiv);
    }

    cardsContainer.append(card);

    // Dots
    const dot = document.createElement('button');
    dot.classList.add('tales-card-dot');
    if (index === 0) dot.classList.add('active');
    dot.addEventListener('click', () => {
      cardsContainer.scrollTo({ left: card.offsetLeft, behavior: 'smooth' });
    });
    dotsContainer.append(dot);
  });

  block.innerHTML = '';
  block.append(cardsContainer);
  block.append(dotsContainer);

  // Scroll Logic & Drag (Same as before)
  let isDown = false;
  let startX;
  let scrollLeft;

  cardsContainer.addEventListener('mousedown', (e) => {
    isDown = true;
    cardsContainer.classList.add('dragging');
    startX = e.pageX - cardsContainer.offsetLeft;
    scrollLeft = cardsContainer.scrollLeft;
  });
  cardsContainer.addEventListener('mouseleave', () => {
    isDown = false;
    cardsContainer.classList.remove('dragging');
  });
  cardsContainer.addEventListener('mouseup', () => {
    isDown = false;
    cardsContainer.classList.remove('dragging');
  });
  cardsContainer.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - cardsContainer.offsetLeft;
    const walk = (x - startX) * 2;
    cardsContainer.scrollLeft = scrollLeft - walk;
  });

  // Update Dots on Scroll
  cardsContainer.addEventListener('scroll', () => {
    const center = cardsContainer.scrollLeft + (cardsContainer.offsetWidth / 2);
    const cards = cardsContainer.querySelectorAll('.tales-card-item');
    cards.forEach((c, i) => {
      if (c.offsetLeft <= center && (c.offsetLeft + c.offsetWidth) > center) {
        if (currentCardIndex !== i) {
          dotsContainer.querySelector('.active')?.classList.remove('active');
          dotsContainer.children[i]?.classList.add('active');
          currentCardIndex = i;
        }
      }
    });
  });
}