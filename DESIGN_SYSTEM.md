# Ultimate Design System Specification
# For Modern SaaS / CRM / Business Applications
# Version 2.0 — Production Ready

> **Purpose**: Hand this file to any AI (Claude, GPT, Cursor, etc.) and it will generate
> production-grade, consistent, premium UI for any SaaS application. This is your
> signature development style — one system, every project, always premium.

> **Stack**: React 18+ · TypeScript · Tailwind CSS 3.4+ · shadcn/ui · Radix UI · Framer Motion · Lucide Icons · TanStack Table · cmdk

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 1 — FOUNDATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 1.1 Design Philosophy

1. **Consistency over creativity** — Every element follows the same spacing, color, and typography rules.
2. **Density with clarity** — Show more data without feeling cramped. Use whitespace strategically.
3. **Keyboard-first** — Power users navigate without a mouse. Every action has a shortcut.
4. **Progressive disclosure** — Show the minimum needed, reveal more on demand.
5. **Speed perception** — Optimistic updates, skeleton loaders, smooth transitions. Never show a blank screen.
6. **Accessible by default** — WCAG 2.1 AA minimum. Focus rings, aria labels, screen reader support.

## 1.2 Project Structure

```
src/
├── app/                          # Next.js App Router (or pages/ for Vite)
│   ├── (auth)/                   # Auth layout group
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Main app layout group
│   │   ├── layout.tsx            # Sidebar + Header shell
│   │   ├── page.tsx              # Dashboard home
│   │   ├── [entity]/             # Dynamic entity routes (jobs, contacts, etc.)
│   │   │   ├── page.tsx          # List view
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Detail view
│   │   └── settings/
│   └── layout.tsx                # Root layout (providers, fonts, meta)
├── components/
│   ├── ui/                       # shadcn/ui base components (DO NOT MODIFY)
│   ├── shared/                   # App-wide shared components
│   │   ├── app-shell.tsx         # Sidebar + Header + Content wrapper
│   │   ├── data-table.tsx        # Full-featured data table
│   │   ├── page-header.tsx       # Page title + actions bar
│   │   ├── stat-card.tsx         # Dashboard metric card
│   │   ├── status-badge.tsx      # Semantic status badges
│   │   ├── empty-state.tsx       # Illustrated empty states
│   │   ├── inline-edit.tsx       # Click-to-edit fields
│   │   ├── command-menu.tsx      # ⌘K command palette
│   │   ├── activity-feed.tsx     # Timeline/activity component
│   │   └── avatar-group.tsx      # Stacked avatar group
│   └── [feature]/                # Feature-specific components
├── hooks/                        # Custom React hooks
├── lib/                          # Utilities, API client, constants
│   ├── utils.ts                  # cn() helper, formatters
│   └── constants.ts              # App-wide constants
├── stores/                       # State management (Zustand recommended)
├── types/                        # TypeScript type definitions
└── styles/
    └── globals.css               # CSS variables + base styles
```

## 1.3 Design Tokens — Colors

### Theme: Professional Blue (Default)

Use HSL format for all colors. This enables easy theme switching via CSS variables.

```css
/* globals.css */
@layer base {
  :root {
    /* ── Surface / Background ─────────────────────────────────── */
    --background: 0 0% 100%;            /* #FFFFFF — page background */
    --foreground: 222.2 84% 4.9%;       /* #030712 — primary text */

    --card: 0 0% 100%;                  /* #FFFFFF — card background */
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    /* ── Brand / Primary ──────────────────────────────────────── */
    --primary: 221.2 83.2% 53.3%;       /* #2563EB — primary actions */
    --primary-foreground: 210 40% 98%;  /* white text on primary */

    /* ── Secondary ────────────────────────────────────────────── */
    --secondary: 210 40% 96.1%;         /* #F1F5F9 — secondary buttons, subtle bg */
    --secondary-foreground: 222.2 47.4% 11.2%;

    /* ── Muted ────────────────────────────────────────────────── */
    --muted: 210 40% 96.1%;             /* #F1F5F9 — disabled, placeholder bg */
    --muted-foreground: 215.4 16.3% 46.9%; /* #6B7280 — secondary text */

    /* ── Accent ───────────────────────────────────────────────── */
    --accent: 210 40% 96.1%;            /* hover states, active sidebar item */
    --accent-foreground: 222.2 47.4% 11.2%;

    /* ── Destructive ──────────────────────────────────────────── */
    --destructive: 0 84.2% 60.2%;       /* #EF4444 — errors, delete actions */
    --destructive-foreground: 210 40% 98%;

    /* ── Border / Input / Ring ────────────────────────────────── */
    --border: 214.3 31.8% 91.4%;        /* #E2E8F0 — card borders, dividers */
    --input: 214.3 31.8% 91.4%;         /* input borders */
    --ring: 221.2 83.2% 53.3%;          /* focus ring = primary */

    /* ── Border Radius ────────────────────────────────────────── */
    --radius: 0.5rem;                   /* 8px — base radius for cards */

    /* ── Sidebar (if using sidebar layout) ────────────────────── */
    --sidebar-background: 0 0% 98%;     /* #FAFAFA */
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 221.2 83.2% 53.3%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 221.2 83.2% 53.3%;

    /* ── Semantic Colors (Custom) ─────────────────────────────── */
    --success: 142.1 76.2% 36.3%;       /* #16A34A — success states */
    --success-foreground: 0 0% 100%;
    --warning: 37.7 92.1% 50.2%;        /* #F59E0B — warning states */
    --warning-foreground: 0 0% 100%;
    --info: 199.4 95.5% 53.8%;          /* #0EA5E9 — info states */
    --info-foreground: 0 0% 100%;

    /* ── Chart Colors ─────────────────────────────────────────── */
    --chart-1: 221.2 83.2% 53.3%;       /* primary blue */
    --chart-2: 142.1 76.2% 36.3%;       /* green */
    --chart-3: 37.7 92.1% 50.2%;        /* amber */
    --chart-4: 262.1 83.3% 57.8%;       /* violet */
    --chart-5: 0 84.2% 60.2%;           /* red */
  }

  .dark {
    --background: 222.2 84% 4.9%;       /* #030712 */
    --foreground: 210 40% 98%;          /* #F8FAFC */

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 217.2 91.2% 59.8%;       /* #3B82F6 — slightly lighter for dark */
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;     /* #1E293B */
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 50.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;

    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;

    --success: 142.1 70.6% 45.3%;
    --success-foreground: 0 0% 100%;
    --warning: 37.7 92.1% 50.2%;
    --warning-foreground: 0 0% 0%;
    --info: 199.4 95.5% 53.8%;
    --info-foreground: 0 0% 100%;

    --chart-1: 217.2 91.2% 59.8%;
    --chart-2: 142.1 70.6% 45.3%;
    --chart-3: 37.7 92.1% 50.2%;
    --chart-4: 262.1 83.3% 57.8%;
    --chart-5: 0 62.8% 50.6%;
  }
}
```

### Alternative Theme: Modern Violet

Replace the primary variables to switch theme:
```css
:root {
  --primary: 262.1 83.3% 57.8%;         /* #7C3AED — Violet */
  --primary-foreground: 210 40% 98%;
  --ring: 262.1 83.3% 57.8%;
  --sidebar-primary: 262.1 83.3% 57.8%;
}
.dark {
  --primary: 263.4 70% 50.4%;
  --ring: 263.4 70% 50.4%;
  --sidebar-primary: 263.4 70% 50.4%;
}
```

### Alternative Theme: Warm Teal

```css
:root {
  --primary: 172.5 66% 50.4%;           /* #14B8A6 — Teal */
  --primary-foreground: 0 0% 100%;
  --ring: 172.5 66% 50.4%;
  --sidebar-primary: 172.5 66% 50.4%;
}
.dark {
  --primary: 170.6 76.9% 44.3%;
  --ring: 170.6 76.9% 44.3%;
  --sidebar-primary: 170.6 76.9% 44.3%;
}
```

## 1.4 Design Tokens — Typography

```
Font Family:
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
  --font-mono: "JetBrains Mono", "Fira Code", ui-monospace, monospace

Font Sizes (Tailwind classes):
  text-xs     → 12px / 16px line-height   — Timestamps, badges, helper text
  text-sm     → 14px / 20px line-height   — Body text, table cells, form labels
  text-base   → 16px / 24px line-height   — Prominent body text
  text-lg     → 18px / 28px line-height   — Card titles, section headers
  text-xl     → 20px / 28px line-height   — Page subtitles
  text-2xl    → 24px / 32px line-height   — Page titles
  text-3xl    → 30px / 36px line-height   — Dashboard stat values
  text-4xl    → 36px / 40px line-height   — Hero numbers (rarely used)

Font Weights:
  font-normal   (400)  — Body text, descriptions
  font-medium   (500)  — Labels, table headers, nav items
  font-semibold (600)  — Page titles, card titles, stat values
  font-bold     (700)  — RARELY USED. Only for extreme emphasis.

3-Tier Text Color System:
  text-foreground          — Primary text (headings, important content)
  text-muted-foreground    — Secondary text (descriptions, metadata, timestamps)
  text-muted-foreground/60 — Tertiary text (placeholders, disabled, helper)
```

