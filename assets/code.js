// =====================================================================
//  SHALIK GLOW CORNER — Google Apps Script  (Code.gs)
//  Fully synced with Shalik_Enhanced sheet
//
//  DEPLOY:
//  1. Extensions → Apps Script → paste this entire file → Save
//  2. Deploy → New Deployment → Web app
//  3. Execute as: Me  |  Who has access: Anyone
//
//  TO ADD MORE PRODUCTS:
//  Just update "Total Products" in ⚙ Website Config cell B31.
//  (If you forget, the script now auto-detects the real product count
//   from the 🛍 Products sheet so sales are never silently dropped.)
//
//  PRODUCT DESCRIPTIONS:
//  Add a "Description" header in 🛍 Products cell V3 (column V, right
//  after "Last Updated"). Whatever you type in column V shows on that
//  product's details page. Alt+Enter = line break; an empty line = new
//  paragraph. The website also auto-detects these section headings when
//  a line ends with a colon — each becomes a styled block, and any
//  heading with nothing under it is hidden automatically:
//    For:            (audience — shown as small pills)
//    Ingredients:    (comma or line separated — shown as pills)
//    Benefits:       (one per line — shown as a checklist)
//    Key Features:   (one per line — shown as a checklist)
//    How to Use:     (one step per line — shown as numbered steps)
//    FAQ:            (question line, then "Answer: ..." — shown as accordion)
//  Any other "Something:" line becomes a plain titled section.
//
//  STOCK STATUS:
//  Availability now follows ONLY the Status column (Q) in 🛍 Products.
//  Status containing "out" / "sold" / "unavailable" → Out of Stock,
//  anything else → available (Stock Qty no longer decides). The 📊
//  Dashboard sheet is no longer read and can be deleted.
//
//  GALLERY (NEW):
//  Create a sheet named  🖼 Gallery  (plain "Gallery" also works).
//  Row 3 = headers, data from row 4:
//    A: Title       caption shown on the image
//    B: Image URL   the photo
//  If the sheet doesn't exist, the gallery page keeps its built-in images.
//
//  OFFERS SECTION (NEW):
//  Create a sheet named exactly:  🎁 Offers
//  Rows 1–2 are free for banners/notes, row 3 = headers, data from row 4:
//    A: Active        Yes / No   (No hides the slide)
//    B: Eyebrow       small pill text, e.g.  Limited Time
//    C: Icon          Font Awesome class, e.g.  fa-solid fa-tag  (optional)
//    D: Title         wrap the highlighted part in asterisks:
//                     Up to *30% Off* Beauty of Joseon
//                     (Alt+Enter in the cell = line break on the site)
//    E: Description   one or two sentences
//    F: Button Text   e.g.  Shop the Offer   (optional, default "Shop Now")
//    G: Image URL     product / banner image
//    H: Link          a product No. (e.g. 6) opens that product's page,
//                     or #shop, or any full URL  (optional)
//  If the sheet doesn't exist, the site keeps its built-in slides.
//  If it exists but no row is Active, the whole section is hidden.
// =====================================================================

// ── SHEET NAMES ─────────────────────────────────────────────────────
var SH_PRODUCTS = "\uD83D\uDECD Products";    // 🛍 Products
var SH_CONFIG = "\u2699 Website Config";     // ⚙ Website Config
var SH_ORDERS = "\uD83D\uDCCB Orders";       // 📋 Orders
var SH_CALC = "\uD83D\uDCB0 Order Calc";   // 📐 Order Calc
var SH_SELLQTY = "\uD83D\uDCCA Sell Qty";     // 📊 Sell Qty
var SH_OFFERS = "\uD83C\uDF81 Offers";       // 🎁 Offers
var SH_GALLERY = "\uD83D\uDDBC Gallery";      // 🖼 Gallery (plain "Gallery" also accepted)

// ── CONFIG CELL — Total Products count ──────────────────────────────
var CONFIG_TOTAL_PRODUCTS_CELL = "B31";   // ⚙ Website Config → B31
var DEFAULT_TOTAL_PRODUCTS = 13;

