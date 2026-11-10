/* ==========================================================================
   BODEGA EL PANA — LÓGICA PRINCIPAL DE LA TIENDA (main.js)
   Conectado al backend en Python Django + PostgreSQL:
   - GET  /api/productos/ -> Obtiene el catálogo desde PostgreSQL (con respaldo local)
   - POST /api/pedidos/   -> Registra el pedido en PostgreSQL y redirige a WhatsApp
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. CONFIGURACIÓN DE LA TIENDA (Edita aquí los datos de tu negocio)
   -------------------------------------------------------------------------- */
const STORE = {
  name: "Bodega El Pana",
  tagline: "Tu bodega de confianza, ahora en línea.",
  address: "Av. Principal, Coro, Falcón",
  hours: "Lunes a sábado de 8:00 am a 8:00 pm",
  // Número de WhatsApp en formato internacional, solo dígitos (58 + número sin el 0)
  whatsapp: "584140000000",
  whatsappDisplay: "+58 414-0000000",
  pagoMovil: {
    banco: "Banco de Venezuela (0102)",
    telefono: "0414-0000000",
    documento: "V-00000000",
  },
};

/* --------------------------------------------------------------------------
   2. CATÁLOGO DE PRODUCTOS (Se actualiza desde PostgreSQL vía /api/productos/)
   -------------------------------------------------------------------------- */
const FALLBACK_PRODUCTS = [
  {
    id: "1",
    name: "Harina de maíz precocida 1kg",
    category: "Víveres",
    brand: "La Arepera",
    price_bs: 62.4,
    unit: "und",
    image: "assets/products/harina.jpg",
    is_new: true,
    created_at: "2026-11-08T10:00:00Z",
  },
  {
    id: "2",
    name: "Café molido tostado 500g",
    category: "Café",
    brand: "Montaña Andina",
    price_bs: 289.9,
    unit: "und",
    image: "assets/products/cafe.jpg",
    is_new: true,
    created_at: "2026-11-07T10:00:00Z",
  },
  {
    id: "3",
    name: "Queso blanco llanero",
    category: "Charcutería",
    brand: "Hato Real",
    price_bs: 410.0,
    unit: "kg",
    image: "assets/products/queso.jpg",
    is_new: false,
    created_at: "2026-11-06T10:00:00Z",
  },
  {
    id: "4",
    name: "Malta 355ml",
    category: "Bebidas",
    brand: "Malta del Sol",
    price_bs: 38.75,
    unit: "und",
    image: "assets/products/malta.jpg",
    is_new: true,
    created_at: "2026-11-05T10:00:00Z",
  },
  {
    id: "5",
    name: "Leche completa en polvo 400g",
    category: "Lácteos",
    brand: "Vaquita",
    price_bs: 215.3,
    unit: "und",
    image: "assets/products/leche.jpg",
    is_new: false,
    created_at: "2026-11-04T10:00:00Z",
  },
  {
    id: "6",
    name: "Chocolate con leche 130g",
    category: "Chuchería",
    brand: "Cacao Sur",
    price_bs: 96.5,
    unit: "und",
    image: "assets/products/chocolate.jpg",
    is_new: true,
    created_at: "2026-11-03T10:00:00Z",
  },
  {
    id: "7",
    name: "Detergente en polvo 1kg",
    category: "Limpieza",
    brand: "Blancura",
    price_bs: 154.2,
    unit: "und",
    image: "assets/products/detergente.jpg",
    is_new: false,
    created_at: "2026-11-02T10:00:00Z",
  },
  {
    id: "8",
    name: "Jabón de baño x3",
    category: "Aseo personal",
    brand: "Frescor",
    price_bs: 88.0,
    unit: "und",
    image: "assets/products/jabon.jpg",
    is_new: false,
    created_at: "2026-11-01T10:00:00Z",
  },
];

let PRODUCTS = [...FALLBACK_PRODUCTS];

