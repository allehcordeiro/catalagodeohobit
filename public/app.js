const CONFIG = Object.assign(
  { instagram: "@mesao_do_amor", whatsappNumber: "" },
  window.MESAO_CONFIG || {}
);

const PRODUCTS = [
  {
    id: "collector",
    code: "HOB-COLLECTOR",
    name: "Caixa de Collector",
    subtitle: "Tesouro da Montanha",
    description: "Para quem quer colecionar o melhor da coleção com uma experiência mais especial.",
    price: 3100,
    stock: 3,
    image: "collector.webp"
  },
  {
    id: "booster",
    code: "HOB-BOOSTER",
    name: "Caixa de Booster",
    subtitle: "Aventura Completa",
    description: "Ideal para quem quer abrir muitos boosters e mergulhar de vez na coleção.",
    price: 1230,
    stock: 4,
    image: "booster.webp"
  },
  {
    id: "bundle",
    code: "HOB-BUNDLE",
    name: "Bundle",
    subtitle: "Queridinho do Mesão",
    description: "Uma opção querida para curtir a coleção de forma prática, bonita e especial.",
    price: 430,
    stock: 6,
    image: "bundle.webp"
  },
  {
    id: "kit-pre",
    code: "HOB-KIT-PRE",
    name: "Kit de Pré",
    subtitle: "Porta da Aventura",
    description: "Perfeito para entrar no clima do lançamento e viver a experiência da coleção.",
    price: 250,
    stock: 8,
    image: "kit-pre.webp"
  }
];

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const $ = (selector) => document.querySelector(selector);

const elements = {
  productGrid: $("#product-grid"),
  cartCount: $("#cart-count"),
  openCart: $("#open-cart"),
  closeCart: $("#close-cart"),
  cartDrawer: $("#cart-drawer"),
  drawerBackdrop: $("#drawer-backdrop"),
  emptyCart: $("#empty-cart"),
  cartItems: $("#cart-items"),
  cartItemsTotal: $("#cart-items-total"),
  cartTotal: $("#cart-total"),
  clearCart: $("#clear-cart"),
  goCheckout: $("#go-checkout"),
  checkoutModal: $("#checkout-modal"),
  modalBackdrop: $("#modal-backdrop"),
  closeCheckout: $("#close-checkout"),
  checkoutForm: $("#checkout-form"),
  checkoutItems: $("#checkout-items"),
  checkoutTotal: $("#checkout-total"),
  formError: $("#form-error"),
  submitOrder: $("#submit-order"),
  toast: $("#toast"),
  socialLabel: $("#social-label")
};

let cart = loadCart();
let lastFocusedElement = null;
let toastTimer = null;

elements.socialLabel.textContent = CONFIG.instagram;

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem("mesao-hobbit-cart") || "{}");
    return typeof saved === "object" && saved ? saved : {};
  } catch {
    return {};
  }
}

function saveCart() {
  localStorage.setItem("mesao-hobbit-cart", JSON.stringify(cart));
}

function productById(id) {
  return PRODUCTS.find((product) => product.id === id);
}

function cartLines() {
  return Object.entries(cart)
    .map(([id, quantity]) => ({ product: productById(id), quantity: Number(quantity) }))
    .filter((line) => line.product && line.quantity > 0);
}

function cartTotals() {
  return cartLines().reduce(
    (acc, line) => {
      acc.quantity += line.quantity;
      acc.total += line.product.price * line.quantity;
      return acc;
    },
    { quantity: 0, total: 0 }
  );
}

function renderProducts() {
  elements.productGrid.innerHTML = PRODUCTS.map((product) => `
    <article class="product-card" id="produto-${product.id}">
      <div class="product-image-wrap">
        <img class="product-image" src="${product.image}" alt="${product.name}" width="500" height="360" loading="lazy" />
      </div>
      <div class="product-info">
        <p class="product-kicker">${product.subtitle}</p>
        <h3 class="product-title">${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-footer">
          <strong class="product-price">${money.format(product.price)}</strong>
          <span class="stock-text">${String(product.stock).padStart(2, "0")} unidades disponíveis</span>
          <button class="add-button" type="button" data-add="${product.id}">Adicionar ao carrinho</button>
        </div>
      </div>
    </article>
  `).join("");
}

