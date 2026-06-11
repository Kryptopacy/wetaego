const STORAGE_KEY = "ourmenu-os-state-v1";

const appStorage = {
  read() {
    return localStorage.getItem(STORAGE_KEY);
  },
  write(nextState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  },
  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },
};

const statusLabels = {
  available: "Available",
  low: "Low stock",
  "sold-out": "Sold out",
  hidden: "Hidden",
};

const statusOrder = ["available", "low", "sold-out", "hidden"];

const currencies = [
  ["NGN", "Nigerian naira (NGN)"],
  ["GHS", "Ghanaian cedi (GHS)"],
  ["KES", "Kenyan shilling (KES)"],
  ["ZAR", "South African rand (ZAR)"],
  ["USD", "US dollar (USD)"],
  ["GBP", "British pound (GBP)"],
  ["EUR", "Euro (EUR)"],
  ["CAD", "Canadian dollar (CAD)"],
];

const currencyLocales = {
  NGN: "en-NG",
  GHS: "en-GH",
  KES: "en-KE",
  ZAR: "en-ZA",
  USD: "en-US",
  GBP: "en-GB",
  EUR: "en-IE",
  CAD: "en-CA",
};

const seedState = {
  session: null,
  authMode: "signin",
  onboardingComplete: false,
  businessType: "lounge",
  view: "dashboard",
  filter: "all",
  search: "",
  publicSearch: "",
  editingId: null,
  scanCount: 128,
  business: {
    name: "Harbor & Vine Lounge",
    slug: "harbor-vine-lounge",
    tagline: "Cocktails, small plates, and late-night specials updated live.",
    address: "24 Market Street, Lagos",
    phone: "+234 800 555 0123",
    currency: "NGN",
    theme: "#0f7b55",
    cover:
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80",
  },
  items: [
    {
      id: "item-1",
      name: "Smoked Jollof Arancini",
      category: "Small Plates",
      price: 8500,
      status: "available",
      featured: true,
      description: "Crisp rice bites, pepper aioli, charred scallion.",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "item-2",
      name: "Suya Ribeye Skewers",
      category: "Small Plates",
      price: 18000,
      status: "low",
      featured: true,
      description: "Tender ribeye, yaji spice, pickled onion, lime.",
      image:
        "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "item-3",
      name: "Garden Highball",
      category: "Cocktails",
      price: 7000,
      status: "available",
      featured: false,
      description: "Gin, cucumber, mint, elderflower, tonic.",
      image:
        "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "item-4",
      name: "Mango Mezcal Sour",
      category: "Cocktails",
      price: 9000,
      status: "sold-out",
      featured: false,
      description: "Mezcal, mango, lime, agave, smoked salt.",
      image:
        "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "item-5",
      name: "Reserve Bottle Service",
      category: "Bottle Service",
      price: 180000,
      status: "available",
      featured: true,
      description: "Premium spirit, mixers, ice service, garnish tray.",
      image:
        "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=400&q=80",
    },
  ],
};

