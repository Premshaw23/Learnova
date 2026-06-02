if (!self.define) {
    let currentScript;
    const modules = {};

    const loadModule = (path, parentUrl) => {
        const url = new URL(`${path}.js`, parentUrl).href;
        if (modules[url]) return modules[url];
        return new Promise((resolve) => {
            if ("document" in self) {
                const script = document.createElement("script");
                script.src = url;
                script.onload = resolve;
                document.head.appendChild(script);
            } else {
                currentScript = url;
                importScripts(url);
                resolve();
            }
        }).then(() => {
            const module = modules[url];
            if (!module) throw new Error(`Module ${url} didn't register its module`);
            return module;
        });
    };

    self.define = (dependencies, factory) => {
        const url =
            currentScript ||
            ("document" in self ? document.currentScript.src : "") ||
            location.href;
        if (modules[url]) return;
        const exports = {};
        const require = (dependency) => loadModule(dependency, url);
        const module = { module: { uri: url }, exports, require };
        modules[url] = Promise.all(
            dependencies.map((dependency) => module[dependency] || require(dependency))
        ).then((resolvedDependencies) => {
            factory(...resolvedDependencies);
            return exports;
        });
    };
}

define(["./workbox-9f8e2357"], function (workbox) {
    "use strict";

    importScripts(
        "/fallback-ce627215c0e4a9af.js",
        "/worker-3aadaf8c1153ec9b.js"
    );

    self.skipWaiting();
    workbox.clientsClaim();

    workbox.precacheAndRoute(
        [
            {
                url: "/_next/static/2v5-6noCqd-NOOyEdZx_b/_buildManifest.js",
                revision: "647dae8183df11e6528079ff11e51291",
            },
            {
                url: "/_next/static/2v5-6noCqd-NOOyEdZx_b/_ssgManifest.js",
                revision: "b6652df95db52feb4daf4eca35380933",
            },
        ],
        { ignoreURLParametersMatching: [/^utm_/, /^fbclid$/] }
    );

    workbox.cleanupOutdatedCaches();

    workbox.registerRoute(
        "/",
        new workbox.NetworkFirst({
            cacheName: "start-url",
            plugins: [
                {
                    cacheWillUpdate: async ({ response }) => {
                        if (response && response.type === "opaqueredirect") {
                            return new Response(response.body, {
                                status: 200,
                                statusText: "OK",
                                headers: response.headers,
                            });
                        }
                        return response;
                    },
                },
                {
                    handlerDidError: async ({ request }) => {
                        return typeof self !== "undefined" ? self.fallback(request) : Response.error();
                    },
                },
            ],
        }),
        "GET"
    );

    workbox.registerRoute(/\/api\/.*/i, new workbox.NetworkOnly(), "GET");

    workbox.registerRoute(
        /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        new workbox.CacheFirst({
            cacheName: "google-fonts",
            plugins: [
                new workbox.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536000 }),
                {
                    handlerDidError: async ({ request }) => {
                        return typeof self !== "undefined" ? self.fallback(request) : Response.error();
                    },
                },
            ],
        }),
        "GET"
    );

    // ── FIX #2180: Cache face-api.js model weights (CacheFirst, 30 days) ──
    // After first load the ~5 MB of .bin weight files are served from cache
    // instantly — eliminating the network fetch that froze the UI on
    // low-end / slow-network devices.
    workbox.registerRoute(
        /\/models\/.*/i,
        new workbox.CacheFirst({
            cacheName: "face-api-models",
            plugins: [
                new workbox.ExpirationPlugin({
                    maxEntries: 20,
                    maxAgeSeconds: 30 * 24 * 60 * 60,
                }),
                {
                    handlerDidError: async ({ request }) => {
                        return typeof self !== "undefined" ? self.fallback(request) : Response.error();
                    },
                },
            ],
        }),
        "GET"
    );

    // ── FIX #2180: Cache the face-api.js CDN bundle used by faceWorker.js ──
    workbox.registerRoute(
        /^https:\/\/cdn\.jsdelivr\.net\/npm\/face-api\.js.*/i,
        new workbox.CacheFirst({
            cacheName: "face-api-cdn",
            plugins: [
                new workbox.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 30 * 24 * 60 * 60 }),
            ],
        }),
        "GET"
    );

    workbox.registerRoute(
        /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        new workbox.StaleWhileRevalidate({
            cacheName: "static-image-assets",
            plugins: [
                new workbox.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
                {
                    handlerDidError: async ({ request }) => {
                        return typeof self !== "undefined" ? self.fallback(request) : Response.error();
                    },
                },
            ],
        }),
        "GET"
    );

    workbox.registerRoute(
        /\.(?:js)$/i,
        new workbox.StaleWhileRevalidate({
            cacheName: "static-js-assets",
            plugins: [
                new workbox.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
                {
                    handlerDidError: async ({ request }) => {
                        return typeof self !== "undefined" ? self.fallback(request) : Response.error();
                    },
                },
            ],
        }),
        "GET"
    );

    workbox.registerRoute(
        /\.(?:css|less)$/i,
        new workbox.StaleWhileRevalidate({
            cacheName: "static-style-assets",
            plugins: [
                new workbox.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
                {
                    handlerDidError: async ({ request }) => {
                        return typeof self !== "undefined" ? self.fallback(request) : Response.error();
                    },
                },
            ],
        }),
        "GET"
    );

    self.__WB_DISABLE_DEV_LOGS = true;
});