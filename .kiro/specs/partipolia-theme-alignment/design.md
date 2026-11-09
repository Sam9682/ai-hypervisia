# Design Document

## Overview

This design aligns the AI Hypervisia frontend (`frontend/`, React 19, Vite, Tailwind CSS v4, TypeScript) with the Partipolia theme. The change has four parts:

1. Declare the palette and font as Tailwind v4 tokens in `frontend/src/index.css` and rewrite the shared component classes as flat styles.
2. Rebuild `Layout.tsx` with a navy header and footer, a text wordmark, active-link underline, an accessible SVG hamburger, a skip link and a focusable `<main>`.
3. Sweep every file in `frontend/src/pages/`, `frontend/src/components/`, `App.tsx` and `index.html` to remove legacy classes and decorative glyphs.
4. Add a static scan test and a few unit tests, then confirm `npm run build` and `npm run lint` pass.

No routes, API calls, services or form logic change. The work is a styling and markup change plus one small pure helper for the active link.

### Design Decisions

- **Tokens through `@theme`.** Tailwind v4 turns `--color-navy-950` into utilities such as `bg-navy-950` and `text-navy-100`. Using the `--color-*` namespace removes any need for `tailwind.config.js` colour entries.
- **Legacy `primary-*` colours disappear.** The existing `@theme`-less setup gets `primary-*` and `accent-*` from `tailwind.config.js`. Those entries must not be reachable from markup after the sweep. Section "Tailwind config" covers this.
- **Breakpoint moves from `sm` to `md`.** Requirement 6.4 specifies `md`. Layout currently uses `sm`, so the header switches to `md`.
- **Wordmark replaces the logo image.** The header and footer render the text "HYPERVISIA". The `hypervisia.png` asset stays on disk but is no longer imported by Layout. Other imports of image assets are removed from the Page_Set unless they are content images; Requirement 4.4 forbids decorative images, so any such image is removed.
- **Pure helper for active link.** `isActivePath(pathname, to)` is extracted so the rule is testable without a DOM.

## Architecture

```mermaid
graph TD
  A[index.html<br/>theme-color, lang] --> B[main.tsx]
  B --> C[App.tsx<br/>routes unchanged]
  C --> D[Layout.tsx<br/>skip link, header, main, footer]
  D --> E[pages/*]
  D --> F[components/*]
  G[index.css<br/>@theme tokens, base rules, component classes] --> D
  G --> E
  G --> F
```

Styling flows one way: tokens in `index.css` feed utilities and component classes, which markup consumes. No component defines its own colours outside the Palette and Slate_Neutrals.

## Components and Interfaces

### Theme_Stylesheet (`frontend/src/index.css`)

```css
@import "tailwindcss";

@theme {
  --color-navy-950: #0a1226;
  --color-navy-900: #0f1b3d;
  --color-navy-700: #223a7a;
  --color-navy-100: #e4e9f5;
  --color-brand-red: #c8202f;
  --color-brand-red-dark: #9f1822;
  --color-paper: #f6f7f9;
  --font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI",
    Roboto, "Helvetica Neue", Arial, sans-serif;
}

@layer base {
  body {
    background-color: var(--color-paper);
    color: var(--color-slate-800);
    font-family: var(--font-sans);
    min-height: 100vh;
  }

  a:focus-visible,
  button:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible {
    outline: 2px solid var(--color-brand-red);
    outline-offset: 2px;
  }
}

@layer components {
  .btn-primary {
    background-color: var(--color-brand-red);
    color: #fff;
    font-weight: 600;
    padding: 0.5rem 1.5rem;
    border-radius: 0.375rem;
    transition: background-color 0.15s;
  }
  .btn-primary:hover { background-color: var(--color-brand-red-dark); }

  .btn-secondary {
    background-color: #fff;
    color: var(--color-navy-900);
    font-weight: 600;
    padding: 0.5rem 1.5rem;
    border-radius: 0.375rem;
    border: 1px solid var(--color-navy-700);
    transition: background-color 0.15s;
  }
  .btn-secondary:hover { background-color: var(--color-navy-100); }

  .card {
    background-color: #fff;
    border: 1px solid var(--color-slate-200);
    border-radius: 0.5rem;
  }
  .card-hover { transition: border-color 0.15s, box-shadow 0.15s; }
  .card-hover:hover {
    border-color: var(--color-navy-700);
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  }

  .kpi { /* tile */
    background-color: #fff;
    border: 1px solid var(--color-slate-200);
    border-radius: 0.5rem;
    padding: 1rem 1.25rem;
  }
  .kpi-value { font-size: 1.875rem; font-weight: 700; color: var(--color-navy-900); }
  .kpi-label { font-size: 0.875rem; color: var(--color-slate-600); }

  .disclaimer {
    background-color: var(--color-navy-100);
    border-left: 4px solid var(--color-navy-700);
    color: var(--color-navy-900);
    padding: 0.75rem 1rem;
    border-radius: 0.25rem;
  }
  .disclaimer-alert { border-left-color: var(--color-brand-red); }
}
```

