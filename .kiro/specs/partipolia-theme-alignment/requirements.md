# Requirements Document

## Introduction

This feature aligns the visual theme of the AI Hypervisia React frontend (located in `frontend/`) with the Partipolia design language. The frontend uses Tailwind CSS v4 and currently relies on gradients, glassmorphism, `primary-*`, `accent-*` and `purple-*` colour classes, and emoji or decorative icons. The aligned theme uses a fixed navy and red palette, the Inter font stack, slate neutrals, flat surfaces, and a small set of shared component classes. All pages and components are swept so that no legacy styling or emoji remains.

## Glossary

- **Frontend**: The React application in the `frontend/` directory of the workspace.
- **Theme_Stylesheet**: The file `frontend/src/index.css`, which holds the Tailwind v4 `@theme` block and shared component classes.
- **Design_Tokens**: The set of colour and font values declared in the `@theme` block of the Theme_Stylesheet.
- **Palette**: The colour values navy-950 `#0a1226`, navy-900 `#0f1b3d`, navy-700 `#223a7a`, navy-100 `#e4e9f5`, brand-red `#c8202f`, brand-red-dark `#9f1822` and paper `#f6f7f9`.
- **Inter_Font_Stack**: A font-family list that starts with Inter and ends with generic system sans-serif fallbacks.
- **Slate_Neutrals**: The Tailwind slate colour scale used for body text, borders and muted surfaces.
- **Legacy_Classes**: Tailwind utility classes whose names begin with `primary-`, `accent-` or `purple-`, and any utility class that applies a gradient (`bg-gradient-*`, `from-*`, `via-*`, `to-*`) or a backdrop blur (`backdrop-blur-*`).
- **Glassmorphism**: Semi-transparent surfaces combined with backdrop blur.
- **Decorative_Glyph**: An emoji character or a pictographic symbol used purely for decoration, in menus, buttons, headings, cards, forum views, footer or any other UI text.
- **Header**: The top navigation region rendered by `frontend/src/components/Layout.tsx`.
- **Footer**: The bottom region rendered by `frontend/src/components/Layout.tsx`.
- **Wordmark**: A plain-text product name rendered in the Header and Footer without an image or icon.
- **Active_Link**: The navigation link whose route matches the current location.
- **Hamburger_Button**: The button that toggles the mobile navigation menu.
- **Skip_Link**: A link that is the first focusable element on the page and moves keyboard focus to the main content region.
- **Component_Classes**: The shared CSS classes for buttons, cards, KPI tiles and disclaimers defined in the Theme_Stylesheet.
- **Page_Set**: Every file in `frontend/src/pages/` and `frontend/src/components/`, plus `frontend/src/App.tsx` and `frontend/index.html`.
- **Build_Tooling**: The commands `npm run build` and `npm run lint` executed in `frontend/`.

## Requirements

### Requirement 1: Theme Tokens

**User Story:** As a maintainer, I want the Partipolia palette and fonts declared once as Tailwind v4 theme tokens, so that all components draw from a single source of truth.

#### Acceptance Criteria

1. THE Theme_Stylesheet SHALL declare the Design_Tokens inside a Tailwind v4 `@theme` block.
2. THE Theme_Stylesheet SHALL define the colour tokens navy-950 as `#0a1226`, navy-900 as `#0f1b3d`, navy-700 as `#223a7a`, navy-100 as `#e4e9f5`, brand-red as `#c8202f`, brand-red-dark as `#9f1822` and paper as `#f6f7f9`.
3. THE Theme_Stylesheet SHALL define the sans font token as the Inter_Font_Stack.
4. THE Theme_Stylesheet SHALL set the document body background to the paper colour token and the body text colour to a Slate_Neutrals value.
5. THE Theme_Stylesheet SHALL apply the Inter_Font_Stack to the document body.
6. THE Theme_Stylesheet SHALL declare the Design_Tokens without gradient values.

### Requirement 2: Focus Indicator

**User Story:** As a keyboard user, I want a visible red focus indicator, so that I can see which control has focus.

#### Acceptance Criteria

1. WHEN an interactive element receives keyboard focus, THE Theme_Stylesheet SHALL render a `focus-visible` outline in the brand-red colour on that element.
2. THE Theme_Stylesheet SHALL apply the focus-visible outline rule to links, buttons, inputs, selects and textareas.
3. THE Theme_Stylesheet SHALL give the focus-visible outline a width of at least 2px and an offset of at least 2px.

### Requirement 3: Flat Visual Style

**User Story:** As a visitor, I want a flat, clean visual style, so that the interface matches the Partipolia brand.

#### Acceptance Criteria

1. THE Page_Set SHALL contain no Legacy_Classes.
2. THE Theme_Stylesheet SHALL contain no `linear-gradient`, `radial-gradient` or `backdrop-filter` declarations.
3. THE Page_Set SHALL contain no Glassmorphism styling.
4. THE Page_Set SHALL use Palette colours and Slate_Neutrals for all text, background, border and ring colours.
5. THE Page_Set SHALL use brand-red for primary calls to action and navy tones for structural surfaces.

### Requirement 4: Text-Only Interface

