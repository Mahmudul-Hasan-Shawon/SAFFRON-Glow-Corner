/* ==============================================================
   Endpoint. NOTE: this used to be declared as `var URL`, which
   overwrote the browser's global URL constructor for the whole
   page — a landmine for any library added later.
   ============================================================== */
var API_URL = "https://script.google.com/macros/s/AKfycbxriqOAO51MW3ekmUhGZ6TWvEqgn9a7wYV6JxU5tvdkiu04VnLvlzRfi6B9JApXUXqLrg/exec";

var ALL = [], FILTERED = [], CFG = { totalProducts: 13 },
    ACTIVE_CAT = "All", SEARCH = "", LAST_ORDER = null;

/* Product details view state (replaces the old quick-view modal). */
var PP_PROD = null, PP_QTY = 1, HOME_SCROLL = 0, PAGE_TITLE = document.title;

/* Offer slides pulled from the 🎁 Offers sheet.
   null  → sheet not created yet: keep the slides hard-coded in the HTML.
   []    → sheet exists but nothing is Active: hide the whole section.
   [...] → build the slider from the sheet. */
var OFFERS = null;

/* localStorage can throw (private mode, blocked storage) and a
   corrupted value used to kill the whole script at parse time,
   leaving a blank page. */
function lsGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
function lsSet(key, val) { try { localStorage.setItem(key, val); } catch (e) { /* storage unavailable */ } }