## 1.5 Design Tokens — Spacing

```
All spacing follows a 4px base grid. Use Tailwind spacing scale:

  0.5 →  2px    — Micro gaps (icon-to-text inside badges)
  1   →  4px    — Tight gaps (between badge icon and label)
  1.5 →  6px    — Small inner padding
  2   →  8px    — Inner padding (badges, small buttons)
  3   → 12px    — Default gap between related items
  4   → 16px    — Standard padding (cards, inputs, sections)
  5   → 20px    — Medium section spacing
  6   → 24px    — Large section spacing, page padding on mobile
  8   → 32px    — Section dividers, card gaps
  10  → 40px    — Large section gaps
  12  → 48px    — Page-level vertical sections
  16  → 64px    — Hero sections, large vertical spacing

Standard Usage:
  Card padding:        p-6 (24px)
  Card gap in grid:    gap-4 (16px) or gap-6 (24px)
  Section spacing:     space-y-6 (24px) or space-y-8 (32px)
  Form field gap:      space-y-4 (16px)
  Page side padding:   px-6 (24px) on desktop, px-4 (16px) on mobile
  Page top padding:    pt-6 (24px)
  Between label+input: space-y-2 (8px)
  Inline icon gap:     gap-2 (8px)
```

## 1.6 Design Tokens — Shadows, Radius, Z-Index

```
Shadows (3-tier system):
  shadow-sm    — Subtle cards, dropdowns at rest
  shadow-md    — Elevated cards (on hover), popovers
  shadow-lg    — Modals, command palette, floating elements
  shadow-xl    — Drag previews, tooltips with emphasis
  shadow-none  — Flat elements (inside cards, list items)

Border Radius:
  rounded-sm   (2px)  — Badges, small tags
  rounded-md   (6px)  — Inputs, buttons, small cards
  rounded-lg   (8px)  — Cards, modals, dropdowns (DEFAULT)
  rounded-xl   (12px) — Large cards, image containers
  rounded-full         — Avatars, circular buttons, pills

  RULE: Cards = rounded-lg, Buttons = rounded-md, Inputs = rounded-md,
        Avatars = rounded-full, Badges = rounded-sm or rounded-full

Z-Index Scale:
  z-0          — Default
  z-10         — Sticky elements (table headers)
  z-20         — Sidebar
  z-30         — Header/Navbar
  z-40         — Dropdowns, popovers, tooltips
  z-50         — Modals, dialogs, command palette
  z-[9999]     — Toast notifications (always on top)
```

## 1.7 Tailwind Config Extension

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "ui-monospace", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slide-in-from-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-to-right": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in-right": "slide-in-from-right 0.3s ease-out",
        "slide-out-right": "slide-out-to-right 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

## 1.8 Global CSS Base Styles

```css
/* globals.css — add AFTER the :root variables */

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground antialiased;
    font-feature-settings: "cv11", "ss01";  /* Inter stylistic sets */
    font-variation-settings: "opsz" 32;
  }

  /* Smooth scrolling */
  html {
    scroll-behavior: smooth;
  }

  /* Custom scrollbar (Webkit) */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    @apply bg-border rounded-full;
  }
  ::-webkit-scrollbar-thumb:hover {
    @apply bg-muted-foreground/30;
  }

  /* Firefox scrollbar */
  * {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--border)) transparent;
  }

  /* Focus visible ring — consistent across all focusable elements */
  *:focus-visible {
    @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
  }

  /* Selection highlight */
  ::selection {
    @apply bg-primary/20 text-foreground;
  }
}

/* Utility classes */
@layer utilities {
  /* Truncate with ellipsis */
  .truncate-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .truncate-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Subtle border — lighter than default */
  .border-subtle {
    border-color: hsl(var(--border) / 0.5);
  }

  /* Glass morphism effect */
  .glass {
    @apply bg-background/80 backdrop-blur-md;
  }
}
```

## 1.9 Utility Helper — cn()

```ts
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 2 — LAYOUT & NAVIGATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 2.1 App Shell — The Master Layout

Every page in the app lives inside this shell. It provides the sidebar, header, and content area.

```
┌──────────────────────────────────────────────────────────────────┐
│ ┌──────────┐ ┌─────────────────────────────────────────────────┐ │
│ │          │ │  Header (h-14)                    [Search] [👤] │ │
│ │          │ ├─────────────────────────────────────────────────┤ │
│ │ Sidebar  │ │                                                 │ │
│ │ (w-64)   │ │  Content Area                                   │ │
│ │          │ │  (flex-1, overflow-auto)                         │ │
│ │ • Nav    │ │                                                 │ │
│ │ • Items  │ │  ┌─────────────────────────────────────────┐    │ │
│ │          │ │  │ Page Header                              │    │ │
│ │          │ │  │ Title + Actions                          │    │ │
│ │          │ │  ├─────────────────────────────────────────┤    │ │
│ │          │ │  │                                         │    │ │
│ │          │ │  │ Page Content                             │    │ │
│ │          │ │  │                                         │    │ │
│ │          │ │  └─────────────────────────────────────────┘    │ │
│ │          │ │                                                 │ │
│ └──────────┘ └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### App Shell Implementation

```tsx
// components/shared/app-shell.tsx

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-screen-2xl px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

## 2.2 Sidebar

### Specs
```
Width:          256px (w-64) expanded, 64px (w-16) collapsed
Background:     hsl(var(--sidebar-background))
Border:         border-r border-sidebar-border
Transition:     width 300ms cubic-bezier(0.4, 0, 0.2, 1)
Position:       Fixed on desktop, slide-over on mobile (z-20)
```

### Sidebar Structure

```tsx
// Sidebar layout structure
<aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
  {/* Logo / Brand — h-14 to align with header */}
  <div className="flex h-14 items-center gap-2 px-4 border-b border-sidebar-border">
    <Logo className="h-8 w-8" />
    <span className="font-semibold text-lg text-sidebar-foreground">AppName</span>
  </div>

  {/* Navigation — scrollable */}
  <nav className="flex-1 overflow-auto px-3 py-4">
    {/* Section label */}
    <p className="mb-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
      Main
    </p>

    {/* Nav items */}
    <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/" />
    <SidebarItem icon={Users} label="Contacts" href="/contacts" active />
    <SidebarItem icon={Briefcase} label="Jobs" href="/jobs" />
    <SidebarItem icon={Calendar} label="Calendar" href="/calendar" />
    <SidebarItem icon={BarChart3} label="Reports" href="/reports" />

    {/* Section divider */}
    <div className="my-4 border-t border-sidebar-border" />

    <p className="mb-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
      Settings
    </p>
    <SidebarItem icon={Settings} label="Settings" href="/settings" />
  </nav>

  {/* Bottom section — user profile */}
  <div className="border-t border-sidebar-border p-3">
    <UserMenu />
  </div>
</aside>
```

### Sidebar Nav Item

```tsx
interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  active?: boolean;
  badge?: string | number;
}

function SidebarItem({ icon: Icon, label, href, active, badge }: SidebarItemProps) {
  return (
    <a
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
      {badge !== undefined && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">
          {badge}
        </span>
      )}
    </a>
  );
}
```

### Collapsed Sidebar (Icon Only)

```tsx
// When collapsed (w-16), hide labels and show only icons:
<aside className="flex h-full w-16 flex-col border-r border-sidebar-border bg-sidebar">
  <div className="flex h-14 items-center justify-center border-b border-sidebar-border">
    <Logo className="h-8 w-8" />
  </div>
  <nav className="flex-1 overflow-auto px-2 py-4">
    {/* Tooltip wraps each item to show label on hover */}
    <Tooltip>
      <TooltipTrigger asChild>
        <a className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-sidebar-accent mx-auto">
          <LayoutDashboard className="h-4 w-4" />
        </a>
      </TooltipTrigger>
      <TooltipContent side="right">Dashboard</TooltipContent>
    </Tooltip>
  </nav>