// =====================================================================
//  ROUTING
// =====================================================================
function doGet(e) {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getAll";
    try {
        if (action === "getProducts") return R(getProducts());
        if (action === "getConfig") return R(getSiteConfig());
        if (action === "getOffers") return R(getOffers());
        if (action === "getGallery") return R(getGallery());
        if (action === "trackOrder") return R(trackOrder(e.parameter.id || ""));
        return R({ products: getProducts(), config: getSiteConfig(), offers: getOffers(), gallery: getGallery() });
    } catch (err) {
        return R({ error: err.message });
    }
}

function doPost(e) {
    try {
        var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
        var body = JSON.parse(raw);
        return R(submitOrder(body));
    } catch (err) {
        return R({ error: err.message });
    }
}

function R(data) {
    return ContentService
        .createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}

// =====================================================================
//  SMALL HELPERS
// =====================================================================

// Safe cell read — sheets narrower than expected return undefined, and
// String(undefined) would print the literal text "undefined" on the site.
function cell_(row, i) {
    var v = row[i];
    return (v === undefined || v === null) ? "" : v;
}

function str_(row, i) {
    return String(cell_(row, i)).trim();
}

// Escapes text before it is dropped into the invoice HTML. Without this a
// customer name or address containing < > & " would corrupt the PDF layout.
function escHtml_(v) {
    return String(v === undefined || v === null ? "" : v)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// "No" / FALSE / 0 / "hide" all mean hidden.
function isFalsy_(v) {
    var s = String(v === undefined || v === null ? "" : v).trim().toLowerCase();
    return s === "no" || s === "false" || s === "0" || s === "off" || s === "hide";
}

// Number.toLocaleString() follows the SCRIPT's locale, so on a Bangla-locale
// project it rendered Bengali numerals (১,২০০) for the invoice unit price and
// row totals while every other figure — passed in pre-formatted from the
// site — stayed in Latin digits. Group manually so the digits can never drift.
function money_(n) {
    n = Math.round(Number(n) || 0);
    var neg = n < 0;
    var s = String(Math.abs(n));
    var out = "";
    while (s.length > 3) {
        out = "," + s.slice(-3) + out;
        s = s.slice(0, -3);
    }
    return (neg ? "-" : "") + s + out;
}

// =====================================================================
//  GET TOTAL PRODUCTS COUNT
//  Reads ⚙ Website Config B31, but never returns less than the highest
//  product number actually present in 🛍 Products. A stale B31 used to
//  make the frontend build a short Sell Qty array, so any product beyond
//  that index never had its sale recorded and its stock never dropped.
// =====================================================================
function getTotalProducts() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    var configured = 0;
    var sheet = ss.getSheetByName(SH_CONFIG);
    if (sheet) {
        var n = parseInt(sheet.getRange(CONFIG_TOTAL_PRODUCTS_CELL).getValue(), 10);
        if (!isNaN(n) && n > 0) configured = n;
    }

    var total = Math.max(configured, getHighestProductNo_(ss));
    return total > 0 ? total : DEFAULT_TOTAL_PRODUCTS;
}

function getHighestProductNo_(ss) {
    var sh = ss.getSheetByName(SH_PRODUCTS);
    if (!sh) return 0;
    var last = sh.getLastRow();
    if (last < 4) return 0;
    var vals = sh.getRange(4, 1, last - 3, 1).getValues();
    var max = 0;
    vals.forEach(function (r) {
        var n = Number(r[0]);
        if (!isNaN(n) && n > max) max = n;
    });
    return max;
}

