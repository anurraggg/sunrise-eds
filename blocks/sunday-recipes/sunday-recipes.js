import { createOptimizedPicture } from '../../scripts/aem.js';

export default async function decorate(block) {
  // 1. Setup Container
  const cardsContainer = document.createElement('div');
  cardsContainer.classList.add('sunday-recipes-container');

  // 2. Process Rows
  [...block.children].forEach((row) => {
    const card = document.createElement('div');
    card.classList.add('sunday-recipes-card');

    // Extract columns based on the table model
    const [titleEl, imageEl, tagEl, diffEl, timeEl, linkEl] = row.children;

    // Extract Data
    const title = titleEl?.textContent.trim() || '';
    const picture = imageEl?.querySelector('picture');
    const tagText = tagEl?.textContent.trim() || '';
    const difficulty = diffEl?.textContent.trim() || '';
    const time = timeEl?.textContent.trim() || '';
    const linkUrl = linkEl?.querySelector('a')?.href || '#';

    // --- Card Image Area ---
    const imageWrapper = document.createElement('div');
    imageWrapper.classList.add('sunday-recipes-image');
    
    if (picture) {
      const img = picture.querySelector('img');
      // Optimize image (width 400 is good for grid cards)
      imageWrapper.append(createOptimizedPicture(img.src, title, false, [{ width: '400' }]));
    }

    // Tag Badge (e.g., Savoury)
    if (tagText) {
      const tag = document.createElement('span');
      tag.classList.add('sunday-recipes-tag');
      tag.textContent = tagText;
      imageWrapper.append(tag);
    }

    // Overlay Title
    const overlayTitle = document.createElement('div');
    overlayTitle.classList.add('sunday-recipes-overlay-title');
    overlayTitle.textContent = title;
    imageWrapper.append(overlayTitle);

    // --- Card Content Area ---
    const contentWrapper = document.createElement('div');
    contentWrapper.classList.add('sunday-recipes-content');

    // Title Link
    const h3 = document.createElement('h3');
    const link = document.createElement('a');
    link.href = linkUrl;
    link.textContent = title;
    h3.append(link);
    contentWrapper.append(h3);

    // Metadata (Difficulty & Time)
    const metaDiv = document.createElement('div');
    metaDiv.classList.add('sunday-recipes-meta');

    if (difficulty) {
      const diffSpan = document.createElement('span');
      // Using emojis as fallback icons, but you can use <span class="icon icon-chef"></span>
      diffSpan.innerHTML = `/icons/clock-svgrepo-com.png ${difficulty}`; 
      metaDiv.append(diffSpan);
    }

    if (time) {
      const timeSpan = document.createElement('span');
      timeSpan.innerHTML = `🕒 ${time}`;
      metaDiv.append(timeSpan);
    }

    contentWrapper.append(metaDiv);

    // Append parts to card
    card.append(imageWrapper, contentWrapper);
    cardsContainer.append(card);
  });

  // 3. "View All" Logic
  const allCards = cardsContainer.querySelectorAll('.sunday-recipes-card');
  const INITIAL_VISIBLE = 3; // Show 3 cards initially

  if (allCards.length > INITIAL_VISIBLE) {
    // Hide extra cards
    allCards.forEach((card, index) => {
      if (index >= INITIAL_VISIBLE) {
        card.style.display = 'none';
      }
    });

    // Create Toggle Button
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('sunday-recipes-actions');
    
    const viewAllBtn = document.createElement('button');
    viewAllBtn.classList.add('button', 'primary');
    viewAllBtn.textContent = 'View All';
    viewAllBtn.setAttribute('aria-expanded', 'false');

    viewAllBtn.addEventListener('click', () => {
      const isExpanded = viewAllBtn.getAttribute('aria-expanded') === 'true';
      
      if (isExpanded) {
        // Collapse
        allCards.forEach((card, index) => {
          if (index >= INITIAL_VISIBLE) card.style.display = 'none';
        });
        viewAllBtn.textContent = 'View All';
        viewAllBtn.setAttribute('aria-expanded', 'false');
        block.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Expand
        allCards.forEach((card) => {
          card.style.display = 'flex';
        });
        viewAllBtn.textContent = 'Show Less';
        viewAllBtn.setAttribute('aria-expanded', 'true');
      }
    });

    buttonContainer.append(viewAllBtn);
    
    block.innerHTML = '';
    block.append(cardsContainer);
    block.append(buttonContainer);
  } else {
    // Less than 3 cards? Just show them.
    block.innerHTML = '';
    block.append(cardsContainer);
  }
}