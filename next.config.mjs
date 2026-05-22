import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  reloadOnOnline: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,

  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
      {
        urlPattern: /^https:\/\/lh3\.googleusercontent\.com\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "google-images",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      {
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-image-assets",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
      {
        urlPattern: /\.(?:js)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-js-assets",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /\.(?:css|less)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-style-assets",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /\/api\/.*$/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "apis",
          expiration: {
            maxEntries: 16,
            maxAgeSeconds: 24 * 60 * 60,
          },
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "github.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        encoding: false,
      };
    }

    return config;
  },
};

export default process.env.NODE_ENV === "development" ? nextConfig : withPWA(nextConfig);