</aside>
```

## 2.3 Header / Top Bar

```
Height:         56px (h-14)
Background:     bg-background (or glass effect: bg-background/80 backdrop-blur-md)
Border:         border-b border-border
Position:       Sticky top (sticky top-0 z-30)
```

### Header Implementation

```tsx
<header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-md px-6">
  {/* Mobile menu trigger (hidden on desktop) */}
  <Button variant="ghost" size="icon" className="lg:hidden">
    <Menu className="h-5 w-5" />
  </Button>

  {/* Breadcrumb or page context */}
  <div className="hidden lg:flex items-center gap-1.5 text-sm text-muted-foreground">
    <span>Dashboard</span>
    <ChevronRight className="h-3.5 w-3.5" />
    <span className="text-foreground font-medium">Contacts</span>
  </div>

  {/* Spacer */}
  <div className="flex-1" />

  {/* Global Search Trigger (⌘K) */}
  <Button
    variant="outline"
    className="hidden md:flex items-center gap-2 text-muted-foreground w-64 justify-start"
    onClick={() => setCommandOpen(true)}
  >
    <Search className="h-4 w-4" />
    <span className="text-sm">Search...</span>
    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
      ⌘K
    </kbd>
  </Button>

  {/* Notification bell */}
  <Button variant="ghost" size="icon" className="relative">
    <Bell className="h-4 w-4" />
    {/* Unread dot */}
    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
  </Button>

  {/* User avatar dropdown */}
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
        <Avatar className="h-8 w-8">
          <AvatarImage src="/avatar.jpg" alt="User" />
          <AvatarFallback className="text-xs">JD</AvatarFallback>
        </Avatar>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-56" align="end">
      <DropdownMenuLabel>My Account</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem><User className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
      <DropdownMenuItem><Settings className="mr-2 h-4 w-4" /> Settings</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-destructive"><LogOut className="mr-2 h-4 w-4" /> Log out</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</header>
```

## 2.4 Page Header Component

Every page starts with a consistent header: title on the left, actions on the right.

```tsx
// components/shared/page-header.tsx

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode; // Action buttons go here
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}

// Usage:
<PageHeader title="Contacts" description="Manage your contacts and leads.">
  <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export</Button>
  <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Contact</Button>
</PageHeader>
```

## 2.5 Page Templates

### Template A: List Page (Most Common)

```
┌──────────────────────────────────────────────┐
│ Page Header                        [+ Add]   │
├──────────────────────────────────────────────┤
│ Filters Bar  [Search] [Status ▾] [Date ▾]   │
├──────────────────────────────────────────────┤
│ Data Table                                    │
│ ┌──┬────────────┬────────┬────────┬────────┐ │
│ │☐ │ Name       │ Status │ Date   │ Actions│ │
│ ├──┼────────────┼────────┼────────┼────────┤ │
│ │☐ │ John Doe   │ Active │ Mar 24 │ •••    │ │
│ │☐ │ Jane Smith │ Pending│ Mar 23 │ •••    │ │
│ └──┴────────────┴────────┴────────┴────────┘ │
│ Pagination                    1 2 3 ... 10    │
└──────────────────────────────────────────────┘
```

```tsx
// Structure for list pages
export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Contacts" description="Manage your contacts and leads.">
        <Button variant="outline" size="sm"><Upload className="mr-2 h-4 w-4" /> Import</Button>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Contact</Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search contacts..." className="pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <Select><SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger></Select>
          <Select><SelectTrigger className="w-[140px]"><SelectValue placeholder="Source" /></SelectTrigger></Select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable columns={columns} data={contacts} />

      {/* Pagination */}
      <Pagination />
    </div>
  );
}
```

### Template B: Detail Page

```
┌──────────────────────────────────────────────┐
│ ← Back   Contact Name              [Edit] [⋯]│
├──────────────────────────────────────────────┤
│ ┌────────────────┐  ┌──────────────────────┐ │
│ │ Info Card       │  │ Activity / Timeline   │ │
│ │ Avatar          │  │ ┌──────────────────┐ │ │
│ │ Name            │  │ │ Mar 24 — Called   │ │ │
│ │ Email           │  │ │ Mar 23 — Email    │ │ │
│ │ Phone           │  │ │ Mar 22 — Note     │ │ │
│ │ Status          │  │ └──────────────────┘ │ │
│ └────────────────┘  └──────────────────────┘ │
│ ┌────────────────────────────────────────────┐│
│ │ Tabs: Overview | Notes | Files | History    ││
│ │ ┌────────────────────────────────────────┐ ││
│ │ │ Tab Content                             │ ││
│ │ └────────────────────────────────────────┘ ││
│ └────────────────────────────────────────────┘│
└──────────────────────────────────────────────┘
```

```tsx
export default function ContactDetailPage() {
  return (
    <div className="space-y-6">
      {/* Back + Title */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/contacts"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">John Doe</h1>
          <p className="text-sm text-muted-foreground">Added on March 24, 2026</p>
        </div>
        <Button variant="outline" size="sm">Edit</Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          {/* ... actions */}
        </DropdownMenu>
      </div>

      {/* Top row: Info + Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="p-6 space-y-4">
            {/* Contact info fields */}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
          <CardContent><ActivityFeed items={activities} /></CardContent>
        </Card>
      </div>

      {/* Tabs section */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          {/* ... */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Template C: Dashboard Page

```
┌──────────────────────────────────────────────┐
│ Dashboard                      [Date Range ▾] │
├──────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │ Stat │ │ Stat │ │ Stat │ │ Stat │         │
│ │ Card │ │ Card │ │ Card │ │ Card │         │
│ └──────┘ └──────┘ └──────┘ └──────┘         │
│ ┌──────────────────┐ ┌────────────────────┐  │
│ │ Chart            │ │ Recent Activity     │  │
│ │ (col-span-2)     │ │ (col-span-1)        │  │
│ └──────────────────┘ └────────────────────┘  │
│ ┌────────────────────────────────────────────┐│
│ │ Recent Items Table                          ││
│ └────────────────────────────────────────────┘│
└──────────────────────────────────────────────┘
```

```tsx
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard">
        <DateRangePicker />
      </PageHeader>

      {/* Stat cards row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Contacts" value="2,847" change="+12.5%" trend="up" icon={Users} />
        <StatCard title="Active Jobs" value="24" change="+3" trend="up" icon={Briefcase} />
        <StatCard title="Interviews" value="18" change="-2" trend="down" icon={Calendar} />
        <StatCard title="Revenue" value="$48.2K" change="+8.1%" trend="up" icon={DollarSign} />
      </div>

      {/* Charts + Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Pipeline Overview</CardTitle></CardHeader>
          <CardContent>{/* Chart component */}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent><ActivityFeed items={recentActivities} /></CardContent>
        </Card>
      </div>

      {/* Recent table */}
      <Card>
        <CardHeader><CardTitle>Recent Contacts</CardTitle></CardHeader>
        <CardContent><DataTable columns={columns} data={recentContacts} /></CardContent>
      </Card>
    </div>
  );
}
```

### Template D: Settings Page

```tsx
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account and preferences." />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Form fields */}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## 2.6 Command Palette (⌘K)

The global command palette is the single most impactful feature for perceived quality.

```tsx
// components/shared/command-menu.tsx
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => {}}>
            <Plus className="mr-2 h-4 w-4" /> Create New Contact
            <CommandShortcut>C</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => {}}>
            <Plus className="mr-2 h-4 w-4" /> Create New Job
            <CommandShortcut>J</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => {}}>
            <Calendar className="mr-2 h-4 w-4" /> Schedule Interview
            <CommandShortcut>I</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</CommandItem>
          <CommandItem><Users className="mr-2 h-4 w-4" /> Go to Contacts</CommandItem>
          <CommandItem><Briefcase className="mr-2 h-4 w-4" /> Go to Jobs</CommandItem>
          <CommandItem><BarChart3 className="mr-2 h-4 w-4" /> Go to Reports</CommandItem>
          <CommandItem><Settings className="mr-2 h-4 w-4" /> Go to Settings</CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Recent Items — dynamically populated */}
        <CommandGroup heading="Recent">
          <CommandItem><Clock className="mr-2 h-4 w-4" /> John Doe — Contact</CommandItem>
          <CommandItem><Clock className="mr-2 h-4 w-4" /> Senior Developer — Job</CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Theme / Settings */}
        <CommandGroup heading="Settings">
          <CommandItem><Sun className="mr-2 h-4 w-4" /> Switch to Light Mode</CommandItem>
          <CommandItem><Moon className="mr-2 h-4 w-4" /> Switch to Dark Mode</CommandItem>
          <CommandItem><Monitor className="mr-2 h-4 w-4" /> Use System Theme</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

