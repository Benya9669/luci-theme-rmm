# OpenWrt RMM Design System

`DESIGN.md` is the permanent source of truth for production UI and UX. New UI must use the rules and tokens defined here. The approved Phase 1 prototypes are visual references; this document is normative.

## Non-negotiables

1. OpenWrt RMM is a dense infrastructure console, not a consumer SaaS dashboard.
2. Surfaces and controls are rectangular, with small functional radii. Large soft cards and pill-shaped controls are not part of the product language.
3. Neon, cyberpunk styling, glassmorphism, glow, glossy gradients, decorative blur, and highly saturated semantic colours are forbidden.
4. Technical identifiers and telemetry use monospace. Interface copy and long-form text use the UI sans-serif stack.
5. Information density is deliberate: hierarchy comes from spacing, borders, typography, and alignment rather than oversized containers.
6. Every interactive feature must work from 320 px through wide desktop. Mobile is a composed layout, not a squeezed desktop table.
7. Status is never communicated by colour alone. Use a label, icon or shape, and concise text in addition to colour.
8. Colours, spacing, radii, control heights, typography, and responsive decisions come from shared tokens and primitives.
9. Loading, empty, error, offline, stale, reconnecting, access-denied, and unavailable states are first-class UI states.
10. Do not solve component or responsive problems with a growing tail of overrides. Refactor the owning rule and remove superseded declarations.
11. Existing IDs, data attributes, event hooks, navigation semantics, API interactions, and live-update behaviour are contracts.
12. Tabler Icons is the single approved icon family. Icons are never represented by emoji or platform-dependent Unicode pictographs anywhere in the product, including public pages, dynamic JavaScript UI, system states, notifications, and admin-only surfaces.

## Visual philosophy

The product is a dark operations surface for inspecting and changing network infrastructure. It should feel quiet, precise, and trustworthy under sustained use. Black and dark-grey planes, fine borders, compact controls, stable columns, and restrained semantic accents carry the hierarchy.

The terminal influence comes from typography, telemetry formatting, command-like labels, and structural rhythm. It must not come from fake scanlines, green-on-black imitation, glowing edges, or decorative code fragments.

Prefer one continuous work surface divided into sections over a grid of floating cards. Emphasise current state, exceptions, and available actions. Decoration must never compete with device health or operational alerts.

## Design tokens

### Palette

| Token | Value | Use |
| --- | --- | --- |
| `--color-bg` | `#090b0d` | application canvas |
| `--color-surface-1` | `#0e1113` | shell and primary work surface |
| `--color-surface-2` | `#131719` | panels, controls, rows |
| `--color-surface-3` | `#191e21` | hover, selected and raised surfaces |
| `--color-border` | `#283034` | default separators and control borders |
| `--color-border-strong` | `#394348` | emphasis and active boundaries |
| `--color-text` | `#e4e8ea` | primary text |
| `--color-text-secondary` | `#a3aaae` | supporting text |
| `--color-text-muted` | `#747d82` | metadata and placeholders |
| `--color-accent` | `#6f8999` | links, focus, selected navigation |
| `--color-accent-hover` | `#819bab` | accent hover and active state |
| `--color-success` | `#77957d` | healthy and completed |
| `--color-warning` | `#b19a6b` | degraded, warning and stale |
| `--color-danger` | `#a87575` | offline, failed and destructive |
| `--color-info` | `#718b9b` | informational and reconnecting |

Semantic colours are intentionally muted. Their soft backgrounds are derived with low-opacity colour mixing; do not substitute saturated green, yellow, red, or blue.

### Typography and monospace

- UI sans: `Inter`, `Segoe UI`, `Roboto`, `Helvetica Neue`, Arial, sans-serif.
- Technical monospace: `IBM Plex Mono`, `SFMono-Regular`, Consolas, `Liberation Mono`, monospace.
- Base size: `14px`; base line height: `1.45`.
- Compact metadata: `11–12px`; body and controls: `13–14px`; section titles: `15–18px`; page titles: `20–24px`.
- Use weights 400, 500, 600, and 700. Avoid faux-light text and heavy display weights.
- Uppercase is reserved for compact labels, table headers, state codes, and telemetry captions.

Use monospace for IP and MAC addresses, ports, versions, interface names, device IDs, timestamps, durations, byte/rate values, commands, package names, UCI paths, request IDs, and compact status telemetry. Do not use it for paragraphs, button prose, user names, or explanatory text.

### Spacing

The base spacing scale is `4, 6, 8, 12, 16, 24px`:

