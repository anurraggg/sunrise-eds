export default function decorate(block) {
    const rows = [...block.children];
  
    // Expecting:
    // Row 0: block name
    // Row 1: kicker | title | cta text | cta link
    if (rows.length < 2) return;
  
    const cells = [...rows[1].children].map((c) => c.textContent.trim());
  
    const kicker = cells[0] || '';
    const title = cells[1] || '';
    const ctaText = cells[2] || '';
    const ctaLink = cells[3] || '#';
  
    const wrapper = document.createElement('div');
    wrapper.className = 'recipe-banner-wrapper';
  
    wrapper.innerHTML = `
      <div class="recipe-banner-content">
        ${kicker ? `<p class="banner-kicker">${kicker}</p>` : ''}
        ${title ? `<h2 class="banner-title">${title.replace(/\n/g, '<br>')}</h2>` : ''}
        ${ctaText ? `<a href="${ctaLink}" class="banner-cta">${ctaText}</a>` : ''}
      </div>
    `;
  
    block.innerHTML = '';
    block.append(wrapper);
  }
  