function renderCart() {
  const lines = cartLines();
  const totals = cartTotals();

  elements.cartCount.textContent = String(totals.quantity);
  elements.cartItemsTotal.textContent = String(totals.quantity);
  elements.cartTotal.textContent = money.format(totals.total);
  elements.goCheckout.disabled = lines.length === 0;
  elements.emptyCart.hidden = lines.length > 0;
  elements.cartItems.hidden = lines.length === 0;

  elements.cartItems.innerHTML = lines.map(({ product, quantity }) => `
    <article class="cart-item">
      <img class="cart-thumb" src="${product.image}" alt="" width="72" height="72" />
      <div>
        <h3>${product.name}</h3>
        <p class="cart-item-price">${money.format(product.price * quantity)}</p>
        <div class="qty-controls" aria-label="Quantidade de ${product.name}">
          <button type="button" data-decrease="${product.id}" aria-label="Diminuir quantidade">−</button>
          <span>${quantity}</span>
          <button type="button" data-increase="${product.id}" aria-label="Aumentar quantidade" ${quantity >= product.stock ? "disabled" : ""}>+</button>
        </div>
      </div>
      <button class="remove-item" type="button" data-remove="${product.id}">Remover</button>
    </article>
  `).join("");

  elements.checkoutItems.innerHTML = lines.map(({ product, quantity }) => `
    <div class="checkout-review-item">
      <span>${quantity}× ${product.name}</span>
      <strong>${money.format(product.price * quantity)}</strong>
    </div>
  `).join("");
  elements.checkoutTotal.textContent = money.format(totals.total);
}

function setQuantity(id, quantity) {
  const product = productById(id);
  if (!product) return;

  const safeQuantity = Math.max(0, Math.min(product.stock, Number(quantity) || 0));
  if (safeQuantity === 0) delete cart[id];
  else cart[id] = safeQuantity;

  saveCart();
  renderCart();
}

function addToCart(id, openAfter = false) {
  const product = productById(id);
  if (!product) return;

  const current = Number(cart[id] || 0);
  if (current >= product.stock) {
    showToast("Você já adicionou todo o estoque disponível deste produto.");
    return;
  }

  setQuantity(id, current + 1);
  showToast(`${product.name} adicionado ao carrinho.`);
  if (openAfter) openDrawer();
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  toastTimer = setTimeout(() => {
    elements.toast.hidden = true;
  }, 3000);
}

function lockPage() {
  document.body.classList.add("no-scroll");
}

function unlockPage() {
  if (elements.cartDrawer.hidden && elements.checkoutModal.hidden) {
    document.body.classList.remove("no-scroll");
  }
}

function openDrawer() {
  lastFocusedElement = document.activeElement;
  elements.drawerBackdrop.hidden = false;
  elements.cartDrawer.hidden = false;
  lockPage();
  setTimeout(() => elements.closeCart.focus(), 0);
}

function closeDrawer() {
  elements.drawerBackdrop.hidden = true;
  elements.cartDrawer.hidden = true;
  unlockPage();
  if (lastFocusedElement) lastFocusedElement.focus();
}

function openCheckout() {
  if (!cartLines().length) return;

  closeDrawer();
  elements.formError.hidden = true;
  elements.modalBackdrop.hidden = false;
  elements.checkoutModal.hidden = false;
  lockPage();
  setTimeout(() => $("#customer-name").focus(), 0);
}

function closeCheckout() {
  elements.modalBackdrop.hidden = true;
  elements.checkoutModal.hidden = true;
  unlockPage();
}

function normalizeWhatsapp(value) {
  return String(value || "").replace(/\D/g, "");
}

function buildOrderData() {
  const totals = cartTotals();
  return {
    customerName: $("#customer-name").value.trim(),
    pickup: $("#customer-pickup").value,
    notes: $("#customer-notes").value.trim(),
    lines: cartLines(),
    totalQuantity: totals.quantity,
    total: totals.total
  };
}

