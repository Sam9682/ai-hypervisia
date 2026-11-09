# Implementation Plan: Partipolia Theme Alignment

## Overview

Implementation language: TypeScript (React 19, Vite, Tailwind CSS v4) in `frontend/`. The plan sets up test tooling, declares the theme tokens and component classes, rebuilds the Layout, sweeps every page and component, then adds static scan tests and runs build and lint. No routes, API calls or form logic change.

## Tasks

- [x] 1. Set up test tooling
  - [x] 1.1 Add vitest, @testing-library/react, @testing-library/user-event, jsdom and fast-check
    - Add as dev dependencies in `frontend/package.json` with exact pinned versions
    - Add `"test": "vitest --run"` script
    - Configure vitest with the jsdom environment in `frontend/vite.config.ts` (or a `vitest.config.ts`)
    - _Requirements: 10.1, 10.2_

- [x] 2. Theme tokens and base styles
  - [x] 2.1 Rewrite `frontend/src/index.css`
    - Add the `@theme` block with the seven palette tokens and the Inter font stack
    - Add base rules: paper body background, slate body text, Inter font, red `focus-visible` outline (2px width, 2px offset) for links, buttons, inputs, selects and textareas
    - Add flat component classes: `btn-primary`, `btn-secondary`, `card`, `card-hover` (border or shadow only, no transform), `kpi`, `kpi-value`, `kpi-label`, `disclaimer`, `disclaimer-alert`
    - Use no gradient, backdrop-filter or transform declarations
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 3.2, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 2.2 Remove legacy colours from `frontend/tailwind.config.js`
    - Read the file; delete any `primary` or `accent` colour entries so legacy classes cannot resolve
    - Leave the file unchanged if it only lists `content`
    - _Requirements: 3.1, 10.3_

  - [x] 2.3 Update `frontend/index.html`
    - Set `<meta name="theme-color" content="#0a1226">`, adding it if absent
    - _Requirements: 9.3_

  - [ ]* 2.4 Write unit tests for the stylesheet and index.html
    - Parse `index.css` text for tokens, font stack, focus rule, component classes, and absence of gradient, backdrop-filter and transform
    - Assert the theme-color value in `index.html`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.3_