// Register the global shortcut in your root layout:
useEffect(() => {
  const down = (e: KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setCommandOpen((prev) => !prev);
    }
  };
  document.addEventListener("keydown", down);
  return () => document.removeEventListener("keydown", down);
}, []);
```

## 2.7 Side Drawer / Sheet

Used for quick-create forms and previews without leaving the current page.

```
Specs:
  Width:          440px (w-[440px]) for forms, 600px for previews
  Position:       Fixed right, full height
  Overlay:        bg-black/50 backdrop-blur-sm
  Animation:      slide in from right (300ms ease-out)
  Z-index:        z-50
  Close:          X button, Escape key, click overlay
```

```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Contact</Button>
  </SheetTrigger>
  <SheetContent className="w-[440px] sm:max-w-[440px]">
    <SheetHeader>
      <SheetTitle>Add New Contact</SheetTitle>
      <SheetDescription>Fill in the details below.</SheetDescription>
    </SheetHeader>
    <div className="mt-6 space-y-4">
      {/* Form fields */}
    </div>
    <SheetFooter className="absolute bottom-0 left-0 right-0 border-t bg-background p-4">
      <Button variant="outline">Cancel</Button>
      <Button>Save Contact</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 3 — COMPONENTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 3.1 Button

The most used component. Follow these specs exactly for consistency.

### Variants

| Variant       | Use Case                                  | Classes                                                                   |
|---------------|-------------------------------------------|---------------------------------------------------------------------------|
| `default`     | Primary actions (Save, Create, Submit)    | `bg-primary text-primary-foreground hover:bg-primary/90`                  |
| `secondary`   | Secondary actions (Cancel, Reset)         | `bg-secondary text-secondary-foreground hover:bg-secondary/80`            |
| `outline`     | Tertiary actions (Export, Filter)         | `border border-input bg-background hover:bg-accent`                       |
| `ghost`       | Inline actions (icon buttons, nav items)  | `hover:bg-accent hover:text-accent-foreground`                            |
| `destructive` | Danger actions (Delete, Remove)           | `bg-destructive text-destructive-foreground hover:bg-destructive/90`      |
| `link`        | Text links that look like buttons         | `text-primary underline-offset-4 hover:underline`                         |

### Sizes

| Size    | Height | Padding      | Font Size | Use Case              |
|---------|--------|-------------|-----------|------------------------|
| `sm`    | 32px   | `px-3`      | `text-xs` | Table actions, compact |
| `default`| 40px  | `px-4 py-2` | `text-sm` | Standard buttons       |
| `lg`    | 44px   | `px-8`      | `text-sm` | Hero CTAs, modals      |
| `icon`  | 40px   | `p-0 w-10`  | —         | Icon-only buttons      |

### Button with Loading State

```tsx
interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
}

function LoadingButton({ loading, children, disabled, ...props }: LoadingButtonProps) {
  return (
    <Button disabled={loading || disabled} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}

// Usage:
<LoadingButton loading={isSubmitting}>Save Contact</LoadingButton>
```

### Icon Button Pattern

```tsx
// Always use size="icon" + ghost/outline for icon-only buttons
<Button variant="ghost" size="icon">
  <MoreHorizontal className="h-4 w-4" />
  <span className="sr-only">More options</span>  {/* ALWAYS include for accessibility */}
</Button>
```

## 3.2 Status Badge

Semantic badges for displaying entity states. **Critical for CRM/SaaS apps.**

```tsx
// components/shared/status-badge.tsx
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:    "bg-primary/10 text-primary",
        success:    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        warning:    "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        destructive:"bg-red-500/10 text-red-600 dark:text-red-400",
        info:       "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        secondary:  "bg-secondary text-secondary-foreground",
        outline:    "border border-border text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

interface StatusBadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  dot?: boolean;       // Show a colored dot before text
  icon?: LucideIcon;   // Show an icon before text
}

export function StatusBadge({ variant, children, dot, icon: Icon }: StatusBadgeProps) {
  return (
    <span className={badgeVariants({ variant })}>
      {dot && (
        <span className={cn(
          "h-1.5 w-1.5 rounded-full",
          variant === "success" && "bg-emerald-500",
          variant === "warning" && "bg-amber-500",
          variant === "destructive" && "bg-red-500",
          variant === "info" && "bg-blue-500",
          variant === "default" && "bg-primary",
          variant === "secondary" && "bg-muted-foreground",
        )} />
      )}
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}

// Usage examples:
<StatusBadge variant="success" dot>Active</StatusBadge>
<StatusBadge variant="warning" dot>Pending</StatusBadge>
<StatusBadge variant="destructive" dot>Rejected</StatusBadge>
<StatusBadge variant="info" dot>In Review</StatusBadge>
<StatusBadge variant="secondary" dot>Draft</StatusBadge>
```

### Status Mapping Convention

Define a standard mapping for your app's statuses:

```ts
// lib/constants.ts
export const STATUS_CONFIG = {
  active:     { label: "Active",     variant: "success"     as const },
  pending:    { label: "Pending",    variant: "warning"     as const },
  rejected:   { label: "Rejected",   variant: "destructive" as const },
  review:     { label: "In Review",  variant: "info"        as const },
  draft:      { label: "Draft",      variant: "secondary"   as const },
  archived:   { label: "Archived",   variant: "outline"     as const },
  new:        { label: "New",        variant: "default"     as const },
  closed:     { label: "Closed",     variant: "secondary"   as const },
  open:       { label: "Open",       variant: "success"     as const },
  in_progress:{ label: "In Progress",variant: "info"        as const },
  completed:  { label: "Completed",  variant: "success"     as const },
  cancelled:  { label: "Cancelled",  variant: "destructive" as const },
  scheduled:  { label: "Scheduled",  variant: "info"        as const },
  overdue:    { label: "Overdue",    variant: "destructive" as const },
} as const;
```

## 3.3 Stat Card

Dashboard metric cards with trend indicators.

```tsx
// components/shared/stat-card.tsx

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  description?: string;
}

export function StatCard({ title, value, change, trend, icon: Icon, description }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {Icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
          )}
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          {change && (
            <span className={cn(
              "inline-flex items-center text-xs font-medium",
              trend === "up" && "text-emerald-600 dark:text-emerald-400",
              trend === "down" && "text-red-600 dark:text-red-400",
              trend === "neutral" && "text-muted-foreground"
            )}>
              {trend === "up" && <TrendingUp className="mr-0.5 h-3 w-3" />}
              {trend === "down" && <TrendingDown className="mr-0.5 h-3 w-3" />}
              {change}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
```

## 3.4 Data Table (Full-Featured)

The most critical component in any CRM. This must be exceptional.

### Features Required
- Column sorting (click header)
- Column resizing (drag border)
- Column visibility toggle
- Row selection (checkbox)
- Bulk actions bar (appears when rows selected)
- Pagination
- Empty state
- Loading skeleton
- Responsive (horizontal scroll on mobile)

### Data Table Implementation

```tsx
// components/shared/data-table.tsx
import {
  ColumnDef, flexRender, getCoreRowModel, getSortedRowModel,
  getPaginationRowModel, getFilteredRowModel, useReactTable,
  SortingState, ColumnFiltersState, VisibilityState, RowSelectionState,
} from "@tanstack/react-table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
}

export function DataTable<TData, TValue>({
  columns, data, searchKey, searchPlaceholder
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data, columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  });

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        {searchKey && (
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder || "Search..."}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
              onChange={(e) => table.getColumn(searchKey)?.setFilterValue(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><SlidersHorizontal className="mr-2 h-4 w-4" />View</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table.getAllColumns().filter(col => col.getCanHide()).map(col => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onCheckedChange={(val) => col.toggleVisibility(!!val)}
                >
                  {col.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Bulk action bar — appears when rows are selected */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">{selectedCount} selected</span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm">Export</Button>
            <Button variant="outline" size="sm">Assign</Button>
            <Button variant="destructive" size="sm">Delete</Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead
                    key={header.id}
                    className="h-10 text-xs font-medium text-muted-foreground"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          "flex items-center gap-1",
                          header.column.getCanSort() && "cursor-pointer select-none hover:text-foreground"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" && <ChevronUp className="h-3 w-3" />}
                        {header.column.getIsSorted() === "desc" && <ChevronDown className="h-3 w-3" />}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="group hover:bg-muted/50"
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <EmptyState title="No results" description="No items match your search." />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {selectedCount > 0
            ? `${selectedCount} of ${table.getFilteredRowModel().rows.length} row(s) selected`
            : `${table.getFilteredRowModel().rows.length} row(s) total`
          }
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### Column Definition Example

```tsx
// Define columns for a contacts table
const columns: ColumnDef<Contact>[] = [
  // Checkbox column
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },
  // Name column with avatar
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={row.original.avatar} />
          <AvatarFallback className="text-xs">{row.original.initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{row.getValue("name")}</p>
          <p className="text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      </div>
    ),
  },
  // Status column
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = STATUS_CONFIG[row.getValue("status") as keyof typeof STATUS_CONFIG];
      return <StatusBadge variant={status.variant} dot>{status.label}</StatusBadge>;
    },
  },
  // Date column
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.getValue("createdAt"))}
      </span>
    ),
  },
  // Actions column
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>View</DropdownMenuItem>
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    size: 50,
  },
];
```

## 3.5 Avatar & Avatar Group

```tsx
// Single Avatar — always with fallback
<Avatar className="h-10 w-10">
  <AvatarImage src={user.avatar} alt={user.name} />
  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
    {getInitials(user.name)}
  </AvatarFallback>
