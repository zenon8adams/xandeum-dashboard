<div style="display: flex; align-items: center; justify-content: center; gap: 1rem;">
    <b style="font-size: 2rem;">Xandeum Analytics Dashboard</b>
    <img src="./public/assets/xandeum-node.png" 
             alt="Xandeum logo" 
             style="width: 60px; height: 60px; border-radius: 100%; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
</div>

## **Project Overview:**

This is the frontend for the [Xandeum](https://www.xandeum.network/) analytics dashboard, built on top of this [backend repo](https://github.com/zenon8adams/xandeum-network-backend.git).

It’s built with Vite, React, and TypeScript, and focuses on making Xandeum’s network data easy to explore — including provider node (pNode) performance, overall storage and usage, node credits, geographic distribution, and an AI-powered chat for querying network insights.

---

### **Key Features**

- **Interactive network view:** A dedicated _Network_ page with a D3-based cluster graph showing pNodes and the versions they’re running.
- **Table & world views:** Separate pages to explore all pNodes either in a structured table or plotted on a global map.
- **Node shell:** An in-app shell that lets you run commands against public pNode endpoints to fetch live stats and status directly from the UI.
- **Sidebar details:** Rich, contextual info for selected nodes, including storage, uptime, location, public endpoint, node status, and credit ranking.
- **AI-powered chat:** Explore network insights and metrics using simple, natural-language queries.

---

<br/>

  <img src="./public/assets/map.png" alt="Network map" style="display:block;width:100%;height:auto;border-radius:8px;object-fit:cover;box-shadow:0 6px 18px rgba(0,0,0,0.08);" />

---

### **Quick Start**

Prerequisites:

- Node.js 18+ (or current LTS)
- npm or yarn

Install and run locally:

```bash
git clone <repo-url>
cd xandeum-dashboard
# install
npm install

# create .env (see below)
# development
npm run start

# build
npm run build

# preview production build
npm run preview
```

Environment

- The app requires `VITE_API_BASE_URL` to point to the backend API (example below).

Example `.env`

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

---

### **Important files & folders**

- **[src/App.tsx](src/App.tsx)**: Main app layout and view switching
- **[src/index.tsx](src/index.tsx)**: App bootstrap and `QueryProvider`
- **[src/components/NetworkGraph.tsx](src/components/NetworkGraph.tsx)**: D3 network visualization
- **[src/components/Sidebar.tsx](src/components/Sidebar.tsx)**: Node details, charts and AI search UI
- **[src/components/ApiDataIntegrator.tsx](src/components/ApiDataIntegrator.tsx)**: Bridges react-query data to app
- **[src/hooks/useNodes.ts](src/hooks/useNodes.ts)**: React Query hooks for root and leaf nodes
- **[src/api/client.ts](src/api/client.ts)**: Axios client + API helpers + `smartQuery`
- **[src/utils](src/utils)**: helpers, aggregation, IP utils, formatting

**Environment & Configuration**

- The base API URL is read from `import.meta.env.VITE_API_BASE_URL`. Set this in a `.env` file at the repo root before running the dev server.

**Development notes**

- Data polling intervals are configured in `src/hooks/useNodes.ts` (currently refetch interval 60s).
- The network graph computes layout client-side (D3) using aggregated data provided by the API.

**Testing**

- Unit tests use `vitest`. Run:

```bash
yarn run test
```

---

## Image layout example ✅

Below is a simple HTML + CSS snippet you can drop into any markdown-rendered page (or a docs page) to display three images from `public/assets/` with the **map** taking the full width on top and the **table** and **graph** sharing the width beneath.

> Note: Files in `public/` are served at the site root. Use `/assets/<name>` as the image `src` (e.g. `/assets/map.png`).

This layout is intentionally minimal and framework-agnostic (works in raw HTML/CSS or in React/MDX). If you'd like, I can provide a Tailwind CSS variant or an accessible, responsive React component for reuse.