- [x] 3. Layout, navigation and accessibility
  - [x] 3.1 Create `frontend/src/utils/navigation.ts`
    - Implement `isActivePath(pathname, to)`: `/` matches only the root, other targets match exactly or on a segment boundary
    - _Requirements: 5.5, 5.6_

  - [x] 3.2 Rebuild `frontend/src/components/Layout.tsx`
    - Add the skip link as the first element, visible only on focus, targeting `#main-content`
    - Render `<main id="main-content" tabIndex={-1}>` so activation moves focus
    - Navy-950 header and footer with plain-text HYPERVISIA wordmark and navy-100 or white text
    - Drive desktop and mobile menus from one `NavItem` array with glyph-free labels; remove the caret and plus prefix; open the admin dropdown on hover and focus within
    - Apply brand-red underline and `aria-current="page"` to the active link using `isActivePath` and `useLocation`; inactive links get a transparent border
    - Add the inline three-bar SVG Hamburger_Button with `aria-label`, `aria-expanded` and `aria-controls`, visible below `md`; desktop nav `hidden md:flex`
    - Use `btn-primary` and `btn-secondary` for login, register and logout buttons; remove the logo image import
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 3.3 Write property test for the active link rule
    - **Property 4: Active link underline matches the route**
    - Generate pathnames and nav targets; assert the brand-red underline appears if and only if `isActivePath` is true and on no other link
    - Tag: `Feature: partipolia-theme-alignment, Property 4`
    - **Validates: Requirements 5.5, 5.6**

  - [ ]* 3.4 Write property test for the hamburger toggle
    - **Property 5: Hamburger state tracks activations**
    - Generate click counts; assert `aria-expanded` is true and the mobile menu is visible if and only if N is odd
    - Tag: `Feature: partipolia-theme-alignment, Property 5`
    - **Validates: Requirements 6.2, 6.3**

  - [ ]* 3.5 Write unit tests for Layout
    - Skip link is first focusable and targets main; main is focusable and receives focus on activation
    - Wordmark is plain text in header and footer; navy classes on both
    - Hamburger SVG has three lines; `md` classes hide and show the correct regions
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.4, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Sweep pages and components
  - [x] 5.1 Sweep `frontend/src/components/` (OracleWidget, MarkdownRenderer, RichTextEditor, ProtectedRoute)
    - Apply the substitution table: remove legacy classes, gradients, blur, transforms and glyphs
    - Replace glyph toolbar labels with text ("Gras", "Italique", "Liste"); move markdown element classes to slate and navy
    - Remove unused imports and state left over from glyph removal
    - Keep behaviour unchanged
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 9.2, 9.4, 9.5_

  - [x] 5.2 Sweep `frontend/src/App.tsx`
    - Use slate text and no glyphs in loading or fallback markup; keep routes unchanged
    - _Requirements: 3.1, 4.1, 9.3, 9.5_

  - [x] 5.3 Sweep authentication pages (LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage)
    - Replace legacy styling and glyphs; use `btn-primary`, `card` and brand-red error states
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 9.1, 9.4, 9.5_

  - [x] 5.4 Sweep forum pages (ForumPage, TopicDetailPage, NewTopicPage)
    - Replace category, pin, lock and reaction glyphs with text badges (`bg-navy-100 text-navy-900`)
    - Replace legacy styling; remove hover transforms
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 9.1, 9.4, 9.5_

  - [x] 5.5 Sweep content pages (HomePage, DocumentsPage, OraclePage)
    - Replace gradients, glassmorphism, legacy colours and glyphs; use `card`, `kpi` and `disclaimer` classes where fitting
    - Review image imports; remove decorative ones together with their usage
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 9.1, 9.4, 9.5_

  - [x] 5.6 Sweep admin and tool pages (AdminUsersPage, AdminEventsPage, SettingsPage, CourseGeneratorPage)
    - Replace legacy styling and glyphs; text labels with `aria-label` for icon-only buttons
    - Sweep any other file in `frontend/src/pages/` not listed above
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 9.1, 9.4, 9.5_

- [ ] 6. Static scan verification
  - [ ]* 6.1 Create the scan helper and write property test for legacy styling
    - Create a test helper that globs the Page_Set plus `index.css` and defines `FORBIDDEN_RULES` (allow-list U+00A9)
    - **Property 1: No legacy styling in the Page_Set or stylesheet**
    - Generate a (file, rule) pair; at least 100 runs
    - Tag: `Feature: partipolia-theme-alignment, Property 1`
    - **Validates: Requirements 1.6, 3.1, 3.2, 3.3, 9.1, 9.2, 9.3, 10.3**

  - [ ]* 6.2 Write property test for palette-only colours
    - **Property 2: Only palette and slate colours are used**
    - Assert colour families are allowed and every navy or brand-red shade used is a declared token
    - Tag: `Feature: partipolia-theme-alignment, Property 2`
    - **Validates: Requirements 3.4, 9.1, 9.2, 9.3**

  - [ ]* 6.3 Write property test for glyphs and icon references
    - **Property 3: No decorative glyphs or icon references**
    - Check glyph code points, icon-font references and decorative icon imports across the Page_Set
    - Tag: `Feature: partipolia-theme-alignment, Property 3`
    - **Validates: Requirements 4.1, 4.4, 9.1, 9.2, 9.3, 10.4**

- [x] 7. Build and lint
  - [x] 7.1 Run `npm run build` and `npm run lint` in `frontend/` and fix any errors
    - Resolve unused imports, type errors and lint findings introduced by the sweep
    - _Requirements: 10.1, 10.2_

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties; unit tests validate examples
- Requirements 3.5, 4.2, 4.3, 9.4 and 9.5 are verified by code review and manual navigation

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "2.2", "2.3", "3.1"] },
    { "id": 1, "tasks": ["2.4", "3.2", "3.3", "5.1", "5.2", "5.3", "5.4", "5.5", "5.6"] },
    { "id": 2, "tasks": ["3.4", "3.5", "6.1"] },
    { "id": 3, "tasks": ["6.2", "6.3"] },
    { "id": 4, "tasks": ["7.1"] }
  ]
}
```