async function fetchProductsFromDjango() {
  if (window.location.protocol === "file:") return;
  try {
    const response = await fetch("/api/productos/", {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return;
    const data = await response.json();
    if (data && data.ok && Array.isArray(data.products) && data.products.length > 0) {
      PRODUCTS = data.products;
      renderCatalog();
    }
  } catch {
    // Si el servidor Django no está activo, se mantiene el catálogo local de respaldo
  }
}

/* --------------------------------------------------------------------------
   3. FUNCIONES DE FORMATO Y WHATSAPP
   -------------------------------------------------------------------------- */
function formatBs(value) {
  return (
    new Intl.NumberFormat("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + " Bs"
  );
}

function orderTotal(lines) {
  return Math.round(lines.reduce((sum, l) => sum + l.price_bs * l.quantity, 0) * 100) / 100;
}

function buildOrderMessage(orderCode, lines, customer) {
  const itemsText = lines
    .map(
      (l) =>
        `• ${l.quantity} ${l.unit} x ${l.name} — ${formatBs(l.price_bs)} c/u = ${formatBs(
          l.price_bs * l.quantity
        )}`
    )
    .join("\n");

  return [
    `¡Hola! Quiero hacer este pedido 🛒`,
    `Pedido #${orderCode}`,
    ``,
    itemsText,
    ``,
    `*Total: ${formatBs(orderTotal(lines))}*`,
    `Método de pago: Pago Móvil`,
    ``,
    `*Mis datos:*`,
    `Nombre: ${customer.firstName} ${customer.lastName}`,
    `Cédula: ${customer.cedula}`,
    `Teléfono: ${customer.phone}`,
    `Dirección: ${customer.address}`,
    ``,
    `Adjunto el comprobante del Pago Móvil.`,
  ].join("\n");
}

function buildWhatsAppUrl(phoneDigits, message) {
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}

/* --------------------------------------------------------------------------
   4. ESTADO DEL CARRITO (Persistido en localStorage)
   -------------------------------------------------------------------------- */
const CART_KEY = "bodega-cart-v1";
const ORDERS_KEY = "bodega-orders-v1";

let cartItems = loadCart();

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  } catch {
    /* ignore */
  }
  renderCartUI();
  renderCheckoutView();
}

function addToCart(product) {
  const found = cartItems.find((i) => String(i.id) === String(product.id) || i.name === product.name);
  if (found) {
    found.quantity = Math.min(found.quantity + 1, 99);
  } else {
    cartItems.push({
      id: String(product.id),
      name: product.name,
      price_bs: product.price_bs,
      unit: product.unit,
      image: product.image,
      quantity: 1,
    });
  }
  saveCart();
  showToast(`${product.name} agregado`);
}

function setCartQty(id, qty) {
  if (qty <= 0) {
    cartItems = cartItems.filter((i) => String(i.id) !== String(id));
  } else {
    cartItems = cartItems.map((i) =>
      String(i.id) === String(id) ? { ...i, quantity: Math.min(qty, 99) } : i
    );
  }
  saveCart();
}

function removeFromCart(id) {
  cartItems = cartItems.filter((i) => String(i.id) !== String(id));
  saveCart();
}

function clearCart() {
  cartItems = [];
  saveCart();
}

/* --------------------------------------------------------------------------
   5. INTERFAZ DEL CARRITO (Cabecera + Panel Lateral CartSheet)
   -------------------------------------------------------------------------- */
function openCartSheet() {
  document.getElementById("cartBackdrop")?.classList.add("open");
  document.getElementById("cartSheet")?.classList.add("open");
}

function closeCartSheet() {
  document.getElementById("cartBackdrop")?.classList.remove("open");
  document.getElementById("cartSheet")?.classList.remove("open");
}

function renderCartUI() {
  const count = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const total = orderTotal(cartItems);

  const countBadge = document.getElementById("cartCountBadge");
  if (countBadge) countBadge.textContent = String(count);

  const emptyEl = document.getElementById("cartEmptyState");
  const listEl = document.getElementById("cartItemsList");
  const footerEl = document.getElementById("cartSheetFooter");
  const totalEl = document.getElementById("cartTotalValue");

  if (!emptyEl || !listEl || !footerEl || !totalEl) return;

  if (cartItems.length === 0) {
    emptyEl.classList.remove("hidden");
    listEl.classList.add("hidden");
    footerEl.classList.add("hidden");
    listEl.innerHTML = "";
    return;
  }

  emptyEl.classList.add("hidden");
  listEl.classList.remove("hidden");
  footerEl.classList.remove("hidden");
  totalEl.textContent = formatBs(total);

  listEl.innerHTML = cartItems
    .map(
      (item) => `
      <li class="cart-item">
        ${
          item.image
            ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" width="64" height="64" class="cart-item-img" />`
            : ""
        }
        <div class="cart-item-details">
          <p class="cart-item-name">${escapeHtml(item.name)}</p>
          <p class="cart-item-unit">${formatBs(item.price_bs)} / ${escapeHtml(item.unit)}</p>
          <div class="cart-item-actions">
            <button type="button" class="qty-btn" data-action="dec" data-id="${escapeHtml(item.id)}" aria-label="Restar">−</button>
            <span class="qty-value">${item.quantity}</span>
            <button type="button" class="qty-btn" data-action="inc" data-id="${escapeHtml(item.id)}" aria-label="Sumar">+</button>
            <button type="button" class="remove-item-btn" data-action="remove" data-id="${escapeHtml(item.id)}" aria-label="Quitar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>
        <p class="cart-item-subtotal">${formatBs(item.price_bs * item.quantity)}</p>
      </li>
    `
    )
    .join("");
}

/* --------------------------------------------------------------------------
   6. CATÁLOGO, FILTROS Y BÚSQUEDA (index.html)
   -------------------------------------------------------------------------- */
const filterState = {
  q: "",
  cat: "",
  sort: "default",
  min: undefined,
  max: undefined,
};

function initCatalogPage() {
  const gridEl = document.getElementById("productsGrid");
  if (!gridEl) return;

  const params = new URLSearchParams(window.location.search);
  if (params.get("q")) {
    filterState.q = params.get("q").trim();
    const searchInput = document.getElementById("headerSearchInput");
    if (searchInput) searchInput.value = filterState.q;
  }

  const minInput = document.getElementById("minPriceInput");
  const maxInput = document.getElementById("maxPriceInput");
  const filterBtn = document.getElementById("applyPriceFilterBtn");
  const sortSelect = document.getElementById("sortSelect");
  const clearSearchBtn = document.getElementById("clearSearchBtn");

  if (filterBtn) {
    filterBtn.addEventListener("click", () => {
      const parseNum = (v) =>
        v.trim() === "" || isNaN(Number(v)) ? undefined : Math.max(0, Number(v));
      filterState.min = minInput ? parseNum(minInput.value) : undefined;
      filterState.max = maxInput ? parseNum(maxInput.value) : undefined;
      renderCatalog();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      filterState.sort = e.target.value;
      renderCatalog();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      filterState.q = "";
      const searchInput = document.getElementById("headerSearchInput");
      if (searchInput) searchInput.value = "";
      renderCatalog();
    });
  }

  gridEl.addEventListener("click", (e) => {
    const addBtn = e.target.closest("[data-add-id]");
    if (!addBtn) return;
    const prod = PRODUCTS.find((p) => String(p.id) === String(addBtn.dataset.addId));
    if (prod) addToCart(prod);
  });

  const chipsContainer = document.getElementById("categoryChips");
  if (chipsContainer) {
    chipsContainer.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-cat]");
      if (!chip) return;
      filterState.cat = chip.dataset.cat;
      renderCatalog();
    });
  }

  renderCatalog();
  fetchProductsFromDjango();
}

function renderCatalog() {
  const gridEl = document.getElementById("productsGrid");
  const emptyEl = document.getElementById("emptyCatalogMessage");
  const titleEl = document.getElementById("catalogTitle");
  const chipsContainer = document.getElementById("categoryChips");
  const searchStatusEl = document.getElementById("searchStatus");
  const searchQueryText = document.getElementById("searchQueryText");

  if (!gridEl) return;

  if (titleEl) {
    titleEl.textContent = filterState.cat || "Todo el mercado";
  }

  if (chipsContainer) {
    const map = new Map();
    PRODUCTS.forEach((p) => map.set(p.category, (map.get(p.category) ?? 0) + 1));
    const categories = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));

    chipsContainer.innerHTML = [
      `<button type="button" class="chip ${!filterState.cat ? "active" : ""}" data-cat="">Todas · ${PRODUCTS.length}</button>`,
      ...categories.map(
        ([name, count]) =>
          `<button type="button" class="chip ${
            filterState.cat === name ? "active" : ""
          }" data-cat="${escapeHtml(name)}">${escapeHtml(name)} · ${count}</button>`
      ),
    ].join("");
  }

  if (searchStatusEl && searchQueryText) {
    if (filterState.q) {
      searchStatusEl.classList.remove("hidden");
      searchQueryText.textContent = filterState.q;
    } else {
      searchStatusEl.classList.add("hidden");
    }
  }

  const qLower = filterState.q.toLowerCase();
  let visible = PRODUCTS.filter(
    (p) =>
      (!filterState.cat || p.category === filterState.cat) &&
      (!qLower ||
        p.name.toLowerCase().includes(qLower) ||
        p.brand.toLowerCase().includes(qLower)) &&
      (filterState.min === undefined || p.price_bs >= filterState.min) &&
      (filterState.max === undefined || p.price_bs <= filterState.max)
  );

  if (filterState.sort === "cheap") {
    visible = [...visible].sort((a, b) => a.price_bs - b.price_bs);
  } else if (filterState.sort === "expensive") {
    visible = [...visible].sort((a, b) => b.price_bs - a.price_bs);
  } else if (filterState.sort === "newest") {
    visible = [...visible].sort((a, b) => b.created_at.localeCompare(a.created_at));
  } else if (filterState.sort === "oldest") {
    visible = [...visible].sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  if (visible.length === 0) {
    gridEl.classList.add("hidden");
    emptyEl?.classList.remove("hidden");
    gridEl.innerHTML = "";
    return;
  }

  emptyEl?.classList.add("hidden");
  gridEl.classList.remove("hidden");

  gridEl.innerHTML = visible
    .map((p, i) => {
      const featured = i % 7 === 0;
      return `
        <article class="tile product-card ${featured ? "featured" : ""}">
          <div class="product-media">
            ${
              p.image
                ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" width="600" height="600" />`
                : ""
            }
            <div class="product-badges">
              ${p.is_new ? `<span class="badge-new">Nuevo</span>` : ""}
              <span class="badge-cat">${escapeHtml(p.category)}</span>
            </div>
          </div>
          <div class="product-body">
            <div class="product-info">
              <p class="product-brand">${escapeHtml(p.brand)}</p>
              <h3 class="product-name">${escapeHtml(p.name)}</h3>
              <p class="product-price">
                ${formatBs(p.price_bs)}<span class="product-unit">/ ${escapeHtml(p.unit)} +IVA</span>
              </p>
            </div>
            <button
              type="button"
              class="add-btn"
              data-add-id="${escapeHtml(p.id)}"
              aria-label="Agregar ${escapeHtml(p.name)} al carrito"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

/* --------------------------------------------------------------------------
   7. PÁGINA DE CHECKOUT Y REGISTRO EN POSTGRESQL (checkout.html)
   -------------------------------------------------------------------------- */
function renderCheckoutView() {
  const emptyWrap = document.getElementById("checkoutEmptyWrap");
  const checkoutGrid = document.getElementById("checkoutGrid");
  if (!emptyWrap || !checkoutGrid) return;

  if (cartItems.length === 0) {
    emptyWrap.classList.remove("hidden");
    checkoutGrid.classList.add("hidden");
    return;
  }

  emptyWrap.classList.add("hidden");
  checkoutGrid.classList.remove("hidden");

  const total = orderTotal(cartItems);

  const pmBanco = document.getElementById("pmBanco");
  const pmTelefono = document.getElementById("pmTelefono");
  const pmDocumento = document.getElementById("pmDocumento");
  const pmMonto = document.getElementById("pmMonto");

  if (pmBanco) pmBanco.textContent = STORE.pagoMovil.banco;
  if (pmTelefono) pmTelefono.textContent = STORE.pagoMovil.telefono;
  if (pmDocumento) pmDocumento.textContent = STORE.pagoMovil.documento;
  if (pmMonto) pmMonto.textContent = formatBs(total);

  const summaryList = document.getElementById("checkoutSummaryList");
  const summaryTotal = document.getElementById("checkoutSummaryTotal");

  if (summaryList) {
    summaryList.innerHTML = cartItems
      .map(
        (i) => `
        <li class="summary-item">
          <span><b>${i.quantity}</b> × ${escapeHtml(i.name)}</span>
          <span class="summary-item-price">${formatBs(i.price_bs * i.quantity)}</span>
        </li>
      `
      )
      .join("");
  }

  if (summaryTotal) {
    summaryTotal.textContent = formatBs(total);
  }
}

function initCheckoutPage() {
  const form = document.getElementById("checkoutForm");
  if (!form) return;

  renderCheckoutView();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const firstName = document.getElementById("firstNameInput")?.value.trim() ?? "";
    const lastName = document.getElementById("lastNameInput")?.value.trim() ?? "";
    const cedulaType = document.getElementById("cedulaTypeSelect")?.value ?? "V";
    const cedulaNum = document.getElementById("cedulaNumInput")?.value.trim() ?? "";
    const rawPhone = document.getElementById("phoneInput")?.value.trim() ?? "";
    const phone = rawPhone.replace(/[\s-]/g, "");
    const address = document.getElementById("addressInput")?.value.trim() ?? "";

    const errors = {};
    if (!firstName) errors.firstName = "Escribe tu nombre";
    if (!lastName) errors.lastName = "Escribe tu apellido";
    if (!/^\d{6,9}$/.test(cedulaNum)) errors.cedulaNum = "Cédula inválida (6 a 9 dígitos)";
    if (!/^0\d{10}$/.test(phone)) errors.phone = "Teléfono inválido (ej: 04141234567)";
    if (address.length < 5) errors.address = "Escribe tu dirección completa";

    ["firstName", "lastName", "cedulaNum", "phone", "address"].forEach((field) => {
      const errEl = document.getElementById(`err-${field}`);
      if (!errEl) return;
      if (errors[field]) {
        errEl.textContent = errors[field];
        errEl.classList.remove("hidden");
      } else {
        errEl.textContent = "";
        errEl.classList.add("hidden");
      }
    });

    if (Object.keys(errors).length > 0) return;

    const lines = cartItems.map((i) => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      unit: i.unit,
      price_bs: i.price_bs,
    }));

    const customer = {
      firstName,
      lastName,
      cedula: `${cedulaType}-${cedulaNum}`,
      phone,
      address,
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    let code = generateOrderCode();

    // Enviar el pedido al backend Django + PostgreSQL (/api/pedidos/)
    if (window.location.protocol !== "file:") {
      try {
        const res = await fetch("/api/pedidos/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...customer,
            items: lines,
          }),
        });
        const data = await res.json();
        if (res.ok && data.ok && data.code) {
          code = data.code;
        } else if (!res.ok) {
          showToast(data.error || "No pudimos registrar tu pedido en el servidor.");
          if (submitBtn) submitBtn.disabled = false;
          return;
        }
      } catch {
        // Si se abre sin el servidor Django activo, continúa con código generado localmente
      }
    }

    // Respaldo local en localStorage
    try {
      const prevOrders = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
      prevOrders.push({
        code,
        customer,
        items: lines,
        total_bs: orderTotal(lines),
        payment_method: "pago_movil",
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(ORDERS_KEY, JSON.stringify(prevOrders));
    } catch {
      /* ignore */
    }

    const whatsappUrl = buildWhatsAppUrl(
      STORE.whatsapp,
      buildOrderMessage(code, lines, customer)
    );

    clearCart();
    window.location.href = whatsappUrl;
  });
}