**User Story:** As a visitor, I want a text-only interface without emoji, so that the product looks professional and consistent.

#### Acceptance Criteria

1. THE Page_Set SHALL contain no Decorative_Glyph in menu labels, button labels, headings, cards, forum views, Footer content or any other rendered text.
2. WHEN a button or link previously relied on a Decorative_Glyph to convey meaning, THE Frontend SHALL present a text label that conveys the same meaning.
3. THE Frontend SHALL preserve the functional behaviour of every control from which a Decorative_Glyph is removed.
4. THE Page_Set SHALL contain no icon-font references and no decorative icon images other than the Hamburger_Button SVG.

### Requirement 5: Header and Footer

**User Story:** As a visitor, I want a navy header and footer with a text wordmark, so that branding is consistent across pages.

#### Acceptance Criteria

1. THE Header SHALL render with a navy background using the navy-950 or navy-900 token and white or navy-100 text.
2. THE Header SHALL render the Wordmark as plain text.
3. THE Footer SHALL render with a navy background using the navy-950 or navy-900 token and white or navy-100 text.
4. THE Footer SHALL render the Wordmark as plain text.
5. WHEN a navigation link matches the current route, THE Header SHALL render that Active_Link with a brand-red underline.
6. WHILE a navigation link is not the Active_Link, THE Header SHALL render the link without the brand-red underline.

### Requirement 6: Mobile Navigation

**User Story:** As a mobile user, I want an accessible hamburger menu, so that I can navigate on small screens.

#### Acceptance Criteria

1. THE Hamburger_Button SHALL render an inline SVG with three horizontal bars.
2. THE Hamburger_Button SHALL expose an accessible name and an `aria-expanded` attribute that reflects the open state of the mobile menu.
3. WHEN the user activates the Hamburger_Button, THE Header SHALL toggle the visibility of the mobile navigation menu.
4. WHILE the viewport width is at or above the Tailwind `md` breakpoint, THE Header SHALL hide the Hamburger_Button and show the inline navigation links.

### Requirement 7: Skip Link

**User Story:** As a keyboard or screen reader user, I want a skip link, so that I can bypass repeated navigation.

#### Acceptance Criteria

1. THE Layout component SHALL render the Skip_Link as the first focusable element in the document.
2. THE Skip_Link SHALL target the main content region by its element id.
3. WHEN the Skip_Link receives keyboard focus, THE Skip_Link SHALL become visible on screen.
4. WHILE the Skip_Link does not have keyboard focus, THE Skip_Link SHALL be visually hidden while remaining available to assistive technology.
5. WHEN the user activates the Skip_Link, THE Frontend SHALL move keyboard focus to the main content region.

### Requirement 8: Shared Component Classes

**User Story:** As a developer, I want shared component classes ported from Partipolia, so that buttons, cards, KPI tiles and disclaimers look the same everywhere.

#### Acceptance Criteria

1. THE Theme_Stylesheet SHALL define button classes for a primary variant using brand-red, a hover state using brand-red-dark, and a secondary variant using navy tones.
2. THE Theme_Stylesheet SHALL define a card class with a white background, a slate border, a rounded corner and no gradient.
3. THE Theme_Stylesheet SHALL define a KPI tile class for displaying a numeric value with a label.
4. THE Theme_Stylesheet SHALL define a disclaimer class for notice blocks using a navy-100 background and a navy-700 or brand-red accent border.
5. THE Theme_Stylesheet SHALL retain the existing class names `btn-primary` and `btn-secondary` so that existing markup keeps working.
6. WHEN a user hovers over a card that uses the card hover class, THE Theme_Stylesheet SHALL change only the border colour or shadow, without a transform translation.

### Requirement 9: Full Sweep of Pages and Components

**User Story:** As a maintainer, I want every page and component swept to the new theme, so that no screen shows the old look.

#### Acceptance Criteria

1. THE Frontend SHALL apply the Palette, Component_Classes and Slate_Neutrals to every file in `frontend/src/pages/`.
2. THE Frontend SHALL apply the Palette, Component_Classes and Slate_Neutrals to every file in `frontend/src/components/`, including OracleWidget, MarkdownRenderer and RichTextEditor.
3. THE Frontend SHALL apply the Palette, Component_Classes and Slate_Neutrals to `frontend/src/App.tsx` and `frontend/index.html`, including the document theme-color meta value when one is present.
4. WHEN a page conveys status, THE Frontend SHALL use brand-red for error states and Slate_Neutrals or navy tones for other states.
5. THE Frontend SHALL keep all existing routes, API calls and form behaviour unchanged.

### Requirement 10: Build and Lint Verification

**User Story:** As a maintainer, I want the build and lint to pass, so that the theme change is safe to merge.

#### Acceptance Criteria

1. WHEN `npm run build` is executed in `frontend/`, THE Build_Tooling SHALL complete with exit code 0.
2. WHEN `npm run lint` is executed in `frontend/`, THE Build_Tooling SHALL complete with exit code 0.
3. WHEN a text search for Legacy_Classes is run over the Page_Set after the sweep, THE search SHALL return zero matches.
4. WHEN a text search for Decorative_Glyph code points is run over the Page_Set after the sweep, THE search SHALL return zero matches.