// =====================================================================
//  GET PRODUCTS
//  Products sheet: rows 1-3 = banners/headers, data from row 4
//  Cols: A=No B=Title C=Brand D=Category E=Size F=Unit G=SKU
//        H=StockQty I=Cost J=Ship K=CostShip L=OldPrice M=OfferPrice
//        N=Profit O=OfferPct P=Margin Q=StockStatus R=ShowOnSite S=ImageURL
//        T=Tags U=LastUpdated V=Description
//
//  Everything is read from this one sheet — the 📊 Dashboard sheet is
//  NOT used anymore. Availability follows ONLY the Status column (Q):
//  a status containing "out" / "sold" / "unavailable" means Out of
//  Stock; any other non-empty status means available, regardless of
//  Stock Qty. (Only if Status is left blank does Stock Qty decide.)
// =====================================================================
function getProducts() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SH_PRODUCTS);
    if (!sheet) throw new Error("Sheet not found: " + SH_PRODUCTS);

    var lastRow = sheet.getLastRow();
    if (lastRow < 4) return [];

    // Never request more columns than the sheet actually has, otherwise
    // getRange() throws and the whole storefront fails to load.
    // 22 columns, so column V (Description) is included when present.
    var cols = Math.min(22, Math.max(sheet.getLastColumn(), 1));
    var data = sheet.getRange(4, 1, lastRow - 3, cols).getValues();
    var out = [];

    data.forEach(function (row) {
        if (row[0] === "" || row[0] === null || row[0] === undefined) return;
        if (isFalsy_(cell_(row, 17))) return;   // R = ShowOnSite

        var no = Number(row[0]);
        if (!no || isNaN(no)) return;

        var old = Number(cell_(row, 11)) || 0;
        var off = Number(cell_(row, 12)) || 0;
        var disc = old > 0 && off > 0 && off < old;

        var qty = Number(cell_(row, 7)) || 0;  // H = Stock Qty (informational only)
        var stat = str_(row, 16);               // Q = Status — the source of truth

        // Status decides availability. Stock Qty is deliberately ignored:
        // "Qty 0 + In Stock" is In Stock, "Qty 100 + Out of Stock" is Out.
        var statLower = stat.toLowerCase();
        var isOut = statLower.indexOf("out") !== -1 ||
            statLower.indexOf("sold") !== -1 ||
            statLower.indexOf("unavailable") !== -1;
        var inStock = stat ? !isOut : qty > 0;   // blank status → fall back to qty

        out.push({
            id: no,
            title: str_(row, 1),
            brand: str_(row, 2),
            category: str_(row, 3),
            size: str_(row, 4) + (str_(row, 5) ? " " + str_(row, 5) : ""),
            sku: str_(row, 6),
            stockQty: qty,
            oldPrice: old,
            offerPrice: off,
            displayPrice: off > 0 ? off : old,
            hasDiscount: disc,
            discountPct: disc ? Math.round((old - off) / old * 100) : 0,
            stockStatus: stat || (inStock ? "In Stock" : "Out of Stock"),
            inStock: inStock,
            imageUrl: str_(row, 18),
            tags: str_(row, 19),
            description: str_(row, 21)             // V = Description
        });
    });

    return out;
}

// =====================================================================
//  GET GALLERY — reads 🖼 Gallery sheet (plain "Gallery" also works)
//  Layout is forgiving: any row whose column B holds an http(s) URL is
//  an image; column A is its title. Header/banner rows are skipped
//  automatically, so both "headers in row 1" and the usual "banners in
//  rows 1-2, headers in row 3" layouts parse the same way.
//  Returns:
//    null  → no gallery sheet  (gallery page keeps its built-in images)
//    []    → sheet exists but holds no images  (page keeps built-ins too)
//    [...] → { title, imageUrl } in sheet order
// =====================================================================
function getGallery() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SH_GALLERY) || ss.getSheetByName("Gallery");
    if (!sh) return null;

    var last = sh.getLastRow();
    if (last < 1) return [];

    var cols = Math.min(2, Math.max(sh.getLastColumn(), 1));
    var data = sh.getRange(1, 1, last, cols).getValues();
    var out = [];

    data.forEach(function (row) {
        var url = str_(row, 1);
        if (!/^https?:\/\//i.test(url)) return;   // skips banners, headers, blanks
        out.push({
            title: str_(row, 0),
            imageUrl: url
        });
    });

    return out;
}

