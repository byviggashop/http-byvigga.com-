const modal = document.querySelector("#order-modal");
const modalPanel = modal.querySelector(".modal-panel");
const modalProductText = document.querySelector("#modal-product-text");
const orderButtons = document.querySelectorAll(".order-button");
const closeButtons = document.querySelectorAll("[data-close-modal]");
let lastFocusedElement = null;

function openModal(product) {
  lastFocusedElement = document.activeElement;
  modalProductText.textContent = product
    ? `Du er ved at bestille: ${product}. Skriv gerne hvilken kategori du er interesseret i, og hvilke ønsker du har.`
    : "Skriv gerne hvilken kategori du er interesseret i.";
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