</Avatar>

// Avatar sizes: h-6 w-6 (tiny), h-8 w-8 (small), h-10 w-10 (default), h-12 w-12 (large)
```

```tsx
// components/shared/avatar-group.tsx

interface AvatarGroupProps {
  users: { name: string; avatar?: string }[];
  max?: number;
  size?: "sm" | "md" | "lg";
}

const sizeMap = { sm: "h-6 w-6", md: "h-8 w-8", lg: "h-10 w-10" };
const textMap = { sm: "text-[10px]", md: "text-xs", lg: "text-sm" };

export function AvatarGroup({ users, max = 4, size = "md" }: AvatarGroupProps) {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((user, i) => (
        <Avatar key={i} className={cn(sizeMap[size], "border-2 border-background")}>
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback className={cn("bg-primary/10 text-primary", textMap[size])}>
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
      ))}
      {remaining > 0 && (
        <div className={cn(
          sizeMap[size],
          "flex items-center justify-center rounded-full border-2 border-background bg-muted",
          textMap[size], "font-medium text-muted-foreground"
        )}>
          +{remaining}
        </div>
      )}
    </div>
  );
}
```

## 3.6 Activity Feed / Timeline

```tsx
// components/shared/activity-feed.tsx

interface ActivityItem {
  id: string;
  user: { name: string; avatar?: string };
  action: string;
  target?: string;
  timestamp: string;
  icon?: LucideIcon;
  iconColor?: string;
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const Icon = item.icon || Activity;
        return (
          <div key={item.id} className="flex gap-3">
            {/* Timeline line + icon */}
            <div className="flex flex-col items-center">
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                item.iconColor || "bg-muted"
              )}>
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              {index < items.length - 1 && (
                <div className="mt-1 w-px flex-1 bg-border" />
              )}
            </div>
            {/* Content */}
            <div className="flex-1 pb-4">
              <p className="text-sm">
                <span className="font-medium">{item.user.name}</span>{" "}
                <span className="text-muted-foreground">{item.action}</span>{" "}
                {item.target && <span className="font-medium">{item.target}</span>}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.timestamp}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

## 3.7 Empty State

```tsx
// components/shared/empty-state.tsx

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
      {action && (
        <Button className="mt-4" size="sm" onClick={action.onClick}>
          <Plus className="mr-2 h-4 w-4" />
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Usage:
<EmptyState
  icon={Users}
  title="No contacts yet"
  description="Get started by adding your first contact. You can also import contacts from a CSV file."
  action={{ label: "Add Contact", onClick: () => setDrawerOpen(true) }}
/>
```

## 3.8 Inline Edit

Click-to-edit fields for detail pages. Eliminates the need for separate edit modals.

```tsx
// components/shared/inline-edit.tsx

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function InlineEdit({ value, onSave, placeholder, className }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  const cancel = () => {
    setEditing(false);
    setDraft(value);
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2 py-1 -mx-2 text-left",
          "hover:bg-muted transition-colors group",
          !value && "text-muted-foreground italic",
          className
        )}
      >
        {value || placeholder || "Click to edit"}
        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") cancel();
        }}
        className={cn("h-8", className)}
      />
    </div>
  );
}

// Usage on detail page:
<div className="space-y-3">
  <div>
    <label className="text-xs font-medium text-muted-foreground">Name</label>
    <InlineEdit value={contact.name} onSave={(val) => updateContact({ name: val })} />
  </div>
  <div>
    <label className="text-xs font-medium text-muted-foreground">Email</label>
    <InlineEdit value={contact.email} onSave={(val) => updateContact({ email: val })} />
  </div>
</div>
```

## 3.9 Skeleton Loaders

Match the exact layout of the content they're replacing.

```tsx
// Stat Card Skeleton
function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        <Skeleton className="mt-3 h-8 w-20" />
        <Skeleton className="mt-2 h-3 w-32" />
      </CardContent>
    </Card>
  );
}

// Table Row Skeleton
function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
    </TableRow>
  );
}

// Page Skeleton (Dashboard)
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="lg:col-span-2 h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    </div>
  );
}

// RULE: Skeleton animation uses animate-pulse (built into shadcn Skeleton component)
// RULE: Skeleton shapes must match the content they replace (rounded-full for avatars, etc.)
```

## 3.10 Form Components — Standard Patterns

### Input with Label

```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="john@example.com" />
</div>
```

### Input with Error

```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" className="border-destructive focus-visible:ring-destructive" />
  <p className="text-xs text-destructive">Please enter a valid email address.</p>
</div>
```

### Input with Description

```tsx
<div className="space-y-2">
  <Label htmlFor="slug">URL Slug</Label>
  <Input id="slug" placeholder="my-project" />
  <p className="text-xs text-muted-foreground">This will be used in your public URL.</p>
</div>
```

### Select

```tsx
<div className="space-y-2">
  <Label>Status</Label>
  <Select>
    <SelectTrigger>
      <SelectValue placeholder="Select status" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="active">Active</SelectItem>
      <SelectItem value="pending">Pending</SelectItem>
      <SelectItem value="archived">Archived</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### Textarea

```tsx
<div className="space-y-2">
  <Label htmlFor="notes">Notes</Label>
  <Textarea id="notes" placeholder="Add notes..." className="min-h-[100px] resize-y" />
</div>
```

### Form Layout — Standard

```tsx
// Two-column form layout for wider screens
<form className="space-y-6">
  <div className="grid gap-4 sm:grid-cols-2">
    <div className="space-y-2">
      <Label>First Name</Label>
      <Input placeholder="John" />
    </div>
    <div className="space-y-2">
      <Label>Last Name</Label>
      <Input placeholder="Doe" />
    </div>
  </div>

  <div className="space-y-2">
    <Label>Email</Label>
    <Input type="email" placeholder="john@example.com" />
  </div>

  <div className="grid gap-4 sm:grid-cols-2">
    <div className="space-y-2">
      <Label>Phone</Label>
      <Input type="tel" placeholder="+1 (555) 000-0000" />
    </div>
    <div className="space-y-2">
      <Label>Company</Label>
      <Input placeholder="Acme Inc." />
    </div>
  </div>

  <div className="space-y-2">
    <Label>Notes</Label>
    <Textarea placeholder="Additional notes..." className="min-h-[100px]" />
  </div>

  {/* Form actions — always at bottom, right-aligned */}
  <div className="flex justify-end gap-2 pt-4 border-t">
    <Button variant="outline" type="button">Cancel</Button>
    <Button type="submit">Save</Button>
  </div>
</form>
```

## 3.11 Toast / Notifications

Use Sonner for toast notifications — it's the best React toast library.

```tsx
// Install: npx shadcn@latest add sonner

// In root layout:
import { Toaster } from "@/components/ui/sonner";
<Toaster position="bottom-right" richColors closeButton />

// Usage patterns:
import { toast } from "sonner";

// Success
toast.success("Contact saved", { description: "John Doe has been added to your contacts." });

// Error
toast.error("Something went wrong", { description: "Please try again later." });

// Warning
toast.warning("Unsaved changes", { description: "You have unsaved changes that will be lost." });

// Promise (for async operations — shows loading → success/error automatically)
toast.promise(saveContact(data), {
  loading: "Saving contact...",
  success: "Contact saved successfully!",
  error: "Failed to save contact.",
});

// With action button
toast("Contact deleted", {
  description: "John Doe has been removed.",
  action: { label: "Undo", onClick: () => restoreContact(id) },
});
```

## 3.12 Confirmation Dialog

For destructive actions — always confirm before deleting.

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive" size="sm">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete this contact and all associated data.
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## 3.13 Card Variants

```tsx
// Standard Card
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description text</CardDescription>
  </CardHeader>
  <CardContent>{/* content */}</CardContent>
  <CardFooter className="border-t px-6 py-4">{/* actions */}</CardFooter>
</Card>

// Clickable Card (for list items, grid items)
<Card className="cursor-pointer transition-colors hover:bg-muted/50 hover:shadow-md">
  <CardContent className="p-4">
    {/* content */}
  </CardContent>
</Card>

// Highlighted Card (selected state)
<Card className="border-primary bg-primary/5">
  <CardContent className="p-4">
    {/* content */}
  </CardContent>