var CART = (function () {
    try {
        var v = JSON.parse(lsGet("sgc_cart") || "[]");
        return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
})();

/* Availability follows ONLY the Status column in the Products sheet
   (p.inStock / p.stockStatus from the backend). Stock Qty is display
   info, never the deciding factor. */
function getStockInfo(p) {
    if (!p.inStock) {
        return {
            cls: "out",
            label: "Out of Stock",
            icon: '<i class="fa-solid fa-circle-xmark" style="color: #B94A48;"></i>'
        };
    }

    if (String(p.stockStatus || "").toLowerCase().indexOf("low") !== -1) {
        return {
            cls: "low",
            label: "Low Stock",
            icon: ""
        };
    }

    return {
        cls: "in",
        label: "In Stock",
        icon: '<i class="fa-solid fa-circle-check" style="color: #228748;"></i>'
    };
}

/* Qty cap for steppers/cart. When the sheet says In Stock with Qty 0,
   the count is stale — allow ordering anyway instead of blocking. */
function maxQty(p) { return (p && p.stockQty > 0) ? p.stockQty : 99; }






var IMGS = { d: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format", s: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format", c: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab12?w=500&auto=format", cl: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&auto=format", t: "https://images.unsplash.com/photo-1570194065650-d99fb4b8ccb0?w=500&auto=format", sun: "https://images.unsplash.com/photo-1556228852-6d35a585d566?w=500&auto=format", bb: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&auto=format" };
function getImg(p) { if (p.imageUrl && p.imageUrl.indexOf("http") === 0) return p.imageUrl; var t = (p.title + " " + p.category).toLowerCase(); if (t.indexOf("serum") !== -1) return IMGS.s; if (t.indexOf("cream") !== -1) return IMGS.c; if (t.indexOf("cleanser") !== -1) return IMGS.cl; if (t.indexOf("toner") !== -1) return IMGS.t; if (t.indexOf("sunscreen") !== -1 || t.indexOf("sunblock") !== -1) return IMGS.sun; if (t.indexOf("bb") !== -1 || t.indexOf("boomer") !== -1) return IMGS.bb; if (t.indexOf("essence") !== -1) return IMGS.s; return IMGS.d; }
/* Grouped manually rather than via toLocaleString(), whose digits
   follow the device locale — a phone set to Bangla rendered Bengali
   numerals here while the emailed invoice used Latin ones. */
function money(n) {
    n = Math.round(Number(n) || 0);
    var neg = n < 0, s = String(Math.abs(n)), out = "";
    while (s.length > 3) { out = "," + s.slice(-3) + out; s = s.slice(0, -3); }
    return (neg ? "-" : "") + s + out;
}
function fmt(n) { var sym = CFG.currencySymbol || "\u09F3"; return sym + money(n); }
function $(i) { return document.getElementById(i); }
function show(i) { $(i).classList.remove("hidden"); }
function hide(i) { $(i).classList.add("hidden"); }

/* ── Escaping ────────────────────────────────────────────────
   Everything below is written into innerHTML. Product titles,
   categories and — on the tracking screen — customer-entered
   addresses all come from outside this page, so they get escaped
   before they touch the DOM. */
var ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
function esc(s) {
    return String(s === null || s === undefined ? "" : s)
        .replace(/[&<>"']/g, function (c) { return ESC_MAP[c]; });
}
// For values dropped inside a single-quoted JS string in an inline
// handler: escape for JS first, then for HTML.
function jsStr(s) {
    return esc(String(s === null || s === undefined ? "" : s)
        .replace(/\\/g, "\\\\").replace(/'/g, "\\'"));
}
function trunc(s, n) {
    s = String(s || "");
    return s.length > n ? s.slice(0, n).trim() + "…" : s;
}

var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── Background scroll lock ──────────────────────────────────
   Without this the page scrolled behind every open drawer/modal. */
var LOCK_IDS = ["cart", "side-panel", "modal-veil", "checkout-veil", "success-veil", "track-veil", "inv-veil"];
function syncOverlayLock() {
    var open = LOCK_IDS.some(function (id) {
        var el = $(id);
        return el && el.classList.contains("on");
    });
    document.documentElement.classList.toggle("ovl-open", open);
    document.body.classList.toggle("ovl-open", open);

    /* Lenis keeps consuming wheel events behind the veil even though
       html{overflow:hidden} makes window.scrollTo() a no-op — its internal
       animatedScroll drifts and the page snaps on close. Park it instead. */
    if (window.lenis) {
        if (open) {
            window.lenis.stop();
        } else {
            window.lenis.start();
            window.lenis.resize();
        }
    }
}

/* Panes that scroll inside an overlay. Lenis checks the event's composed
   path for data-lenis-prevent and bails out before preventDefault(), so
   native scrolling works inside these — even while Lenis is stopped. */
var LENIS_PANES = ["#cart-body", ".sp-body", ".modal-info", "#modal", "#checkout-box", "#success-box", "#track-box", "#inv-box"];
function tagLenisPanes() {
    LENIS_PANES.forEach(function (sel) {
        document.querySelectorAll(sel).forEach(function (el) {
            el.setAttribute("data-lenis-prevent", "");
        });
    });
}

/* ── Motion helpers ─────────────────────────────── */
var _revealObs = null;
function initReveal() {
    if (REDUCED || !("IntersectionObserver" in window)) {
        document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
        return;
    }
    _revealObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            var el = en.target;
            _revealObs.unobserve(el);
            var d = parseInt(el.getAttribute("data-delay"), 10) || 0;
            if (d > 0) setTimeout(function () { el.classList.add("in"); }, d);
            else el.classList.add("in");
        });
    }, { threshold: .12, rootMargin: "0px 0px -40px 0px" });
    document.querySelectorAll(".reveal").forEach(function (el) { _revealObs.observe(el); });
}
function observeNew(nodes) {
    if (REDUCED || !_revealObs) { nodes.forEach(function (n) { n.classList.add("in"); }); return; }
    nodes.forEach(function (n) { _revealObs.observe(n); });
}

function countUp(el, target, dur) {
    if (!el) return;
    target = Number(target) || 0;
    if (REDUCED) { el.textContent = target; return; }
    var start = 0, t0 = performance.now(); dur = dur || 1400;
    function step(now) {
        var p = Math.min((now - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(start + (target - start) * eased);
        if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function makeSparks() {
    if (REDUCED) return;
    var host = $("sparks"); if (!host) return;
    var h = "";
    for (var i = 0; i < 14; i++) {
        var size = 4 + Math.random() * 8;
        var left = Math.random() * 100;
        var dur = 9 + Math.random() * 10;
        var delay = Math.random() * 12;
        h += '<span class="spark" style="width:' + size.toFixed(1) + 'px;height:' + size.toFixed(1) + 'px;left:' + left.toFixed(1) + '%;animation-duration:' + dur.toFixed(1) + 's;animation-delay:-' + delay.toFixed(1) + 's;opacity:' + (0.25 + Math.random() * 0.4).toFixed(2) + '"></span>';
    }
    host.innerHTML = h;
}

function initScrollFx() {
    var bar = $("scroll-bar"), nav = $("navbar"), top = $("to-top"), ticking = false;
    if (!bar || !nav || !top) return;
    function onScroll() {
        if (ticking) return; ticking = true;
        requestAnimationFrame(function () {
            var y = window.scrollY || document.documentElement.scrollTop;
            var max = document.documentElement.scrollHeight - window.innerHeight;
            bar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
            nav.classList.toggle("stuck", y > 24);
            top.classList.toggle("on", y > 620);
            ticking = false;
        });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();
}

function flyToCart(srcEl) {
    if (REDUCED || !srcEl) return;
    // Target the cart button itself — the count badge is hidden while
    // the bag is empty, so the very first add had no animation.
    var target = window.innerWidth <= 768 ? $("mbn-cart") : $("cart-btn");
    if (!target) return;
    var a = srcEl.getBoundingClientRect(), b = target.getBoundingClientRect();
    if (!b.width || !a.width) return;
    var dot = document.createElement("div");
    dot.style.cssText = "position:fixed;left:" + (a.left + a.width / 2 - 9) + "px;top:" + (a.top + a.height / 2 - 9) + "px;width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#7A3D28,#B8674F);z-index:999;pointer-events:none;box-shadow:0 6px 18px rgba(184,103,79,.6);transition:transform .75s cubic-bezier(.55,-.2,.35,1),opacity .75s ease";
    document.body.appendChild(dot);
    requestAnimationFrame(function () {
        dot.style.transform = "translate(" + (b.left + b.width / 2 - a.left - a.width / 2) + "px," + (b.top + b.height / 2 - a.top - a.height / 2) + "px) scale(.3)";
        dot.style.opacity = "0";
    });
    setTimeout(function () { dot.remove(); }, 800);
}

function bumpCartIcon() {
    var els = [$("cart-cnt"), $("mbn-cart-cnt")];
    els.forEach(function (el) {
        if (!el || el.classList.contains("hidden")) return;
        el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
    });
}

document.addEventListener("DOMContentLoaded", function () {
    renderBadge(); makeSparks(); initReveal(); initScrollFx(); tagLenisPanes();
    buildOfferSlider();                       // hard-coded slides until sheet data arrives
    /* Offline-friendly asset cache. Safe to ignore when SW is
       unsupported/unavailable — the site just loads normally. */
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", function () {
            navigator.serviceWorker.register("./sw.js").catch(function () { /* ignored */ });
        });
    }
    window.addEventListener("hashchange", handleRoute);
    if ($("product-grid")) loadData();
    if ($("gallery-grid")) initGallery();
    document.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;
        // Close only the topmost layer so Escape doesn't nuke everything.
        if ($("inv-veil") && $("inv-veil").classList.contains("on")) { closeInvoice(); return; }
        if ($("track-veil") && $("track-veil").classList.contains("on")) { closeTrack(); return; }
        if ($("success-veil") && $("success-veil").classList.contains("on")) { closeSuccess(); return; }
        if ($("checkout-veil") && $("checkout-veil").classList.contains("on")) { closeCheckout(); return; }
        if ($("side-panel") && $("side-panel").classList.contains("on")) { closeSidePanel(); return; }
        if ($("cart") && $("cart").classList.contains("on")) { closeCart(); return; }
        if (PP_PROD) { closeProduct(); }
    });
});

/* ── Networking ────────────────────────────────────────────── */
function fetchJson(url, opts, ms) {
    opts = opts || {};
    opts.redirect = "follow";
    ms = ms || 25000;
    var ctl = ("AbortController" in window) ? new AbortController() : null;
    if (ctl) opts.signal = ctl.signal;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, ms);

    return fetch(url, opts)
        .then(function (r) { return r.text(); })
        .then(function (t) {
            clearTimeout(timer);
            var d;
            try { d = JSON.parse(t); }
            catch (e) { throw new Error("The server returned an unexpected response. Please try again."); }
            if (d && d.error) throw new Error(d.error);
            return d;
        })
        .catch(function (e) {
            clearTimeout(timer);
            if (e && e.name === "AbortError") throw new Error("Request timed out. Please check your connection.");
            throw e;
        });
}

/* Shop data comes from a single Google Apps Script fetch. Bump this
   version whenever the shape of the cached payload changes so old
   browsers don't keep serving stale structure. */
var SHOP_CACHE_KEY = "sgc_shop_v1";

function loadData() {
    hide("error-state"); hide("empty-state"); hide("product-grid");

    // 1. Instant paint from cache — no spinner so returning users see
    //    the shop immediately instead of a flashing loader.
    var cached = null;
    try { cached = JSON.parse(lsGet(SHOP_CACHE_KEY) || "null"); } catch (e) { cached = null; }
    var hasCache = !!(cached && Array.isArray(cached.products) && cached.products.length);
    if (hasCache) {
        applyShopData(cached.products, cached.config, cached.offers, false);
    } else {
        show("loading-state");
    }

    // 2. Fetch fresh data in the background, then refresh cache + DOM.
    fetchJson(API_URL + "?action=getAll").then(function (d) {
        var fresh = { products: (d && d.products) || [], config: (d && d.config) || {}, offers: (d && d.offers !== undefined) ? d.offers : null };
        lsSet(SHOP_CACHE_KEY, JSON.stringify(fresh));
        applyShopData(fresh.products, fresh.config, fresh.offers, true);
    }).catch(function (e) {
        // Cache already served: keep the shop up and quietly note the miss.
        if (hasCache) return;
        hide("loading-state");
        $("err-msg").textContent = (e && e.message) || "Connection failed.";
        show("error-state");
    });
}

/* Applies a resolved-to-shape data set. `fromCache` lets us skip the
   spinner vanish (already handled by us on the network path) and only
   re-render when something actually changed, avoiding flicker on
   repeat visits. The loading box always gets hidden — a visible cache
   paint must never sit underneath the default-on spinner. */
function applyShopData(products, config, offers, fromNetwork) {
    ALL = products || [];
    CFG = config || { totalProducts: 13 };
    if (!CFG.totalProducts || CFG.totalProducts < 1) CFG.totalProducts = 13;
    OFFERS = (offers !== undefined) ? offers : null;

    hide("loading-state");
    applyConfig(); buildPills(); reconcileCart(); applyFilters();
    initOffers();
    handleRoute();   // someone may have opened/shared a #product-N link directly
}

// Silent refresh so stock levels reflect a just-placed order.
function refreshProducts() {
    fetchJson(API_URL + "?action=getProducts").then(function (d) {
        if (!Array.isArray(d)) return;
        ALL = d;
        reconcileCart();
        applyFilters();
        // Keep an open product page in sync with the just-updated stock.
        if (PP_PROD) {
            var fresh = findProduct(PP_PROD.id);
            if (fresh) fillProductPage(fresh);
        }
    }).catch(function () { /* non-critical */ });
}

/* The cart lives in localStorage, so it can hold products that were
   deleted, repriced, or sold out since the last visit. */
function reconcileCart() {
    if (!CART.length || !ALL.length) return;
    var byId = {};
    ALL.forEach(function (p) { byId[p.id] = p; });
    var changed = false, removed = 0, clamped = 0;

    CART = CART.filter(function (i) {
        var p = byId[i.id];
        if (!p || !p.inStock) { removed++; changed = true; return false; }   // Status decides
        var price = p.displayPrice || p.offerPrice || p.oldPrice;
        if (i.offerPrice !== price) { i.offerPrice = price; changed = true; }
        i.title = p.title; i.brand = p.brand; i.size = p.size; i.sku = p.sku;
        i.oldPrice = p.oldPrice; i.hasDiscount = p.hasDiscount; i.imageUrl = getImg(p);
        if (i.qty > maxQty(p)) { i.qty = maxQty(p); clamped++; changed = true; }
        return true;
    });

    if (!changed) return;
    saveCart(); renderBadge();
    if ($("cart") && $("cart").classList.contains("on")) renderCartUI(); else updateCartFooter();
    if (removed || clamped) showToast("Your bag was updated to match current stock", true);
}

function waLink(num) {
    var d = String(num || "").replace(/\D/g, "");
    if (!d) return "";
    if (d.indexOf("880") === 0) return "https://wa.me/" + d;
    if (d.charAt(0) === "0") return "https://wa.me/88" + d;      // 01XXXXXXXXX
    if (d.length <= 10) return "https://wa.me/88" + d;
    return "https://wa.me/" + d;                                  // already international
}

function applyConfig() {
    var c = CFG;
    if (c.siteTitle && $("site-logo")) {
        document.title = c.siteTitle;
        $("site-logo").textContent = c.siteTitle;
    }

    var wa = c.whatsAppNumber || c.whatsappNumber;
    var href = waLink(wa);
    if (href) {
        if ($("wa-btn")) $("wa-btn").href = href;
        if ($("mbn-chat")) $("mbn-chat").href = href;
        var wf = $("wa-footer"); if (wf) wf.href = href;
    }

    var brands = {}; ALL.forEach(function (p) { if (p.brand) brands[p.brand] = 1; });
    countUp($("s-products"), ALL.length);
    countUp($("s-brands"), Object.keys(brands).length);
    var orders = document.querySelectorAll(".hero-stat strong[data-count]")[1];
    if (orders) countUp(orders, Number(c.happyOrders) || 56);
}

function buildPills() {
    if (!$("cat-pills")) return;
    var cats = ["All"], seen = {};
    ALL.forEach(function (p) { if (p.category && !seen[p.category]) { cats.push(p.category); seen[p.category] = 1; } });
    var h = "";
    cats.forEach(function (c) {
        h += '<button class="pill' + (c === "All" ? " on" : "") + '" data-cat="' + esc(c) +
            '" onclick="setCat(\'' + jsStr(c) + '\')">' + esc(c) + '</button>';
    });
    $("cat-pills").innerHTML = h;

    var fh = "";
    cats.slice(1, 7).forEach(function (c) {
        fh += '<li><a href="index.html#shop" onclick="selectCategory(\'' + jsStr(c) + '\');return false;">' + esc(c) + '</a></li>';
    });
    if (fh && $("footer-cats")) $("footer-cats").innerHTML = fh;
}

function setCat(cat) {
    if (PP_PROD) exitProductView(false);
    resetHomeHash();
    ACTIVE_CAT = cat;
    document.querySelectorAll(".pill").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-cat") === cat); });
    applyFilters(); updateClearFilterBtn();
}
/* Point the URL back to a given home route without leaving an extra
   history entry, so the bar reflects where the shopper landed after
   exiting the product view. No-op when there's no product hash yet. */
function resetHomeHash(target) {
    target = target || "home";
    if (!/^#product-\d+$/.test(location.hash || "") && location.hash !== "#" + target) return;
    if (history.replaceState) history.replaceState(null, "", location.pathname + location.search + "#" + target);
    else location.hash = target;
}

function scrollToShop() {
    if (PP_PROD) exitProductView(false);
    resetHomeHash("shop");
    if ($("shop")) { $("shop").scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" }); }
    else { window.location.href = "index.html#shop"; }
}
function openContact() {
    window.location.href = "contact.html";
}

function openSidePanel() {
    closeCart();
    var sp = $("side-panel");
    var spv = $("sp-veil");
    if (sp) sp.classList.add("on");
    if (spv) spv.classList.add("on");
    syncOverlayLock();
}
function closeSidePanel() {
    var sp = $("side-panel");
    var spv = $("sp-veil");
    if (sp) sp.classList.remove("on");
    if (spv) spv.classList.remove("on");
    syncOverlayLock();
}

function openBrandPanel() {
    var seen = {}, brands = [];
    ALL.forEach(function (p) { if (p.brand && !seen[p.brand]) { seen[p.brand] = 1; brands.push(p.brand); } });
    brands.sort(function (a, b) { return a.localeCompare(b); });
    $("sp-title").textContent = "Brands";
    if (!brands.length) { $("sp-body").innerHTML = '<p class="sp-empty">No brands available.</p>'; }
    else {
        var h = "";
        brands.forEach(function (b) {
            h += '<button class="sp-pill" onclick="selectBrand(\'' + jsStr(b) + '\')">' + esc(b) + '</button>';
        });
        $("sp-body").innerHTML = h;
    }
    openSidePanel();
}

function openCategoryPanel() {
    var seen = {}, cats = [];
    ALL.forEach(function (p) { if (p.category && !seen[p.category]) { seen[p.category] = 1; cats.push(p.category); } });
    cats.sort(function (a, b) { return a.localeCompare(b); });
    $("sp-title").textContent = "Categories";
    if (!cats.length) { $("sp-body").innerHTML = '<p class="sp-empty">No categories available.</p>'; }
    else {
        var h = "";
        cats.forEach(function (c) {
            h += '<button class="sp-pill" onclick="selectCategory(\'' + jsStr(c) + '\')">' + esc(c) + '</button>';
        });
        $("sp-body").innerHTML = h;
    }
    openSidePanel();
}

function selectBrand(brand) {
    if (PP_PROD) exitProductView(false);
    SEARCH = String(brand).toLowerCase().trim();
    $("search-inp").value = brand;
    ACTIVE_CAT = "All";
    document.querySelectorAll(".pill").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-cat") === "All"); });
    applyFilters(); updateClearFilterBtn(); closeSidePanel(); scrollToShop();
}

function selectCategory(cat) { setCat(cat); closeSidePanel(); scrollToShop(); }
function onSearch() { if (PP_PROD) exitProductView(true); resetHomeHash(); SEARCH = $("search-inp").value.toLowerCase().trim(); applyFilters(); updateClearFilterBtn(); }
function updateClearFilterBtn() { $("search-wrap").classList.toggle("has-filter", !!SEARCH || ACTIVE_CAT !== "All"); }
function clearFilter() { $("search-inp").value = ""; SEARCH = ""; setCat("All"); updateClearFilterBtn(); }

function applyFilters() {
    FILTERED = ALL.filter(function (p) {
        var mc = ACTIVE_CAT === "All" || p.category === ACTIVE_CAT;
        if (!mc) return false;
        if (!SEARCH) return true;
        var hay = (p.title + " " + p.brand + " " + p.category + " " + p.sku).toLowerCase();
        return hay.indexOf(SEARCH) !== -1;
    });
    renderGrid();
}

function renderGrid() {
    if (!$("product-grid")) return;
    $("prod-count").textContent = FILTERED.length + " product" + (FILTERED.length !== 1 ? "s" : "");
    if (!FILTERED.length) { hide("product-grid"); show("empty-state"); return; }
    hide("empty-state"); show("product-grid");
    var h = "";
    FILTERED.forEach(function (p, idx) { h += cardHTML(p, idx); });
    $("product-grid").innerHTML = h;
    observeNew(Array.prototype.slice.call($("product-grid").querySelectorAll(".card")));
}

/* One product card. Shared between the main grid and the
   "You May Also Like" strip on the product details view. */
function cardHTML(p, idx) {
    var px = p.displayPrice || p.offerPrice || p.oldPrice;
    var dis = p.inStock ? "" : "disabled";
    var si = getStockInfo(p);
    var delay = Math.min(idx, 11) * 55;
    var h = '<div class="card reveal" data-delay="' + delay + '" onclick="openProduct(' + p.id + ')">';
    h += '<div class="card-img"><img src="' + esc(getImg(p)) + '" alt="' + esc(p.title) + '" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\'' + IMGS.d + '\'"/>';
    h += '<div class="card-badges">';
    if (p.hasDiscount) h += '<span class="badge badge-sale">-' + p.discountPct + '%</span>';
    else if (si.cls === "low") h += '<span class="badge badge-low">Low Stock</span>';
    h += '</div><button class="card-quick" aria-label="Add to bag" onclick="event.stopPropagation();quickAdd(' + p.id + ',this)" ' + dis + '><i class="fa-solid fa-cart-plus"></i></button></div>';
    h += '<div class="card-body"><span class="card-brand">' + esc(p.brand) + '</span><p class="card-name">' + esc(p.title) + '</p><p class="card-size">' + esc(p.size) + '</p>';
    h += '<div class="card-pricing"><span class="p-new">' + fmt(px) + '</span>';
    if (p.hasDiscount) h += '<span class="p-old">' + fmt(p.oldPrice) + '</span>';
    h += '</div><div class="card-foot"><span class="stock-tag ' + si.cls + '">' + si.label + '</span>';
    h += '<button class="add-btn" aria-label="Add to bag" onclick="event.stopPropagation();quickAdd(' + p.id + ',this)" ' + dis + '><i class="fa-solid fa-cart-plus"></i></button></div></div></div>';
    return h;
}

function findProduct(id) {
    for (var i = 0; i < ALL.length; i++) { if (ALL[i].id === id) return ALL[i]; }
    return null;
}
function findCartItem(id) {
    for (var i = 0; i < CART.length; i++) { if (CART[i].id === id) return CART[i]; }
    return null;
}

/* ═════════════════════════════════════════════════════════════
   PRODUCT DETAILS VIEW
   One in-page "product page" rendered instantly with JS — no
   modal and no separate HTML file per product. The URL hash
   (#product-12) drives it, so browser Back/Forward and shared
   links all work, while everything stays on index.html.
   ═════════════════════════════════════════════════════════════ */

function openProduct(id) {
    var p = findProduct(id);
    if (!p) return;
    if (!PP_PROD) HOME_SCROLL = window.scrollY || 0;  // remember where the shopper was
    if (location.hash === "#product-" + id) { handleRoute(); }
    else { location.hash = "product-" + id; }         // handleRoute() fires via hashchange
}

function closeProduct() {
    // Replace the hash instead of pushing "#shop", so Back doesn't
    // bounce the user through a stack of product hashes.
    exitProductView(false);
    if (history.replaceState) history.replaceState(null, "", location.pathname + location.search + "#shop");
    else location.hash = "shop";
    if ($("shop")) $("shop").scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" });
}

function ppGoCategory() {
    var cat = PP_PROD ? PP_PROD.category : "All";
    closeProduct();
    if (cat) setCat(cat);
}

/* Central router — runs on load and on every hash change. */
function handleRoute() {
    var m = String(location.hash || "").match(/^#product-(\d+)$/);
    if (m) {
        if (!ALL.length) return;              // data still loading; loadData() re-runs this
        var p = findProduct(Number(m[1]));
        if (p) { showProductView(p); return; }
        showToast("Product not found", true); // stale/shared link to a removed product
    }
    if (PP_PROD) exitProductView(true);
}

var HOME_SECTIONS = ["hero", "offers", "shop"];

function showProductView(p) {
    var firstOpen = !PP_PROD;
    PP_PROD = p; PP_QTY = 1;
    fillProductPage(p);
    HOME_SECTIONS.forEach(function (id) { var el = $(id); if (el) el.classList.add("route-hidden"); });
    show("product-page");
    document.title = p.title + " \u2014 " + (CFG.siteTitle || PAGE_TITLE);
    if (firstOpen || REDUCED) window.scrollTo(0, 0);
    else window.scrollTo({ top: 0, behavior: "smooth" });
}

function exitProductView(restoreScroll) {
    if (!PP_PROD) return;
    PP_PROD = null;
    hide("product-page");
    HOME_SECTIONS.forEach(function (id) { var el = $(id); if (el) el.classList.remove("route-hidden"); });
    initOffers();                              // re-applies "hide section" if sheet says so
    document.title = CFG.siteTitle || PAGE_TITLE;
    if (restoreScroll) window.scrollTo(0, HOME_SCROLL);
}

function fillProductPage(p) {
    var px = p.displayPrice || p.offerPrice || p.oldPrice;
    var si = getStockInfo(p);

    $("pp-img").src = getImg(p); $("pp-img").alt = p.title;
    $("pp-crumb-cat").textContent = p.category || "Products";
    $("pp-crumb-name").textContent = trunc(p.title, 40);
    $("pp-brand").textContent = p.brand + (p.category ? " \u00b7 " + p.category : "");
    $("pp-name").textContent = p.title;
    $("pp-sku").textContent = p.sku ? "SKU: " + p.sku : "";
    $("pp-price").textContent = fmt(px);
    $("pp-old").textContent = p.hasDiscount ? fmt(p.oldPrice) : "";
    $("pp-qty").textContent = PP_QTY;

    var db = $("pp-disc");
    if (p.hasDiscount) { db.textContent = "-" + p.discountPct + "%"; db.classList.remove("hidden"); }
    else { db.classList.add("hidden"); }

    var stockText = si.cls === "out" ? "Out of Stock"
        : (si.label + (p.stockQty > 0 ? " (" + p.stockQty + " units)" : ""));
    var stockIconColor = si.cls === "out" ? "var(--red)" : si.cls === "low" ? "var(--amber)" : "var(--green)";
    var stockIconClass = si.cls === "out" ? "fa-solid fa-circle-xmark" : "fa-solid fa-circle-check";
    var st = $("pp-stock");
    st.innerHTML = '<i class="' + stockIconClass + '" style="color:' + stockIconColor + ';margin-right:6px"></i>' + esc(stockText);
    st.className = "pp-stock " + si.cls;
    $("pp-add").disabled = !p.inStock;

    // Quick facts table
    $("pp-meta-brand").textContent = p.brand || "\u2014";
    $("pp-meta-cat").textContent = p.category || "\u2014";
    $("pp-meta-size").textContent = p.size || "\u2014";
    $("pp-meta-sku").textContent = p.sku || "\u2014";
    // $("pp-short").textContent = p.size ? p.size : "";

    // Full description from the sheet's Description column, parsed into
    // styled sections (For / Ingredients / Benefits / How to Use / FAQ ...).
    renderDescription(p);

    renderRelated(p);
}

function renderRelated(p) {
    var wrap = $("pp-related-wrap"), grid = $("pp-related");
    if (!wrap || !grid) return;
    var rel = ALL.filter(function (x) { return x.id !== p.id && x.category === p.category; });
    if (rel.length < 4) {
        ALL.forEach(function (x) {
            if (x.id === p.id) return;
            if (rel.indexOf(x) !== -1) return;
            if (x.brand === p.brand && rel.length < 4) rel.push(x);
        });
    }
    if (rel.length < 4) {   // small catalogues: pad with anything else in stock
        ALL.forEach(function (x) {
            if (x.id === p.id) return;
            if (rel.indexOf(x) !== -1) return;
            if (x.inStock && rel.length < 4) rel.push(x);
        });
    }
    rel = rel.slice(0, 4);
    if (!rel.length) { wrap.classList.add("hidden"); return; }
    wrap.classList.remove("hidden");
    var h = "";
    rel.forEach(function (x, i) { h += cardHTML(x, i); });
    grid.innerHTML = h;
    observeNew(Array.prototype.slice.call(grid.querySelectorAll(".card")));
}

/* ═════════════════════════════════════════════════════════════
   DESCRIPTION PARSER
   One Google Sheets cell → structured, styled sections.

   Rules (all case-insensitive):
   • Text before the first heading = intro paragraphs.
   • A line like "Ingredients:" starts a section. Content may also sit
     on the same line after the colon ("For: Male, Female").
   • Known headings get special layouts:
       For / Suitable For          → pills
       Ingredients / Key Ingredients → pills
       Benefits / Key Features / Features / Highlights → checklist
       How to Use / Usage / Directions → numbered steps
       FAQ / FAQs                  → accordion (question line, then
                                     "Answer: ..." / "A: ..." lines)
   • Any other short "Something:" line becomes a plain titled section.
   • A heading with nothing under it produces NO output at all.
   ═════════════════════════════════════════════════════════════ */

var DESC_SECTIONS = [
    { keys: ["for", "suitable for"], type: "pills", label: "For", icon: "fa-solid fa-user-check" },
    // { keys: ["ingredients", "key ingredients"],                type: "list", label: "Ingredients",  icon: "fa-solid fa-leaf" },
    { keys: ["ingredients", "key ingredients"], type: "ingredients", label: "Ingredients", icon: "fa-solid fa-leaf" },
    { keys: ["benefits", "key benefits"], type: "list", label: "Benefits", icon: "fa-solid fa-star" },
    { keys: ["key features", "features", "highlights"], type: "list", label: "Key Features", icon: "fa-solid fa-wand-magic-sparkles" },
    { keys: ["how to use", "usage", "directions", "how to apply"], type: "steps", label: "How to Use", icon: "fa-solid fa-hand-sparkles" },
    { keys: ["faq", "faqs"], type: "faq", label: "FAQ", icon: "fa-solid fa-circle-question" }
];

// "Ingredients:"  /  "For: Male, Female"  → { def|null, label, inline }
function matchHeading(line) {
    var m = line.match(/^([A-Za-z][A-Za-z /&'-]{0,40})\s*:\s*(.*)$/);
    if (!m) return null;
    var label = m[1].trim(), inline = m[2].trim(), low = label.toLowerCase();
    // "Answer:" belongs to FAQ content, never starts a section.
    if (low === "answer" || low === "a" || low === "q" || low === "question") return null;
    for (var i = 0; i < DESC_SECTIONS.length; i++) {
        if (DESC_SECTIONS[i].keys.indexOf(low) !== -1) {
            return { def: DESC_SECTIONS[i], label: DESC_SECTIONS[i].label, inline: inline };
        }
    }
    // Unknown heading: only treat as one when the line is JUST the label,
    // so a sentence like "Note: shake well before use." stays a paragraph.
    if (!inline && label.split(/\s+/).length <= 5) {
        return { def: null, label: label, inline: "" };
    }
    return null;
}

function parseDescription(text) {
    var lines = String(text || "").replace(/\r/g, "").split("\n");
    var intro = [], sections = [], cur = null;

    function pushLine(line) {
        if (cur) cur.lines.push(line);
        else intro.push(line);
    }

    lines.forEach(function (raw) {
        var line = raw.trim();
        if (!line) { pushLine(""); return; }
        var h = matchHeading(line);
        if (h) {
            cur = { def: h.def, label: h.label, lines: [] };
            sections.push(cur);
            if (h.inline) cur.lines.push(h.inline);
        } else {
            pushLine(line);
        }
    });

    // Intro → paragraphs (blank line = new paragraph)
    var paras = [], buf = [];
    intro.forEach(function (l) {
        if (l === "") { if (buf.length) { paras.push(buf.join(" ")); buf = []; } }
        else buf.push(l);
    });
    if (buf.length) paras.push(buf.join(" "));

    // Drop sections that ended up with no real content (rule #6)
    sections = sections.filter(function (s) {
        return s.lines.some(function (l) { return l !== ""; });
    });

    return { intro: paras, sections: sections };
}

/* ── section renderers ─────────────────────────────────────── */

function descItems(lines, splitCommas) {
    var items = [];
    lines.forEach(function (l) {
        if (!l) return;
        l = l.replace(/^[-•*\u2022]\s*/, "");
        if (splitCommas && l.indexOf(",") !== -1) {
            l.split(",").forEach(function (x) { x = x.trim(); if (x) items.push(x); });
        } else if (l) items.push(l);
    });
    return items;
}

function descFaqPairs(lines) {
    var pairs = [], q = null, a = [];
    function flush() {
        if (q !== null) pairs.push({ q: q, a: a.join(" ").trim() });
        q = null; a = [];
    }
    lines.forEach(function (l) {
        if (!l) return;
        var am = l.match(/^(?:answer|a)\s*:\s*(.*)$/i);
        var qm = l.match(/^(?:question|q)\s*:\s*(.*)$/i);
        if (am) { a.push(am[1]); return; }
        if (qm) { flush(); q = qm[1]; return; }
        if (q === null) { q = l; }               // first line = a question
        else if (a.length) { flush(); q = l; }   // new question after an answer
        else { a.push(l); }                      // continuation w/o "Answer:" prefix
    });
    flush();
    return pairs.filter(function (p) { return p.q && p.a; });
}

function renderDescription(p) {
    var descEl = $("pp-desc");
    var parsed = parseDescription(p.description);
    var h = "";

    parsed.intro.forEach(function (para) {
        h += '<p class="pd-para">' + esc(para) + "</p>";
    });

    parsed.sections.forEach(function (s) {
        var type = s.def ? s.def.type : "text";
        var icon = s.def ? s.def.icon : "fa-solid fa-circle-info";
        var body = "";

        if (type === "pills") {
            var pills = descItems(s.lines, true);
            if (!pills.length) return;

            body = '<div class="pd-pills">' + pills.map(function (x) {
                return '<span class="pd-pill">' + esc(x) + "</span>";
            }).join("") + "</div>";

        } else if (type === "ingredients") {
            var ingredients = s.lines.filter(function (l) { return l; });
            if (!ingredients.length) return;

            body = ingredients.map(function (l) {
                return '<p class="pd-para">' + esc(l) + "</p>";
            }).join("");

        } else if (type === "list") {
            var items = descItems(s.lines, false);
            if (!items.length) return;

            body = '<ul class="pd-list">' + items.map(function (x) {
                return '<li><i class="fa-solid fa-circle-check"></i><span>' + esc(x) + "</span></li>";
            }).join("") + "</ul>";

        } else if (type === "steps") {
            var steps = descItems(s.lines, false);
            if (!steps.length) return;
            body = '<ol class="pd-steps">' + steps.map(function (x, i) {
                return '<li><span class="pd-step-no">' + (i + 1) + "</span><span>" + esc(x) + "</span></li>";
            }).join("") + "</ol>";
        } else if (type === "faq") {
            var pairs = descFaqPairs(s.lines);
            if (!pairs.length) return;
            body = '<div class="pd-faq">' + pairs.map(function (x) {
                return '<div class="pd-faq-item" onclick="this.classList.toggle(\'open\')">'
                    + '<div class="pd-faq-q"><span>' + esc(x.q) + '</span><i class="fa-solid fa-chevron-down"></i></div>'
                    + '<div class="pd-faq-a"><p>' + esc(x.a) + "</p></div></div>";
            }).join("") + "</div>";
        } else {
            var txt = s.lines.filter(function (l) { return l; });
            if (!txt.length) return;
            body = txt.map(function (l) { return '<p class="pd-para">' + esc(l) + "</p>"; }).join("");
        }

        h += '<div class="pd-section"><h3 class="pd-title"><i class="' + icon + '"></i> '
            + esc(s.label) + "</h3>" + body + "</div>";
    });

    if (!h) {
        h = '<p class="pd-para">' + esc(p.brand + " " + p.title + (p.size ? " \u2014 " + p.size : "")) +
            ". Message us on WhatsApp for full product details.</p>";
    }
    descEl.innerHTML = h;
    show("pp-desc-wrap");
}

function ppQty(d) {
    if (!PP_PROD) return;
    var prev = PP_QTY;
    PP_QTY = Math.max(1, Math.min(PP_QTY + d, maxQty(PP_PROD)));
    var el = $("pp-qty"); el.textContent = PP_QTY;
    if (prev !== PP_QTY && !REDUCED) { el.style.animation = "none"; void el.offsetWidth; el.style.animation = "popIn .35s cubic-bezier(.34,1.56,.64,1) both"; }
}

function addFromPage() {
    if (!PP_PROD) return;
    flyToCart($("pp-add"));
    addToCart(PP_PROD.id, PP_QTY);
}

function quickAdd(id, el) { if (el) flyToCart(el); addToCart(id, 1); }

function addToCart(id, qty) {
    qty = qty || 1;
    var p = findProduct(id);
    if (!p || !p.inStock) { showToast("Out of stock!", true); return; }
    var ex = findCartItem(id);
    var nq = (ex ? ex.qty : 0) + qty;
    if (nq > maxQty(p)) { showToast("Only " + maxQty(p) + " available", true); return; }
    if (ex) { ex.qty = nq; }
    else {
        CART.push({
            id: p.id, title: p.title, brand: p.brand,
            offerPrice: p.displayPrice || p.offerPrice, oldPrice: p.oldPrice,
            hasDiscount: p.hasDiscount, imageUrl: getImg(p), sku: p.sku, size: p.size, qty: qty
        });
    }
    saveCart();
    if (ex && $("cart-body") && $("cart-body").querySelector('.ci[data-id="' + id + '"]')) { patchCartRow(id); updateCartFooter(); renderBadge(); }
    else { renderCartUI(); }
    bumpCartIcon();
    showToast(trunc(p.title, 30) + " added!");
}

function changeQty(id, d) {
    var item = findCartItem(id), prod = findProduct(id);
    if (!item) return;
    var nq = item.qty + d;
    if (nq <= 0) { removeItem(id); return; }
    if (prod && nq > prod.stockQty) { showToast("Not enough stock", true); return; }
    item.qty = nq; saveCart();
    // Patch just this row — rebuilding innerHTML would replay the entry
    // animation and force the thumbnails to repaint (the flicker).
    patchCartRow(id); updateCartFooter(); renderBadge();
}

function patchCartRow(id) {
    var row = $("cart-body").querySelector('.ci[data-id="' + id + '"]');
    if (!row) return false;
    var item = findCartItem(id);
    if (!item) return false;
    var qn = row.querySelector(".q-n"), tot = row.querySelector(".ci-tot");
    if (qn) { qn.textContent = item.qty; flash(qn); }
    if (tot) { tot.textContent = fmt(item.offerPrice * item.qty); flash(tot); }
    return true;
}

function flash(el) {
    if (REDUCED || !el) return;
    el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
}

function updateCartFooter() {
    var foot = $("cart-foot");
    if (!foot) return;
    if (!CART.length) { foot.style.display = "none"; return; }
    var t = getTotals();
    $("cf-sub").textContent = fmt(t.sub);
    $("cf-del").textContent = "Calculated at checkout";
    $("cf-tot").textContent = fmt(t.sub);
    foot.style.display = "";
}

function removeItem(id) {
    CART = CART.filter(function (c) { return c.id !== id; });
    saveCart(); renderBadge(); updateCartFooter();
    var row = $("cart-body").querySelector('.ci[data-id="' + id + '"]');
    if (!row) { renderCartUI(); return; }
    if (REDUCED) { row.remove(); if (!CART.length) renderCartUI(); return; }
    row.style.maxHeight = row.offsetHeight + "px";
    requestAnimationFrame(function () {
        row.classList.add("removing");
        setTimeout(function () {
            row.remove();
            if (!CART.length) renderCartUI();
        }, 340);
    });
}

function saveCart() { lsSet("sgc_cart", JSON.stringify(CART)); }
function getDelivery(loc) { if (!loc) return 0; return loc === "inside" ? (Number(CFG.insideDhakaCharge) || 60) : (Number(CFG.outsideDhakaCharge) || 120); }
function getTotals(loc) { var sub = 0; CART.forEach(function (i) { sub += i.offerPrice * i.qty; }); var del = getDelivery(loc); return { sub: sub, del: del, tot: sub + del }; }

function renderCartUI() {
    renderBadge();
    var body = $("cart-body");
    if (!body) return;
    var foot = $("cart-foot");
    if (!CART.length) {
        body.innerHTML = '<div class="cart-empty"><i class="fa fa-bag-shopping"></i><p>Your bag is empty</p><button class="btn-shop" onclick="closeCart()">Continue Shopping</button></div>';
        if (foot) foot.style.display = "none";
        return;
    }
    var h = "";
    CART.forEach(function (i) {
        h += '<div class="ci" data-id="' + i.id + '"><img class="ci-img" src="' + esc(i.imageUrl) + '" alt="' + esc(i.title) + '" onerror="this.onerror=null;this.src=\'' + IMGS.d + '\'"/>';
        h += '<div class="ci-info"><p class="ci-name">' + esc(i.title) + '</p><p><span class="ci-price">' + fmt(i.offerPrice) + '</span>';
        if (i.hasDiscount) h += '<span class="ci-price-old">' + fmt(i.oldPrice) + '</span>';
        h += '</p><div class="ci-row"><button class="q-btn" aria-label="Decrease quantity" onclick="changeQty(' + i.id + ',-1)">\u2212</button><span class="q-n">' + i.qty + '</span><button class="q-btn" aria-label="Increase quantity" onclick="changeQty(' + i.id + ',1)">+</button><button class="ci-rm" onclick="removeItem(' + i.id + ')">Remove</button></div></div>';
        h += '<span class="ci-tot">' + fmt(i.offerPrice * i.qty) + '</span></div>';
    });
    body.innerHTML = h;
    updateCartFooter();
}

function renderBadge() {
    var n = 0; CART.forEach(function (i) { n += i.qty; });
    var b = $("cart-cnt");
    if (b) { b.textContent = n; b.classList.toggle("hidden", n <= 0); }
    var mb = $("mbn-cart-cnt");
    if (mb) { mb.textContent = n; mb.classList.toggle("hidden", n <= 0); }
}

function openCart() {
    // Only close side panel if it exists and is open
    var sp = $("side-panel");
    var spv = $("sp-veil");
    if (sp && sp.classList.contains("on")) {
        sp.classList.remove("on");
        if (spv) spv.classList.remove("on");
        syncOverlayLock();
    }
    renderCartUI();
    var cart = $("cart");
    var veil = $("cart-veil");
    if (cart) cart.classList.add("on");
    if (veil) veil.classList.add("on");
    syncOverlayLock();
}
function closeCart() {
    var cart = $("cart");
    var veil = $("cart-veil");
    if (cart) cart.classList.remove("on");
    if (veil) veil.classList.remove("on");
    syncOverlayLock();
}
function toggleCart() {
    var cart = $("cart");
    if (!cart) return;
    if (cart.classList.contains("on")) closeCart();
    else openCart();
}

function openCheckout() {
    if (!CART.length) return;
    closeCart();
    updateCoTotals();
    $("checkout-veil").classList.add("on");
    syncOverlayLock();
}
function closeCheckout() { $("checkout-veil").classList.remove("on"); syncOverlayLock(); }
function onCoVeilClick(e) { if (e.target === $("checkout-veil")) closeCheckout(); }
function onLocChange() { updateCoTotals(); }

function updateCoTotals() {
    var loc = $("co-loc").value; var t = getTotals(loc);
    $("co-sub").textContent = fmt(t.sub);
    $("co-del").textContent = t.del > 0 ? fmt(t.del) : "TBD";
    $("co-del-lbl").textContent = loc === "outside" ? "Delivery (Outside)" : loc === "inside" ? "Delivery (Inside)" : "Delivery";
    $("co-tot").textContent = fmt(t.tot);
}

function onPayChange() {
    var m = $("co-pay").value;
    var info = $("pay-info"), txn = $("txn-wrap");
    if (m === "bKash" || m === "Nagad") {
        $("pi-title").textContent = m + " Payment";
        $("pi-num").textContent = (m === "bKash" ? (CFG.bKashAccount || CFG.bkashAccount) : CFG.nagadAccount) || "01XXXXXXXXX";
        info.classList.remove("hidden"); txn.classList.remove("hidden");
    } else {
        info.classList.add("hidden"); txn.classList.add("hidden");
    }
}

function placeOrder() {
    var fn = $("co-fn").value.trim(), ln = $("co-ln").value.trim(),
        ph = $("co-phone").value.trim(), addr = $("co-addr").value.trim(),
        loc = $("co-loc").value, pay = $("co-pay").value;
    var acc = $("co-acc").value.trim(), txn = $("co-txn").value.trim();
    var errEl = $("co-err"); errEl.classList.remove("on");

    function fail(msg) { errEl.textContent = msg; errEl.classList.add("on"); }

    if (!CART.length) { fail("Your bag is empty."); return; }
    if (!fn || !ln || !ph || !addr || !loc || !pay) { fail("Please fill in all required fields."); return; }
    if (ph.replace(/\D/g, "").length < 10) { fail("Please enter a valid contact number."); return; }
    if (addr.length < 10) { fail("Please enter a complete delivery address."); return; }
    // Mobile-wallet orders are unverifiable without these.
    if ((pay === "bKash" || pay === "Nagad") && (!acc || !txn)) {
        fail("Please enter your " + pay + " account number and transaction ID.");
        return;
    }

    var totalProds = parseInt(CFG.totalProducts, 10) || 13;
    // Never let a stale "Total Products" value truncate the array —
    // that silently dropped the sale for any higher-numbered product.
    CART.forEach(function (i) { if (i.id > totalProds) totalProds = i.id; });

    var t = getTotals(loc);
    var fullname = fn + " " + ln;
    var productsArr = [], quantities = [], totalItems = 0;
    var qtyArr = [];
    for (var z = 0; z < totalProds; z++) { qtyArr.push(0); }

    CART.forEach(function (item, x) {
        productsArr.push((x + 1) + ". " + item.title + " - " + fmt(item.offerPrice));
        quantities.push("Q-" + item.qty);
        if (item.id >= 1 && item.id <= totalProds) { qtyArr[item.id - 1] = item.qty; }
        totalItems += item.qty;
    });

    var payload = {
        action: "submitOrder", firstname: fn, lastname: ln, fullname: fullname,
        contactnumber: ph, address: addr, delivery_location: loc, services: pay,
        account_number: acc, transaction_id: txn,
        subtotal: fmt(t.sub), delivery_charge: fmt(t.del), total: fmt(t.tot),
        subtotalNum: t.sub, deliveryNum: t.del, totalNum: t.tot, calcTotal: t.tot,
        products: productsArr.join(", "), quantities: quantities,
        quantitiesArray: qtyArr,
        totalItems: totalItems, offerSubtotal: t.sub,
        formattedData: CART.map(function (i) { return i.qty; }).join(", ")
    };

    var btn = $("btn-place");
    btn.disabled = true;
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Placing Order...';
    var snap = CART.slice();

    // No Content-Type header on purpose: it keeps this a "simple"
    // request so the browser skips the CORS preflight that Apps
    // Script web apps cannot answer.
    fetchJson(API_URL, { method: "POST", body: JSON.stringify(payload) }, 40000).then(function (d) {
        LAST_ORDER = {
            orderNumber: d.orderNumber, trackingCode: d.trackingCode, fullname: fullname,
            contactnumber: ph, address: addr, delivery_location: loc, services: pay,
            account_number: acc, transaction_id: txn,
            sub: t.sub, del: t.del, tot: t.tot, snap: snap
        };
        closeCheckout();
        showSuccess(d.orderNumber, d.trackingCode, d.emailSent);
        CART = []; saveCart(); renderCartUI();
        refreshProducts();
    }).catch(function (e) {
        fail(((e && e.message) || "Could not place order.") +
            " If this keeps happening, message us on WhatsApp before re-ordering so we don't duplicate it.");
    }).then(function () {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa fa-check-circle"></i> Place Order';
    });
}

function showSuccess(orderNum, tracking, emailSent) {
    $("succ-order-id").textContent = orderNum;
    $("succ-tracking").textContent = tracking;
    var note = $("succ-note");
    if (emailSent === false) {
        note.textContent = "Your order is saved, but our confirmation email didn't go out. Please keep your tracking code and message us on WhatsApp to confirm.";
        note.classList.remove("hidden");
    } else {
        note.classList.add("hidden");
    }
    $("success-veil").classList.add("on");
    syncOverlayLock();
    confetti();
}
function closeSuccess() { $("success-veil").classList.remove("on"); syncOverlayLock(); }
function openTrackFromSuccess() { closeSuccess(); openTrack(LAST_ORDER ? LAST_ORDER.trackingCode : ""); }
// Invoice sits above the success card (z-index 650 vs 600), so the
// tracking code is still there when the customer closes it.
function openInvoiceFromSuccess() { if (LAST_ORDER) showInvoice(LAST_ORDER); }

function confetti() {
    if (REDUCED) return;
    var colors = ["#B8674F", "#D99B7C", "#C08A3E", "#FFFFFF", "#7A3D28"];
    for (var i = 0; i < 40; i++) {
        (function (i) {
            var el = document.createElement("div");
            var size = 6 + Math.random() * 7;
            el.style.cssText = "position:fixed;left:50%;top:34%;width:" + size + "px;height:" + (size * .5) + "px;background:" + colors[i % colors.length] + ";z-index:999;pointer-events:none;border-radius:2px;opacity:1;transition:transform 1.5s cubic-bezier(.2,.6,.35,1),opacity 1.5s ease";
            document.body.appendChild(el);
            requestAnimationFrame(function () {
                var x = (Math.random() - .5) * 620, y = (Math.random() - .35) * 560;
                el.style.transform = "translate(" + x + "px," + y + "px) rotate(" + (Math.random() * 900 - 450) + "deg)";
                el.style.opacity = "0";
            });
            setTimeout(function () { el.remove(); }, 1700);
        })(i);
    }
}

/* ── Track ─────────────────────────────────────────────────── */
var STATUS_ORDER = ["Processing", "Confirmed", "Packed", "Shipped", "Out for Delivery", "Delivered"];
function normStatus(s) { return String(s || "").trim().toLowerCase().replace(/\s+/g, ""); }

function openTrack(prefill) {
    $("track-err").classList.remove("on");
    $("track-result").classList.remove("on");
    $("track-inp").value = (typeof prefill === "string" ? prefill : "");
    $("track-veil").classList.add("on");
    syncOverlayLock();
    if (typeof prefill === "string" && prefill) doTrack();
}
function closeTrack() { $("track-veil").classList.remove("on"); syncOverlayLock(); }
function onTrackVeilClick(e) { if (e.target === $("track-veil")) closeTrack(); }

function doTrack() {
    var id = $("track-inp").value.trim();
    $("track-err").classList.remove("on"); $("track-result").classList.remove("on");
    if (!id) { $("track-err").textContent = "Please enter an Order ID or Tracking Code."; $("track-err").classList.add("on"); return; }
    var btn = $("btn-search");
    btn.disabled = true; btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
    fetchJson(API_URL + "?action=trackOrder&id=" + encodeURIComponent(id)).then(function (d) {
        if (!d.found) throw new Error(d.error || "Order not found.");
        renderTrackResult(d);
    }).catch(function (e) {
        $("track-err").textContent = (e && e.message) || "Could not connect. Please try again.";
        $("track-err").classList.add("on");
    }).then(function () {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa fa-magnifying-glass"></i> Search';
    });
}

function renderTrackResult(d) {
    var status = d.shippingStatus || "Processing";
    var key = normStatus(status);
    var cancelled = (key === "cancelled" || key === "canceled");

    var chip = $("tr-status-chip");
    chip.textContent = status;
    chip.className = "status-chip sc-" + (cancelled ? "cancelled" : key);

    // Status matching is now case/space insensitive, and a cancelled
    // order no longer lights up "Processing" as if it were live.
    var statusIdx = -1;
    STATUS_ORDER.forEach(function (s, i) { if (normStatus(s) === key) statusIdx = i; });
    $("tr-steps").style.display = cancelled ? "none" : "";
    if (!cancelled) {
        if (statusIdx === -1) statusIdx = 0;
        STATUS_ORDER.forEach(function (s, i) {
            var el = $("step-" + normStatus(s));
            if (!el) return;
            var dot = el.querySelector(".step-dot"), lbl = el.querySelector(".step-lbl");
            setTimeout(function () {
                if (i < statusIdx) { dot.className = "step-dot done"; lbl.className = "step-lbl done"; }
                else if (i === statusIdx) { dot.className = "step-dot active"; lbl.className = "step-lbl active"; }
                else { dot.className = "step-dot"; lbl.className = "step-lbl"; }
            }, REDUCED ? 0 : i * 120);
        });
    }

    $("tr-order-info").innerHTML = "<strong>" + esc(d.orderNumber) + "</strong><br/>" + esc(d.date) +
        "<br/>Payment: " + esc(d.payment) +
        (d.trackingCode ? "<br/>Tracking: <strong>" + esc(d.trackingCode) + "</strong>" : "");
    $("tr-delivery-info").innerHTML = "<strong>" + esc(d.fullName) + "</strong><br/>" + esc(d.contact) +
        "<br/>" + esc(d.address) + "<br/>" + esc(d.delivery);

    var items = String(d.items || "").split(", ");
    var iHtml = "";
    items.forEach(function (item) { if (String(item).trim()) iHtml += "\u2022 " + esc(item) + "<br/>"; });
    $("tr-items-list").innerHTML = iHtml || "\u2014";

    $("tr-sub").textContent = d.subtotal;
    $("tr-del").textContent = d.deliveryCharge;
    $("tr-tot").textContent = d.total;
    $("track-result").classList.add("on");
}

/* ── Invoice ───────────────────────────────────────────────── */
/* Mirrors generatePDF() in Code.gs field for field, so the invoice the
   customer prints is the same document that lands in your inbox. */
function showInvoice(o) {
    if (!o) return;
    var sym = CFG.currencySymbol || "\u09F3";
    var now = new Date();
    var pad = function (n) { return n < 10 ? "0" + n : "" + n; };
    var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var hr = now.getHours(), ampm = hr >= 12 ? "PM" : "AM";
    hr = hr % 12; if (hr === 0) hr = 12;
    var date = pad(now.getDate()) + " " + MON[now.getMonth()] + " " + now.getFullYear() +
        ", " + pad(hr) + ":" + pad(now.getMinutes()) + " " + ampm;

    var oh = "<b>Order No:</b> " + esc(o.orderNumber) + "<br/>";
    if (o.trackingCode) oh += "<b>Tracking:</b> <span class='inv-trk'>" + esc(o.trackingCode) + "</span><br/>";
    oh += "<b>Date:</b> " + date + "<br/>";
    oh += "<b>Payment:</b> " + esc(o.services);
    if (o.account_number) oh += "<br/><b>Account:</b> " + esc(o.account_number);
    if (o.transaction_id) oh += "<br/><b>Txn:</b> " + esc(o.transaction_id);
    $("inv-order").innerHTML = oh;

    $("inv-cust").innerHTML = "<b>" + esc(o.fullname) + "</b><br/>" + esc(o.contactnumber) +
        "<br/>" + esc(o.address) + "<br/><b>Delivery:</b> " +
        (o.delivery_location === "inside" ? "Inside Dhaka" : "Outside Dhaka");

    var rows = "";
    (o.snap || []).forEach(function (i) {
        rows += "<tr><td>" + esc(i.title) + "</td><td style=\"text-align:center\">" + i.qty +
            "</td><td style=\"text-align:right\">" + sym + money(i.offerPrice) +
            "</td><td style=\"text-align:right;font-weight:700\">" + sym + money(i.offerPrice * i.qty) + "</td></tr>";
    });
    $("inv-rows").innerHTML = rows ||
        "<tr><td colspan='4' style='text-align:center;color:var(--slate)'>No items recorded</td></tr>";

    $("inv-sub").textContent = sym + money(o.sub);
    $("inv-del").textContent = sym + money(o.del);
    $("inv-tot").textContent = sym + money(o.tot);
    $("inv-veil").classList.add("on");
    syncOverlayLock();
}
function closeInvoice() { $("inv-veil").classList.remove("on"); syncOverlayLock(); }

// Print only the invoice — this used to send the entire storefront
// (hero, product grid and all) to the printer.
function printInvoice() {
    document.body.classList.add("printing-invoice");
    var cleanup = function () { document.body.classList.remove("printing-invoice"); };
    window.addEventListener("afterprint", function h() {
        window.removeEventListener("afterprint", h); cleanup();
    });
    setTimeout(function () {
        window.print();
        setTimeout(cleanup, 800);   // fallback for browsers without afterprint
    }, 60);
}

/* ── Toast ─────────────────────────────────────────────────── */
var _tt;
function showToast(msg, isErr) {
    var el = $("toast"), ic = $("toast-ic");
    if (!el) return;
    $("toast-msg").textContent = msg;
    el.style.background = isErr ? "rgba(185,74,72,.95)" : "rgba(43,30,20,.95)";
    ic.className = isErr ? "fa fa-triangle-exclamation" : "fa fa-check-circle";
    el.classList.add("on");
    clearTimeout(_tt);
    _tt = setTimeout(function () { el.classList.remove("on"); }, 2800);
}

/* ── FAQ accordion (used on faq.html) ─────────────────────────────── */
function toggleFaq(el) {
    var item = el.closest(".faq-item");
    var ans = item.querySelector(".faq-a");
    var isOpen = item.classList.contains("open");
    document.querySelectorAll(".faq-item.open").forEach(function (o) {
        if (o !== item) { o.classList.remove("open"); o.querySelector(".faq-a").style.maxHeight = null; }
    });
    if (isOpen) { item.classList.remove("open"); ans.style.maxHeight = null; }
    else { item.classList.add("open"); ans.style.maxHeight = ans.scrollHeight + "px"; }
}

/* ── Contact form (used on contact.html) ─────────────────────────────── */
function submitContactForm(e) {
    e.preventDefault();
    var name = $("cf-name").value.trim(), email = $("cf-email").value.trim(),
        phone = $("cf-phone").value.trim(), msg = $("cf-message").value.trim();
    var errEl = $("cf-err");
    errEl.classList.remove("on");
    if (!name || !phone || !msg) {
        errEl.textContent = "Please fill in your name, phone number, and message.";
        errEl.classList.add("on");
        return false;
    }
    document.getElementById("contact-form").classList.add("hidden");
    $("contact-success").classList.add("on");
    return false;
}





/* ═════════════════════════════════════════════════════════════
   OFFER SECTION — driven by the 🎁 Offers sheet
   The slides hard-coded in index.html act only as a fallback
   until sheet data arrives (or if the sheet doesn't exist yet).
   ═════════════════════════════════════════════════════════════ */

var _offerTimer = null, _offerIdx = 0;

/* "Up to *30% Off*" → highlight span; a newline in the cell → <br> */
function offerTitleHTML(t) {
    return esc(t)
        .replace(/\*([^*]+)\*/g, "<span>$1</span>")
        .replace(/\r?\n/g, "<br>");
}

function offerSlideHTML(o, first) {
    var icon = String(o.icon || "").trim() || "fa-solid fa-tag";
    var btn = String(o.buttonText || "").trim() || "Shop Now";
    var link = String(o.link || "").trim();
    // A bare number in the Link column jumps straight to that product's page.
    var href = "#shop", extra = "";
    if (/^\d+$/.test(link)) { href = "#product-" + link; }
    else if (link) { href = link; if (/^https?:\/\//i.test(link)) extra = ' target="_blank" rel="noopener"'; }

    var h = '<div class="offer-slide' + (first ? " is-active" : "") + '">';
    h += '<div class="offer-copy">';
    if (o.eyebrow) h += '<p class="offer-eyebrow"><i class="' + esc(icon) + '"></i> ' + esc(o.eyebrow) + '</p>';
    h += '<h2 class="offer-title">' + offerTitleHTML(o.title || "") + '</h2>';
    if (o.description) h += '<p class="offer-desc">' + esc(o.description) + '</p>';
    h += '<a href="' + esc(href) + '"' + extra + ' class="offer-btn"><i class="fa-solid fa-bag-shopping"></i> ' + esc(btn) + '</a>';
    h += '</div>';
    h += '<div class="offer-image"><img src="' + esc(o.imageUrl || IMGS.d) + '" alt="' + esc(o.title || "Offer") + '" loading="lazy" onerror="this.onerror=null;this.src=\'' + IMGS.d + '\'"/></div>';
    h += '</div>';
    return h;
}

/* Called after loadData() — decides what the section shows. */
function initOffers() {
    var sec = $("offers");
    if (!sec || !$("offerTrack")) return;
    if (Array.isArray(OFFERS)) {
        if (!OFFERS.length) { sec.classList.add("offers-off"); return; }
        sec.classList.remove("offers-off");
        var h = "";
        OFFERS.forEach(function (o, i) { h += offerSlideHTML(o, i === 0); });
        $("offerTrack").innerHTML = h;
    }
    buildOfferSlider();
}

/* (Re)binds dots + autoplay to whatever slides are in the track. */
function buildOfferSlider() {
    var track = $("offerTrack"), dotsWrap = $("offerDots");
    if (!track || !dotsWrap) return;

    // Arm the hide/stagger CSS only now, in the SAME synchronous pass that
    // marks the active slide below — never a frame with everything hidden.
    var slider = track.closest ? track.closest(".offer-slider") : null;
    if (slider) slider.classList.add("js-anim");

    clearInterval(_offerTimer);
    _offerIdx = 0;
    dotsWrap.innerHTML = "";

    var slides = track.querySelectorAll(".offer-slide");
    var total = slides.length;
    if (!total) return;

    for (var i = 0; i < total; i++) {
        (function (i) {
            var dot = document.createElement("button");
            dot.className = "offer-dot" + (i === 0 ? " is-active" : "");
            dot.setAttribute("aria-label", "Show offer " + (i + 1));
            dot.addEventListener("click", function () { _offerIdx = i; offerRender(); offerResetTimer(); });
            dotsWrap.appendChild(dot);
        })(i);
    }

    function offerRender() {
        track.style.transform = "translateX(-" + (_offerIdx * 100) + "%)";
        var dots = dotsWrap.querySelectorAll(".offer-dot");
        dots.forEach(function (d, i) { d.classList.toggle("is-active", i === _offerIdx); });
        slides.forEach(function (s, i) { s.classList.toggle("is-active", i === _offerIdx); });
    }
    function offerNext() { _offerIdx = (_offerIdx + 1) % total; offerRender(); }
    function offerResetTimer() {
        clearInterval(_offerTimer);
        if (total > 1 && !REDUCED) _offerTimer = setInterval(offerNext, 4500);
    }

    offerRender();
    offerResetTimer();
}

/* ═════════════════════════════════════════════════════════════
   GALLERY — driven by the 🖼 Gallery sheet (Title | Image URL)
   The images hard-coded in gallery.html stay as a fallback when
   the sheet doesn't exist yet or returns nothing. Every image
   (sheet-driven or fallback) opens in a lightbox.
   ═════════════════════════════════════════════════════════════ */

/* Loading strategy:
   1. Shimmer skeleton cards render INSTANTLY, before any network.
   2. The last successful gallery is cached in localStorage, so repeat
      visits paint real content immediately, then quietly revalidate
      against the sheet (stale-while-revalidate).
   3. Each image starts as a shimmer block and cross-fades in the
      moment its file finishes downloading; the first 6 load eagerly
      with high priority, the rest lazy-load as you scroll.
   4. If the sheet is empty/unreachable and nothing is cached, a
      friendly empty state replaces the skeletons (the page never
      hangs on shimmer forever). */

var GALLERY_CACHE_KEY = "sgc_gallery_v1";

function initGallery() {
    var grid = $("gallery-grid");
    if (!grid) return;

    // Lightbox via delegation — works for every item ever rendered.
    grid.addEventListener("click", function (e) {
        var item = e.target.closest ? e.target.closest(".gallery-item") : null;
        if (!item || item.classList.contains("gallery-skel")) return;
        var img = item.querySelector("img");
        var cap = item.querySelector(".gallery-cap");
        if (img) openLightbox(img.src, cap ? cap.textContent.trim() : (img.alt || ""));
    });

    // 1. Instant paint: cached real gallery if we have one, skeletons if not.
    var cached = null;
    try { cached = JSON.parse(lsGet(GALLERY_CACHE_KEY) || "null"); } catch (e) { cached = null; }
    var hasCache = Array.isArray(cached) && cached.length > 0;

    if (hasCache) renderGalleryItems(grid, cached);
    else if (!grid.children.length) renderGallerySkeletons(grid, 9);

    // 2. Fetch fresh data in the background.
    fetchJson(API_URL + "?action=getGallery", null, 25000).then(function (d) {
        var fresh = Array.isArray(d) ? d.filter(function (g) { return g && g.imageUrl; }) : null;

        if (fresh && fresh.length) {
            lsSet(GALLERY_CACHE_KEY, JSON.stringify(fresh));
            // Skip the re-render when nothing changed — no flicker on repeat visits.
            if (!hasCache || JSON.stringify(fresh) !== JSON.stringify(cached)) {
                renderGalleryItems(grid, fresh);
            }
            return;
        }

        // Sheet empty or missing: nothing to show beyond cache.
        if (!hasCache) renderGalleryEmpty(grid,
            "Our gallery is being refreshed",
            "New photos are on the way. Meanwhile, browse the collection or message us on WhatsApp.");
    }).catch(function () {
        if (!hasCache) renderGalleryEmpty(grid,
            "Couldn't load the gallery",
            "Please check your connection and try again.", true);
    });
}

function renderGallerySkeletons(grid, n) {
    // Varied heights so the shimmer already looks like the masonry it becomes.
    var hts = [300, 360, 260, 340, 300, 380, 280, 330, 310];
    var h = "";
    for (var i = 0; i < n; i++) {
        h += '<div class="gallery-item gallery-skel" style="height:' + hts[i % hts.length] + 'px" aria-hidden="true"></div>';
    }
    grid.innerHTML = h;
}

function renderGalleryItems(grid, items) {
    var h = "";
    items.forEach(function (g, i) {
        var eager = i < 6;   // first viewport-ish batch downloads immediately
        h += '<figure class="gallery-item is-loading reveal" data-delay="' + (Math.min(i, 11) * 45) + '">'
            + '<img src="' + esc(g.imageUrl) + '" alt="' + esc(g.title || "Gallery image") + '"'
            + (eager ? ' loading="eager" fetchpriority="high"' : ' loading="lazy"')
            + ' decoding="async"'
            + ' onload="this.closest(\'.gallery-item\').classList.remove(\'is-loading\')"'
            + ' onerror="this.closest(\'.gallery-item\').remove()"/>'
            + '<figcaption class="gallery-cap"><i class="fa-solid fa-magnifying-glass-plus"></i> '
            + esc(g.title || "") + "</figcaption></figure>";
    });
    grid.innerHTML = h;
    // Images served from the browser cache can finish before the onload
    // attribute is evaluated — sweep for already-complete ones.
    Array.prototype.forEach.call(grid.querySelectorAll(".gallery-item img"), function (img) {
        if (img.complete && img.naturalWidth > 0) {
            img.closest(".gallery-item").classList.remove("is-loading");
        }
    });
    observeNew(Array.prototype.slice.call(grid.querySelectorAll(".gallery-item")));
}

function renderGalleryEmpty(grid, title, sub, retry) {
    grid.innerHTML = '<div class="gallery-empty">'
        + '<i class="fa-regular fa-images"></i>'
        + '<h3>' + esc(title) + '</h3>'
        + '<p>' + esc(sub) + '</p>'
        + (retry ? '<button class="gal-retry" onclick="initGalleryRetry()"><i class="fa fa-rotate-right"></i> Try Again</button>' : '')
        + '</div>';
}

function initGalleryRetry() {
    var grid = $("gallery-grid");
    if (!grid) return;
    renderGallerySkeletons(grid, 9);
    fetchJson(API_URL + "?action=getGallery", null, 25000).then(function (d) {
        var fresh = Array.isArray(d) ? d.filter(function (g) { return g && g.imageUrl; }) : null;
        if (fresh && fresh.length) {
            lsSet(GALLERY_CACHE_KEY, JSON.stringify(fresh));
            renderGalleryItems(grid, fresh);
        } else {
            renderGalleryEmpty(grid, "Our gallery is being refreshed",
                "New photos are on the way. Meanwhile, browse the collection or message us on WhatsApp.");
        }
    }).catch(function () {
        renderGalleryEmpty(grid, "Couldn't load the gallery",
            "Please check your connection and try again.", true);
    });
}

var _lbKeyBound = false;

function openLightbox(src, title) {
    var lb = $("lightbox");
    if (!lb) {
        lb = document.createElement("div");
        lb.id = "lightbox";
        lb.innerHTML = '<button class="lb-x" aria-label="Close"><i class="fa fa-xmark"></i></button>'
            + '<figure class="lb-fig"><img id="lb-img" src="" alt=""/>'
            + '<figcaption id="lb-cap"></figcaption></figure>';
        document.body.appendChild(lb);
        lb.addEventListener("click", function (e) {
            if (e.target === lb || e.target.closest(".lb-x")) closeLightbox();
        });
    }
    if (!_lbKeyBound) {
        _lbKeyBound = true;
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && $("lightbox") && $("lightbox").classList.contains("on")) closeLightbox();
        });
    }
    $("lb-img").src = src;
    $("lb-img").alt = title || "";
    $("lb-cap").textContent = title || "";
    lb.classList.add("on");
    document.body.classList.add("ovl-open");
    document.documentElement.classList.add("ovl-open");
}

function closeLightbox() {
    var lb = $("lightbox");
    if (lb) lb.classList.remove("on");
    syncOverlayLock();
}