// =====================================================================
//  GET OFFERS — reads 🎁 Offers sheet (see layout at top of file)
//  Returns:
//    null  → sheet doesn't exist  (site keeps its built-in slides)
//    []    → sheet exists, nothing Active  (site hides the section)
//    [...] → active offer slides in sheet order
// =====================================================================
function getOffers() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SH_OFFERS);
    if (!sh) return null;

    var last = sh.getLastRow();
    if (last < 4) return [];

    var cols = Math.min(8, Math.max(sh.getLastColumn(), 1));
    var data = sh.getRange(4, 1, last - 3, cols).getValues();
    var out = [];

    data.forEach(function (row) {
        var active = str_(row, 0);
        if (!active) return;            // blank row → skip
        if (isFalsy_(active)) return;   // "No" → hidden slide

        var title = str_(row, 3);
        if (!title) return;             // a slide with no title is unusable

        out.push({
            eyebrow: str_(row, 1),
            icon: str_(row, 2),
            title: String(cell_(row, 3)),   // keep in-cell line breaks
            description: str_(row, 4),
            buttonText: str_(row, 5),
            imageUrl: str_(row, 6),
            link: str_(row, 7)
        });
    });

    return out;
}

// =====================================================================
//  GET CONFIG — reads ⚙ Website Config sheet live
// =====================================================================
function getSiteConfig() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SH_CONFIG);
    if (!sheet) return defaultConfig();

    var data = sheet.getDataRange().getValues();
    var cfg = {};

    data.forEach(function (row) {
        var k = String(row[0] === null || row[0] === undefined ? "" : row[0]).trim();
        if (!k) return;

        // Skip section banners and note rows. The old check compared
        // k.charAt(0) against a 2-char surrogate pair ("\uD83D\uDD12"), which
        // can never match, and it missed every emoji in the \uD83C range.
        if (k.charCodeAt(0) > 0x2000) return;          // any emoji / arrow / symbol
        if (!/^[A-Za-z0-9]/.test(k)) return;           // must start with a letter or digit
        if (/^(update|never|yellow|note|warning|instruction)/i.test(k)) return;

        var cc = k.toLowerCase()
            .replace(/[^a-z0-9\s]/g, "").trim()
            .replace(/\s+(.)/g, function (_, c) { return c.toUpperCase(); });

        if (cc) cfg[cc] = (row[1] === null || row[1] === undefined) ? "" : row[1];
    });

    // The camelCase conversion lowercases everything first, so "WhatsApp
    // Number" became `whatsappNumber` while the frontend looked for
    // `whatsAppNumber` — the configured number was silently ignored.
    // Publish both spellings so either lookup works.
    if (cfg.whatsappNumber && !cfg.whatsAppNumber) cfg.whatsAppNumber = cfg.whatsappNumber;
    if (cfg.whatsAppNumber && !cfg.whatsappNumber) cfg.whatsappNumber = cfg.whatsAppNumber;
    if (cfg.bkashAccount && !cfg.bKashAccount) cfg.bKashAccount = cfg.bkashAccount;
    if (cfg.bKashAccount && !cfg.bkashAccount) cfg.bkashAccount = cfg.bKashAccount;

    cfg.totalProducts = getTotalProducts();

    return cfg;
}

function defaultConfig() {
    return {
        siteTitle: "Shalik Glow Corner",
        tagline: "Your Glow, Our Pride \u273F",
        currencySymbol: "\u09F3",
        insideDhakaCharge: 60,
        outsideDhakaCharge: 120,
        whatsAppNumber: "01915707075",
        whatsappNumber: "01915707075",
        bKashAccount: "01XXXXXXXXX",
        bkashAccount: "01XXXXXXXXX",
        nagadAccount: "01XXXXXXXXX",
        bannerActive: "Yes",
        bannerText: "\uD83C\uDF38 Free Delivery on Orders over \u09F32000 Inside Dhaka!",
        totalProducts: DEFAULT_TOTAL_PRODUCTS
    };
}