</Card>

// Compact Card (for dense layouts)
<Card>
  <CardContent className="p-4">
    {/* content — uses p-4 instead of CardHeader/CardContent split */}
  </CardContent>
</Card>
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 4 — PATTERNS & FLOWS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 4.1 CRUD Flow Pattern

Every entity (contacts, jobs, deals, etc.) follows this exact flow:

```
LIST PAGE ──→ QUICK CREATE (Drawer) ──→ LIST PAGE (updated)
    │                                        │
    ├──→ DETAIL PAGE ──→ INLINE EDIT ────────┘
    │         │
    │         ├──→ FULL EDIT (Drawer or Modal)
    │         │
    │         └──→ DELETE (Confirmation Dialog)
    │
    └──→ BULK ACTIONS (select multiple → batch action bar)
```

### Rules:
1. **Create** → Always use a **Side Drawer (Sheet)** for quick creation. Save should close drawer and show toast.
2. **Read/List** → Always use **Data Table** with search, filters, sorting, pagination.
3. **Read/Detail** → Use **Detail Page Template** with info card + tabs.
4. **Update** → Use **Inline Edit** on detail page for single fields. Use **Drawer** for multi-field edits.
5. **Delete** → Always show **Confirmation Dialog** first. After delete, redirect to list + show undo toast.

### Create Flow (Drawer)

