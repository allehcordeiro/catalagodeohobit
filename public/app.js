"use strict";

const config = Object.freeze({
  whatsappNumber: "",
  instagram: "@mesao_do_amor",
  catalogName: "Catálogo Hobbit — Mesão do Amor",
  ...(window.MESAO_CONFIG || {})
});

const products = Object.freeze([
  Object.freeze({ id: "collector", code: "HOB-COLLECTOR", name: "Caixa de Collector", subtitle: "Tesouro da Montanha", description: "Para quem quer colecionar o melhor da coleção com uma experiência mais especial.", price: 3100, stock: 3, image: "assets/collector.webp" }),
  Object.freeze({ id: "booster", code: "HOB-BOOSTER", name: "Caixa de Booster", subtitle: "Aventura Completa", description: "Ideal para quem quer abrir muitos boosters e mergulhar de vez na coleção.", price: 1230, stock: 4, image: "assets/booster.webp" }),
  Object.freeze({ id: "bundle", code: "HOB-BUNDLE", name: "Bundle", subtitle: "Queridinho do Mesão", description: "Uma opção querida para curtir a coleção de forma prática, bonita e especial.", price: 430, stock: 6, image: "assets/bundle.webp" }),
  Object.freeze({ id: "kit-pre", code: "HOB-KIT-PRE", name: "Kit de Pré", subtitle: "Porta da Aventura", description: "Perfeito para entrar no clima do lançamento e viver a experiência da coleção.", price: 250, stock: 8, image: "assets/kit-pre.webp" })
]);

const STORAGE_KEY = "mesao-hobbit-cart-v3";
const state = { cart: loadCart() };

const elements = {
  productGrid: document.querySelector("#product-grid"),
  openCart: document.querySelector("#open-cart"),
  heroCart: document.querySelector("#hero-cart"),
  closeCart: document.querySelector("#close-cart"),
  drawer: document.querySelector("#cart-drawer"),
  backdrop: document.querySelector("#backdrop"),
  cartCount: document.querySelector("#cart-count"),
  cartItems: document.querySelector("#cart-items"),
  cartTotal: document.querySelector("#cart-total"),
  clearCart: document.querySelector("#clear-cart"),
  startCheckout: document.querySelector("#start-checkout"),
  checkoutDialog: document.querySelector("#checkout-dialog"),
  checkoutForm: document.querySelector("#checkout-form"),
  closeCheckout: document.querySelector("#close-checkout"),
  checkoutTotal: document.querySelector("#checkout-total"),
  customerName: document.querySelector("#customer-name"),
  pickupMethod: document.querySelector("#pickup-method"),
  customerNotes: document.querySelector("#customer-notes"),
  formError: document.querySelector("#form-error"),
  toast: document.querySelector("#toast"),
  instagramLabel: document.querySelector("#instagram-label")
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function loadCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return sanitizeCart(parsed);
  } catch {
    return {};
  }
}

function sanitizeCart(value) {
  const clean = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return clean;
  for (const product of products) {
    const quantity = Number.parseInt(value[product.id], 10);
    if (Number.isFinite(quantity) && quantity > 0) clean[product.id] = Math.min(quantity, product.stock);
  }
  return clean;
}

function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart));
}

function getProduct(id) {
  return products.find((product) => product.id === id);
}

function getCartLines() {
  return products
    .filter((product) => state.cart[product.id] > 0)
    .map((product) => ({ ...product, quantity: state.cart[product.id], subtotal: state.cart[product.id] * product.price }));
}