Notes:
- The stylesheet contains no `linear-gradient`, `radial-gradient`, `backdrop-filter` or `transform`.
- `--color-slate-*` comes from the Tailwind default theme, which `@import "tailwindcss"` already provides.
- Inter is referenced by name. The system fallbacks cover machines without it. Loading the font file is out of scope.

### Tailwind config (`frontend/tailwind.config.js`)

Read the file during implementation. If it extends `colors` with `primary` or `accent`, remove those entries so legacy classes cannot resolve. If the file only lists `content`, leave it alone.

### Layout (`frontend/src/components/Layout.tsx`)

Structure:

```tsx
<div className="min-h-screen flex flex-col">
  <a href="#main-content"
     className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-white focus:text-navy-900 focus:px-4 focus:py-2 focus:rounded">
    Aller au contenu principal
  </a>
  <header className="bg-navy-950 text-white sticky top-0 z-40">
    <nav aria-label="Navigation principale"> ... </nav>
  </header>
  <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl mx-auto w-full py-8 px-4 sm:px-6 lg:px-8 focus:outline-none">
    {children}
  </main>
  <footer className="bg-navy-950 text-navy-100"> ... </footer>
</div>
```

Behaviour:
- **Skip link.** First element in the DOM, so first focusable. Visible only on focus. The browser moves focus to the target on activation when the target has `tabIndex={-1}`.
- **Wordmark.** `<Link to="/" className="text-xl font-bold tracking-wide text-white">HYPERVISIA</Link>` in the header, plain `<span>` text in the footer.
- **Nav links.** A single data array drives both desktop and mobile menus, and the labels contain no glyphs:

```ts
interface NavItem {
  to: string;
  label: string;
  requiresAuth?: boolean;
  adminOnly?: boolean;
}
```

  Labels: Accueil, Forum, Événements, Documents, EduScalar: Générateur de Cours, Utilisateurs, Paramètres. The admin sub-link "Gérer les événements" stays a text link. The `▾` caret and `➕` prefix are dropped. The dropdown stays functional through hover, and also opens on focus within so keyboard users can reach it.
- **Active link.** `useLocation()` supplies `pathname`. Active links get `border-b-2 border-brand-red text-white`. Inactive links get `border-b-2 border-transparent text-navy-100 hover:text-white`. Active links also set `aria-current="page"`.
- **Hamburger button.** Visible below `md` (`md:hidden`), with `aria-label` "Menu", `aria-expanded={mobileMenuOpen}` and `aria-controls="mobile-menu"`:

```tsx
<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"
     stroke="currentColor" strokeWidth="2" strokeLinecap="round">
  <line x1="4" y1="6" x2="20" y2="6" />
  <line x1="4" y1="12" x2="20" y2="12" />
  <line x1="4" y1="18" x2="20" y2="18" />
</svg>
```

  The same three-bar icon is used in both states. The open state is conveyed by `aria-expanded`, since the close glyph `✕` is removed.
- **Desktop nav.** `hidden md:flex`. Mobile menu container: `md:hidden`, rendered only when open.
- **Buttons.** Logout uses `btn-primary`. Login uses `btn-secondary` styled for the dark header (`border-white text-white hover:bg-navy-900`). Register uses `btn-primary`.

### Active link helper (`frontend/src/utils/navigation.ts`)