// =====================================================================
//  TRACK ORDER — lookup by Order No. or Tracking Code
// =====================================================================
function trackOrder(id) {
    if (!id || id.trim() === "") return { error: "Please enter an Order ID or Tracking Code." };

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SH_ORDERS);
    if (!sheet) return { error: "Orders sheet not found." };

    var lastRow = sheet.getLastRow();
    if (lastRow < 4) return { found: false, error: "No orders found." };

    var cols = Math.min(20, Math.max(sheet.getLastColumn(), 1));
    var data = sheet.getRange(4, 1, lastRow - 3, cols).getValues();
    var q = id.trim().toUpperCase();

    for (var i = 0; i < data.length; i++) {
        var row = data[i];
        var ord = str_(row, 1).toUpperCase();
        var trk = str_(row, 18).toUpperCase();
        if (ord === q || trk === q) {
            // Quantities live in col P ("Q-1, Q-2") with the human-readable
            // col Q ("1, 2") as a fallback for rows written by older clients.
            var qty = str_(row, 15) || str_(row, 16);
            return {
                found: true,
                orderNumber: str_(row, 1),
                trackingCode: str_(row, 18),
                shippingStatus: str_(row, 19) || "Processing",
                fullName: str_(row, 4),
                contact: str_(row, 5),
                address: str_(row, 6),
                delivery: str_(row, 7),
                payment: str_(row, 8),
                items: str_(row, 14),
                quantities: qty,
                subtotal: str_(row, 11),
                deliveryCharge: str_(row, 12),
                total: str_(row, 13),
                date: formatOrderDate_(cell_(row, 0))
            };
        }
    }
    return { found: false, error: "No order found with ID: " + id + ". Please check and try again." };
}

// A blank or text value in column A used to throw inside new Date(...).
function formatOrderDate_(v) {
    if (!v) return "";
    try {
        var d = (v instanceof Date) ? v : new Date(v);
        if (isNaN(d.getTime())) return String(v);
        return Utilities.formatDate(d, Session.getScriptTimeZone(), "EEE, dd MMM yyyy");
    } catch (e) {
        return String(v);
    }
}

// =====================================================================
//  SUBMIT ORDER
// =====================================================================
function submitOrder(form) {
    form = form || {};

    // Basic server-side validation. The browser form checks these too, but
    // the endpoint is public and a half-empty row is impossible to fulfil.
    var missing = [];
    if (!String(form.fullname || "").trim()) missing.push("name");
    if (!String(form.contactnumber || "").trim()) missing.push("contact number");
    if (!String(form.address || "").trim()) missing.push("address");
    if (!String(form.products || "").trim()) missing.push("products");
    if (missing.length) throw new Error("Missing required order details: " + missing.join(", ") + ".");

    // Two customers checking out at the same moment could interleave their
    // appendRow calls and land on the same order number.
    var lock = LockService.getScriptLock();
    try {
        lock.waitLock(30000);
    } catch (e) {
        throw new Error("The store is busy right now. Please try again in a moment.");
    }

    try {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var frSh = ss.getSheetByName(SH_ORDERS);
        var ocSh = ss.getSheetByName(SH_CALC);
        var sqSh = ss.getSheetByName(SH_SELLQTY);

        if (!frSh) throw new Error("Sheet not found: " + SH_ORDERS);

        var totalProds = getTotalProducts();

        var now = new Date();
        var ts = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyyMMddHHmmss");
        var orderNum = "#ORD-" + ts + "-" + (frSh.getLastRow() + 1);
        var tracking = "SGC-" + Utilities.formatDate(now, Session.getScriptTimeZone(), "yyMMdd")
            + "-" + Math.floor(Math.random() * 9000 + 1000);

        var qStr = Array.isArray(form.quantities)
            ? form.quantities.join(", ")
            : String(form.quantities || "");

        // ── 1. 📋 Orders ─────────────────────────────────────────────────
        frSh.appendRow([
            now, orderNum,
            form.firstname || "",
            form.lastname || "",
            form.fullname || "",
            "'" + (form.contactnumber || ""),  // ← Added ' before number
            form.address || "",
            form.delivery_location || "",
            form.services || "",
            form.account_number || "N/A",
            form.transaction_id || "N/A",
            form.subtotal || "",
            form.delivery_charge || "",
            form.total || "",
            form.products || "",
            qStr,
            form.formattedData || "",
            form.calcTotal || 0,
            tracking,
            "Processing"
        ]);

        // ── 2. 📐 Order Calc ─────────────────────────────────────────────
        if (ocSh) {
            ocSh.appendRow([
                now,
                form.fullname || "",
                "'" + (form.contactnumber || ""),  // ← Added ' before number here too
                form.address || "",
                form.delivery_location || "",
                form.services || "",
                form.account_number || "N/A",
                form.transaction_id || "N/A",
                form.subtotalNum || 0,
                form.subtotalNum || 0,
                form.deliveryNum || 0,
                form.totalNum || 0,
                form.products || "",
                qStr,
                form.totalItems || 1,
                "",
                "",
                "Processing",
                tracking,
                "Processing"
            ]);
        }

        // ── 3. 📊 Sell Qty — one column per product ──────────────────────
        if (sqSh) {
            var sqRow = [now];
            var qa = Array.isArray(form.quantitiesArray) ? form.quantitiesArray : [];
            for (var i = 0; i < totalProds; i++) {
                sqRow.push(Number(qa[i]) || 0);
            }
            sqSh.appendRow(sqRow);
        }

        // ── 4. PDF + Email ───────────────────────────────────────────────
        // The order rows are already committed at this point. If the mail
        // quota is exhausted or PDF generation hiccups, the customer must
        // still see a success screen — otherwise they re-submit and you get
        // a duplicate order.
        var emailSent = false;
        try {
            var cfg = getSiteConfig();
            var emails = buildEmailList(cfg);
            var pdf = generatePDF(form, orderNum, tracking);
            sendEmail(form, pdf, orderNum, tracking, emails);
            emailSent = true;
        } catch (mailErr) {
            console.error("Order " + orderNum + " saved, but notification failed: " + mailErr.message);
        }

        return {
            success: true,
            orderNumber: orderNum,
            trackingCode: tracking,
            emailSent: emailSent
        };

    } finally {
        lock.releaseLock();
    }
}