function getCartTotals() {
  return getCartLines().reduce((totals, line) => ({ quantity: totals.quantity + line.quantity, amount: totals.amount + line.subtotal }), { quantity: 0, amount: 0 });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function renderProducts() {
  elements.productGrid.innerHTML = products.map((product) => `
    <article class="product-card" id="produto-${product.id}">
      <div class="product-card__visual"><img src="${product.image}" alt="${escapeHtml(product.name)}" width="360" height="340" loading="lazy"></div>
      <div class="product-card__content">
        <p class="product-kicker">Hobbit • ${escapeHtml(product.code)}</p>
        <h3>${escapeHtml(product.name)}</h3>
        <p class="product-subtitle">${escapeHtml(product.subtitle)}</p>
        <p class="product-description">${escapeHtml(product.description)}</p>
        <div class="product-meta">
          <div><strong class="product-price">${money.format(product.price)}</strong><span class="product-stock">${String(product.stock).padStart(2, "0")} unidades disponíveis</span></div>
          <button class="button button--primary add-button" type="button" data-add="${product.id}">Adicionar ao carrinho</button>
        </div>
      </div>
    </article>
  `).join("");
}

function renderCart() {
  const lines = getCartLines();
  const totals = getCartTotals();
  elements.cartCount.textContent = String(totals.quantity);
  elements.cartTotal.textContent = money.format(totals.amount);
  elements.checkoutTotal.textContent = money.format(totals.amount);
  elements.startCheckout.disabled = lines.length === 0;
  elements.clearCart.disabled = lines.length === 0;

  if (lines.length === 0) {
    elements.cartItems.innerHTML = '<div class="empty-cart"><div><span aria-hidden="true">🧺</span><strong>Seu carrinho está vazio.</strong><p>Escolha um produto para começar a aventura.</p></div></div>';
    return;
  }

  elements.cartItems.innerHTML = lines.map((line) => `
    <article class="cart-item">
      <img src="${line.image}" alt="" width="78" height="78">
      <div>
        <h3>${escapeHtml(line.name)}</h3>
        <p class="cart-item__price">${money.format(line.price)} cada • ${money.format(line.subtotal)}</p>
        <div class="quantity" aria-label="Quantidade de ${escapeHtml(line.name)}">
          <button type="button" data-decrease="${line.id}" aria-label="Diminuir quantidade">−</button>
          <span>${line.quantity}</span>
          <button type="button" data-increase="${line.id}" aria-label="Aumentar quantidade" ${line.quantity >= line.stock ? "disabled" : ""}>+</button>
        </div>
      </div>
      <button class="remove-item" type="button" data-remove="${line.id}" aria-label="Remover ${escapeHtml(line.name)}">×</button>
    </article>
  `).join("");
}

function commitCart() {
  state.cart = sanitizeCart(state.cart);
  saveCart();
  renderCart();
}

function addToCart(id, showConfirmation = true) {
  const product = getProduct(id);
  if (!product) return;
  const current = state.cart[id] || 0;
  if (current >= product.stock) {
    showToast(`O limite disponível de ${product.name} já está no carrinho.`);
    return;
  }
  state.cart[id] = current + 1;
  commitCart();
  if (showConfirmation) showToast(`${product.name} adicionado ao carrinho.`);
}

function changeQuantity(id, delta) {
  const product = getProduct(id);
  if (!product) return;
  const next = (state.cart[id] || 0) + delta;
  if (next <= 0) delete state.cart[id];
  else state.cart[id] = Math.min(next, product.stock);
  commitCart();
}

function clearCart() {
  state.cart = {};
  commitCart();
}

function openCart() {
  elements.drawer.classList.add("is-open");
  elements.drawer.setAttribute("aria-hidden", "false");
  elements.openCart.setAttribute("aria-expanded", "true");
  elements.backdrop.hidden = false;
  document.body.classList.add("no-scroll");
  window.setTimeout(() => elements.closeCart.focus(), 0);
}

function closeCart() {
  elements.drawer.classList.remove("is-open");
  elements.drawer.setAttribute("aria-hidden", "true");
  elements.openCart.setAttribute("aria-expanded", "false");
  elements.backdrop.hidden = true;
  document.body.classList.remove("no-scroll");
}

function openCheckout() {
  if (getCartLines().length === 0) return;
  closeCart();
  elements.formError.hidden = true;
  elements.checkoutDialog.showModal();
  window.setTimeout(() => elements.customerName.focus(), 0);
}

function closeCheckout() {
  elements.checkoutDialog.close();
}

function createWhatsAppMessage({ customerName, pickupMethod, customerNotes }) {
  const lines = getCartLines();
  const totals = getCartTotals();
  const itemText = lines.map((line) => `• ${line.quantity}x ${line.name}\n  ${money.format(line.price)} cada — subtotal ${money.format(line.subtotal)}`).join("\n\n");
  const notes = customerNotes.trim() ? `\n📝 Observações: ${customerNotes.trim()}` : "";
  return [
    `Olá! Quero fechar um pedido do ${config.catalogName}. 💚`,
    "",
    "🛒 *Itens selecionados:*",
    "",
    itemText,
    "",
    `📦 Quantidade total: ${totals.quantity}`,
    `💰 *Total estimado: ${money.format(totals.amount)}*`,
    "",
    `👤 Nome: ${customerName.trim()}`,
    `📍 Retirada: ${pickupMethod}${notes}`,
    "",
    "Aguardo a confirmação de disponibilidade, pagamento e retirada."
  ].join("\n");
}

function submitCheckout(event) {
  event.preventDefault();
  elements.formError.hidden = true;

  const number = String(config.whatsappNumber || "").replace(/\D/g, "");
  if (!/^\d{12,15}$/.test(number)) {
    elements.formError.textContent = "O número do WhatsApp não está configurado corretamente em config.js.";
    elements.formError.hidden = false;
    return;
  }
  if (!elements.checkoutForm.reportValidity()) return;
  if (getCartLines().length === 0) {
    elements.formError.textContent = "O carrinho está vazio. Adicione ao menos um produto.";
    elements.formError.hidden = false;
    return;
  }

  const message = createWhatsAppMessage({
    customerName: elements.customerName.value,
    pickupMethod: elements.pickupMethod.value,
    customerNotes: elements.customerNotes.value
  });
  const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  const newWindow = window.open(url, "_blank", "noopener,noreferrer");
  if (!newWindow) window.location.href = url;
}

let toastTimer;
function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  toastTimer = window.setTimeout(() => { elements.toast.hidden = true; }, 2400);
}