```ts
/** True when `to` is the current location or one of its ancestors. */
export function isActivePath(pathname: string, to: string): boolean {
  if (to === '/') return pathname === '/';
  return pathname === to || pathname.startsWith(`${to}/`);
}
```

The `/` link matches only the root. Other links match exact paths and nested paths on a segment boundary, so `/forum` does not match `/forums`. When both `/events` and `/admin/events` exist, `/events` does not match `/admin/events`, since matching is prefix-based from the start.

### Page and component sweep

Each file in the Page_Set is edited with the same substitution rules.

| Legacy pattern | Replacement |
| --- | --- |
| `bg-gradient-to-*`, `from-*`, `via-*`, `to-*` | Solid `bg-navy-900`, `bg-brand-red` or `bg-white` by role |
| `backdrop-blur-*`, `bg-white/80` | `bg-white` with `border border-slate-200` |
| `primary-50`/`100` | `navy-100` |
| `primary-600`/`700` text or border | `navy-700` or `navy-900` |
| `primary-600` filled CTA | `bg-brand-red hover:bg-brand-red-dark`, or `btn-primary` |
| `accent-*`, `purple-*` | `navy-700` or `navy-100` |
| `gray-*` | `slate-*` of the same step |
| `red-*`, `green-*`, `yellow-*`, `blue-*` for status | Error: `brand-red` on `navy-100` or white. Other: `slate-*` or `navy-*` |
| `shadow-lg`, `shadow-xl`, `hover:-translate-y-*`, `hover:scale-*` | `shadow-sm` or none; no transforms |
| Emoji and pictographs (e.g. 🏠 💬 📅 📄 📚 👥 ⚙️ ➕ 👋 🔐 ✨ 🤖 ✕ ☰ ▾) | Removed; keep or add a text label that carries the meaning |
| Icon-only buttons with a glyph | Text label ("Supprimer", "Modifier", "Fermer") plus `aria-label` where needed |

Specific files:
- `OracleWidget.tsx`, `MarkdownRenderer.tsx`, `RichTextEditor.tsx`: remove glyph toolbar labels and replace with text ("Gras", "Italique", "Liste"). Markdown renderer element classes move to slate and navy.
- Forum pages (`ForumPage`, `TopicDetailPage`, `NewTopicPage`): remove glyphs from category, pin, lock and reaction indicators and use text badges (`bg-navy-100 text-navy-900`).
- `App.tsx`: any loading or fallback markup uses slate text and no glyphs.
- `index.html`: set `<meta name="theme-color" content="#0a1226">`, adding it if absent. If a favicon link points to an icon file that is a content asset, leave it.
- Imports of `eduscalar.svg`, `Sam.png`, `Nini.png` and `hypervisia.png` in the Page_Set are reviewed. Decorative uses are removed along with their imports; if an image is part of the content (a team portrait), it stays and the glyph rule does not apply because it is not an icon (Requirement 4.4 forbids decorative icon images only).

Status handling: error messages use `text-brand-red` with a `border-brand-red` and `bg-white` or `bg-navy-100` surface. Success and info use `text-slate-700` or `text-navy-900` on `bg-navy-100`.

## Data Models

No runtime data models change. The only new types are the `NavItem` interface above and the following scan configuration used by the verification test:

```ts
interface ForbiddenRule {
  id: string;
  pattern: RegExp;
  description: string;
}

const FORBIDDEN_RULES: ForbiddenRule[] = [
  { id: 'legacy-colour', pattern: /\b(?:[a-z-]+:)*(?:bg|text|border|ring|from|via|to|fill|stroke|divide|outline|shadow|placeholder|decoration|accent|caret)-(?:primary|accent|purple)-\d{2,3}/ },
  { id: 'gradient', pattern: /\b(?:bg-gradient-|bg-linear-|from-|via-|to-)[\w/\[\]#-]+|linear-gradient|radial-gradient/ },
  { id: 'blur', pattern: /backdrop-blur|backdrop-filter/ },
  { id: 'glyph', pattern: /\p{Extended_Pictographic}|[\u2190-\u21FF\u25A0-\u25FF\u2600-\u27BF\u2B00-\u2BFF]/u },
  { id: 'icon-font', pattern: /\b(?:fa-|material-icons|bi-|icon-)/ },
];
```

