/* Saffron Glow Corner — Service Worker
   Caches static assets (CSS, JS, fonts, icons, logos, hero images)
   for instant repeat visits. Bump CACHE when you ship any change. */

var CACHE = "sgc-static-v1";

var CORE = [
    "./",
    "./index.html",
    "./about.html",
    "./contact.html",
    "./gallery.html",
    "./faq.html",
    "./assets/styles.css",
    "./assets/site.js",
    "./assets/logo/saffron_1.svg",
    "./assets/logo/saffron_footer.svg",
    "./assets/logo/about.png"
];

self.addEventListener("install", function (e) {
    e.waitUntil(
        caches.open(CACHE).then(function (c) {
            return c.addAll(CORE);
        }).then(function () { return self.skipWaiting(); })
    );
});

self.addEventListener("activate", function (e) {
    e.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys.filter(function (k) { return k !== CACHE; })
                    .map(function (k) { return caches.delete(k); })
            );
        }).then(function () { return self.clients.claim(); })
    );
});

/* Network-first for navigation (always want the newest HTML).
   Cache-first for everything else, falling back to the network. */
self.addEventListener("fetch", function (e) {
    if (e.request.method !== "GET") return;

    var url = new URL(e.request.url);
    // Never cache the live Apps Script API — it must stay fresh.
    if (url.host.indexOf("script.google.com") !== -1) return;

    if (e.request.mode === "navigate") {
        e.respondWith(
            fetch(e.request).then(function (res) {
                var copy = res.clone();
                caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
                return res;
            }).catch(function () {
                return caches.match(e.request).then(function (hit) { return hit || caches.match("./index.html"); });
            })
        );
        return;
    }

    e.respondWith(
        caches.match(e.request).then(function (hit) {
            return hit || fetch(e.request).then(function (res) {
                if (res && res.ok && url.origin === location.origin) {
                    var copy = res.clone();
                    caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
                }
                return res;
            });
        })
    );
});