function handleDirectProductLink() {
  const url = new URL(window.location.href);
  const productId = url.searchParams.get("produto");
  if (!productId || !getProduct(productId)) return;
  addToCart(productId, false);
  url.searchParams.delete("produto");
  history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  openCart();
}

function bindEvents() {
  elements.productGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add]");
    if (button) addToCart(button.dataset.add);
  });
  elements.cartItems.addEventListener("click", (event) => {
    const decrease = event.target.closest("[data-decrease]");
    const increase = event.target.closest("[data-increase]");
    const remove = event.target.closest("[data-remove]");
    if (decrease) changeQuantity(decrease.dataset.decrease, -1);
    if (increase) changeQuantity(increase.dataset.increase, 1);
    if (remove) changeQuantity(remove.dataset.remove, -(state.cart[remove.dataset.remove] || 0));
  });
  elements.openCart.addEventListener("click", openCart);
  elements.heroCart.addEventListener("click", openCart);
  elements.closeCart.addEventListener("click", closeCart);
  elements.backdrop.addEventListener("click", closeCart);
  elements.clearCart.addEventListener("click", clearCart);
  elements.startCheckout.addEventListener("click", openCheckout);
  elements.closeCheckout.addEventListener("click", closeCheckout);
  elements.checkoutForm.addEventListener("submit", submitCheckout);
  elements.checkoutDialog.addEventListener("click", (event) => {
    if (event.target === elements.checkoutDialog) closeCheckout();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && elements.drawer.classList.contains("is-open")) closeCart();
  });
}

function init() {
  elements.instagramLabel.textContent = config.instagram;
  renderProducts();
  renderCart();
  bindEvents();
  handleDirectProductLink();
}

init();