// =====================================================================
//  EMAIL LIST — reads Notification Email 1..5 from Config sheet
// =====================================================================
function buildEmailList(cfg) {
    return "mhshan177@gmail.com,mhshan77@gmail.com";
}

// =====================================================================
//  PDF INVOICE
//  NOTE: the HtmlService → PDF converter uses a legacy renderer that
//  ignores flexbox and CSS grid. The old layout relied on both, so the
//  two info panels stacked and every total line collapsed onto itself.
//  Everything positional is now table-based, which the converter honours.
// =====================================================================
function generatePDF(form, orderNum, tracking) {
    var date = Utilities.formatDate(
        new Date(), Session.getScriptTimeZone(), "dd MMM yyyy, hh:mm a"
    );
    var sym = "\u09F3";
    var rows = "";
    var items = String(form.products || "").split(", ");
    var qtys = Array.isArray(form.quantities)
        ? form.quantities
        : String(form.quantities || "").split(", ");

    items.forEach(function (item, i) {
        if (!String(item).trim()) return;
        var q = String(qtys[i] || "1").replace(/Q-/gi, "").trim();
        var m = item.match(/-\s*\u09F3\s*([\d,]+)/);
        var pr = m ? parseInt(m[1].replace(/,/g, ""), 10) : 0;
        var qn = parseInt(q, 10);
        var tot = (pr && qn) ? pr * qn : "";
        var nm = item.replace(/^\d+\.\s*/, "").replace(/\s*-\s*\u09F3[\d,]+.*$/, "").trim();
        rows += "<tr>"
            + "<td style='padding:8px 11px'>" + escHtml_(nm) + "</td>"
            + "<td style='padding:8px 11px;text-align:center'>" + escHtml_(q) + "</td>"
            + "<td style='padding:8px 11px;text-align:right'>" + (pr > 0 ? sym + money_(pr) : "") + "</td>"
            + "<td style='padding:8px 11px;text-align:right;font-weight:700'>" + (tot ? sym + money_(tot) : "") + "</td>"
            + "</tr>";
    });
    if (!rows) {
        rows = "<tr><td colspan='4' style='padding:10px 11px;text-align:center;color:#64748b'>No items recorded</td></tr>";
    }

    var pex = "";
    if (form.account_number && form.account_number !== "N/A" && form.account_number !== "") {
        pex += "<br/><b>Account:</b> " + escHtml_(form.account_number);
    }
    if (form.transaction_id && form.transaction_id !== "N/A" && form.transaction_id !== "") {
        pex += "<br/><b>Txn:</b> " + escHtml_(form.transaction_id);
    }
    var del = form.delivery_location === "inside" ? "Inside Dhaka" : "Outside Dhaka";

    var css = "@page{size:A4;margin:10mm 14mm 14mm 14mm}"
        + "*{box-sizing:border-box;margin:0;padding:0}"
        + "body{font-family:Arial,Helvetica,sans-serif;color:#1c1917;font-size:12px;line-height:1.5;padding:6px}"
        + ".hdr{text-align:center;border-bottom:3px solid #E11D48;padding-bottom:14px;margin-bottom:16px}"
        + ".logo{font-family:Georgia,serif;font-size:22px;font-weight:700;color:#9F1239}"
        + ".tagline{font-size:10px;color:#64748b;margin-top:2px}"
        + ".badge{display:inline-block;background:#E11D48;color:#fff;font-size:10px;font-weight:700;padding:3px 14px;border-radius:99px;margin-top:6px}"
        + ".trk{color:#1D4ED8;font-weight:800;letter-spacing:1px}"
        + ".infotbl{width:100%;border-collapse:separate;border-spacing:11px 0;margin:0 -11px 14px}"
        + ".infotbl>tbody>tr>td{width:50%;vertical-align:top}"
        + ".box{background:#FFF1F2;border-left:4px solid #E11D48;border-radius:8px;padding:10px 12px}"
        + ".box .bl{font-size:9px;text-transform:uppercase;letter-spacing:.8px;color:#E11D48;font-weight:700;margin-bottom:5px}"
        + ".box p{font-size:11px;line-height:1.8;color:#374151}"
        + ".box b{color:#1c1917}"
        + "table.items{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:13px}"
        + "table.items thead th{background:#E11D48;color:#fff;padding:8px 11px;font-size:10px;text-align:left}"
        + "table.items tbody td{border-bottom:1px solid #f0e8e8}"
        + "table.items tbody tr:nth-child(even) td{background:#FFF8F8}"
        + ".tot{background:#FFF1F2;border-radius:8px;padding:11px 14px;margin-bottom:14px}"
        + ".tottbl{width:100%;border-collapse:collapse}"
        + ".tottbl td{font-size:12px;color:#64748b;padding:3px 0}"
        + ".tottbl td.r{text-align:right}"
        + ".tottbl tr.grand td{font-size:15px;font-weight:800;color:#9F1239;padding-top:8px;border-top:2px solid #E11D48}"
        + ".thx{text-align:center;color:#9F1239;font-weight:700;font-size:12px;margin-bottom:10px}"
        + ".foot{text-align:center;font-size:9px;color:#94a3b8;border-top:1px solid #f0e8e8;padding-top:10px}";

    var html = "<!DOCTYPE html><html><head><meta charset='UTF-8'/>"
        + "<meta name='format-detection' content='telephone=no'/>"
        + "<style>" + css + "</style></head><body>"
        + "<div class='hdr'><div class='logo'>\u273F Shalik Glow Corner \u273F</div>"
        + "<div class='tagline'>Your Glow, Our Pride</div><div class='badge'>INVOICE</div></div>"

        + "<table class='infotbl'><tr>"
        + "<td><div class='box'><div class='bl'>Order Details</div><p>"
        + "<b>Order No:</b> " + escHtml_(orderNum) + "<br/>"
        + "<b>Tracking:</b> <span class='trk'>" + escHtml_(tracking) + "</span><br/>"
        + "<b>Date:</b> " + date + "<br/>"
        + "<b>Payment:</b> " + escHtml_(form.services || "") + pex + "</p></div></td>"
        + "<td><div class='box'><div class='bl'>Customer</div><p>"
        + "<b>" + escHtml_(form.fullname || "") + "</b><br/>"
        + escHtml_(form.contactnumber || "") + "<br/>"
        + escHtml_(form.address || "") + "<br/>"
        + "<b>Delivery:</b> " + del + "</p></div></td>"
        + "</tr></table>"

        + "<table class='items'><thead><tr><th>Product</th>"
        + "<th style='text-align:center'>Qty</th>"
        + "<th style='text-align:right'>Price</th>"
        + "<th style='text-align:right'>Total</th></tr></thead>"
        + "<tbody>" + rows + "</tbody></table>"

        + "<div class='tot'><table class='tottbl'>"
        + "<tr><td>Subtotal</td><td class='r'>" + escHtml_(form.subtotal || "") + "</td></tr>"
        + "<tr><td>Delivery</td><td class='r'>" + escHtml_(form.delivery_charge || (sym + "0")) + "</td></tr>"
        + "<tr class='grand'><td>Grand Total</td><td class='r'>" + escHtml_(form.total || "") + "</td></tr>"
        + "</table></div>"

        + "<p class='thx'>\uD83C\uDF38 Thank you for shopping with Shalik Glow Corner!</p>"
        + "<div class='foot'><b style='color:#9F1239'>Shalik Glow Corner</b> | shalikbeauty@gmail.com | \u00A9 2026</div>"
        + "</body></html>";

    return HtmlService.createHtmlOutput(html).getBlob()
        .getAs("application/pdf")
        .setName("Invoice_" + orderNum + ".pdf");
}

