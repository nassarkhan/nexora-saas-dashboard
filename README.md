# Nexora — SaaS Dashboard Template

A premium, fully functional SaaS dashboard. Not a screenshot: every page, button, filter, form, chart and export works. Built with React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, React Router and Lucide icons.

> **Demo data:** the app ships with clearly labelled sample data (12 projects, 14 customers, 28 transactions, 10 notifications, 4 reports) stored in your browser's localStorage. No backend, no API keys, no account. Your edits persist across refreshes. Reset them any time from **Settings → Reset demo data**.

## Quick start

```bash
npm install
npm run dev        # open http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

Requires Node.js 20+.

## Features

- **8 pages** with client-side routing: Overview, Analytics, Projects, Customers, Transactions, Reports, Notifications, Settings
- **Overview:** welcome + live date/time, date-range selector (7 / 30 / 90 days / 12 months) that recalculates KPIs and charts against an **equal-length previous period**, 4 KPI cards with % change, sparklines and previous-period values, revenue area chart, traffic donut, recent transactions, activity feed
- **Analytics:** monthly/daily bar chart, customer-acquisition line, period comparison table, conversion funnel, trend explorer, CSV export that follows the selected range
- **Projects / Customers / Transactions:** search, sort, filter, pagination (pages clamp back after deletions), status badges, row-action menus that work inside scrolling tables, create / edit / delete with validation and toast feedback, detail modals
- **Transactions that actually connect:** recording a completed payment updates the customer's lifetime spend, adds an activity entry and a "Payment received" notification; refunding reverses the spend exactly
- **Reports:** create reports, export CSV with proper quote escaping honouring the report's own date range; "PDF summary" reports download a real generated PDF
- **Notifications:** unread badge in the sidebar and top bar, mark one / all read, unread filter, delete
- **Settings:** profile, currency **USD / EUR / GBP / PKR** (reformats every amount, chart axis, form label, search result and notification immediately — no Save button), light/dark theme (menus and toasts follow dark mode), notification toggles, language as a saved preference only (it does not translate the interface)
- **Global search:** finds customers, projects and transactions and opens the exact item — even when you are already on that page
- **Responsive:** collapsible sidebar on desktop, drawer on mobile, KPI cards stack, tables scroll horizontally inside their cards (no page-level horizontal overflow)

## Project structure

```
src/
  main.tsx            # entry point
  App.tsx             # routes
  index.css           # Tailwind v4 setup + dark-mode variant
  lib/
    types.ts          # data models
    utils.ts          # money/date formatting, CSV escaping, PDF generation, downloads
    store.tsx         # state, localStorage persistence, all CRUD + side effects
  data/
    seed.ts           # demo data (edit here to change the sample workspace)
  components/
    Layout.tsx        # sidebar, top bar, global search, breadcrumbs, bell, avatar menu
    ui.tsx            # cards, badges, buttons, modals, portal row-menus, pagination, toasts
  pages/
    Overview.tsx  Analytics.tsx  Projects.tsx  Customers.tsx
    Transactions.tsx  Reports.tsx  Notifications.tsx  Settings.tsx
```

## Customising

- **Brand:** change the name/logo in `src/components/Layout.tsx` and the `<title>` in `index.html`.
- **Currency / defaults:** edit the default `settings` in `src/data/seed.ts`.
- **Demo data:** edit `src/data/seed.ts` — or delete the `nexora-dashboard-v1` key in localStorage to reseed.
- **Colours:** Tailwind classes live in the components; the accent is slate + sky, deliberately restrained.

## Going live with a real backend

The data layer is deliberately isolated: `src/lib/store.tsx` (state + actions) and `src/data/seed.ts` (sample data). Replace the localStorage load/save in `store.tsx` with calls to your API (REST, Supabase, etc.) and keep the same action names — the pages do not need to change.

## Licence

Proprietary — see `LICENSE.md`. A **Standard licence** covers one project. An **Extended licence** covers multiple projects and client work. You may not redistribute, resell, share or publish the source code.

Sales on CodeCanyon are governed by Envato's Regular/Extended licences (see Envato licence terms at purchase); this proprietary licence applies to direct sales outside Envato. See `LICENSE.md` and `LICENSE-CODECANYON.md`.

## Support

For install or usage help, use the support channel for where you bought Nexora: on CodeCanyon, use the item's support page; for direct sales, use the seller's store page. Include the page, the action you took, and any message shown on screen.