function generateOrderCode() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().slice(0, 8).toUpperCase();
  }
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

/* --------------------------------------------------------------------------
   8. NOTIFICACIONES TOAST Y UTILIDADES COMUNES
   -------------------------------------------------------------------------- */
function showToast(message) {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fec106" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    <span>${escapeHtml(message)}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2400);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function populateStoreFooter() {
  const nameEl = document.getElementById("footerStoreName");
  const addrEl = document.getElementById("footerStoreAddress");
  const hoursEl = document.getElementById("footerStoreHours");
  const waEl = document.getElementById("footerStoreWhatsapp");

  if (nameEl) nameEl.textContent = STORE.name;
  if (addrEl) addrEl.textContent = STORE.address;
  if (hoursEl) hoursEl.textContent = STORE.hours;
  if (waEl) waEl.textContent = `WhatsApp ${STORE.whatsappDisplay}`;
}

/* --------------------------------------------------------------------------
   9. INICIALIZACIÓN GENERAL AL CARGAR EL DOM
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  populateStoreFooter();
  renderCartUI();

  document.getElementById("openCartBtn")?.addEventListener("click", openCartSheet);
  document.getElementById("closeCartBtn")?.addEventListener("click", closeCartSheet);
  document.getElementById("cartBackdrop")?.addEventListener("click", closeCartSheet);

  document.getElementById("cartItemsList")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    const item = cartItems.find((i) => String(i.id) === String(id));
    if (!item) return;

    if (action === "inc") setCartQty(id, item.quantity + 1);
    if (action === "dec") setCartQty(id, item.quantity - 1);
    if (action === "remove") removeFromCart(id);
  });

  const searchForm = document.getElementById("headerSearchForm");
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = document.getElementById("headerSearchInput")?.value.trim() ?? "";
      const isCatalogPage = Boolean(document.getElementById("productsGrid"));

      if (isCatalogPage) {
        filterState.q = q;
        renderCatalog();
        document.getElementById("productos")?.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.href = q
          ? `index.html?q=${encodeURIComponent(q)}#productos`
          : `index.html#productos`;
      }
    });
  }

  initCatalogPage();
  initCheckoutPage();
});