const demoTemplates = {
  lounge: {
    label: "Lounge / Bar",
    business: {
      name: "Harbor & Vine Lounge",
      slug: "harbor-vine-lounge",
      tagline: "Cocktails, small plates, and late-night specials updated live.",
      address: "24 Market Street, Lagos",
      phone: "+234 800 555 0123",
      currency: "NGN",
      theme: "#0f7b55",
      cover:
        "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80",
    },
    items: seedState.items,
  },
  cafe: {
    label: "Cafe / Bakery",
    business: {
      name: "Morning Table Cafe",
      slug: "morning-table-cafe",
      tagline: "Fresh pastries, espresso, and dayparts that change as items sell out.",
      address: "12 Admiralty Way, Lekki",
      phone: "+234 800 555 0198",
      currency: "NGN",
      theme: "#286b91",
      cover:
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
    },
    items: [
      {
        id: "cafe-1",
        name: "Butter Croissant",
        category: "Pastries",
        price: 2500,
        status: "low",
        featured: true,
        description: "Laminated butter pastry, baked every morning.",
        image:
          "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "cafe-2",
        name: "Iced Vanilla Latte",
        category: "Coffee",
        price: 4500,
        status: "available",
        featured: true,
        description: "Espresso, milk, vanilla syrup, ice.",
        image: "",
      },
      {
        id: "cafe-3",
        name: "Chicken Suya Sandwich",
        category: "Meals",
        price: 8500,
        status: "available",
        featured: false,
        description: "Toasted sourdough, suya chicken, greens, aioli.",
        image:
          "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },
  restaurant: {
    label: "Restaurant",
    business: {
      name: "Orchid Room Kitchen",
      slug: "orchid-room-kitchen",
      tagline: "Modern Nigerian plates with live specials and accurate availability.",
      address: "8 Isaac John Street, Ikeja",
      phone: "+234 800 555 0160",
      currency: "NGN",
      theme: "#7a3f98",
      cover:
        "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80",
    },
    items: [
      {
        id: "rest-1",
        name: "Seafood Okra",
        category: "Mains",
        price: 22000,
        status: "available",
        featured: true,
        description: "Prawns, crab, smoked fish, okra, swallow pairing.",
        image:
          "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "rest-2",
        name: "Peppered Goat Meat",
        category: "Small Plates",
        price: 12000,
        status: "sold-out",
        featured: false,
        description: "Slow-cooked goat, pepper sauce, onions.",
        image: "",
      },
      {
        id: "rest-3",
        name: "Chapman Spritz",
        category: "Drinks",
        price: 5500,
        status: "available",
        featured: true,
        description: "Chapman cordial, citrus, soda, bitters.",
        image:
          "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },
};

let state = loadState();
const isPublicRoute = window.location.pathname.startsWith("/m/");
if (isPublicRoute) {
  state = { ...state, view: "public", scanCount: state.scanCount + 1 };
  saveState();
}
let toastTimer;

function loadState() {
  try {
    const saved = appStorage.read();
    if (!saved) return structuredClone(seedState);

    const parsed = JSON.parse(saved);
    const next = {
      ...structuredClone(seedState),
      ...parsed,
      business: { ...seedState.business, ...(parsed.business || {}) },
    };

    if (!parsed.business?.currency) {
      next.business.currency = "NGN";
      const demoPrices = {
        "item-1": 8500,
        "item-2": 18000,
        "item-3": 7000,
        "item-4": 9000,
        "item-5": 180000,
      };
      next.items = next.items.map((item) =>
        demoPrices[item.id] && Number(item.price) < 1000
          ? { ...item, price: demoPrices[item.id] }
          : item,
      );
    }

    return next;
  } catch {
    return structuredClone(seedState);
  }
}

function saveState() {
  appStorage.write(state);
}

function setState(next) {
  state = { ...state, ...next };
  saveState();
  render();
}

function money(value) {
  const currency = state.business.currency || "NGN";
  return new Intl.NumberFormat(currencyLocales[currency] || "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function publicUrl() {
  return `${window.location.origin}/m/${state.business.slug}`;
}

function qrUrl() {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(publicUrl())}`;
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function applyTemplate(type) {
  const template = demoTemplates[type] || demoTemplates.lounge;
  setState({
    businessType: type,
    onboardingComplete: true,
    business: structuredClone(template.business),
    items: structuredClone(template.items),
    view: "dashboard",
    filter: "all",
    search: "",
    publicSearch: "",
    editingId: null,
  });
  toast(`${template.label} demo loaded`);
}

function launchWorkspace(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const type = data.businessType || "lounge";
  const template = demoTemplates[type] || demoTemplates.lounge;
  const businessName = data.name.trim() || template.business.name;
  const slug = slugify(data.slug || businessName);

  setState({
    businessType: type,
    onboardingComplete: true,
    business: {
      ...structuredClone(template.business),
      name: businessName,
      slug: slug || template.business.slug,
      currency: data.currency || template.business.currency,
      address: data.address.trim() || template.business.address,
    },
    items: structuredClone(template.items),
    view: "dashboard",
  });
  toast("Workspace launched");
}

function visibleItems(includeHidden = true) {
  return state.items.filter((item) => {
    const matchesFilter =
      state.filter === "all" ||
      item.status === state.filter ||
      (state.filter === "featured" && item.featured);
    const query = state.search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [item.name, item.category, item.description].some((value) =>
        value.toLowerCase().includes(query),
      );
    return matchesFilter && matchesSearch && (includeHidden || item.status !== "hidden");
  });
}

function customerItems() {
  const query = state.publicSearch.trim().toLowerCase();
  return state.items.filter((item) => {
    if (item.status === "hidden") return false;
    return (
      !query ||
      [item.name, item.category, item.description].some((value) =>
        value.toLowerCase().includes(query),
      )
    );
  });
}

function grouped(items) {
  return items.reduce((groups, item) => {
    groups[item.category] ||= [];
    groups[item.category].push(item);
    return groups;
  }, {});
}

function icon(name) {
  const paths = {
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 15h10l1-15"/>',
    copy: '<path d="M8 8h11v11H8z"/><path d="M5 16H4a1 1 0 0 1-1-1V4h11a1 1 0 0 1 1 1v1"/>',
  };
  return `<svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name] || ""}</svg>`;
}

function itemThumb(item) {
  if (item.image?.trim()) {
    return `<div class="thumb"><img src="${escapeAttr(item.image)}" alt="" /></div>`;
  }

  const initials = item.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return `<div class="thumb no-photo" aria-label="No photo for ${escapeAttr(item.name)}"><span>${escapeHtml(initials || "LM")}</span></div>`;
}

function header() {
  const tabs = [
    ["dashboard", "Dashboard"],
    ["menu", "Menu Manager"],
    ["settings", "Business Setup"],
  ];

  return `
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">LM</div>
        <div>
          <p class="brand-title">OurMenu OS</p>
          <p class="brand-subtitle">Live availability pages for hospitality teams</p>
        </div>
      </div>
      <nav class="nav" aria-label="Main navigation">
        ${tabs
          .map(
            ([view, label]) =>
              `<button class="${state.view === view ? "active" : ""}" data-view="${view}">${label}</button>`,
          )
          .join("")}
        <button data-open-public>View public page</button>
        <button data-sign-out>Sign out</button>
      </nav>
    </header>
  `;
}

function dashboard() {
  const soldOut = state.items.filter((item) => item.status === "sold-out").length;
  const live = state.items.filter((item) => item.status !== "hidden").length;
  const featured = state.items.filter((item) => item.featured).length;
  const noPhoto = state.items.filter((item) => !item.image?.trim()).length;

  return `
    <section class="hero">
      <div class="hero-copy">
        <h1>Menus that stay accurate while service is moving.</h1>
        <p>${state.business.name} can update items, prices, specials, and stock status in seconds. Customers scan once and see the live version every time.</p>
        <div class="hero-actions">
          <button class="primary" data-view="menu">Manage items</button>
          <button class="ghost" data-open-public>Open customer page</button>
        </div>
      </div>
      <div class="metric-stack">
        <div class="metric"><p class="metric-value">${state.scanCount}</p><p class="metric-label">Simulated QR scans</p></div>
        <div class="metric"><p class="metric-value">${live}</p><p class="metric-label">Visible live items</p></div>
        <div class="metric"><p class="metric-value">${soldOut}</p><p class="metric-label">Sold out right now</p></div>
        <div class="metric"><p class="metric-value">${featured}</p><p class="metric-label">Featured specials</p></div>
      </div>
    </section>
    <section class="grid">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Operations snapshot</h2>
            <p class="panel-note">Fast signals for the person managing service.</p>
          </div>
        </div>
        <div class="panel-body">${itemList(state.items.slice(0, 4))}</div>
      </div>
      ${qrPanel()}
    </section>
    <section class="insight-grid">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Demo checklist</h2>
            <p class="panel-note">Use this sequence when showing OurMenu OS to a business owner.</p>
          </div>
        </div>
        <div class="panel-body">
          ${demoChecklist({ live, soldOut, noPhoto })}
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Readiness notes</h2>
            <p class="panel-note">Signals that help an operator understand what to fix before going live.</p>
          </div>
        </div>
        <div class="panel-body">
          <div class="readiness-list">
            <div><strong>${soldOut}</strong><span>items need restock or hiding</span></div>
            <div><strong>${noPhoto}</strong><span>items using clean no-photo placeholders</span></div>
            <div><strong>${state.business.currency || "NGN"}</strong><span>active customer-facing currency</span></div>
          </div>
        </div>
      </div>
    </section>
    <section class="panel public-preview-panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Customer preview</h2>
          <p class="panel-note">A read-only preview of the public menu, separate from the business controls.</p>
        </div>
      </div>
      <div class="panel-body"><div class="preview-wrap">${phonePreview()}</div></div>
    </section>
  `;
}

function demoChecklist({ live, soldOut, noPhoto }) {
  const steps = [
    ["Workspace created", Boolean(state.session)],
    ["Business profile configured", Boolean(state.business.name && state.business.slug)],
    ["Our menu has items", live > 0],
    ["Availability states visible", soldOut > 0 || state.items.some((item) => item.status === "low")],
    ["No-photo fallback demonstrated", noPhoto > 0],
    ["QR link ready", Boolean(state.business.slug)],
  ];

  return `
    <div class="checklist">
      ${steps
        .map(
          ([label, done]) => `
            <div class="check-row ${done ? "done" : ""}">
              <span>${done ? "OK" : "-"}</span>
              <p>${label}</p>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function menuManager() {
  return `
    <section class="grid">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Menu manager</h2>
            <p class="panel-note">Toggle availability, edit prices, feature specials, or hide items instantly.</p>
          </div>
          <button class="primary" data-new-item>Add item</button>
        </div>
        <div class="panel-body">
          <div class="toolbar">
            <div class="filters">
              ${[
                ["all", "All"],
                ["available", "Available"],
                ["low", "Low stock"],
                ["sold-out", "Sold out"],
                ["hidden", "Hidden"],
                ["featured", "Featured"],
              ]
                .map(
                  ([filter, label]) =>
                    `<button class="filter ${state.filter === filter ? "active" : ""}" data-filter="${filter}">${label}</button>`,
                )
                .join("")}
            </div>
            <input class="search" data-search placeholder="Search items" value="${escapeHtml(state.search)}" />
          </div>
          ${itemList(visibleItems())}
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">${state.editingId ? "Edit item" : "Add item"}</h2>
            <p class="panel-note">Keep fields short so the customer page stays easy to scan.</p>
          </div>
        </div>
        <div class="panel-body">${itemForm()}</div>
      </div>
    </section>
  `;
}

function itemList(items) {
  if (!items.length) return `<div class="empty">No items match this view.</div>`;

  return `
    <div class="item-list">
      ${items
        .map(
          (item) => `
            <article class="item-row">
              ${itemThumb(item)}
              <div>
                <h3 class="item-title">
                  ${escapeHtml(item.name)}
                  <span class="status ${item.status}">${statusLabels[item.status]}</span>
                  ${item.featured ? '<span class="status available">Featured</span>' : ""}
                </h3>
                <p class="item-meta">${escapeHtml(item.category)} - ${money(item.price)} - ${escapeHtml(item.description)}</p>
              </div>
              <div class="row-actions">
                <select data-status="${item.id}" aria-label="Status for ${escapeAttr(item.name)}">
                  ${statusOrder
                    .map(
                      (status) =>
                        `<option value="${status}" ${item.status === status ? "selected" : ""}>${statusLabels[status]}</option>`,
                    )
                    .join("")}
                </select>
                <button class="icon-button" title="Edit ${escapeAttr(item.name)}" data-edit="${item.id}">${icon("edit")}</button>
                <button class="icon-button" title="Delete ${escapeAttr(item.name)}" data-delete="${item.id}">${icon("trash")}</button>
              </div>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function itemForm() {
  const item =
    state.items.find((entry) => entry.id === state.editingId) || {
      id: "",
      name: "",
      category: "",
      price: "",
      status: "available",
      featured: false,
      description: "",
      image: "",
    };

  return `
    <form data-item-form>
      <div class="form-grid">
        <div class="field"><label for="item-name">Name</label><input id="item-name" name="name" required value="${escapeAttr(item.name)}" /></div>
        <div class="field"><label for="item-category">Category</label><input id="item-category" name="category" required value="${escapeAttr(item.category)}" /></div>
        <div class="field"><label for="item-price">Price</label><input id="item-price" name="price" type="number" min="0" step="1" required value="${escapeAttr(item.price)}" /></div>
        <div class="field">
          <label for="item-status">Status</label>
          <select id="item-status" name="status">
            ${statusOrder
              .map(
                (status) =>
                  `<option value="${status}" ${item.status === status ? "selected" : ""}>${statusLabels[status]}</option>`,
              )
              .join("")}
          </select>
        </div>
        <div class="field full"><label for="item-image">Photo URL <span class="optional">optional</span></label><input id="item-image" name="image" placeholder="Leave blank to use a clean text placeholder" value="${escapeAttr(item.image)}" /></div>
        <div class="field full"><label for="item-description">Description</label><textarea id="item-description" name="description">${escapeHtml(item.description)}</textarea></div>
        <div class="field full"><label><input name="featured" type="checkbox" ${item.featured ? "checked" : ""} /> Feature this item</label></div>
      </div>
      <div class="form-actions">
        <button class="ghost" type="button" data-cancel-edit>Clear</button>
        <button class="primary" type="submit">${state.editingId ? "Save item" : "Create item"}</button>
      </div>
    </form>
  `;
}

function settings() {
  return `
    <section class="grid">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Business setup</h2>
            <p class="panel-note">These details power the branded customer page and QR destination.</p>
          </div>
        </div>
        <div class="panel-body">
          <form data-business-form>
            <div class="form-grid">
              <div class="field"><label for="biz-name">Business name</label><input id="biz-name" name="name" required value="${escapeAttr(state.business.name)}" /></div>
              <div class="field"><label for="biz-slug">Public slug</label><input id="biz-slug" name="slug" required value="${escapeAttr(state.business.slug)}" /></div>
              <div class="field"><label for="biz-phone">Phone</label><input id="biz-phone" name="phone" value="${escapeAttr(state.business.phone)}" /></div>
              <div class="field">
                <label for="biz-currency">Menu currency</label>
                <select id="biz-currency" name="currency">
                  ${currencies
                    .map(
                      ([code, label]) =>
                        `<option value="${code}" ${(state.business.currency || "NGN") === code ? "selected" : ""}>${label}</option>`,
                    )
                    .join("")}
                </select>
              </div>
              <div class="field"><label for="biz-theme">Brand color</label><input id="biz-theme" name="theme" type="color" value="${escapeAttr(state.business.theme)}" /></div>
              <div class="field full"><label for="biz-address">Address</label><input id="biz-address" name="address" value="${escapeAttr(state.business.address)}" /></div>
              <div class="field full"><label for="biz-cover">Cover photo URL</label><input id="biz-cover" name="cover" value="${escapeAttr(state.business.cover)}" /></div>
              <div class="field full"><label for="biz-tagline">Tagline</label><textarea id="biz-tagline" name="tagline">${escapeHtml(state.business.tagline)}</textarea></div>
            </div>
            <div class="form-actions">
              <button class="danger" type="button" data-reset>Reset demo data</button>
              <button class="primary" type="submit">Save business</button>
            </div>
          </form>
        </div>
      </div>
      ${qrPanel()}
    </section>
  `;
}

function qrPanel() {
  return `
    <aside class="panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">QR destination</h2>
          <p class="panel-note">Dynamic QR codes keep working even as the menu changes.</p>
        </div>
      </div>
      <div class="panel-body">
        <div class="qr-box">
          <img src="${qrUrl()}" alt="QR code for ${escapeAttr(state.business.name)}" />
          <div>
            <a class="linkbox" href="/m/${escapeAttr(state.business.slug)}" data-public-link>${publicUrl()}</a>
            <div class="form-actions" style="justify-content:flex-start">
              <button class="ghost" data-copy-link>${icon("copy")} Copy link</button>
              <a class="ghost button-link" href="${qrUrl()}" download="${escapeAttr(state.business.slug)}-qr.png">Download QR</a>
              <button class="ghost" data-print-tent>Print table tent</button>
              <button class="primary" data-sim-scan>Simulate scan</button>
            </div>
          </div>
        </div>
        <div class="print-tent">
          <p class="tent-business">${escapeHtml(state.business.name)}</p>
          <img src="${qrUrl()}" alt="" />
          <p>Scan for today's live menu</p>
          <small>${publicUrl()}</small>
        </div>
      </div>
    </aside>
  `;
}

function publicView() {
  return `
    <section class="grid">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Customer view</h2>
            <p class="panel-note">This is what guests see after scanning the QR code.</p>
          </div>
          <button class="primary" data-sim-scan>Simulate scan</button>
        </div>
        <div class="panel-body"><div class="preview-wrap">${phonePreview()}</div></div>
      </div>
      ${qrPanel()}
    </section>
  `;
}

function authScreen() {
  const isSignup = state.authMode === "signup";
  return `
    <div class="auth-shell">
      <section class="auth-hero">
        <div class="brand auth-brand">
          <div class="brand-mark">LM</div>
          <div>
            <p class="brand-title">OurMenu OS</p>
            <p class="brand-subtitle">Business portal</p>
          </div>
        </div>
        <h1>Run a live menu customers can trust.</h1>
        <p>Sign in to manage items, pricing, availability, QR codes, and brand settings. Customers only see the clean public menu at your QR link.</p>
        <div class="auth-proof">
          <div><strong>10 sec</strong><span>stock updates</span></div>
          <div><strong>24/7</strong><span>public menu</span></div>
          <div><strong>No app</strong><span>for customers</span></div>
        </div>
      </section>
      <section class="auth-card panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">${isSignup ? "Create workspace" : "Sign in"}</h2>
            <p class="panel-note">${isSignup ? "Start with a local demo account for this business." : "Use any email and password to enter the local demo."}</p>
          </div>
        </div>
        <div class="panel-body">
          <form data-auth-form>
            <div class="form-grid auth-form-grid">
              ${
                isSignup
                  ? `<div class="field full"><label for="auth-business">Business name</label><input id="auth-business" name="business" value="${escapeAttr(state.business.name)}" required /></div>`
                  : ""
              }
              <div class="field full"><label for="auth-email">Email</label><input id="auth-email" name="email" type="email" value="${escapeAttr(state.session?.email || "owner@harborvine.test")}" required /></div>
              <div class="field full"><label for="auth-password">Password</label><input id="auth-password" name="password" type="password" value="password123" required /></div>
            </div>
            <div class="form-actions">
              <button class="ghost" type="button" data-auth-mode="${isSignup ? "signin" : "signup"}">${isSignup ? "I already have an account" : "Create account"}</button>
              <button class="primary" type="submit">${isSignup ? "Create and enter" : "Sign in"}</button>
            </div>
          </form>
          <button class="ghost auth-demo" data-demo-login>Enter demo workspace</button>
        </div>
      </section>
    </div>
  `;
}

function onboardingScreen() {
  return `
    <div class="onboarding-shell">
      <section class="panel onboarding-panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Set up your demo workspace</h2>
            <p class="panel-note">Choose a starting point. You can edit every item, price, status, and business detail after launch.</p>
          </div>
        </div>
        <div class="panel-body">
          <form data-onboarding-form>
            <div class="template-grid">
              ${Object.entries(demoTemplates)
                .map(
                  ([type, template]) => `
                    <label class="template-card">
                      <input type="radio" name="businessType" value="${type}" ${state.businessType === type ? "checked" : ""} />
                      <strong>${template.label}</strong>
                      <span>${template.business.tagline}</span>
                    </label>
                  `,
                )
                .join("")}
            </div>
            <div class="form-grid">
              <div class="field"><label for="onboard-name">Business name</label><input id="onboard-name" name="name" value="${escapeAttr(state.business.name)}" required /></div>
              <div class="field"><label for="onboard-slug">Public slug</label><input id="onboard-slug" name="slug" value="${escapeAttr(state.business.slug)}" required /></div>
              <div class="field">
                <label for="onboard-currency">Currency</label>
                <select id="onboard-currency" name="currency">
                  ${currencies
                    .map(
                      ([code, label]) =>
                        `<option value="${code}" ${(state.business.currency || "NGN") === code ? "selected" : ""}>${label}</option>`,
                    )
                    .join("")}
                </select>
              </div>
              <div class="field"><label for="onboard-address">Address</label><input id="onboard-address" name="address" value="${escapeAttr(state.business.address)}" /></div>
            </div>
            <div class="form-actions">
              <button class="ghost" type="button" data-template="cafe">Load cafe demo</button>
              <button class="ghost" type="button" data-template="restaurant">Load restaurant demo</button>
              <button class="primary" type="submit">Launch workspace</button>
            </div>
          </form>
        </div>
      </section>
    </div>
  `;
}

function publicMenuPage() {
  const groups = grouped(customerItems());
  return `
    <main class="customer-page" style="--brand:${escapeAttr(state.business.theme)}; --cover-url:url('${escapeAttr(state.business.cover)}')">
      <section class="customer-public-cover">
        <div class="customer-public-top">
          <strong>${escapeHtml(state.business.name)}</strong>
          <span>Powered by OurMenu OS</span>
        </div>
        <div class="customer-public-copy">
          <h1>${escapeHtml(state.business.name)}</h1>
          <p>${escapeHtml(state.business.tagline)}</p>
          <p>${escapeHtml(state.business.address)}</p>
        </div>
      </section>
      <section class="customer-public-body">
        <input class="public-search" data-public-search placeholder="Search menu" value="${escapeAttr(state.publicSearch)}" />
        ${
          Object.keys(groups).length
            ? Object.entries(groups)
                .map(
                  ([category, items]) => `
                    <section class="public-category">
                      <h2>${escapeHtml(category)}</h2>
                      ${items.map(publicItem).join("")}
                    </section>
                  `,
                )
                .join("")
            : '<div class="empty">No visible items right now.</div>'
        }
      </section>
    </main>
  `;
}

function phonePreview() {
  const groups = grouped(customerItems());
  return `
    <div class="phone">
      <div class="phone-screen">
        <div class="customer-cover" style="--brand:${escapeAttr(state.business.theme)}; --cover-url:url('${escapeAttr(state.business.cover)}')">
          <h2>${escapeHtml(state.business.name)}</h2>
          <p>${escapeHtml(state.business.tagline)}</p>
          <p>${escapeHtml(state.business.address)}</p>
        </div>
        <div class="customer-body">
          <input class="public-search" data-public-search placeholder="Search menu" value="${escapeAttr(state.publicSearch)}" />
          ${
            Object.keys(groups).length
              ? Object.entries(groups)
                  .map(
                    ([category, items]) => `
                      <section class="public-category">
                        <h3>${escapeHtml(category)}</h3>
                        ${items.map(publicItem).join("")}
                      </section>
                    `,
                  )
                  .join("")
              : '<div class="empty">No visible items right now.</div>'
          }
        </div>
      </div>
    </div>
  `;
}

function publicItem(item) {
  return `
    <article class="public-item">
      ${itemThumb(item)}
      <div>
        <h4>${escapeHtml(item.name)}</h4>
        <p>${escapeHtml(item.description)}</p>
        <div class="price-line">
          <span class="price">${money(item.price)}</span>
          <span class="status ${item.status}">${statusLabels[item.status]}</span>
        </div>
      </div>
    </article>
  `;
}

function render() {
  document.documentElement.style.setProperty("--brand", state.business.theme);
  if (isPublicRoute) {
    document.getElementById("app").innerHTML = publicMenuPage();
    return;
  }

  if (!state.session) {
    document.getElementById("app").innerHTML = authScreen();
    return;
  }

  if (!state.onboardingComplete) {
    document.getElementById("app").innerHTML = onboardingScreen();
    return;
  }

  document.getElementById("app").innerHTML = `
    <div class="shell">
      ${header()}
      <main class="main">
        ${
          state.view === "dashboard"
            ? dashboard()
            : state.view === "menu"
              ? menuManager()
              : settings()
        }
      </main>
      <div class="toast" role="status" aria-live="polite"></div>
    </div>
  `;
}

function toast(message) {
  let node = document.querySelector(".toast");
  if (!node) {
    node = document.createElement("div");
    node.className = "toast";
    node.setAttribute("role", "status");
    node.setAttribute("aria-live", "polite");
    document.body.append(node);
  }
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove("show"), 1800);
}

function upsertItem(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const item = {
    id: state.editingId || crypto.randomUUID(),
    name: data.name.trim(),
    category: data.category.trim(),
    price: Number(data.price || 0),
    status: data.status,
    featured: Boolean(data.featured),
    description: data.description.trim(),
    image:
      data.image.trim(),
  };

  const exists = state.items.some((entry) => entry.id === item.id);
  setState({
    items: exists
      ? state.items.map((entry) => (entry.id === item.id ? item : entry))
      : [item, ...state.items],
    editingId: null,
  });
  toast(exists ? "Item saved" : "Item created");
}

function saveBusiness(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const slug = data.slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  setState({
    business: {
      ...state.business,
      name: data.name.trim(),
      slug: slug || state.business.slug,
      phone: data.phone.trim(),
      currency: data.currency || state.business.currency || "NGN",
      theme: data.theme,
      address: data.address.trim(),
      cover: data.cover.trim(),
      tagline: data.tagline.trim(),
    },
  });
  toast("Business setup saved");
}

document.addEventListener("click", async (event) => {
  const target = event.target.closest("button, a");
  if (!target) return;

  if (target.dataset.view) setState({ view: target.dataset.view });
  if (target.dataset.openPublic !== undefined) window.location.href = `/m/${state.business.slug}`;
  if (target.dataset.signOut !== undefined) {
    setState({ session: null, view: "dashboard" });
    return;
  }
  if (target.dataset.authMode) {
    setState({ authMode: target.dataset.authMode });
    return;
  }
  if (target.dataset.demoLogin !== undefined) {
    setState({
      session: { email: "owner@harborvine.test", role: "Owner" },
      onboardingComplete: false,
      view: "dashboard",
    });
    toast("Signed in to demo workspace");
    return;
  }
  if (target.dataset.template) {
    applyTemplate(target.dataset.template);
    return;
  }
  if (target.dataset.filter) setState({ filter: target.dataset.filter });
  if (target.dataset.newItem !== undefined) setState({ editingId: null, view: "menu" });
  if (target.dataset.edit) setState({ editingId: target.dataset.edit, view: "menu" });

  if (target.dataset.delete) {
    const item = state.items.find((entry) => entry.id === target.dataset.delete);
    if (item && confirm(`Delete ${item.name}?`)) {
      setState({ items: state.items.filter((entry) => entry.id !== item.id) });
      toast("Item deleted");
    }
  }

  if (target.dataset.cancelEdit !== undefined) setState({ editingId: null });

  if (target.dataset.copyLink !== undefined) {
    await navigator.clipboard.writeText(publicUrl());
    toast("Public link copied");
  }

  if (target.dataset.simScan !== undefined) {
    setState({ scanCount: state.scanCount + 1 });
    toast("Scan recorded");
  }

  if (target.dataset.printTent !== undefined) {
    window.print();
  }

  if (target.dataset.reset !== undefined && confirm("Reset the demo data?")) {
    appStorage.clear();
    state = structuredClone(seedState);
    render();
    toast("Demo data reset");
  }
});

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-search]")) setState({ search: event.target.value });
  if (event.target.matches("[data-public-search]")) {
    setState({ publicSearch: event.target.value });
  }
});

document.addEventListener("change", (event) => {
  if (event.target.matches('input[name="businessType"]')) {
    const template = demoTemplates[event.target.value] || demoTemplates.lounge;
    setState({
      businessType: event.target.value,
      business: { ...state.business, ...structuredClone(template.business) },
    });
    return;
  }

  if (event.target.matches("[data-status]")) {
    const id = event.target.dataset.status;
    setState({
      items: state.items.map((item) =>
        item.id === id ? { ...item, status: event.target.value } : item,
      ),
    });
    toast("Availability updated");
  }
});

document.addEventListener("submit", (event) => {
  event.preventDefault();
  if (event.target.matches("[data-auth-form]")) {
    const data = Object.fromEntries(new FormData(event.target).entries());
    const businessName = data.business?.trim();
    setState({
      session: { email: data.email.trim(), role: "Owner" },
      business: businessName ? { ...state.business, name: businessName } : state.business,
      onboardingComplete: false,
      view: "dashboard",
    });
    toast("Signed in");
    return;
  }
  if (event.target.matches("[data-onboarding-form]")) {
    launchWorkspace(event.target);
    return;
  }
  if (event.target.matches("[data-item-form]")) upsertItem(event.target);
  if (event.target.matches("[data-business-form]")) saveBusiness(event.target);
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

render();