```tsx
function CreateContactFlow() {
  const [open, setOpen] = useState(false);

  const onSubmit = async (data: ContactFormData) => {
    try {
      await createContact(data);
      setOpen(false);
      toast.success("Contact created", { description: `${data.name} has been added.` });
      router.refresh(); // or mutate SWR cache
    } catch (error) {
      toast.error("Failed to create contact", { description: "Please try again." });
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Contact</Button>
      </SheetTrigger>
      <SheetContent className="w-[440px] sm:max-w-[440px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Add New Contact</SheetTitle>
          <SheetDescription>Fill in the contact details below.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-auto py-6">
          <ContactForm onSubmit={onSubmit} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

### Delete Flow

```tsx
function DeleteContactButton({ contact, onDeleted }: { contact: Contact; onDeleted: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {contact.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this contact and all associated data.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={async () => {
              await deleteContact(contact.id);
              onDeleted();
              toast("Contact deleted", {
                description: `${contact.name} has been removed.`,
                action: { label: "Undo", onClick: () => restoreContact(contact.id) },
              });
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

## 4.2 Form Patterns

### Form Validation with React Hook Form + Zod

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(["active", "pending", "archived"]),
  notes: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

function ContactForm({ onSubmit, defaultValues }: {
  onSubmit: (data: ContactFormData) => void;
  defaultValues?: Partial<ContactFormData>;
}) {
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      status: "active",
      notes: "",
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="+1 (555) 000-0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Inc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional notes..." className="min-h-[80px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" type="button" onClick={() => form.reset()}>Reset</Button>
          <LoadingButton type="submit" loading={form.formState.isSubmitting}>
            {defaultValues ? "Update" : "Create"} Contact
          </LoadingButton>
        </div>
      </form>
    </Form>
  );
}
```

## 4.3 Responsive Design Rules

### Breakpoints

```
sm:    640px     — Large phones landscape
md:    768px     — Tablets portrait
lg:    1024px    — Tablets landscape, small laptops
xl:    1280px    — Desktops
2xl:   1536px    — Large desktops
```

### Responsive Behavior Matrix

| Element             | Mobile (<768px)                    | Tablet (768-1024px)          | Desktop (>1024px)               |
|---------------------|------------------------------------|------------------------------|---------------------------------|
| **Sidebar**         | Hidden (slide-over menu)           | Collapsed (icon-only, w-16)  | Expanded (w-64)                 |
| **Header**          | Hamburger menu + logo              | Full header                  | Full header with search         |
| **Page padding**    | `px-4 py-4`                        | `px-6 py-6`                  | `px-6 py-6`                     |
| **Stat cards**      | 1 column (stacked)                 | 2 columns                    | 4 columns                       |
| **Data table**      | Horizontal scroll, hide columns    | Show most columns            | Show all columns                |
| **Forms**           | Single column                      | Two columns where logical    | Two columns where logical       |
| **Detail page**     | Stacked (info card above tabs)     | Side-by-side                 | Side-by-side                    |
| **Drawer width**    | Full width                         | 440px                        | 440px                           |
| **Page header**     | Stack title + actions vertically   | Side by side                 | Side by side                    |
| **Command palette** | Full width, 90% height             | Centered, max-w-lg           | Centered, max-w-lg             |

### Mobile-Specific Patterns

```tsx
// Sidebar: Use Sheet for mobile menu
<div className="lg:hidden">
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
    </SheetTrigger>
    <SheetContent side="left" className="w-64 p-0">
      <Sidebar />
    </SheetContent>
  </Sheet>
</div>

// Hide non-essential table columns on mobile
{
  accessorKey: "company",
  header: "Company",
  cell: ({ row }) => <span>{row.getValue("company")}</span>,
  meta: { className: "hidden md:table-cell" },  // Hide on mobile
}

// Stack page header on mobile
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <h1>Title</h1>
  <div className="flex gap-2">Actions</div>
</div>
```

## 4.4 Loading States Pattern

### Loading Hierarchy

```
1. SKELETON LOADERS     — For initial page load (replace layout exactly)
2. BUTTON SPINNERS      — For form submissions (inline in the button)
3. OVERLAY SPINNER      — For page-level actions (e.g., applying filters to whole page)
4. PROGRESS BAR         — For long operations (file upload, import)
5. TOAST LOADING        — For background operations (toast.promise)
6. OPTIMISTIC UPDATES   — For instant-feel actions (toggle, like, save)
```

### Optimistic Update Pattern

```tsx
// Example: Toggle contact status optimistically
function useToggleStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toggleContactStatus(id),
    // Optimistic update
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["contacts"] });
      const previous = queryClient.getQueryData(["contacts"]);

      queryClient.setQueryData(["contacts"], (old: Contact[]) =>
        old.map(c => c.id === id
          ? { ...c, status: c.status === "active" ? "archived" : "active" }
          : c
        )
      );

      return { previous };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(["contacts"], context?.previous);
      toast.error("Failed to update status");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}
```

## 4.5 Error Handling Patterns

### Error Boundary Page

```tsx
function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="mt-6 text-xl font-semibold">Something went wrong</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <div className="mt-6 flex gap-2">
        <Button variant="outline" onClick={() => window.location.reload()}>Refresh Page</Button>
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  );
}
```

### 404 Page

```tsx
function NotFoundPage() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
      <p className="text-7xl font-bold text-muted-foreground/20">404</p>
      <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
      </Button>
    </div>
  );
}
```

## 4.6 Filter & Search Patterns

### Filter Bar Component

```tsx
function FilterBar({
  searchValue,
  onSearchChange,
  filters,
  onFilterChange,
  onClearFilters,
  activeFilterCount,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={() => onSearchChange("")}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Filter dropdowns */}
      <div className="flex items-center gap-2">
        {filters.map((filter) => (
          <Select key={filter.key} value={filter.value} onValueChange={(v) => onFilterChange(filter.key, v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {filter.label}</SelectItem>
              {filter.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {/* Clear all filters */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-muted-foreground">
            <X className="mr-1 h-3 w-3" />
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>
    </div>
  );
}
```

### Active Filter Chips

```tsx
// Show active filters as removable chips below the filter bar
{activeFilters.length > 0 && (
  <div className="flex flex-wrap gap-2">
    {activeFilters.map((filter) => (
      <Badge key={filter.key} variant="secondary" className="gap-1 pl-2">
        <span className="text-xs text-muted-foreground">{filter.label}:</span>
        <span className="text-xs font-medium">{filter.value}</span>
        <button onClick={() => removeFilter(filter.key)} className="ml-1 hover:text-foreground">
          <X className="h-3 w-3" />
        </button>
      </Badge>
    ))}
  </div>
)}
```

## 4.7 Tabs Pattern

### Standard Tabs

```tsx
<Tabs defaultValue="overview" className="space-y-6">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="activity">Activity</TabsTrigger>
    <TabsTrigger value="notes">Notes <Badge variant="secondary" className="ml-1.5">3</Badge></TabsTrigger>
    <TabsTrigger value="files">Files</TabsTrigger>
  </TabsList>

  <TabsContent value="overview">
    {/* Content */}
  </TabsContent>
  <TabsContent value="activity">
    {/* Content */}
  </TabsContent>
</Tabs>
```

### Underline Tabs (Alternative Style)

```tsx
// For page-level navigation (like settings pages)
<div className="border-b">
  <nav className="flex gap-6 -mb-px">
    {tabs.map(tab => (
      <button
        key={tab.value}
        className={cn(
          "border-b-2 px-1 py-3 text-sm font-medium transition-colors",
          active === tab.value
            ? "border-primary text-foreground"
            : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
        )}
        onClick={() => setActive(tab.value)}
      >
        {tab.label}
      </button>
    ))}
  </nav>
</div>
```

## 4.8 Kanban / Board View Pattern

For pipeline views (deal stages, recruitment stages, etc.)

```tsx
function KanbanBoard({ columns, onDragEnd }: KanbanProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div key={column.id} className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/50">
          {/* Column header */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium">{column.title}</h3>
              <Badge variant="secondary" className="text-xs">{column.items.length}</Badge>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Column items — droppable zone */}
          <div className="flex-1 space-y-2 p-2 min-h-[200px]">
            {column.items.map((item) => (
              <Card key={item.id} className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground truncate">{item.subtitle}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <AvatarGroup users={item.assignees} size="sm" max={3} />
                    <StatusBadge variant={item.priority === "high" ? "destructive" : "secondary"} dot>
                      {item.priority}
                    </StatusBadge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

## 4.9 Onboarding / Setup Wizard Pattern

```tsx
function SetupWizard() {
  const [step, setStep] = useState(0);
  const steps = [
    { title: "Company Info", description: "Tell us about your company" },
    { title: "Invite Team", description: "Add your team members" },
    { title: "Import Data", description: "Import your existing contacts" },
    { title: "Customize", description: "Set up your preferences" },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-12">
      {/* Progress steps */}
      <div className="flex items-center justify-between">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
              i < step && "bg-primary text-primary-foreground",
              i === step && "bg-primary text-primary-foreground ring-4 ring-primary/20",
              i > step && "bg-muted text-muted-foreground"
            )}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                "mx-2 h-0.5 w-16 sm:w-24",
                i < step ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[step].title}</CardTitle>
          <CardDescription>{steps[step].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step-specific form content */}
        </CardContent>
        <CardFooter className="flex justify-between border-t px-6 py-4">
          <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
            Back
          </Button>
          <Button onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : finishSetup()}>
            {step < steps.length - 1 ? "Continue" : "Finish Setup"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 5 — POLISH & PREMIUM FEEL
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 5.1 Framer Motion — Animation Specs

Install: `npm install framer-motion`

### Page Transition

```tsx
// Wrap page content with this for smooth transitions between routes
import { motion } from "framer-motion";

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// Usage in every page:
export default function ContactsPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        {/* page content */}
      </div>
    </PageTransition>
  );
}
```

### List Stagger Animation

```tsx
// Cards and list items animate in one by one with a stagger delay
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,    // 50ms delay between each child
      delayChildren: 0.1,       // 100ms delay before first child
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
};

// Usage — stat cards:
<motion.div
  className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
  {stats.map((stat) => (
    <motion.div key={stat.title} variants={itemVariants}>
      <StatCard {...stat} />
    </motion.div>
  ))}
</motion.div>

// Usage — table rows:
<motion.tbody variants={containerVariants} initial="hidden" animate="visible">
  {rows.map((row) => (
    <motion.tr key={row.id} variants={itemVariants}>
      {/* cells */}
    </motion.tr>
  ))}
</motion.tbody>
```

### Drawer / Sheet Animation

```tsx
// Side drawer slides in from right with backdrop fade
const drawerVariants = {
  hidden: { x: "100%" },
  visible: { x: 0, transition: { type: "spring", damping: 30, stiffness: 300 } },
  exit: { x: "100%", transition: { duration: 0.2 } },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};
```

### Modal / Dialog Animation

```tsx
const dialogVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};
```

### Number Counter Animation

```tsx
// Animate numbers from 0 to target value (for stat cards)
import { useMotionValue, useTransform, animate, useInView } from "framer-motion";

function AnimatedNumber({ value, duration = 1 }: { value: number; duration?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    if (isInView) {
      animate(motionValue, value, { duration, ease: "easeOut" });
    }
  }, [isInView, value]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

// Usage:
<p className="text-3xl font-semibold">
  <AnimatedNumber value={2847} />
</p>
```

### Hover Card Scale

```tsx
// Subtle scale on hover for clickable cards
<motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} transition={{ duration: 0.15 }}>
  <Card className="cursor-pointer">
    {/* content */}
  </Card>
</motion.div>
```

### Layout Animation (for items that change position)

```tsx
// When items are reordered (filters, drag-drop), animate their position
<motion.div layout layoutId={item.id} transition={{ duration: 0.25, ease: "easeInOut" }}>
  <Card>{/* content */}</Card>
</motion.div>
```

## 5.2 Micro-Interactions — CSS Only

For simpler effects that don't need Framer Motion:

```css
/* Button press effect */
.btn-press {
  @apply transition-transform active:scale-[0.98];
}

/* Card hover lift */
.card-hover {
  @apply transition-all duration-200 hover:shadow-md hover:-translate-y-0.5;
}

/* Smooth color transitions on everything */
.transition-smooth {
  @apply transition-colors duration-150;
}

/* Table row hover with left border highlight */
.table-row-hover {
  @apply relative transition-colors hover:bg-muted/50;
}
.table-row-hover::before {
  content: "";
  @apply absolute inset-y-0 left-0 w-0.5 bg-primary scale-y-0 transition-transform;
}
.table-row-hover:hover::before {
  @apply scale-y-100;
}

/* Notification badge bounce */
@keyframes badge-bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
.badge-animate {
  animation: badge-bounce 0.3s ease-out;
}

/* Skeleton shimmer (already in shadcn, but customizable) */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton-shimmer {
  background: linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted-foreground) / 0.05) 50%, hsl(var(--muted)) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

## 5.3 Dark Mode

### Implementation

```tsx
// Use next-themes for dark mode:
// npm install next-themes

// In root layout providers:
import { ThemeProvider } from "next-themes";

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}

// Theme toggle component:
import { useTheme } from "next-themes";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}><Sun className="mr-2 h-4 w-4" /> Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}><Moon className="mr-2 h-4 w-4" /> Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}><Monitor className="mr-2 h-4 w-4" /> System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Dark Mode Rules

```
1. NEVER use hardcoded colors — always use CSS variables (hsl(var(--xxx)))
2. Shadows become LESS visible in dark mode (use ring instead for elevation)
3. Borders become MORE important in dark mode (they define card edges)
4. Use `dark:` prefix ONLY for edge cases not handled by CSS variables
5. Images/charts may need contrast adjustments: `dark:brightness-90`
6. Avoid pure white text on dark bg — use hsl(var(--foreground)) which is off-white
7. Avoid pure black bg — use hsl(var(--background)) which has a slight blue tint
```

## 5.4 Accessibility (a11y)

### Must-Have Rules

```
1. FOCUS RINGS     — Every interactive element must have a visible focus ring.
                     Already handled by the global *:focus-visible rule in globals.css.

2. COLOR CONTRAST  — All text must meet WCAG AA contrast ratios:
                     Normal text: 4.5:1 minimum
                     Large text (18px+): 3:1 minimum
                     The provided color system meets these requirements.

3. ARIA LABELS     — Every icon-only button MUST have <span className="sr-only">Label</span>
                     Every image MUST have alt text.
                     Every form input MUST have a label (even if visually hidden).

4. KEYBOARD NAV    — Tab order must be logical.
                     Escape closes modals/drawers/popovers.
                     Enter/Space activates buttons and links.
                     Arrow keys navigate lists and menus.

5. SCREEN READER   — Use semantic HTML: <nav>, <main>, <header>, <section>, <article>
                     Use heading hierarchy: h1 → h2 → h3 (never skip levels)
                     Use aria-live="polite" for toast notifications
                     Use role="alert" for error messages

6. MOTION          — Respect prefers-reduced-motion:
```

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```tsx
// In Framer Motion, respect user preference:
import { useReducedMotion } from "framer-motion";

function AnimatedComponent() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* content */}
    </motion.div>
  );
}
```

## 5.5 Keyboard Shortcuts

### Global Shortcuts (Register in Root Layout)

| Shortcut       | Action                    | Implementation                   |
|----------------|---------------------------|----------------------------------|
| `⌘K` / `Ctrl+K`| Open command palette      | Toggle CommandMenu open state    |
| `⌘/` / `Ctrl+/`| Open keyboard shortcut help| Show shortcuts dialog           |
| `Esc`          | Close modal/drawer/popover| Handled by Radix primitives      |

### Page-Level Shortcuts

| Shortcut  | Action              | Context           |
|-----------|---------------------|-------------------|
| `C`       | Create new item     | List pages        |
| `E`       | Edit current item   | Detail pages      |
| `⌫`      | Delete (with dialog)| Detail pages      |
| `/`       | Focus search input  | List pages        |
| `J`       | Next item           | List navigation   |
| `K`       | Previous item       | List navigation   |
| `G then D`| Go to Dashboard     | Global            |
| `G then C`| Go to Contacts      | Global            |
| `G then S`| Go to Settings      | Global            |

### Implementation

```tsx
// hooks/use-hotkeys.ts
import { useEffect } from "react";

type HotkeyCallback = (e: KeyboardEvent) => void;

export function useHotkeys(shortcuts: Record<string, HotkeyCallback>) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      for (const [key, callback] of Object.entries(shortcuts)) {
        const parts = key.toLowerCase().split("+");
        const mainKey = parts[parts.length - 1];
        const needsMeta = parts.includes("meta") || parts.includes("cmd");
        const needsCtrl = parts.includes("ctrl");
        const needsShift = parts.includes("shift");

        if (
          e.key.toLowerCase() === mainKey &&
          (needsMeta ? e.metaKey : true) &&
          (needsCtrl ? e.ctrlKey : true) &&
          (needsShift ? e.shiftKey : true) &&
          (!needsMeta && !needsCtrl ? !e.metaKey && !e.ctrlKey : true)
        ) {
          e.preventDefault();
          callback(e);
        }
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [shortcuts]);
}

// Usage in a list page:
useHotkeys({
  "c": () => setCreateDrawerOpen(true),
  "/": () => searchInputRef.current?.focus(),
});
```

### Keyboard Shortcuts Help Dialog

```tsx
function KeyboardShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const shortcuts = [
    { category: "Global", items: [
      { keys: ["⌘", "K"], description: "Open command palette" },
      { keys: ["⌘", "/"], description: "Show keyboard shortcuts" },
      { keys: ["Esc"], description: "Close dialog / drawer" },
    ]},
    { category: "Navigation", items: [
      { keys: ["G", "D"], description: "Go to Dashboard" },
      { keys: ["G", "C"], description: "Go to Contacts" },
      { keys: ["G", "S"], description: "Go to Settings" },
    ]},
    { category: "Actions", items: [
      { keys: ["C"], description: "Create new item" },
      { keys: ["E"], description: "Edit current item" },
      { keys: ["/"], description: "Focus search" },
    ]},
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h4 className="mb-3 text-sm font-medium text-muted-foreground">{section.category}</h4>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div key={item.description} className="flex items-center justify-between">
                    <span className="text-sm">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key) => (
                        <kbd key={key} className="inline-flex h-6 min-w-6 items-center justify-center rounded border bg-muted px-1.5 font-mono text-[11px] font-medium text-muted-foreground">
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## 5.6 Information Density — Compact Mode

Allow users to choose their preferred density:

```tsx
// Store density preference
type Density = "compact" | "default" | "comfortable";

const densityConfig = {
  compact: {
    tablePadding: "py-1.5 px-3",
    tableText: "text-xs",
    cardPadding: "p-3",
    gap: "gap-3",
    rowHeight: "h-8",
  },
  default: {
    tablePadding: "py-3 px-4",
    tableText: "text-sm",
    cardPadding: "p-6",
    gap: "gap-4",
    rowHeight: "h-10",
  },
  comfortable: {
    tablePadding: "py-4 px-4",
    tableText: "text-sm",
    cardPadding: "p-8",
    gap: "gap-6",
    rowHeight: "h-12",
  },
};

// Density toggle in settings or as a toolbar control:
<ToggleGroup type="single" value={density} onValueChange={(v) => setDensity(v as Density)}>
  <ToggleGroupItem value="compact" aria-label="Compact">
    <AlignJustify className="h-4 w-4" />
  </ToggleGroupItem>
  <ToggleGroupItem value="default" aria-label="Default">
    <LayoutList className="h-4 w-4" />
  </ToggleGroupItem>
  <ToggleGroupItem value="comfortable" aria-label="Comfortable">
    <LayoutGrid className="h-4 w-4" />
  </ToggleGroupItem>
</ToggleGroup>
```

## 5.7 Do's and Don'ts — Quick Reference

### DO:

```
✓ Use CSS variables for ALL colors — never hardcode hex/rgb
✓ Use the 4px spacing grid — all spacing values divisible by 4
✓ Use font-semibold for titles, font-medium for labels, font-normal for body
✓ Use text-sm (14px) as the default body text size
✓ Use rounded-lg (8px) for cards, rounded-md (6px) for buttons/inputs
✓ Use shadow-sm for cards, shadow-md for hover/elevated, shadow-lg for modals
✓ Show loading states for every async operation
✓ Show empty states with clear CTAs
✓ Confirm destructive actions with a dialog
✓ Use toast notifications for operation feedback
✓ Add sr-only labels to every icon-only button
✓ Use semantic HTML elements
✓ Test both light and dark mode
✓ Test at mobile, tablet, and desktop breakpoints
✓ Keep pages under 100vh initial viewport (no unexplained scroll)
✓ Use Lucide icons exclusively for consistency
```

### DON'T:

```
✗ Don't use more than 3 font sizes on a single page
✗ Don't use font-bold — semibold is the maximum
✗ Don't use rounded-2xl or rounded-3xl — too bubbly, looks unprofessional
✗ Don't use pure black (#000) or pure white (#fff) — use CSS variables
✗ Don't use more than 2 primary action buttons per page section
✗ Don't mix icon libraries — only Lucide
✗ Don't use alerts/banners for success — use toast
✗ Don't put form submit buttons on the left — always right-aligned
✗ Don't use disabled buttons without explaining why (use tooltip)
✗ Don't use color alone to convey meaning (add icons/text for colorblind users)
✗ Don't animate layout shifts that aren't intentional
✗ Don't use z-index values outside the defined scale
✗ Don't nest cards more than 2 levels deep
✗ Don't use horizontal scrolling except for data tables and kanban
✗ Don't exceed 80ch line width for readable text content
```

## 5.8 NPM Dependencies — Complete List

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "next": "^14.2.0",

    "@radix-ui/react-alert-dialog": "latest",
    "@radix-ui/react-avatar": "latest",
    "@radix-ui/react-checkbox": "latest",
    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-dropdown-menu": "latest",
    "@radix-ui/react-label": "latest",
    "@radix-ui/react-popover": "latest",
    "@radix-ui/react-select": "latest",
    "@radix-ui/react-separator": "latest",
    "@radix-ui/react-slot": "latest",
    "@radix-ui/react-switch": "latest",
    "@radix-ui/react-tabs": "latest",
    "@radix-ui/react-toggle": "latest",
    "@radix-ui/react-toggle-group": "latest",
    "@radix-ui/react-tooltip": "latest",

    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0",
    "tailwindcss-animate": "^1.0.0",
    "lucide-react": "^0.400.0",
    "cmdk": "^1.0.0",
    "sonner": "^1.5.0",
    "framer-motion": "^11.0.0",

    "@tanstack/react-table": "^8.17.0",
    "react-hook-form": "^7.52.0",
    "@hookform/resolvers": "^3.6.0",
    "zod": "^3.23.0",
    "next-themes": "^0.3.0",
    "zustand": "^4.5.0",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "typescript": "^5.5.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0"
  }
}
```

## 5.9 Quick Start — How to Use This Design System

```
Step 1: Create your project
  npx create-next-app@latest my-app --typescript --tailwind --eslint --app --src-dir