| Token | Value |
| --- | --- |
| `--space-1` | `4px` |
| `--space-2` | `6px` |
| `--space-3` | `8px` |
| `--space-4` | `12px` |
| `--space-5` | `16px` |
| `--space-6` | `24px` |

Use `32px` only for major page separation and public-page composition. Internal alignment and padding stay on the base scale.

### Radius

| Token | Value | Use |
| --- | --- | --- |
| `--radius-xs` | `2px` | indicators and tightly nested elements |
| `--radius-sm` | `4px` | inputs, buttons, rows |
| `--radius-md` | `6px` | panels and menus |
| `--radius-lg` | `8px` | dialogs and exceptional large surfaces |

Do not use full pills except for a switch track or a circular presence indicator. Nested radii must not exceed their parent radius.

### Control heights

- Compact: `30px` — dense table actions and toolbars.
- Default: `36px` — normal buttons, inputs, selects, and search.
- Comfortable: `42px` — authentication forms and touch-priority actions.
- Minimum touch target on coarse pointers: `42 × 42px`; visual controls may remain compact inside that target.

## Component rules

### Buttons

- Default buttons use a dark surface, one-pixel border, medium text, and a small radius.
- Primary buttons use the restrained accent fill and high-contrast dark text.
- Destructive buttons use danger colour sparingly and state the destructive action.
- Icon-only buttons require an accessible name and visible focus state.
- Labels are short and action-oriented. No gradient fills, glow, oversized capsules, or layout-shifting hover effects.
- Disabled buttons remain legible and communicate unavailability through opacity and cursor.

### Inputs, selects, search, and forms

- Text inputs, selects, textareas, and search share height, border, background, radius, typography, focus ring, and disabled treatment.
- Labels are visible and associated with controls. Placeholder text is never the only label.
- Technical inputs may use monospace; ordinary text fields remain sans-serif.
- Validation appears next to the field with a textual message. Error colour alone is insufficient.
- Search uses the base input with a leading icon or compact `SEARCH` affordance. Clearing search is keyboard accessible.
- Forms use a predictable label/control/help/error stack with `8px` field gaps and `16px` group gaps.

### Checkboxes and toggles

- Native semantics and keyboard behaviour are retained.
- Checkboxes are square, compact, and use the accent only when checked.
- Toggles are reserved for immediate binary settings. Use a checkbox when a change is submitted with a form.
- Every toggle has a visible label and a state understandable without colour.

### Settings and complex forms

- Account and settings surfaces use compact `Settings Section` regions: an eyebrow/title/description header, grouped fields, optional status, and one aligned action row. Sections are separated by dividers or a shared boundary rather than nested oversized cards.
- Complex settings follow the product hierarchy: channels, events, thresholds, schedules, integrations, device overrides, delivery status, and history. Global defaults and device-specific overrides are always labelled as separate scopes.
- Units are visually attached to numeric fields and never left implicit. Related values such as quiet-hour start/end share a compact grid and collapse to one column on mobile.
- Submission state disables the relevant form action, preserves entered values, and announces progress in the form's existing live region. Success is inline or transient; field and section errors stay in context.
- Verification controls expose a textual `NOT CONFIGURED`, `PENDING VERIFICATION`, `VERIFIED`, or `ERROR` state. Verification codes, resend actions, and destination context remain grouped with their channel.

### Account and administration

- Account identity is a compact summary of display name, username, role, and configured contact state. Do not use profile heroes or oversized avatars.
- Security actions explain session consequences before submission. Password validation is associated with the relevant form; destructive session and user actions use the shared confirmation system.
- User management is a dense comparable list on desktop and a labelled compact record on mobile. Identity and state have priority over actions; role changes, disabling, password resets, and equivalent security-sensitive changes identify the target in confirmation.
- Enrollment grants are presented as sensitive one-use technical values with expiry, selectable monospace output, copy feedback, and safe wrapping. The token is never decorative content.

### Notifications

- Notification channels, inbox items, delivery rows, and channel diagnostics reuse the canonical status system. Delivery lifecycle labels include `QUEUED`, `SENDING`, `DELIVERED`, `FAILED`, and retry/dead-letter states mapped to the common tones.
- Notification Center is a compact event list. Unread state uses marker, weight, and text/context; severity is not communicated by colour alone.
- Delivery history is a table/list on desktop and labelled compact records below tablet width. Long event text and backend errors wrap inside the record; raw technical details use the Technical Output pattern.
- Channel configuration uses one boolean-control pattern and a separate textual configuration/verification status. Do not make each channel an oversized toggle card.