The `to-` and `from-` rule matches colour-stop utilities only when they appear inside a `className` or CSS string; the scan runs against whole files, so it needs care around ordinary words like "to-do". The implementation anchors the pattern with a preceding quote, space or backtick and requires a following colour name. The `Extended_Pictographic` property also matches `©`; the scan allow-lists U+00A9 so the footer copyright stays.

## Error Handling

- **Build errors from removed imports.** Deleting an image import without removing its usage fails `tsc -b`. The sweep removes both together and the build catches mistakes.
- **Unused variables after glyph removal.** `eslint` flags unused imports and state. Remove them in the same edit.
- **Unknown utility names.** Tailwind v4 ignores unknown utilities silently, which hides typos such as `bg-navy-950` before the token exists. The scan test also asserts that every `navy-*` and `brand-red*` utility used in markup refers to a declared token.
- **Missing Inter font.** The fallback stack keeps text readable.
- **Skip link target missing.** If a page renders outside Layout, the link does not exist, so there is no dangling anchor.
- **Over-matching scans.** Scan false positives (for example prose containing "to-") are fixed by tightening the pattern, not by editing user-visible text.

## Testing Strategy

The frontend has no test runner. Add `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom` and `fast-check` as dev dependencies, pinned to exact versions, and a `"test": "vitest --run"` script. Run tests with `npm test`.

**Property tests** (`fast-check`, at least 100 runs each):
- Scan properties iterate over every file found by globbing the Page_Set and check forbidden rules. Generators pick a file and a rule so a failure shrinks to a single file and rule.
- The active link property generates pathnames and nav targets.
- The menu toggle property generates click counts.

**Unit tests** cover the CSS example checks (parse `index.css` text for tokens, focus rule, component classes, absence of `transform` in the hover rule), the Layout render checks (skip link first, wordmark text, navy classes, SVG with three lines, `md` classes, focus moves to main), and `index.html` theme-color.

**Smoke checks**: `npm run build` and `npm run lint` must exit 0.

Each property test carries a tag comment of the form `Feature: partipolia-theme-alignment, Property N: <text>`.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: No legacy styling in the Page_Set or stylesheet

For any file in the Page_Set and the Theme_Stylesheet, and for any forbidden styling rule (legacy `primary-`, `accent-` or `purple-` classes, gradient utilities or functions, backdrop blur or filter), the file content contains no match for that rule.

**Validates: Requirements 1.6, 3.1, 3.2, 3.3, 9.1, 9.2, 9.3, 10.3**

### Property 2: Only palette and slate colours are used

For any file in the Page_Set and any colour utility in it (text, background, border, ring, fill, stroke), the colour family is one of navy, brand-red, brand-red-dark, paper, slate, white, black, transparent or current, and every navy or brand-red shade used is a declared token.

**Validates: Requirements 3.4, 9.1, 9.2, 9.3**

### Property 3: No decorative glyphs or icon references

For any file in the Page_Set and any decorative glyph code point, icon-font reference or icon image import (other than the Hamburger_Button SVG), the file contains no match.

**Validates: Requirements 4.1, 4.4, 9.1, 9.2, 9.3, 10.4**

### Property 4: Active link underline matches the route

For any current pathname and any navigation target, the Header applies the brand-red underline to that link if and only if `isActivePath(pathname, to)` is true, and no other link carries it.

**Validates: Requirements 5.5, 5.6**

### Property 5: Hamburger state tracks activations

For any sequence of N activations of the Hamburger_Button starting from the closed state, `aria-expanded` is `true` and the mobile menu is visible if and only if N is odd.

**Validates: Requirements 6.2, 6.3**

## Requirement Coverage Notes

Criteria verified by example tests or smoke checks rather than properties: 1.1 to 1.5, 2.1 to 2.3, 5.1 to 5.4, 6.1, 6.4, 7.1 to 7.5, 8.1 to 8.6, 9.3 (theme-color value), 10.1, 10.2. Criteria 3.5, 4.2, 4.3, 9.4 and 9.5 are checked by code review and by building and manually navigating the app.
