# SEO Setup — Learnova

## What Was Added / Changed

| File | Change |
|------|--------|
| `lib/seo/siteMetadata.js` | Upgraded to full OG/Twitter/robots/verification metadata; added `metadataBase` |
| `app/layout.js` | Fixed broken import → proper `export { metadata }` re-export so Next.js actually reads it |
| `app/sitemap.js` | New — generates `/sitemap.xml` automatically via Next.js App Router |
| `app/robots.js` | New — generates `/robots.txt` with all authenticated routes blocked |
| `app/auth/layout.js` | Updated with login-specific metadata (`title: "Login"`, OG url, description) |
| `public/og-image-placeholder.txt` | Design specs for the OG image |

## Why `app/auth/layout.js` instead of `app/auth/page.js`

`app/auth/page.js` is a `"use client"` component. Next.js App Router does not allow
`export const metadata` inside client components — it must live in a Server Component.
The segment layout (`app/auth/layout.js`) is a Server Component and is the correct
place for route-specific metadata when the page itself is a client component.

## OG Image

`public/og-image.jpg` already exists and is referenced in metadata.
See `public/og-image-placeholder.txt` for design specs if you want to replace it.

## Verification

| Check | URL |
|-------|-----|
| OG tags preview | https://www.opengraph.xyz/ |
| Sitemap | https://learnova-web.vercel.app/sitemap.xml |
| Robots | https://learnova-web.vercel.app/robots.txt |
| Google Search Console | https://search.google.com/search-console |

## Disallowed Routes (`robots.txt`)

Blocked from search engine indexing:

- `/api/`
- `/admin/dashboard/`
- `/student/dashboard/`
- `/teacher/dashboard/`
- `/institute/dashboard/`
- `/attendance/`
- `/complaints/`
- `/leaderboards/`
- `/notices/`
- `/productivity/`
- `/profile/`
- `/settings/`
- `/streaks/`

## Sitemap — Public Routes Included

- `/` — Home (priority 1.0, weekly)
- `/auth` — Login / Sign-up (priority 0.8, monthly)
- `/register` — Register (priority 0.8, monthly)
- `/contact` — Contact (priority 0.6, monthly)
- `/contributors` — Contributors (priority 0.5, monthly)
- `/terms` — Terms of Service (priority 0.4, yearly)
- `/verify` — Email Verification (priority 0.3, monthly)
