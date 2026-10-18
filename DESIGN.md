# Design Brief

## Direction

Bengkel Presisi — a calm, precise workshop tool for Indonesian phone-repair shops, from device intake to pickup.

## Tone

Refined industrial calm: cool neutral surfaces, one confident teal-slate accent, dense-but-legible data. Restrained like a professional tool, never decorative.

## Differentiation

A coherent six-stage ticket color scale (Diterima → Diambil) that lets a technician read a ticket's whole journey at a glance from any table row or badge.

## Color Palette

| Token      | OKLCH        | Role                                     |
| ---------- | ------------ | ---------------------------------------- |
| background | 0.985 0.004 220 | Cool off-white app canvas            |
| foreground | 0.19 0.02 225   | Primary text                         |
| card       | 1.0 0.002 220   | Elevated surfaces, tables, panels    |
| primary    | 0.44 0.095 215  | Deep teal-slate — CTAs, active nav   |
| accent     | 0.6 0.13 190    | Cool teal — highlights, links        |
| muted      | 0.955 0.008 220 | Secondary fills, table headers       |
| success    | 0.55 0.15 150   | Completed / paid states              |
| warning    | 0.72 0.15 78    | Waiting / attention states           |
| destructive| 0.55 0.21 25    | Delete, overdue, errors              |

### Ticket Stage Scale

| Stage              | Token                    | OKLCH          |
| ------------------ | ------------------------ | -------------- |
| Diterima           | stage-diterima           | 0.52 0.05 235  |
| Diagnosa           | stage-diagnosa           | 0.52 0.14 250  |
| Menunggu Sparepart | stage-sparepart          | 0.6 0.14 72    |
| Dikerjakan         | stage-dikerjakan         | 0.5 0.16 295   |
| Selesai            | stage-selesai            | 0.5 0.14 152   |
| Diambil            | stage-diambil            | 0.45 0.03 200  |

Each stage has a `-bg` tint token for badge backgrounds.

## Typography

- Display: Space Grotesk — headings, page titles, stat numbers
- Body: DM Sans — UI labels, table cells, paragraphs
- Mono: JetBrains Mono — ticket numbers, IMEI/serial, currency
- Scale: hero `text-4xl md:text-5xl font-bold tracking-tight`, h2 `text-2xl md:text-3xl font-bold tracking-tight`, label `text-xs font-semibold tracking-widest uppercase text-muted-foreground`, body `text-sm md:text-base`

## Elevation & Depth

Layered surfaces: white cards on cool off-white canvas with `shadow-subtle`; `shadow-elevated` for dropdowns/popovers; `shadow-panel` for modals. Borders stay thin (1px) and cool.

## Structural Zones

| Zone    | Background      | Border     | Notes                                          |
| ------- | --------------- | ---------- | ---------------------------------------------- |
| Header  | bg-card         | border-b   | Search, notifications, user avatar             |
| Sidebar | bg-sidebar      | border-r   | Active item: bg-sidebar-accent rounded, primary text |
| Content | bg-background   | —          | Alternate sections with bg-muted/40            |
| Footer  | bg-muted/40     | border-t   | Small print, version, muted text               |

## Spacing & Rhythm

Generous page padding (`p-4 md:p-6 lg:p-8`); section gaps `space-y-6`; card padding `p-4 md:p-5`; micro-spacing `gap-2`/`gap-3` in toolbars and badges.

## Component Patterns

- Buttons: `rounded-md`, primary = bg-primary text-primary-foreground, hover darkens + `shadow-subtle`; secondary = bg-secondary; ghost for table actions
- Cards: `rounded-lg bg-card border shadow-subtle`, hover lifts to `shadow-elevated` on interactive cards
- Badges: pill `rounded-full px-2.5 py-0.5 text-xs font-semibold`, stage tokens use `bg-stage-*-bg text-stage-*`
- Tables: `bg-muted/50` header row, `border-b` row dividers, tabular-nums for numbers, right-aligned currency

## Motion

- Entrance: `animate-fade-in-up` on cards/rows, 0.35s ease-out, staggered ~40ms
- Hover: `transition-smooth` on buttons/cards/rows, 0.3s
- Decorative: `animate-pulse-soft` only for live "in progress" indicators

## Constraints

- Mobile-first: tables scroll horizontally or collapse to stacked cards below `md`
- Token-only styling — no raw hex/rgb or arbitrary color classes
- Indonesian UI copy throughout; currency `Rp 1.250.000`, dates `15 Okt 2023`
- Max 3 font families; status colors reserved for ticket stages

## Signature Detail

The six-stage status scale rendered as a consistent pill badge + colored dot pair — the one visual system that turns a dense ticket table into an instantly readable workflow map.