Step 2: Initialize shadcn/ui
  npx shadcn@latest init
  (Choose: New York style, Zinc base color, CSS variables = YES)

Step 3: Install shadcn components
  npx shadcn@latest add button card input label select textarea badge avatar
  npx shadcn@latest add dialog alert-dialog sheet tabs dropdown-menu popover tooltip
  npx shadcn@latest add table checkbox separator command sonner toggle toggle-group
  npx shadcn@latest add skeleton form

Step 4: Install additional dependencies
  npm install framer-motion @tanstack/react-table cmdk next-themes zustand date-fns
  npm install react-hook-form @hookform/resolvers zod

Step 5: Copy the CSS variables from Part 1.3 into your globals.css
Step 6: Copy the Tailwind config from Part 1.7 into your tailwind.config.ts
Step 7: Copy the global base styles from Part 1.8 into your globals.css
Step 8: Create the shared components from Part 3 in your components/shared/ folder
Step 9: Build your pages following the templates in Part 2.5
Step 10: Add animations from Part 5.1 for the premium feel
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# END OF DESIGN SYSTEM SPECIFICATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# This is your signature development style.
# One system. Every project. Always premium.
#
# Hand this file to any AI and say:
# "Build me a [CRM/HR Tool/SaaS App] following this design system exactly."
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
