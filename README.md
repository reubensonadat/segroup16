# Runway

An interactive runway e-commerce experience built with Vite, TypeScript, custom
elements, and CSS 3D transforms.

The application is React-based. `src/main.tsx` mounts `src/App.tsx`, which owns
the document shell, navigation header, styling bag, and page container. The
high-performance runway itself remains a native custom element
(`runway-section`) mounted by React, while its routing and animation logic stay
in TypeScript.

## Prerequisites

- Node.js 20 or newer
- npm

## Setup

Install dependencies:

```bash
npm install
```

Copy `.env.example` to `.env.local` if you need to configure the Gemini API or
deployment URL:

```bash
cp .env.example .env.local
```

The storefront itself runs without an API key. Keep secrets in `.env.local`;
that file is ignored by git.

## Development

Start the local development server:

```bash
npm run dev
```

Vite will print the available local URL when it starts, typically
`http://localhost:5173`. If that port is busy, Vite automatically selects the
next available port.

## Verification

```bash
npm run lint
npm test
npm run build
```

`npm run preview` serves the production build locally after `npm run build`.

## Project structure

- `index.html` — minimal Vite document and React root
- `src/App.tsx` — React application shell
- `src/main.tsx` — React entry point
- `src/runway-section.ts` — interactive runway custom element
- `public/runway-template.html` — generated runway markup fetched and mounted by React
- `src/pages/` — cart, collection, tracking, and admin views
- `src/data.ts` — product and lookbook data
- `src/runway-logic.ts` — carousel and styling-bag logic
- `src/orders-store.ts` — local order persistence and reporting
- `scripts/build-html.ts` — generates the static runway markup in `public/runway-template.html`

## Why `index.html` is large

The runway template is kept separate from the minimal `index.html` so the Vite
document stays easy to understand. React fetches the generated template and
mounts the runway custom element without embedding its large markup in the
JavaScript bundle. Non-initial model and product images use lazy loading.
