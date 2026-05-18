const modal = document.querySelector("#order-modal");
const modalPanel = modal.querySelector(".modal-panel");
const modalProductText = document.querySelector("#modal-product-text");
const modalMail = document.querySelector(".modal-mail");
const orderButtons = document.querySelectorAll(".order-button");
const closeButtons = document.querySelectorAll("[data-close-modal]");
let lastFocusedElement = null;

function buildOrderMail(product = "") {
  const category = product || "";
  const subject = encodeURIComponent(`Bestilling hos By Vigga${category ? ` - ${category}` : ""}`);
  const body = encodeURIComponent(`Hej By Vigga\n\nKategori: ${category}\nØnsket farve:\n\nSend mål:\nArmbånd: mål omkring håndleddet\nRing: ringstørrelse eller mål omkring fingeren\nHalskæde: ønsket længde\nØreringe: eventuelle ønsker til farve og stil\n\nKontakt info:\nNavn:\nAdresse:\nPost nr:\nMobil nummer / MobilePay:\n\nØnsker du indpakning til gave - koster 10 kr.\nSvar:\n\nKærlige hilsner\nBy Vigga`);
  return `mailto:byviggashop@gmail.com?subject=${subject}&body=${body}`;
}

function openModal(product) {
  lastFocusedElement = document.activeElement;
  modalProductText.textContent = product
    ? `Du er ved at bestille: ${product}. Skriv gerne hvilken kategori du er interesseret i, og hvilke ønsker du har.`
    : "Skriv gerne hvilken kategori du er interesseret i.";
  modalMail.href = buildOrderMail(product);
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  modalPanel.focus();
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");

  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
}

modalMail.href = buildOrderMail();

orderButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openModal(button.dataset.product);
  });
});

closeButtons.forEach((button) => {
  button.addEventListener("click", closeModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("is-open")) {
    closeModal();
  }
});
