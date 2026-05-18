const DATA_URL = "data/smykker.json";
const MAIL = "byviggashop@gmail.com";

const grid = document.querySelector("#design-grid");
const preview = document.querySelector("#order-preview");
const filterButtons = document.querySelectorAll(".filter-button");
const sortSelect = document.querySelector("#sort-select");

let designs = [];
let activeFilter = "Alle";
let selectedDesign = null;

function imageMarkup(item, className = "") {
  const fallback = item.fallback || item.billede;
  return `<img class="${className}" src="${item.billede}" onerror="this.onerror=null;this.src='${fallback}';" alt="${item.navn} fra By Vigga">`;
}

function formatPrice(price) {
  return `fra ${price} kr. + fragt`;
}

function orderLink(item) {
  const subject = encodeURIComponent(`Bestilling hos By Vigga - ${item.navn}`);
  const body = encodeURIComponent(`Hej By Vigga\n\nSmykke/design: ${item.navn}\nKategori: ${item.kategori}\nØnsket farve:\n\nSend mål:\nArmbånd: mål omkring håndleddet\nRing: ringstørrelse eller mål omkring fingeren\nHalskæde: ønsket længde\nØreringe: eventuelle ønsker til farve og stil\n\nKontakt info:\nNavn:\nAdresse:\nPost nr:\nMobil nummer / MobilePay:\n\nØnsker du indpakning til gave - koster 10 kr.\nSvar:\n\nKærlige hilsner\nBy Vigga`);
  return `mailto:${MAIL}?subject=${subject}&body=${body}`;
}

function getVisibleDesigns() {
  const filtered = activeFilter === "Alle" ? [...designs] : designs.filter((item) => item.kategori === activeFilter);
  const sort = sortSelect.value;
  return filtered.sort((a, b) => {
    if (sort === "navn") return a.navn.localeCompare(b.navn, "da");
    if (sort === "pris-lav") return a.pris - b.pris;
    if (sort === "pris-hoej") return b.pris - a.pris;
    return new Date(b.dato) - new Date(a.dato);
  });
}

function renderGrid() {
  const visible = getVisibleDesigns();
  if (!visible.length) {
    grid.innerHTML = `<p class="empty-state">Der er ikke tilføjet smykker i denne kategori endnu.</p>`;
    return;
  }

  if (!selectedDesign || !visible.some((item) => item.id === selectedDesign.id)) {
    selectedDesign = visible[0];
  }

  grid.innerHTML = visible.map((item) => `
    <article class="design-card ${item.id === selectedDesign.id ? "is-selected" : ""}" data-id="${item.id}" tabindex="0" aria-label="Vælg ${item.navn}">
      ${imageMarkup(item)}
      <h3>${item.navn}</h3>
      <p>${item.kategori}</p>
      <strong>${formatPrice(item.pris)}</strong>
      <button class="button button-card" type="button">Bestil</button>
    </article>
  `).join("");

  grid.querySelectorAll(".design-card").forEach((card) => {
    const choose = () => selectDesign(card.dataset.id);
    card.addEventListener("click", choose);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        choose();
      }
    });
  });
}

function renderPreview() {
  if (!selectedDesign) return;
  preview.innerHTML = `
    <h2>Bestil dette ${selectedDesign.kategori.toLowerCase()}</h2>
    ${imageMarkup(selectedDesign, "preview-image")}
    <div class="preview-title">
      <h3>${selectedDesign.navn}</h3>
      <p>${selectedDesign.kategori}</p>
      <p>Pris ${formatPrice(selectedDesign.pris)}</p>
    </div>
    <div class="preview-list">
      <span><b>✧</b> ${selectedDesign.maal}</span>
      <span><b>✧</b> Betal via MobilePay efter aftale.</span>
      <span><b>✧</b> Håndlavet på bestilling specielt til dig.</span>
    </div>
    <p class="preview-note">${selectedDesign.beskrivelse}</p>
    <a class="button button-primary preview-mail" href="${orderLink(selectedDesign)}">Bestil med mail</a>
  `;
}

function selectDesign(id) {
  selectedDesign = designs.find((item) => item.id === id) || selectedDesign;
  renderGrid();
  renderPreview();
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderGrid();
    renderPreview();
  });
});

sortSelect.addEventListener("change", () => {
  renderGrid();
  renderPreview();
});

fetch(DATA_URL)
  .then((response) => {
    if (!response.ok) throw new Error("Kunne ikke hente smykkedata");
    return response.json();
  })
  .then((items) => {
    designs = items;
    selectedDesign = designs[0];
    renderGrid();
    renderPreview();
  })
  .catch(() => {
    grid.innerHTML = `<p class="empty-state">Smykkerne kunne ikke indlæses lige nu.</p>`;
  });