function validateOrder(order) {
  if (order.customerName.length < 2) return "Informe seu nome.";
  if (!order.lines.length) return "Seu carrinho está vazio.";

  const destination = normalizeWhatsapp(CONFIG.whatsappNumber);
  if (destination.length < 12) {
    return "O WhatsApp do Mesão ainda não foi configurado. Preencha o número no arquivo config.js.";
  }

  return "";
}

function buildWhatsappMessage(order) {
  const itemLines = order.lines.flatMap(({ product, quantity }) => {
    const subtotal = product.price * quantity;
    return [
      `• *${quantity}x ${product.name}*`,
      `  ${money.format(product.price)} cada — subtotal ${money.format(subtotal)}`
    ];
  });

  const messageLines = [
    "Olá! Quero fechar um pedido do *Catálogo Hobbit — Mesão do Amor*. 💚",
    "",
    "🛒 *Itens selecionados:*",
    ...itemLines,
    "",
    `📦 *Quantidade total:* ${order.totalQuantity}`,
    `💰 *Total do pedido:* ${money.format(order.total)}`,
    "",
    `👤 *Nome:* ${order.customerName}`,
    `📍 *Retirada:* ${order.pickup}`
  ];

  if (order.notes) {
    messageLines.push(`📝 *Observações:* ${order.notes}`);
  }

  messageLines.push(
    "",
    "Aguardo a confirmação de disponibilidade, pagamento e retirada."
  );

  return messageLines.join("\n");
}

function buildWhatsappLink(order) {
  const destination = normalizeWhatsapp(CONFIG.whatsappNumber);
  const message = buildWhatsappMessage(order);
  return `https://wa.me/${destination}?text=${encodeURIComponent(message)}`;
}

function openWhatsapp(url) {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function handleSubmit(event) {
  event.preventDefault();

  const order = buildOrderData();
  const validationError = validateOrder(order);
  if (validationError) {
    elements.formError.textContent = validationError;
    elements.formError.hidden = false;
    return;
  }

  elements.formError.hidden = true;
  openWhatsapp(buildWhatsappLink(order));
  showToast("WhatsApp aberto com o pedido pronto para enviar.");
}

function handleProductLink() {
  const params = new URLSearchParams(location.search);
  const id = params.get("produto") || params.get("add");
  if (!id || !productById(id)) return;

  const token = `${location.pathname}:${id}`;
  if (sessionStorage.getItem("mesao-link-added") !== token) {
    addToCart(id, true);
    sessionStorage.setItem("mesao-link-added", token);
  }

  const card = document.querySelector(`#produto-${CSS.escape(id)}`);
  if (card) {
    setTimeout(() => card.scrollIntoView({ behavior: "smooth", block: "center" }), 260);
  }
}

renderProducts();
renderCart();
handleProductLink();

document.addEventListener("click", (event) => {
  const add = event.target.closest("[data-add]");
  const increase = event.target.closest("[data-increase]");
  const decrease = event.target.closest("[data-decrease]");
  const remove = event.target.closest("[data-remove]");

  if (add) { addToCart(add.dataset.add); return; }
  if (increase) { setQuantity(increase.dataset.increase, Number(cart[increase.dataset.increase] || 0) + 1); return; }
  if (decrease) { setQuantity(decrease.dataset.decrease, Number(cart[decrease.dataset.decrease] || 0) - 1); return; }
  if (remove) setQuantity(remove.dataset.remove, 0);
});

elements.openCart.addEventListener("click", openDrawer);
elements.closeCart.addEventListener("click", closeDrawer);
elements.drawerBackdrop.addEventListener("click", closeDrawer);
elements.clearCart.addEventListener("click", () => {
  cart = {};
  saveCart();
  renderCart();
  showToast("Carrinho limpo.");
});
elements.goCheckout.addEventListener("click", openCheckout);
elements.closeCheckout.addEventListener("click", closeCheckout);
elements.modalBackdrop.addEventListener("click", closeCheckout);
elements.checkoutForm.addEventListener("submit", handleSubmit);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!elements.checkoutModal.hidden) closeCheckout();
  else if (!elements.cartDrawer.hidden) closeDrawer();
});
