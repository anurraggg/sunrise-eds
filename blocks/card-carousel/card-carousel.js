export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  // ---- Extract header row ----
  const headerRow = rows.shift();
  const title = headerRow.children?.[0]?.innerText?.trim() || "";
  const subtitle = headerRow.children?.[1]?.innerText?.trim() || "";

  // ---- Extract card rows ----
  const cards = rows.map((row) => {
    const imgEl = row.querySelector("img");
    const img = imgEl ? imgEl.src : "";
    const title = row.children[1]?.innerText?.trim() || "";
    const desc = row.children[2]?.innerText?.trim() || "";
    const cta = row.children[3]?.innerText?.trim() || "Learn More →";
    const link = row.children[4]?.innerText?.trim() || "#";

    return { img, title, desc, cta, link };
  });

  block.innerHTML = "";
  block.classList.add("spice-carousel");

  // ---- Header ----
  const header = document.createElement("div");
  header.className = "sc__header";

  if (title) {
    const h2 = document.createElement("h2");
    h2.textContent = title;
    header.appendChild(h2);
  }
  if (subtitle) {
    const p = document.createElement("p");
    p.textContent = subtitle;
    header.appendChild(p);
  }

  block.appendChild(header);

  // ---- Wrapper + Track ----
  const wrapper = document.createElement("div");
  wrapper.className = "sc__wrapper";

  const track = document.createElement("div");
  track.className = "sc__track";

  // ---- Build slides ----
  cards.forEach((card, index) => {
    const slide = document.createElement("div");
    slide.className = "sc__slide";
    slide.dataset.index = index;

    slide.innerHTML = `
      <div class="sc__card">
        <div class="sc__img-wrap">
          <img src="${card.img}" loading="lazy" alt="${card.title}">
        </div>
        <h3>${card.title}</h3>
        <p>${card.desc}</p>
        <a class="sc__btn" href="${card.link}">${card.cta}</a>
      </div>
    `;

    track.appendChild(slide);
  });

  // ---- Infinite Clone (one on each side) ----
  const firstClone = track.children[0].cloneNode(true);
  firstClone.classList.add("clone");
  const lastClone = track.children[cards.length - 1].cloneNode(true);
  lastClone.classList.add("clone");

  track.insertBefore(lastClone, track.firstChild);
  track.appendChild(firstClone);

  wrapper.appendChild(track);
  block.appendChild(wrapper);

  // ---- Navigation ----
  const prev = document.createElement("button");
  prev.className = "sc__nav sc__prev";
  prev.innerHTML = "&#10094;";

  const next = document.createElement("button");
  next.className = "sc__nav sc__next";
  next.innerHTML = "&#10095;";

  block.append(prev, next);

  // ---- Dots ----
  const dotsContainer = document.createElement("div");
  dotsContainer.className = "sc__dots";

  cards.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "sc__dot";
    dot.dataset.index = i;
    dotsContainer.appendChild(dot);
  });

  block.appendChild(dotsContainer);

  // ---- Logic ----
  let index = 1;
  const slideCount = cards.length;
  let slideWidth = 0;

  function updateWidth() {
    slideWidth = wrapper.clientWidth;
    track.style.transform = `translateX(${-slideWidth * index}px)`;
  }

  updateWidth();
  window.addEventListener("resize", updateWidth);

  function updateDots() {
    [...dotsContainer.children].forEach((dot) => {
      dot.classList.toggle("active", Number(dot.dataset.index) === index - 1);
    });
  }

  updateDots();

  function moveTo(newIndex) {
    index = newIndex;
    track.style.transition = "transform 0.4s ease";
    track.style.transform = `translateX(${-slideWidth * index}px)`;
    updateDots();
  }

  next.addEventListener("click", () => {
    if (index >= slideCount) return moveTo(index + 1);
    moveTo(index + 1);
  });

  prev.addEventListener("click", () => {
    if (index <= 0) return moveTo(index - 1);
    moveTo(index - 1);
  });

  track.addEventListener("transitionend", () => {
    if (track.children[index].classList.contains("clone")) {
      track.style.transition = "none";

      if (index === 0) index = slideCount;
      else index = 1;

      track.style.transform = `translateX(${-slideWidth * index}px)`;
    }
  });

  dotsContainer.querySelectorAll("button").forEach((dot) => {
    dot.addEventListener("click", () => {
      moveTo(Number(dot.dataset.index) + 1);
    });
  });
}
