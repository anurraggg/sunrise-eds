export default function decorate(block) {
    const rows = [...block.children];
  
    if (!rows.length) return;
  
    // Extract the first row’s cells
    const cells = [...rows[0].children].map((c) => c.textContent.trim());
  
    const kicker = cells[0] || "";
    const title = cells[1] || "";
    const ctaText = cells[2] || "";
    const ctaLink = cells[3] || "#";
  
    // Build clean HTML
    const inner = document.createElement("div");
    inner.className = "recipe-banner-inner";
  
    inner.innerHTML = `
      <div class="recipe-banner-content">
        <p class="banner-kicker">${kicker}</p>
        <h2 class="banner-title">${title}</h2>
        <a class="banner-cta" href="${ctaLink}">${ctaText}</a>
      </div>
    `;
  
    // Replace table with new structure
    block.innerHTML = "";
    block.append(inner);
  }
  