// =====================================================================
//  SEND EMAIL
// =====================================================================
function sendEmail(form, pdf, orderNum, tracking, to) {
    var date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd MMM yyyy, hh:mm a");
    var del = form.delivery_location === "inside" ? "Inside Dhaka" : "Outside Dhaka";

    MailApp.sendEmail({
        to: to,
        subject: "\uD83D\uDED2 New Order: " + (form.fullname || "Customer") + " \u2014 " + orderNum,
        body: "New order on Shalik Glow Corner!\n"
            + "==========================================\n"
            + "Order No:   " + orderNum + "\n"
            + "Tracking:   " + tracking + "\n"
            + "Date:       " + date + "\n"
            + "==========================================\n"
            + "CUSTOMER\n"
            + "Name:       " + (form.fullname || "") + "\n"
            + "Contact:    " + (form.contactnumber || "") + "\n"
            + "Address:    " + (form.address || "") + "\n"
            + "Delivery:   " + del + "\n"
            + "==========================================\n"
            + "PAYMENT\n"
            + "Method:     " + (form.services || "") + "\n"
            + (form.account_number && form.account_number !== "N/A"
                ? "Account:    " + form.account_number + "\n" : "")
            + (form.transaction_id && form.transaction_id !== "N/A"
                ? "Txn ID:     " + form.transaction_id + "\n" : "")
            + "==========================================\n"
            + "ITEMS\n"
            + String(form.products || "").replace(/, /g, "\n") + "\n"
            + "==========================================\n"
            + "Subtotal:   " + (form.subtotal || "") + "\n"
            + "Delivery:   " + (form.delivery_charge || "\u09F30") + "\n"
            + "TOTAL:      " + (form.total || "") + "\n"
            + "==========================================\n"
            + "Update Shipping Status in Google Sheet (\uD83D\uDCCB Orders \u2192 Column T).\n"
            + "Customer tracking code: " + tracking,
        attachments: [pdf]
    });
}

// =====================================================================
//  LEGACY COMPATIBILITY
// =====================================================================
function submitForm(form) { return submitOrder(form); }
function include(filename) { return HtmlService.createHtmlOutputFromFile(filename).getContent(); }

function getProductPrices() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SH_PRODUCTS);
    var r = { newPrices: {}, oldPrices: {} };
    if (!sh) return r;

    var lastRow = sh.getLastRow();
    if (lastRow < 4) return r;                       // used to throw on an empty sheet

    var cols = Math.min(13, Math.max(sh.getLastColumn(), 1));
    var d = sh.getRange(4, 1, lastRow - 3, cols).getValues();
    d.forEach(function (row) {
        if (!row[0]) return;
        r.newPrices[Number(row[0])] = Number(cell_(row, 12)) || 0;
        r.oldPrices[Number(row[0])] = Number(cell_(row, 11)) || 0;
    });
    return r;
}