### Panels and sections

- A panel is a structural region, not a decorative card: one-pixel border, flat surface, small radius, and compact header.
- Headers align title, metadata, and actions on a stable grid. Actions wrap below the title on narrow screens.
- Avoid deep nesting. Prefer dividers and subheadings inside one panel over layers of bordered cards.
- Summary metrics are labelled, aligned, and scannable; marketing-style numerals are not used.

### Tables and lists

- Tables are the default for dense comparable records on tablet and desktop.
- Headers are compact and muted. Rows use separators and restrained hover/selected surfaces, not floating row cards.
- Numeric and technical columns use tabular monospace and align consistently.
- Long names, tags, IDs, and IPv6 values wrap or truncate with a discoverable full value; they never force page-level horizontal overflow.
- On small screens, records become intentional stacked rows with labelled values and priority-based field visibility. Do not merely shrink text.
- A local scroll container is acceptable for intrinsically tabular expert data, but the page itself must not overflow horizontally.

### Expert mode

- Expert mode remains part of the main application shell and component system. Its denser presentation comes from compact grids, monospace values, dividers, and technical labels, not from a separate visual theme.
- Mark the area with a restrained `SYSTEM / EXPERT` eyebrow, warning marker, one-pixel warning boundary, and a concise consequence statement.
- Low-level actions are grouped by workflow: inspection, primary change, recovery, and destructive maintenance. Do not present every action with equal emphasis.
- Live low-level actions expose `READY`, lifecycle, stale, or router-offline state in context. Unsafe actions are disabled while the router is offline.

### Technical output and code blocks

- Command, diagnostic, package, UCI, JSON, and backend technical output share one `Technical Output` pattern: dark canvas, one-pixel border, small radius, selectable monospace text, compact padding, and a `1.5–1.6` line height.
- Output containers have `max-width: 100%` and never size a page. Use vertical scrolling with a contextual maximum height; use horizontal scrolling for exact preformatted output and safe wrapping for prose-like logs on narrow screens.
- Large or secondary output may use an accessible `<details>` disclosure. Critical status and the first useful result remain visible outside the disclosure.
- A technical error starts with understandable interface copy. Raw response text and request identifiers belong in an optional `TECHNICAL DETAILS` disclosure.

### Technical diff

- Configuration previews use one reusable diff structure with an object path, `CURRENT` and `NEW` values, and optional raw preview output.
- Removed/current values use restrained danger tone and added/new values use restrained success tone. Prefix markers and labels make the change understandable without colour.
- Unknown current values are labelled `Not reported`; the UI does not invent state that the backend did not provide.

### Status system

Every state combines restrained colour, a symbol or marker, and text. Canonical tones are:

- `success`: online, healthy, applied, completed;
- `warning`: degraded, stale, expiring, needs attention;
- `danger`: offline, failed, blocked, destructive;
- `info`: connecting, queued, informational;
- `neutral`: unknown, not configured, inactive.

Status labels are compact rectangular badges, not large pills. Use consistent language: `Online`, `Offline`, `Warning`, `Stale`, `Error`, `Reconnecting`, `Unknown`. More specific domain states map to one canonical tone.

Operation lifecycle codes are uppercase monospace labels and map to the common tones: `READY` and `COMPLETED` to neutral/success, `QUEUED` and `RUNNING` to info, `WARNING` and `STALE` to warning, and `FAILED`, `CANCELLED`, `TIMEOUT`, `EXPIRED`, and `OFFLINE` to danger or neutral where cancellation is user-initiated. Lifecycle components do not introduce a separate visual language.

### Navigation

- Desktop uses a fixed-width left sidebar with product identity, primary sections, environment telemetry, and account actions.
- The selected destination has an accent edge/fill and clear text; hover alone does not indicate selection.
- Related destinations are grouped, with one primary navigation hierarchy.
- Device tabs are local navigation and visually distinct from the global sidebar.
- Navigation labels and icons remain readable at 200% zoom. Icons never replace primary destination labels.

### Dialogs

- Use native dialog semantics where available, with a bounded viewport height and an internal scrolling body.
- Dialogs have a compact header, content region, and footer. Close is keyboard accessible and labelled.
- Default maximum width is `560px`; wide data dialogs may use `760px`. On mobile, use the available viewport with `12px` outer margin.
- Destructive confirmation identifies the target and consequence. The safe action is clearly available.
- Focus is visible, trapped while open, and restored to the invoking control on close.

### Confirmation dialogs

