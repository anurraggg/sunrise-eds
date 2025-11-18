export default function decorate(block) {
    const rows = [...block.children];
    if (rows.length < 2) return;
  
    // Row 1 contains text cells
    const cells = [...rows[1].children].map((c) => c.textContent.trim());
  
    const kicker = cells[0] || "";
    const title = cells[1] || "";
    const ctaText = cells[2] || "";
    const ctaLink = cells[3] || "#";
  
    // Build banner HTML
    const wrapper = document.createElement("div");
    wrapper.className = "recipe-banner-inner";
  
    wrapper.innerHTML = `
      <div class="recipe-banner-content">
        <p class="banner-kicker">${kicker}</p>
        <h2 class="banner-title">${title}</h2>
        <a class="banner-cta" href="${ctaLink}">${ctaText}</a>
      </div>
    `;
  
    // Clear block & insert new markup
    block.innerHTML = "";
    block.append(wrapper);
  }
  