import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Decorates the tales-card block.
 * @param {Element} block The tales-card block element
 */
export default async function decorate(block) {
  const cardsContainer = document.createElement('div');
  cardsContainer.classList.add('tales-card-container');

  const dotsContainer = document.createElement('div');
  dotsContainer.classList.add('tales-card-dots');
  let currentCardIndex = 0;

  // Process each row as a card
  Array.from(block.children).forEach((row, index) => {
    const card = document.createElement('div');
    card.classList.add('tales-card-item');
    card.dataset.index = index;

    const cols = Array.from(row.children);
    let linkUrl = '';

    // Extract content based on the content model
    // Col 1: Title
    const titleEl = cols[0] ? cols[0].querySelector('h1, h2, h3, h4, h5, h6, p') || cols[0] : null;
    const title = titleEl ? titleEl.textContent.trim() : '';

    // Col 2: Description
    const descriptionEl = cols[1] ? cols[1].querySelector('p') || cols[1] : null;
    const description = descriptionEl ? descriptionEl.innerHTML.trim() : '';

    // Col 3: Image (optional)
    const imageEl = cols[2] ? cols[2].querySelector('img') : null;

    // Col 4: Link (optional)
    const linkEl = cols[3] ? cols[3].querySelector('a') : null;
    linkUrl = linkEl ? linkEl.href : '#';

    // Col 5: Background Color (optional)
    const bgColorEl = cols[4] ? cols[4].querySelector('p') || cols[4] : null;
    const bgColor = bgColorEl ? bgColorEl.textContent.trim() : '';

    if (bgColor) {
      card.style.setProperty('--tales-card-bg', bgColor);
    }

    // First card (intro card) has different layout - no image
    if (index === 0) {
      card.classList.add('tales-card-intro');
      const introContent = document.createElement('div');
      introContent.classList.add('tales-card-content');

      if (title) {
        const h2 = document.createElement('h2');
        h2.innerHTML = title.replace(/\n/g, '<br>'); // Preserve line breaks
        introContent.append(h2);
      }
      if (description) {
        const p = document.createElement('p');
        p.innerHTML = description;
        introContent.append(p);
      }
      if (linkUrl && linkUrl !== '#') {
        const linkWrapper = document.createElement('div');
        linkWrapper.classList.add('tales-card-link');
        const a = document.createElement('a');
        a.href = linkUrl;
        a.textContent = 'SWIPE TO LEARN'; // Default text if link text is missing
        // You can also use linkEl.textContent if the author provided specific text
        introContent.append(linkWrapper);
        linkWrapper.append(a);
      }
      card.append(introContent);
    } else {
      // Regular cards
      const contentWrapper = document.createElement('div');
      contentWrapper.classList.add('tales-card-content');

      if (imageEl) {
        const imgWrapper = document.createElement('div');
        imgWrapper.classList.add('tales-card-image');
        imgWrapper.append(createOptimizedPicture(imageEl.src, title, false, [{ width: '400' }]));
        card.append(imgWrapper);
      }
      
      if (title) {
        const h3 = document.createElement('h3');
        h3.textContent = title;
        contentWrapper.append(h3);
      }
      if (description) {
        const p = document.createElement('p');
        p.innerHTML = description;
        contentWrapper.append(p);
      }
      if (linkUrl && linkUrl !== '#') {
        const linkWrapper = document.createElement('div');
        linkWrapper.classList.add('tales-card-link');
        const a = document.createElement('a');
        a.href = linkUrl;
        a.textContent = 'VIEW NOW';
        linkWrapper.append(a);
        contentWrapper.append(linkWrapper);
      }
      card.append(contentWrapper);
    }

    cardsContainer.append(card);

    // Create pagination dot
    const dot = document.createElement('button');
    dot.ariaLabel = `Go to slide ${index + 1}`;
    dot.classList.add('tales-card-dot');
    if (index === currentCardIndex) {
      dot.classList.add('active');
    }
    dot.addEventListener('click', () => {
      cardsContainer.scrollTo({
        left: card.offsetLeft,
        behavior: 'smooth',
      });
    });
    dotsContainer.append(dot);
  });

  block.innerHTML = '';
  block.append(cardsContainer);
  block.append(dotsContainer);

  // --- Scroll & Active State Management ---
  const updateDots = () => {
    const scrollPosition = cardsContainer.scrollLeft + (cardsContainer.offsetWidth / 2);
    const cards = cardsContainer.querySelectorAll('.tales-card-item');
    let newIndex = 0;

    cards.forEach((card, i) => {
      if (card.offsetLeft <= scrollPosition && (card.offsetLeft + card.offsetWidth) > scrollPosition) {
        newIndex = i;
      }
    });

    if (newIndex !== currentCardIndex) {
      const currentDot = dotsContainer.querySelector('.tales-card-dot.active');
      if (currentDot) currentDot.classList.remove('active');
      
      const newDot = dotsContainer.children[newIndex];
      if (newDot) newDot.classList.add('active');
      
      currentCardIndex = newIndex;
    }
  };

  cardsContainer.addEventListener('scroll', () => {
    clearTimeout(cardsContainer.scrollTimeout);
    cardsContainer.scrollTimeout = setTimeout(updateDots, 50);
  });
}