- Destructive and consequential operations use one Promise-based confirmation dialog built on the shared native `<dialog>` infrastructure. Browser-native `confirm`, `alert`, and `prompt` are not product UI.
- Supported variants are `neutral`, `warning`, and `danger`. Variant changes the marker, boundary accent, status icon, and confirmation button only; the dialog surface is never flooded with semantic colour.
- A confirmation states the context, target, action, consequence, reversibility, and connection risk where relevant. Generic copy such as “Are you sure?” is forbidden.
- Optional structured rows show object names, package/UCI paths, old/new values, device identifiers, or duration. Technical values use monospace and wrap safely.
- Input confirmations use a visible labelled field, validation, keyboard submit, and inline error. They replace browser prompts without creating a separate dialog family.
- During asynchronous submission, repeated submission and cancellation are disabled, the action label becomes contextual progress copy, and a failure stays in the dialog with understandable text plus optional technical details.
- Escape and safe backdrop cancellation resolve as cancelled. Focus starts on the safest useful control and returns to the invoker after close. Mobile bodies scroll inside `100dvh`; footer actions remain reachable and stack when necessary.

### Destructive action hierarchy and danger zones

- Inspection and read-only actions use neutral styling. Primary workflow actions use the standard primary treatment. Recovery actions use warning treatment only when their consequence warrants it.
- A destructive button is reserved for deletion, irreversible removal, session revocation, or an operation likely to interrupt service. Not every maintenance action is red.
- A danger zone is a compact, separately labelled section with a danger boundary, direct consequence copy, target identity, and one explicit destructive action. It is not a large red card.
- Package removal, device deletion/transfer, UCI commit/revert/restore, reboot, destructive cleanup, and comparable admin actions require contextual confirmation. Safe read-only operations do not.

## System and data states

The reusable System State pattern serves `404`, `Access denied`, `Backend unavailable`, and `Generic error`. It contains:

1. a stable state code and restrained symbol;
2. a direct title;
3. one concise explanation;
4. optional technical context such as request ID, endpoint, or last successful update;
5. a primary recovery action and an optional secondary action.

`404` offers a route to Fleet. `Access denied` offers a safe back action. `Backend unavailable` offers retry and makes cached/stale content explicit. `Generic error` offers retry or return and exposes a request ID when available.

Data-state conventions:

- `Loading`: reserve final geometry where practical; use a compact progress message or restrained skeleton, never indefinite layout shift.
- `Empty`: explain what is absent and, when useful, how to create or discover it. Empty is not an error.
- `Error`: keep the failed region in context and provide retry. Page-wide failure uses the System State pattern.
- `Offline`: retain last-known data, label it offline, show last contact, and disable unsafe live actions.
- `Stale`: retain data, show when it was updated, use warning tone, and never present it as live.
- `Reconnecting`: keep the interface usable, show progress in info tone, and fall back to polling without alarming the user.

Asynchronous announcements use an appropriate `aria-live` region. Repeated polling must not create noisy announcements or repeated toasts.

### Public, authentication, and legal surfaces

- Landing, Login, Legal, and public system states use the same tokens, typography, controls, borders, radii, and Tabler icon vocabulary as the application shell.
- Landing may use a wider editorial grid and one realistic product preview, but remains a restrained infrastructure introduction. Hero type is capped, status examples are real product patterns, and presentation never uses glow, glass, perspective, floating SaaS cards, or decorative terminal effects.
- Login is a focused authentication surface with one compact form, an inline associated error region, predictable focus order, password-manager-compatible fields, and clear submitting state. It does not duplicate the full Landing page.
- Legal copy uses a readable bounded measure, semantic headings, restrained section dividers, and technical styling only for licence identifiers and paths.
- Public route failures and app-wide failures share the System State structure and icon language. Only states reachable through the current routing and request architecture receive standalone pages.

## Responsive system

| Range | Width | Primary behaviour |
| --- | --- | --- |
| Mobile | `< 600px` | bottom navigation, stacked records, single-column content |
| Tablet | `600–899px` | compact shell, two-column summaries where space permits |
| Compact desktop | `900–1199px` | desktop navigation, reduced side columns and panel gaps |
| Desktop | `1200–1599px` | full information hierarchy and normal density |
| Wide desktop | `≥ 1600px` | wider data regions and stable max line lengths; no arbitrary scaling |

Implement responsive rules mobile-first where practical and consolidate them into these ranges. Component-specific container queries are acceptable when the component truly depends on its container.

### Mobile conventions

