# UI/UX Signature Blueprint

> A standardized design system and architectural guide extracted from **SmartHR-In** — an enterprise-grade AI-powered recruitment platform built with React, TypeScript, and Tailwind CSS.
>
> **Version:** 1.0
> **Author:** Digigit24
> **Last Updated:** April 2026

---

## Table of Contents

1. [Project Design Philosophy](#1-project-design-philosophy)
2. [Design System](#2-design-system)
3. [Component Architecture](#3-component-architecture)
4. [UI Patterns](#4-ui-patterns)
5. [UX Principles](#5-ux-principles)
6. [Code & Styling Guidelines](#6-code--styling-guidelines)
7. [Reusability Instructions](#7-reusability-instructions)

---

## 1. Project Design Philosophy

### 1.1 Core Design Thinking

This project follows a **"Professional Minimalism"** philosophy — clean, dense, and information-rich interfaces that prioritize data visibility over decoration. Every pixel serves a purpose.

**Guiding Principles:**

| Principle | Description |
|---|---|
| **Density with Clarity** | Pack information tightly but use whitespace, borders, and color to maintain visual hierarchy. Never sacrifice readability for compactness. |
| **Progressive Disclosure** | Show summaries first (cards, lists), reveal details on demand (side drawers, detail pages). Don't overwhelm — layer information. |
| **Consistent Feedback** | Every user action gets feedback — toast notifications (Sonner), loading spinners, hover states, disabled states. No silent failures. |
| **Mobile-First, Desktop-Polished** | Design for mobile constraints first, then enhance for desktop with multi-column grids, hover actions, and collapsible sidebars. |
| **Dark Mode as a First-Class Citizen** | Every color, border, and shadow has explicit light and dark mode variants. Not an afterthought. |

### 1.2 Design Personality

- **Tone:** Professional, calm, trustworthy — think enterprise SaaS, not playful startup
- **Visual Weight:** Light — thin borders, subtle shadows, muted backgrounds
- **Color Usage:** Restrained — neutral base with strategic color accents for status, actions, and emphasis
- **Typography:** System-native feel — clean sans-serif, tight tracking, small but readable sizes
- **Motion:** Minimal and functional — 150ms-200ms transitions, no gratuitous animations

### 1.3 The "No Decoration" Rule

- No unnecessary gradients (except branding elements like login hero, logo, avatars)
- No decorative illustrations or heavy imagery inside the app shell
- No rounded-full buttons in primary flows (reserved for badges/pills only)
- No excessive shadows — `shadow-sm` for cards, `shadow-lg` only on hover or elevated elements
- Icons are functional indicators, not decoration — always paired with meaning

---

## 2. Design System

### 2.1 Color Palette

The color system uses **HSL CSS custom properties** for seamless theme switching. All colors are defined in `globals.css` and consumed via Tailwind tokens.

#### Semantic Tokens

| Token | Light Mode (HSL) | Dark Mode (HSL) | Usage |
|---|---|---|---|
| `--background` | `0 0% 100%` | `224 15% 6%` | Page background |
| `--foreground` | `220 14% 10%` | `210 40% 98%` | Primary text |
| `--card` | `0 0% 100%` | `224 15% 8%` | Card surfaces |
| `--popover` | `0 0% 100%` | `224 15% 8%` | Dropdown/popover surfaces |
| `--primary` | `220 14% 10%` | `210 40% 98%` | Primary buttons, active states |
| `--secondary` | `220 14% 96%` | `217 19% 14%` | Secondary surfaces |
| `--muted` | `220 14% 96%` | `217 19% 14%` | Disabled/muted backgrounds |
| `--muted-foreground` | `220 9% 46%` | `215 20% 55%` | Secondary text, captions |
| `--accent` | `220 14% 96%` | `217 19% 14%` | Hover backgrounds |
| `--destructive` | `0 84% 60%` | `0 63% 31%` | Danger/delete actions |
| `--border` | `220 13% 91%` | `217 19% 14%` | Borders, dividers |
| `--ring` | `220 14% 10%` | `212 27% 84%` | Focus rings |
| `--radius` | `0.5rem` | `0.5rem` | Base border radius |

#### Status Color System

Status indicators use a consistent, semantic color language across the entire app:

```
Emerald/Green  → Success, Open, Active, Hired, Completed
Amber/Yellow   → Warning, Paused, Pending, In Progress
Red/Rose       → Danger, Closed, Failed, Rejected, Destructive
Blue           → Info, Default, Primary actions
Indigo/Violet  → AI features, Screening, Special
Gray           → Draft, Neutral, Disabled, Muted
Cyan/Teal      → Shortlisted, Offers, Secondary metrics
Pink           → Interviews, Scheduling
```

Each status color is applied as a **triad** — always together:

```tsx
// Pattern: background + text + dot/border
'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'  // badge bg
'bg-emerald-500'                                                                  // status dot
'border-l-emerald-500'                                                            // card accent
```

#### Brand Gradient

Used exclusively for branding elements (logo, login hero, avatar fallbacks):

```
from-blue-600 via-indigo-600 to-purple-700    // Login hero panel
from-blue-600 to-indigo-600                    // Logo mark
from-violet-500 to-purple-600                  // Avatar gradients (6 rotating)
```

### 2.2 Typography

**Font Strategy:** System font stack with OpenType features enabled for polished rendering.

```css
font-feature-settings: "cv02", "cv03", "cv04", "cv11";
```

#### Type Scale

| Level | Class | Size | Weight | Usage |
|---|---|---|---|---|
| **Page Title** | `text-base sm:text-lg font-semibold` | 16px / 18px | 600 | Page headings (`<h1>`) |
| **Card Title** | `text-sm font-semibold` or `text-[15px] font-semibold` | 14-15px | 600 | Card headings, entity names |
| **Section Label** | `text-[10px] font-semibold tracking-[0.12em] uppercase` | 10px | 600 | Sidebar section headers |
| **Body Text** | `text-sm` | 14px | 400 | Standard body text |
| **Small Text** | `text-xs` | 12px | 400 | Descriptions, metadata |
| **Micro Text** | `text-[11px]` or `text-[10px]` | 10-11px | 500 | Badges, tags, timestamps |
| **Stat Value** | `text-xl sm:text-2xl font-bold` | 20-24px | 700 | Dashboard metric numbers |

#### Key Rules

- **Never use `text-3xl` or larger** inside the app shell — reserve large text for login/landing pages only
- **Page titles are modest** — `text-lg` max, not `text-2xl`. The content is the hero, not the heading
- **Muted text is `text-muted-foreground`** — never use raw `text-gray-500`; always use the semantic token
- **Descriptions always follow titles** as `text-xs text-muted-foreground`

### 2.3 Spacing System

#### Page Padding

```tsx
// Standard page wrapper
<div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
  {/* Page Header */}
  {/* Filters */}
  {/* Content */}
</div>
```

| Context | Spacing |
|---|---|
| Page padding | `p-3 sm:p-4 md:p-6` |
| Section gaps | `space-y-4 sm:space-y-5` or `space-y-4 sm:space-y-6` |
| Card padding | `p-4` (compact) or `p-6` (standard — CardHeader/CardContent) |
| Card grid gap | `gap-3 sm:gap-4` |
| Filter row gap | `gap-3` (flex-wrap) |
| Inline element gap | `gap-1.5` to `gap-3` |
| Form field spacing | `space-y-1.5` (label + input), `space-y-5` (between fields) |

#### Grid System

```tsx
// Dashboard stats: 2-col mobile → 4-col desktop
"grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4"

// Entity cards: 1-col mobile → 2-col tablet → 3-col desktop
"grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"

// Applicant cards: wider grid
"grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
```

### 2.4 Elevation & Shadows

| Level | Class | Usage |
|---|---|---|
| **Flat** | `shadow-none` | Inline elements, badges |
| **Resting** | `shadow-sm` | Cards at rest |
| **Elevated** | `shadow-lg` | Cards on hover, dropdowns |
| **Overlay** | `shadow-xl` | Mobile sidebar, drawers |

Cards use `hover:shadow-lg` with `transition-all duration-200` for interactive lift.

### 2.5 Border Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-lg` | `0.5rem` (8px) | Cards, dialogs, inputs |
| `rounded-md` | `calc(0.5rem - 2px)` (6px) | Buttons, smaller elements |
| `rounded-sm` | `calc(0.5rem - 4px)` (4px) | Tags, inner elements |
| `rounded-full` | `9999px` | Badges, status dots, avatars |
| `rounded-xl` | `0.75rem` (12px) | Login cards, branding, feature tiles |

---

## 3. Component Architecture

### 3.1 Folder Structure

```
src/
├── components/
│   ├── ui/                    # Primitive UI components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── sheet.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── label.tsx
│   │   ├── textarea.tsx
│   │   ├── switch.tsx
│   │   ├── separator.tsx
│   │   ├── scroll-area.tsx
│   │   ├── progress.tsx
│   │   ├── tooltip.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── collapsible.tsx
│   │   ├── drawer.tsx
│   │   └── theme-provider.tsx
│   ├── UniversalSidebar.tsx   # App-wide sidebar navigation
│   ├── UniversalHeader.tsx    # App-wide top header bar
│   ├── SideDrawer.tsx         # Reusable resizable side panel
│   ├── DateRangeFilter.tsx    # Reusable date range picker
│   ├── ApplicantImportDialog.tsx  # Multi-step import wizard
│   └── ApplicationJobWizard.tsx   # Multi-step application wizard
├── pages/                     # Route-level page components
│   ├── DashboardPage.tsx
│   ├── LoginPage.tsx
│   ├── JobsPage.tsx           # List page
│   ├── JobDetailPage.tsx      # Detail page
│   ├── JobCreatePage.tsx      # Create form
│   ├── JobEditPage.tsx        # Edit form
│   └── ...                    # Same pattern for all entities
├── services/                  # API service modules
│   ├── api.ts                 # Axios instance, interceptors, helpers
│   ├── jobs.ts
│   ├── applicants.ts
│   ├── applications.ts
│   └── ...                    # One file per resource
├── stores/                    # Zustand state stores
│   └── authStore.ts
├── types/                     # TypeScript type definitions
│   └── index.ts               # All interfaces and type unions
├── lib/                       # Utility functions
│   ├── utils.ts               # cn(), formatDate(), getInitials(), etc.
│   └── apiErrors.ts           # Error extraction and form error mapping
├── globals.css                # CSS variables, base styles, custom utilities
├── main.tsx                   # App entry point with ThemeProvider
└── App.tsx                    # Router, QueryClient, layout shell
```

### 3.2 Naming Conventions

| Category | Convention | Examples |
|---|---|---|
| **UI Primitives** | `lowercase-kebab.tsx` | `button.tsx`, `dropdown-menu.tsx` |
| **Composite Components** | `PascalCase.tsx` | `UniversalSidebar.tsx`, `SideDrawer.tsx` |
| **Pages** | `PascalCase` + `Page` suffix | `JobsPage.tsx`, `DashboardPage.tsx` |
| **Services** | `camelCase` + `Service` suffix | `jobsService`, `applicantsService` |
| **Stores** | `camelCase` + `Store` suffix | `authStore.ts`, `useAuthStore` |
| **Types** | `PascalCase`, descriptive | `JobListItem`, `JobDetail`, `JobFormData` |
| **Type Unions** | `PascalCase`, pipe-separated | `JobStatus`, `ApplicationStatus` |
| **Utility Functions** | `camelCase`, verb-first | `formatDate()`, `getInitials()`, `extractCursor()` |
| **CSS Variables** | `--kebab-case` | `--background`, `--muted-foreground` |
| **Constants** | `SCREAMING_SNAKE_CASE` | `NAV_SECTIONS`, `STATUS_COLORS`, `COLOR_MAP` |

### 3.3 Entity Page Pattern (CRUD)

Every entity follows a **4-file pattern**:

```
[Entity]sPage.tsx        → List view (search, filters, card grid)
[Entity]DetailPage.tsx   → Read-only detail with tabs/sections
[Entity]CreatePage.tsx   → Creation form (react-hook-form + zod)
[Entity]EditPage.tsx     → Edit form (pre-populated, same schema)
```

### 3.4 Component Composition Rules

1. **UI Primitives (`components/ui/`)** — Never contain business logic. Built with Radix UI + CVA + `cn()`. Forwarded refs. Single responsibility.

2. **Composite Components (`components/`)** — Combine primitives into reusable patterns. May contain UI logic (open/close state, drag/resize). No API calls.

3. **Page Components (`pages/`)** — Own all data fetching (React Query), mutations, navigation, and toast notifications. Compose from primitives and composites.

4. **Services (`services/`)** — Pure API call functions. Return typed data. No side effects. No UI concerns.

5. **Stores (`stores/`)** — Global client-side state only (auth, preferences). Server state lives in React Query cache.

### 3.5 Reusable Component Registry

| Component | Purpose | Key Props |
|---|---|---|
| `Button` | All clickable actions | `variant`, `size`, `asChild`, `disabled` |
| `Card` | Content containers | `CardHeader`, `CardContent`, `CardFooter` |
| `Input` | Text input fields | Standard HTML input + focus ring |
| `Select` | Dropdown selectors | Radix-based, `SelectTrigger` + `SelectContent` |
| `Dialog` | Modal overlays | `DialogHeader`, `DialogFooter`, `DialogContent` |
| `Badge` | Status pills/tags | `variant: default/secondary/destructive/outline` |
| `Tabs` | Content switching | `TabsList`, `TabsTrigger`, `TabsContent` |
| `Sheet` | Side panel base | Used by `SideDrawer` |
| `SideDrawer` | Resizable detail panel | `mode`, `size`, `resizable`, `footerButtons` |
| `DateRangeFilter` | Date range inputs | `fromDate`, `toDate`, `onClear` |
| `UniversalSidebar` | App navigation | Collapsible, mobile responsive |
| `UniversalHeader` | Top bar | Theme toggle, notifications, profile menu |

---

## 4. UI Patterns

### 4.1 App Shell Layout

The app uses a **sidebar + header + content** shell with full viewport height:

```tsx
<div className="flex h-screen overflow-hidden bg-background">
  {/* Sidebar: fixed width, collapsible */}
  <UniversalSidebar />

  <div className="flex flex-col flex-1 overflow-hidden">
    {/* Header: fixed height h-14 */}
    <UniversalHeader />

    {/* Content: scrollable */}
    <main className="flex-1 overflow-auto">
      <Routes>...</Routes>
    </main>
  </div>
</div>
```

**Key dimensions:**
- Sidebar expanded: `w-[250px]` | Collapsed: `w-[68px]`
- Header height: `h-14` (56px)
- Mobile sidebar: `w-72 max-w-[calc(100vw-3rem)]`

### 4.2 Page Header Pattern

Every list page follows this exact header structure:

```tsx
{/* Page Header */}
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
  <div>
    <h1 className="text-base sm:text-lg font-semibold">Page Title</h1>
    <p className="text-xs text-muted-foreground">{count} total items</p>
  </div>
  <div className="flex items-center gap-2">
    {/* Export dropdown */}
    {/* Primary action button */}
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      New Item
    </Button>
  </div>
</div>
```

**Rules:**
- Title is always `text-base sm:text-lg` — never larger
- Subtitle shows count or description
- Actions stack vertically on mobile, inline on desktop
- Primary action button always last (rightmost)

### 4.3 Filter Bar Pattern

```tsx
<div className="flex flex-wrap items-center gap-3">
  {/* Search input with icon */}
  <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input placeholder="Search..." className="pl-9" />
  </div>

  {/* Filter dropdowns */}
  <Select>
    <SelectTrigger className="w-full min-[400px]:w-40">
      <SelectValue placeholder="All statuses" />
    </SelectTrigger>
    <SelectContent>...</SelectContent>
  </Select>

  {/* Sort dropdown */}
  <Select>
    <SelectTrigger className="w-full min-[400px]:w-44">
      <SelectValue placeholder="Sort by" />
    </SelectTrigger>
    <SelectContent>...</SelectContent>
  </Select>

  {/* Optional: DateRangeFilter */}
</div>
```

**Rules:**
- Search input takes `flex-1` with `sm:max-w-sm`
- Each filter has `w-full min-[400px]:w-40` for mobile-first sizing
- Filters wrap naturally with `flex-wrap`
- "All" option value is always `"ALL"`, mapped to empty string

### 4.4 Card Pattern

Cards are the primary content display unit. They follow this anatomy:

```
┌─────────────────────────────────┐
│ ▌ (status accent border-l-4)    │
│  [Icon/Avatar] Title    [Actions]│
│  Subtitle / metadata            │
│  [Tags] [Badges] [Status pills] │
│─────────────────────────────────│
│  Footer: stats + timestamp      │
│  (bg-muted/30 border-t)         │
└─────────────────────────────────┘
```

**Card interaction pattern:**
```tsx
<Card
  className={cn(
    'group border-l-4 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden',
    STATUS_ACCENT[item.status],
  )}
  onClick={() => onView(item)}
>
```

**Action buttons reveal on hover:**
```tsx
<div className="flex items-center gap-0.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
     onClick={(e) => e.stopPropagation()}>
  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-blue-500">
    <Eye className="h-3.5 w-3.5" />
  </Button>
  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-amber-500">
    <Pencil className="h-3.5 w-3.5" />
  </Button>
  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
    <Trash2 className="h-3.5 w-3.5" />
  </Button>
</div>
```

**Rules:**
- Cards always have `overflow-hidden` and `transition-all duration-200`
- Hover-reveal actions on desktop (`sm:opacity-0 sm:group-hover:opacity-100`), always visible on mobile
- Action buttons are `h-7 w-7` ghost icons, colored on hover
- Click on card = view, explicit button clicks = edit/delete
- `e.stopPropagation()` on action button containers

### 4.5 Status Badge Pattern

Status badges use a consistent **dot + text** pattern:

```tsx
<span className={cn(
  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
  STATUS_COLORS[status]
)}>
  <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[status])} />
  {status}
</span>
```

**Color maps are always defined as const objects:**
```tsx
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  OPEN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  // ...
}
```

### 4.6 Stat Card Pattern (Dashboard)

```tsx
<Card className="border-l-4 {palette.border} overflow-hidden">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
    <div className="h-9 w-9 rounded-lg {palette.bg} flex items-center justify-center">
      <Icon className="h-4.5 w-4.5 {color}" />
    </div>
  </CardHeader>
  <CardContent>
    <div className="text-xl sm:text-2xl font-bold text-foreground">{value}</div>
    <p className="text-xs text-muted-foreground mt-1">{description}</p>
  </CardContent>
</Card>
```

**Rules:**
- Left `border-l-4` accent in the icon's color family
- Icon sits in a `h-9 w-9 rounded-lg` container with `bg-{color}/10`
- Value is `text-xl sm:text-2xl font-bold`
- Clickable stat cards add `hover:scale-[1.02]` and an arrow reveal

### 4.7 Loading & Empty States

**Loading state:**
```tsx
<div className="flex flex-col items-center justify-center py-20">
  <Loader2 className="h-10 w-10 animate-spin text-primary" />
  <p className="text-sm text-muted-foreground mt-3">Loading items...</p>
</div>
```

**Empty state:**
```tsx
<div className="text-center py-16 text-muted-foreground">
  <EntityIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
  <p className="font-medium">No items found</p>
  <p className="text-sm mt-1">Create your first item to get started</p>
</div>
```

**Rules:**
- Loading uses `Loader2` from lucide with `animate-spin text-primary`
- Empty states use the entity's icon at `h-12 w-12 opacity-30`
- Both are vertically centered with generous `py-16` / `py-20`

### 4.8 Form Pattern

Forms use **react-hook-form + zod** with this structure:

```tsx
const schema = z.object({
  field: z.string().min(1, 'Field is required'),
  // ...
})

const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
  resolver: zodResolver(schema),
})

// Field layout:
<div className="space-y-1.5">
  <Label htmlFor="field" className="text-sm font-medium">Field Label</Label>
  <Input
    id="field"
    className={cn('h-11', errors.field && 'border-destructive')}
    {...register('field')}
  />
  {errors.field && (
    <p className="text-xs text-destructive mt-1">{errors.field.message}</p>
  )}
</div>
```

**Rules:**
- Input height: `h-11` for forms (taller than default `h-10` for comfortable touch targets)
- Error borders: `border-destructive` class on the input
- Error messages: `text-xs text-destructive mt-1` below the field
- Submit buttons: full width `w-full h-11` with `Loader2` spinner when `isSubmitting`
- Server errors are applied to form fields via `applyFieldErrors()` utility

### 4.9 Modal/Dialog Pattern

```tsx
<Dialog open={open} onOpenChange={handleClose}>
  <DialogContent className="w-[calc(100%-2rem)] sm:max-w-2xl max-h-[85vh] flex flex-col">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2 text-sm sm:text-lg">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
        Dialog Title
      </DialogTitle>
      <DialogDescription className="text-xs sm:text-sm">
        Description text
      </DialogDescription>
    </DialogHeader>

    {/* Scrollable content */}
    <div className="flex-1 min-h-0 overflow-y-auto">
      {/* Content */}
    </div>

    <DialogFooter className="gap-2 sm:gap-0">
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Rules:**
- Mobile width: `w-[calc(100%-2rem)]`
- Max height: `max-h-[85vh] sm:max-h-[90vh]`
- Content scrolls independently (`flex-1 min-h-0 overflow-y-auto`)
- Titles include a colored icon for visual anchoring

### 4.10 Side Drawer Pattern

The `SideDrawer` is a resizable right-side panel used for detail views and editing:

**Key features:**
- 5 size presets: `sm` (384px), `md` (448px), `lg` (672px), `xl` (768px), `2xl` (896px)
- Drag-resizable left edge on desktop
- Full-screen on mobile (`100vw`)
- Persists width to `localStorage`
- Mode badge: `create` (green), `edit` (blue), `view` (gray)
- Optional footer action buttons with configurable alignment
- Loading overlay with backdrop blur

### 4.11 Sidebar Navigation Pattern

```tsx
const NAV_SECTIONS = [
  {
    title: 'SECTION_NAME',        // Uppercase, letter-spaced
    items: [
      { label: 'Item', icon: LucideIcon, href: '/path' },
      // Supports nested children via Collapsible
    ],
  },
]
```

**Active state styling:**
- Background: `hsl(var(--sidebar-active-bg))`
- Left border: `2px solid hsl(var(--sidebar-active-border))` (blue accent)
- Icon color: matches the border accent
- Custom CSS utility class: `.sidebar-active`

### 4.12 Table Pattern

Tables follow a clean, compact style used inside dialogs and detail pages:

```tsx
<div className="border rounded-lg overflow-hidden">
  <table className="w-full text-sm">
    <thead>
      <tr className="bg-muted/50 border-b">
        <th className="text-left px-3 py-2 font-medium text-xs">Column</th>
      </tr>
    </thead>
    <tbody className="divide-y">
      <tr className="hover:bg-muted/30">
        <td className="px-3 py-2 text-xs">{value}</td>
      </tr>
    </tbody>
  </table>
</div>
```

**Rules:**
- Wrapped in `border rounded-lg overflow-hidden`
- Header: `bg-muted/50 border-b`
- Rows: `divide-y` + `hover:bg-muted/30`
- Cell padding: `px-3 py-2`
- Font: `text-xs` to `text-sm`
- On mobile: replace tables with **card layouts** (responsive pattern)

### 4.13 Toast Notification Pattern

All user feedback uses **Sonner** positioned at `bottom-right` with `richColors`:

```tsx
// In App root:
<Toaster position="bottom-right" richColors />

// Usage:
toast.success('Item created successfully')
toast.error('Failed to create item')
toast.error(extractApiError(err, 'Something went wrong'))
```

**Rules:**
- Success: green toast for create/update/delete confirmations
- Error: red toast for all failures, using `extractApiError()` for human-readable messages
- Never use `toast.info()` or `toast.warning()` unless truly necessary
- Delete confirmations use `window.confirm()` before the action, not a toast

---

## 5. UX Principles

### 5.1 Navigation Flow

#### Information Architecture

```
Dashboard (/)
├── Jobs (/jobs)
│   ├── Create (/jobs/new)
│   ├── Detail (/jobs/:id)
│   ├── Edit (/jobs/:id/edit)
│   └── Application Detail (/jobs/:id/applications/:appId)
├── Applicants (/applicants)
│   ├── Create (/applicants/new)
│   └── Detail (/applicants/:id)
├── Applications (/applications)
│   ├── Create (/applications/new)  → Wizard flow
│   ├── Detail (/applications/:appId)
│   └── Edit (/applications/:appId/edit)
├── Pipeline (/pipeline)
├── Call Records (/calls)
│   ├── Detail (/calls/:id)
│   └── Edit (/calls/:id/edit)
├── AI Queues (/call-queues)
│   ├── Create (/call-queues/new)
│   └── Detail (/call-queues/:id)
├── Scorecards (/scorecards)
│   ├── Detail (/scorecards/:id)
│   └── Edit (/scorecards/:id/edit)
├── Interviews (/interviews)
│   ├── Create (/interviews/new)
│   ├── Detail (/interviews/:id)
│   └── Edit (/interviews/:id/edit)
├── Notifications (/notifications)
│   └── Detail (/notifications/:id)
├── Activity Log (/activities)
│   └── Detail (/activities/:id)
└── Profile (/profile)
```

#### Navigation Principles

1. **Flat hierarchy** — Max 2 levels deep from the sidebar. No deeply nested routes.
2. **Sidebar as anchor** — The sidebar always reflects where you are. Active state highlights current section.
3. **List → Detail → Edit** — Consistent drill-down pattern. List cards click to detail, detail has edit button.
4. **Back navigation** — Detail/edit pages provide explicit "Back" buttons with `ArrowLeft` icon. Never rely on browser back alone.
5. **Auto-close mobile sidebar** — On any route change, the mobile sidebar auto-closes via `useEffect` on `location.pathname`.
6. **Catch-all redirect** — Unknown routes redirect to `/` via `<Route path="*" element={<Navigate to="/" replace />} />`
7. **Auth guard** — `ProtectedRoute` wrapper redirects unauthenticated users to `/login`. Login page redirects authenticated users to `/`.

### 5.2 Responsiveness Strategy

#### Breakpoint Usage

| Breakpoint | Value | Usage |
|---|---|---|
| **Default** | `< 640px` | Mobile: single column, full-width inputs, stacked layouts |
| **`sm`** | `640px` | Small tablet: 2-col grids, inline filters, side-by-side buttons |
| **`md`** | `768px` | Tablet: increased padding (`md:p-6`), wider grids |
| **`lg`** | `1024px` | Desktop: sidebar visible, 3-col grids, hover interactions |
| **`xl`** | `1280px` | Wide desktop: 4-col grids, wider content areas |
| **`min-[400px]`** | `400px` | Custom: filter dropdowns switch from full-width to fixed width |

#### Responsive Patterns

**1. Mobile Sidebar → Desktop Sidebar**
```
Mobile: Hidden by default, slide-in overlay with backdrop blur
Desktop: Always visible, collapsible to icon-only (68px)
```

**2. Stacked → Inline Layouts**
```tsx
"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
```

**3. Full-Width → Fixed-Width Inputs**
```tsx
"w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm"   // Search
"w-full min-[400px]:w-40"                           // Filter dropdown
```

**4. Single Column → Multi-Column Grids**
```tsx
"grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"         // Entity cards
"grid-cols-2 lg:grid-cols-4"                         // Stat cards
```

**5. Table → Card Layout (Mobile)**
```tsx
{/* Desktop: table layout */}
<div className="hidden sm:block">
  <table>...</table>
</div>

{/* Mobile: card layout */}
<div className="sm:hidden space-y-2">
  {items.map(item => <div className="border rounded-lg p-2.5">...</div>)}
</div>
```

**6. Side Drawer Full Screen on Mobile**
```tsx
style={{ width: isMobile ? '100vw' : `${drawerWidth}px` }}
```

### 5.3 Interaction Patterns

#### Hover Effects

| Element | Hover Behavior |
|---|---|
| Cards | `hover:shadow-lg`, optional `hover:scale-[1.02]` |
| Card action buttons | `sm:opacity-0 sm:group-hover:opacity-100` (reveal) |
| Sidebar items | `hover:bg-muted/80 hover:text-foreground` |
| Header buttons | `hover:bg-accent` |
| Table rows | `hover:bg-muted/30` |
| Ghost buttons | `hover:bg-accent hover:text-accent-foreground` |
| Destructive items | `hover:text-destructive` |

#### Transitions

All transitions use the same timing:

```
transition-all duration-200      → Cards, layout shifts
transition-colors                → Buttons, backgrounds
transition-opacity               → Reveal/hide elements
transition-transform duration-200 → Scale effects
duration-150                     → Sidebar items (snappier)
duration-300                     → Sidebar open/close (smoother)
```

**Rule:** Never exceed `300ms`. Most interactions are `150ms` or `200ms`. Animations should be felt, not watched.

#### Drag & Drop

Used in pipeline stage reordering:
- `cursor-grab` at rest, `active:cursor-grabbing` while dragging
- Drop target: `border-primary border-2 scale-[1.02]`
- Visual feedback is immediate and obvious

#### Multi-Step Wizards

Used for import dialog and application creation:

```tsx
// Step indicators
<div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs">
  {steps.map((s, i) => (
    <div className={cn(
      'flex items-center gap-1.5 px-2 py-1 rounded-full font-medium',
      isCurrent && 'bg-primary text-primary-foreground',
      isCompleted && 'bg-emerald-100 text-emerald-700',
      isPending && 'bg-muted text-muted-foreground'
    )}>
      <span className="w-4 h-4 rounded-full">{i + 1}</span>
      <span>{s.label}</span>
    </div>
  ))}
</div>
```

**Rules:**
- Steps connected by `h-px bg-border` dividers
- Current step: primary color pill
- Completed steps: emerald/green pill
- Pending steps: muted pill
- Navigation via explicit "Back" / "Next" buttons, never auto-advance

### 5.4 Data Loading Strategy

| Concern | Solution |
|---|---|
| **Server state** | TanStack React Query (`@tanstack/react-query`) |
| **Client state** | Zustand with `persist` middleware |
| **Stale time** | `30_000ms` (30 seconds) — queries refetch after 30s |
| **Retry** | `1` retry on failure |
| **Polling** | Notifications polled every `60_000ms` (1 minute) |
| **Cache invalidation** | Mutations invalidate related query keys via `queryClient.invalidateQueries()` |
| **Analytics refresh** | All mutations auto-invalidate analytics query keys via `MutationCache.onSuccess` |
| **Optimistic updates** | Not used — wait for server confirmation, then invalidate |

### 5.5 Authentication Flow

```
App Load → Zustand hydrates from localStorage
  ├── Has valid token → Show AppLayout (sidebar + header + routes)
  └── No token → Redirect to /login
       └── Login success → setAuth() stores user + tokens
            └── Navigate to / → AppLayout renders
```

- Tokens stored in both Zustand and `localStorage` (belt and suspenders)
- Axios interceptor attaches `Authorization: Bearer <token>` and `X-Tenant-ID` header
- 401 responses trigger `clearAuth()` + redirect to `/login` (with a 5-second grace period after login to prevent race conditions)

---

## 6. Code & Styling Guidelines

### 6.1 CSS / Tailwind Conventions

#### Always Use Semantic Tokens

```tsx
// CORRECT
className="bg-background text-foreground border-border"
className="text-muted-foreground"
className="bg-destructive text-destructive-foreground"

// WRONG — never use raw Tailwind colors for semantic purposes
className="bg-white text-gray-900 border-gray-200"
className="text-gray-500"
className="bg-red-500 text-white"
```

#### The `cn()` Utility

All conditional or composed class names must use the `cn()` utility (clsx + tailwind-merge):

```tsx
import { cn } from '@/lib/utils'

// Merge base + conditional classes
className={cn(
  'base-classes here',
  isActive && 'active-classes',
  variant === 'primary' && 'primary-classes',
  className  // Allow parent overrides
)}
```

#### Class Variance Authority (CVA)

Multi-variant components use CVA for type-safe variant definitions:

```tsx
const buttonVariants = cva(
  'base-classes-shared-by-all-variants',
  {
    variants: {
      variant: {
        default: 'variant-specific-classes',
        destructive: '...',
        outline: '...',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)
```

#### Dark Mode Classes

Always provide explicit dark mode variants for colored elements:

```tsx
// Pattern: light-bg light-text dark:dark-bg dark:dark-text
'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
```

**Never rely on `dark:` inversion alone** — always specify both light and dark explicitly for colored elements. Semantic tokens (`bg-background`, `text-foreground`) auto-switch and don't need `dark:` overrides.

#### Opacity Patterns

```
/10  → Icon backgrounds (bg-blue-500/10)
/20  → Hover overlays, subtle tints
/30  → Muted section backgrounds (bg-muted/30)
/40  → Borders, backdrop (border-border/40)
/50  → Section headers (bg-muted/50)
/60  → Muted sub-borders (border-border/60)
/80  → Hover states (hover:bg-primary/80)
```

### 6.2 TypeScript Conventions

#### Type Organization

All types live in `src/types/index.ts`, organized by domain with ASCII-art section headers:

```tsx
// ─── Jobs ────────────────────────────────────────────────────────────────────
export interface JobListItem { ... }
export interface JobDetail { ... }
export interface JobFormData { ... }
```

#### Type Naming Pattern

Each entity has 3-4 types:

| Pattern | Purpose | Example |
|---|---|---|
| `[Entity]ListItem` | Compact type for list views | `JobListItem` |
| `[Entity]Detail` | Full type for detail views | `JobDetail` |
| `[Entity]FormData` | Input type for create/edit | `JobFormData` |
| `[Entity]Summary` | Nested/embedded type | `ScorecardSummary` |

#### Enum Strategy

String literal unions, not TypeScript enums:

```tsx
export type JobStatus = 'DRAFT' | 'OPEN' | 'PAUSED' | 'CLOSED'
```

Always SCREAMING_SNAKE_CASE for enum values, matching the backend API.

### 6.3 API Service Pattern

Each entity has a dedicated service file following this template:

```tsx
import { get, post, put, patch, del, download } from './api'
import type { EntityListItem, EntityDetail, EntityFormData, PaginatedResponse } from '@/types'

export const entityService = {
  list: (params?: Record<string, string>) =>
    get<PaginatedResponse<EntityListItem>>('/entities/', { params }),

  get: (id: string) =>
    get<EntityDetail>(`/entities/${id}/`),

  create: (data: EntityFormData) =>
    post<EntityDetail>('/entities/', data),

  update: (id: string, data: EntityFormData) =>
    put<EntityDetail>(`/entities/${id}/`, data),

  patch: (id: string, data: Partial<EntityFormData>) =>
    patch<EntityDetail>(`/entities/${id}/`, data),

  delete: (id: string) =>
    del(`/entities/${id}/`),

  export: (filters: Record<string, string>, format: 'csv' | 'xlsx') =>
    download(
      `/entities/export/?${new URLSearchParams({ ...filters, export_format: format })}`,
      `entities.${format}`,
    ),
}
```

**Rules:**
- All URLs end with `/` (Django convention)
- Params are `Record<string, string>` — simple flat objects
- Return types are always explicit generics
- Export uses the `download()` helper that triggers a browser file download

### 6.4 Error Handling Pattern

```tsx
// In mutations:
const mutation = useMutation({
  mutationFn: (data) => entityService.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['entities'] })
    toast.success('Entity created')
    navigate('/entities')
  },
  onError: (err) => toast.error(extractApiError(err, 'Failed to create entity')),
})

// For forms with inline field errors:
onError: (err) => {
  const msg = applyFieldErrors(err, setError, 'Failed to save')
  if (msg) toast.error(msg)
}
```

**The error extraction chain:**
1. `extractApiError()` — Returns a human-readable string from any API error shape
2. `extractFieldErrors()` — Returns `Record<string, string>` of field-level errors
3. `applyFieldErrors()` — Sets errors on react-hook-form fields AND returns a toast message

### 6.5 State Management Rules

| State Type | Tool | Example |
|---|---|---|
| Server data | React Query | Jobs list, applicant details, analytics |
| Auth / session | Zustand + persist | User object, tokens, isAuthenticated |
| UI state | React `useState` | Search term, filter values, mobile sidebar open |
| Form state | react-hook-form | Input values, validation errors, dirty/touched |
| Theme | next-themes | Light/dark mode preference |

**Rule:** Never duplicate server state in Zustand. If it comes from an API, it lives in React Query cache.

### 6.6 Performance Considerations

1. **Query stale time:** 30 seconds prevents redundant refetches on tab focus
2. **Single retry:** Limits retry storms on genuine failures
3. **Mutation cache invalidation:** Analytics queries auto-refresh after any mutation
4. **Lazy route loading:** Pages are direct imports (could be enhanced with `React.lazy` for larger apps)
5. **Icon tree-shaking:** Individual Lucide icon imports, never `import * from 'lucide-react'`
6. **Tailwind purging:** Only scans `src/**/*.{ts,tsx}` — no bloated CSS output
7. **Date formatting:** Uses `date-fns` for lightweight date operations
8. **No global CSS beyond base:** All styling is utility-first Tailwind, no component-specific CSS files

---

## 7. Reusability Instructions

### 7.1 How to Bootstrap a New Project with This Style

**Step 1: Initialize the stack**
```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npx shadcn@latest init   # Choose: Default style, Slate base, CSS variables: yes
```

**Step 2: Install core dependencies**
```bash
npm install @tanstack/react-query axios zustand react-router-dom
npm install react-hook-form @hookform/resolvers zod
npm install sonner lucide-react date-fns recharts next-themes
npm install tailwindcss-animate vaul cmdk
```

**Step 3: Copy the design tokens**

Copy the `globals.css` `:root` and `.dark` variable blocks exactly. These are the DNA of the visual identity.

**Step 4: Set up the folder structure**

```
src/
├── components/ui/     ← shadcn components
├── components/        ← composite components
├── pages/             ← route pages
├── services/          ← API modules
├── stores/            ← Zustand stores
├── types/             ← TypeScript types
├── lib/               ← Utilities (utils.ts, apiErrors.ts)
├── globals.css
├── main.tsx
└── App.tsx
```

**Step 5: Set up the app shell**

Copy the `App.tsx` pattern: `QueryClientProvider` → `TooltipProvider` → `Toaster` → `BrowserRouter` with sidebar/header shell.

### 7.2 Rules That Must Always Be Followed

#### Non-Negotiable Design Rules

1. **Always use HSL CSS variables** for theme colors — never hardcode hex/rgb for semantic colors
2. **Every interactive element needs a hover state** — no "dead" buttons or cards
3. **Dark mode variants are mandatory** for all colored backgrounds and text
4. **Loading states on every async operation** — spinners for queries, disabled+spinner for mutations
5. **Toast feedback on every mutation** — success AND error, no silent operations
6. **Mobile layout first** — test at 375px width before desktop polish
7. **Semantic HTML** — `<main>`, `<header>`, `<nav>`, `<button>` for interactive elements, never `<div onClick>`
8. **Icons from a single library** — Lucide React only, `h-4 w-4` default size
9. **Consistent page structure** — Header → Filters → Content grid, every list page
10. **No inline styles** except for dynamic values (widths, colors from data)

#### Non-Negotiable Code Rules

1. **TypeScript strict mode** — no `any`, explicit return types on services
2. **Zod schemas for all forms** — client-side validation before submission
3. **Server errors mapped to form fields** — via `applyFieldErrors()` pattern
4. **One service file per entity** — never mix API calls across domains
5. **React Query for all server state** — never `useEffect` + `useState` for data fetching
6. **Zustand only for client state** — auth, UI preferences, never server data
7. **Path aliases** — always `@/components`, `@/lib`, never relative `../../`
8. **`cn()` for all dynamic classes** — never string concatenation for Tailwind classes
9. **Constants as typed `Record` objects** — color maps, label maps, config objects
10. **Explicit error handling** — `extractApiError()` in every `onError`, never swallow errors

### 7.3 Component Checklist for New Pages

When building a new entity page, verify:

- [ ] List page with search + filter bar
- [ ] Card component with hover reveal actions
- [ ] Status badge with dot + color map
- [ ] Loading state with `Loader2`
- [ ] Empty state with entity icon
- [ ] Detail page with section cards
- [ ] Create/edit form with zod validation
- [ ] Toast notifications on success/error
- [ ] Export dropdown (CSV/Excel)
- [ ] Mobile responsive layout
- [ ] Dark mode appearance
- [ ] Back navigation button

### 7.4 Quick Reference: Class Snippets

```tsx
// Page wrapper
"p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5"

// Page header
"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"

// Page title
"text-base sm:text-lg font-semibold"

// Page subtitle
"text-xs text-muted-foreground"

// Filter row
"flex flex-wrap items-center gap-3"

// Search input wrapper
"relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm"

// Search icon
"absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"

// Filter select trigger
"w-full min-[400px]:w-40"

// Card grid
"grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"

// Interactive card
"group border-l-4 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"

// Hover-reveal actions
"flex items-center gap-0.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"

// Action icon button
"h-7 w-7 text-muted-foreground hover:text-blue-500"

// Status badge
"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"

// Status dot
"h-1.5 w-1.5 rounded-full"

// Loading state
"flex flex-col items-center justify-center py-20"

// Empty state
"text-center py-16 text-muted-foreground"

// Form field spacing
"space-y-1.5"

// Form input
"h-11"

// Error text
"text-xs text-destructive mt-1"

// Muted section
"bg-muted/30 border-t border-border/40"

// Section label (sidebar)
"text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/50 uppercase"
```

---

## Appendix: Technology Stack Reference

| Category | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | React | 18.3 | UI rendering |
| **Language** | TypeScript | 5.5 | Type safety |
| **Build Tool** | Vite | 5.4 | Dev server + bundling |
| **Routing** | react-router-dom | 6.26 | Client-side routing |
| **Styling** | Tailwind CSS | 3.4 | Utility-first CSS |
| **UI Primitives** | shadcn/ui + Radix UI | Latest | Accessible components |
| **Variant System** | class-variance-authority | 0.7 | Type-safe variants |
| **Class Merging** | tailwind-merge + clsx | Latest | `cn()` utility |
| **Animations** | tailwindcss-animate | 1.0 | CSS animation utilities |
| **Icons** | Lucide React | 0.446 | Consistent icon library |
| **Server State** | TanStack React Query | 5.51 | Data fetching + caching |
| **Client State** | Zustand | 4.5 | Lightweight global state |
| **Forms** | react-hook-form | 7.53 | Form management |
| **Validation** | Zod | 3.23 | Schema validation |
| **HTTP Client** | Axios | 1.7 | API requests |
| **Toasts** | Sonner | 1.5 | Toast notifications |
| **Charts** | Recharts | 2.12 | Data visualization |
| **Dates** | date-fns | 3.6 | Date formatting |
| **Theme** | next-themes | 0.3 | Dark/light mode |
| **Drawer** | Vaul | 0.9 | Mobile drawer component |

---

> **This document is your UI/UX signature.** Treat it as a living blueprint — update it as your style evolves, but always maintain its core principles. Consistency across projects is what transforms a developer into a brand.