- Global navigation becomes a fixed bottom bar. Reserve safe-area and navigation space in the document.
- The topbar stays compact; lower-priority telemetry moves into content or a menu.
- Page headers stack title, status, and actions. Primary actions may fill the row.
- Device tabs scroll horizontally within their own container. The page itself does not scroll horizontally.
- Fleet and other dense lists become stacked records with visible labels for retained fields.
- Dialogs, dropdowns, and notification surfaces stay inside the viewport and account for safe-area insets.
- Never hide a critical state, destructive consequence, or only recovery action to make a layout fit.

## Accessibility

- Target WCAG 2.2 AA contrast for text, controls, state indicators, and focus.
- All functionality is keyboard accessible. Focus order follows visual order and `:focus-visible` is unmistakable.
- Maintain semantic headings, landmarks, labels, table structure, and native control behaviour.
- Interactive targets meet touch-size guidance on coarse pointers without inflating desktop density.
- Respect `prefers-reduced-motion`; motion is short, functional, and never required to understand a change.
- Do not rely on colour, hover, placeholder text, or icon shape alone.
- Truncation provides access to the full value through wrapping, title text, or an accessible detail view.
- Live telemetry updates never steal focus.

## Iconography

- Tabler Icons is the canonical and only approved icon family for product UI.
- The production subset is pinned to Tabler Icons `v3.46.0` (`8ac7d81`) and stored locally in `web/assets/icons/tabler-sprite.svg`. Runtime CDN icon dependencies are forbidden.
- Standard sizes are `--icon-xs: 14px`, `--icon-sm: 16px`, `--icon-md: 18px`, and `--icon-lg: 24px`. System and empty states may use `32px` inside their documented state container. Do not introduce incidental 17/19/21/23px sizes.
- Use Tabler's coherent outline style with a consistent `2px` stroke, `fill: none`, round caps/joins, and `stroke: currentColor`.
- Icons describe navigation, state, or action; they are not decoration.
- Pair unfamiliar or high-consequence icons with text.
- Emoji and platform-dependent Unicode pictographs must never be used as icons anywhere in the product. This applies to HTML, JavaScript-generated markup, dialogs, toasts, empty/error states, public pages, and the application shell.
- Do not substitute text glyphs such as arrows, bells, clouds, tools, devices, warning signs, or checkmarks for proper SVG icons when the glyph is serving as an icon. Ordinary punctuation and textual status codes are not icons.
- Vendor only symbols used by production UI and reference them through the shared sprite/registry helper. Adding an icon means adding its Tabler symbol, registry name, and accessible usage; do not paste a second copy of standard path data into HTML or JavaScript.
- Preserve the upstream MIT licence in `web/licenses/Tabler-Icons-MIT.txt` and the project notice in `NOTICE.md`.
- Unique data visualisations such as metric charts may remain inline SVG because they are generated content rather than interface iconography. Do not load icon assets from a runtime CDN and do not introduce an icon font.
- Decorative SVGs use `aria-hidden="true"`. Icon-only controls require a stable accessible name; icons paired with visible text must not duplicate that text for assistive technology.
- Multicolour illustrations, filled novelty icons, and mixed icon families are not used.
- Status icons inherit the canonical semantic tone and include a text equivalent.

## Allowed and forbidden techniques

Allowed:

- flat dark surfaces;
- one-pixel borders and separators;
- small functional radii;
- restrained inset or focus outlines;
- compact grids and aligned telemetry;
- muted semantic tint backgrounds;
- short opacity or colour transitions;
- local overflow for intrinsically tabular content.

Forbidden:

- neon or acidic colours;
- glow and luminous shadows;
- glassmorphism, backdrop blur, and translucent floating chrome;
- glossy or decorative gradients;
- oversized rounded cards and widespread pill controls;
- ornamental terminal effects, scanlines, glitch, or fake command prompts;
- page-level horizontal scrolling;
- status conveyed only by colour;
- duplicate component implementations or late-file specificity overrides.

## CSS and implementation architecture

Production CSS is organised from low to high level: tokens and reset, typography, primitives, components, application shell, feature layouts, then consolidated responsive rules. Feature rules own their variants; obsolete declarations are removed as a feature is migrated.

Prefer single-class component selectors and explicit state classes such as `.is-active`, `.is-offline`, or `[data-tone="warning"]`. Avoid IDs for styling, deep descendant chains, `!important`, and source-order patches. Shared primitives may change the baseline of unmigrated screens, but feature-specific redesign waits for its scheduled migration.

Any intentional exception must be documented next to the rule and reviewed as part of the UI change.
