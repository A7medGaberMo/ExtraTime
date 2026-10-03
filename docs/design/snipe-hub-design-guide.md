# Snipe Hub: Reverse-Engineered Design Guide

This guide records the design intent and implementation patterns of the ExtraTime Snipe hub (`/snipe`). Use it as a reference when bringing the other game hubs into the same visual family. The page is a compact entry point for a competitive football auction: it should feel focused, live, and premium, while making the next action obvious.

> Scope note: the Codex request did not include an attached browser page. This guide treats the repository's `/snipe` hub as the reference because it is the project's dedicated, game-themed hub page. The observations below are grounded in its implementation.

## 1. Product and visual intent

**Experience in one sentence:** a dark, tactical “ready room” that draws the eye through the game identity and live radar to one prominent matchmaking action, with private/join options close behind.

The design mixes three cues:

- **Football strategy:** radar/scope rings, sweep, blips, corner brackets, and a very faint grid.
- **Competitive premium:** restrained amber/gold accents, a confident high-contrast title, metallic light on the primary action.
- **Live service:** a queue pill reflects loading, empty, and populated states; the main action changes to a clear matchmaking progress state.

The interface is atmospheric but intentionally sparse. Decorative effects frame the content rather than competing with it. Its hierarchy is:

1. Mode eyebrow and title establish identity.
2. Short description explains the game in plain language.
3. Radar is the central brand illustration and visual pause.
4. Live queue status adds social proof and real-time context.
5. A full-width public-match CTA leads the action group.
6. Two secondary cards expose private-room and join-by-code paths.
7. A small feature strip summarizes the mode's differentiators.

## 2. Page anatomy and layout rules

The page is a full-viewport, low/no-scroll composition. It respects device safe areas and reserves space at the top for the shared header. Content is centered in a narrow column (`max-w-[460px]`), even on wide screens, so the hub reads like a focused game launcher rather than a marketing landing page.

The vertical structure is divided into three zones:

| Zone | Contents | Layout intent |
| --- | --- | --- |
| Hero | Eyebrow, large title, one-line description | Centered, tight, confident; use balanced text wrapping |
| Centerpiece | Radar illustration, live status pill | Flexible height; radar absorbs the remaining space and scales down before the page scrolls |
| Actions | Primary CTA, two secondary cards, three-item feature strip | Fixed-feeling bottom cluster with clear priority and compact spacing |

The main layout uses a flex column with `justify-between`, `min-h-0`, and a flexible center stage. This allows the hero and action group to keep their positions while the radar yields space on shorter screens. The CSS has explicit short-height breakpoints (`760px`, `600px`, and `520px`) that reduce title size, control heights, and radar core size. Preserve this intent if changing content: the complete core task should remain reachable without scrolling on common phone sizes, and unusually short landscape screens should degrade gracefully.

Avoid treating “zero scroll” as a universal rule for every page. It works here because this hub has only a handful of decisions. Pages with content, settings, or multiple cards should use a clear scroll container rather than compressing text or shrinking targets excessively.

## 3. Visual language

### Color and surfaces

The page-local palette is scoped under `[data-game='snipe']` in `src/styles/snipe-hub.css`:

| Role | Reference value / treatment |
| --- | --- |
| Canvas | Near-black blue `#07090F` |
| Accent | Amber light `#FBBF24`, mid `#F59E0B`, deep `#D97706` |
| Primary text | Soft white `#F5F5F7` |
| Secondary text | Cool grey `#B8BECC` / `#C5CAD6` |
| Muted text | Grey `#9AA0AE` |
| Glass surface | White at about 3% opacity |
| Hairline border | White at about 8% opacity |

Use gold selectively: it identifies the mode, live signals, focus, and the primary CTA. Supporting controls stay neutral glass so they do not compete with the main action. The vignette, radial glow, fine grid, and subtle grain give depth without adding another content layer.

### Type

The Latin display title uses Sora at a heavy weight, tight tracking, and a white vertical gradient. Supporting text uses Plus Jakarta Sans. Eyebrows use Barlow Condensed with uppercase tracking. These font variables are loaded in `src/app/layout.tsx`; page styles consume the variables instead of loading fonts per route.

Treat type roles as reusable roles rather than copying each class literally:

- **Display:** one short mode name, large and heavy.
- **Eyebrow:** small uppercase mode category, accent colored, optionally flanked by hairlines.
- **Body:** concise explanation with comfortable line height and a restrained max width.
- **Action label:** strong weight, readable at a glance.
- **Metadata/status:** compact, muted, with tabular numerals where values update.

### Shape, elevation, and texture

Rounded geometry is consistent: the main CTA and secondary cards use roughly 16px radii; small icon containers use a smaller rounded-square shape; the live state is a pill. Prefer thin borders, inset highlights, soft shadow, and restrained blur over opaque, heavy cards. Keep backdrop blur limited to surfaces where the layered effect is visible and useful.

## 4. Interaction and motion patterns

Motion supports state and atmosphere; it should never be needed to understand the interface.

- **Entrance:** small upward fade with a short stagger for the hero, radar, and lower controls. Keep distances small and total delay brief.
- **Radar:** slow sweep, pulsing rings, timed blip flares, subtle breathing glow, and sonar ping. These layers use CSS gradients and pseudo-elements/positioned spans, not a video or a heavy canvas scene.
- **Title:** an occasional sheen passes over the title; do not run a constant, high-contrast flash.
- **Primary CTA:** gold gradient with a soft glow and slow shine; hover lifts slightly; active presses down/scales; loading replaces the normal label with a spinner and progress indication.
- **Secondary cards:** pointer-positioned radial highlight (`--spot-x`, `--spot-y`), edge/border emphasis, subtle lift, and an active press.
- **Live queue:** status dot pulses only when there is a live count. Loading, zero, and positive counts have distinct copy and visuals.

Honor `prefers-reduced-motion`. The Snipe stylesheet has a dedicated override and the page marks purely decorative elements `aria-hidden`; keep those behaviors when adapting the motion vocabulary.

## 5. Component and route architecture

Keep the same separation of concerns when implementing another mode:

```text
App layout (`src/app/layout.tsx`)
├─ global tokens, fonts, providers, shared header
└─ MainWrapper (`src/components/layout/main-wrapper.tsx`)
   └─ route page (`src/app/<mode>/page.tsx`)
      ├─ game theme scope: data-game="<mode>"
      ├─ page-specific CSS (`src/styles/<mode>-hub.css`)
      ├─ localized strings (`src/lib/i18n/dictionaries/{en,ar}.ts`)
      └─ shared UI primitives (Button, ModalShell, TextInput, AppIcon)
```

Responsibilities:

- **`src/config/games.ts`:** canonical game IDs, hub/create/join destinations, icon and translation keys. It deliberately does not own colors.
- **`src/styles/theme.css`:** app-wide design tokens and `[data-game="…"]` game accent tokens. Add a new mode's shared accent values here instead of sprinkling color literals through unrelated components.
- **`src/styles/snipe-hub.css`:** Snipe-only presentation details and animations. Follow the same page-scoped CSS pattern for hub-specific effects.
- **`src/app/snipe/page.tsx`:** page composition, data wiring, local interaction state, and presentation hooks. It reads localized copy through `useI18n`, gets queue counts from Convex, and starts a match through a mutation.
- **`src/components/layout/main-wrapper.tsx`:** viewport/scroll behavior at the route level. Decide intentionally whether each new route is a fixed arena or a scrollable content page.
- **Shared UI components:** use existing primitives for buttons, inputs, icons, and modals. New page-specific primitives should be extracted only when another route can use them without inheriting Snipe's game-specific look.

Keep game identity as data (`data-game`) and let theme CSS map identity to the active color. Avoid making every shared component know about every mode. For cross-mode page structure, extract neutral primitives such as `HubHero`, `LiveStatus`, `PrimaryAction`, or `SecondaryActionCard`, and pass labels, icons, accent scope, and state as props.

## 6. Functional states and product behavior

The page's queue pill is not decorative: it has three product states and should remain accurate:

1. **Loading/unknown:** show a small spinner and neutral loading copy until the query resolves.
2. **No one waiting:** show a quiet indicator and communicate the empty state without presenting it as an error.
3. **Players waiting:** show the live label, localized count, and a pulsing dot.

The primary action follows the complete intent path:

1. If no guest nickname is stored, open the name modal with a generated suggestion and a randomize affordance.
2. Validate a non-empty name, create/resolve the guest session, and request a public match.
3. Prevent duplicate submission while loading; show progress feedback.
4. Route to the returned match room on success; show a toast and restore the action on failure.

Secondary actions lead directly to create-room and join-room flows. Keep their ordering and visual weight subordinate to public matchmaking unless product priorities change.

## 7. Localization, RTL, and accessibility

English and Arabic are first-class layout modes, not string swaps. Existing implementation changes title, eyebrow, body, and card font choices for RTL; mirrors CTA gradient and arrow movement; uses logical borders (`border-inline-start`); sets content direction on localized text; localizes the live number format; and avoids applying Latin uppercase/letter-spacing conventions to Arabic.

When porting the pattern:

- Put all user-facing copy in both dictionaries; do not hard-code labels into JSX.
- Use logical properties (`start/end`, `inline`, `border-inline-start`) so layout mirrors naturally.
- Set `dir` where mixed-direction status or dynamic content needs explicit control; use `<bdi dir="ltr">` for numeric values when that improves clarity.
- Give icon-only controls accessible labels; preserve visible focus outlines and keyboard activation.
- Mark decorative radar, glow, texture, and shine layers as hidden from assistive technology and pointer input.
- Use semantic buttons for actions and links for navigation; expose loading with `aria-busy`/status text.
- Check Arabic wrapping and button sizing rather than assuming Latin line lengths transfer.

## 8. Reuse recipe for the other hubs

Keep the shared brand grammar while changing the mode's signature metaphor and accent:

1. Keep the dark premium canvas, crisp typography hierarchy, restrained glass cards, compact status pill, and clear primary action.
2. Give each mode one recognizable centerpiece tied to its actual mechanic (for example: ranking ladder, draft/formation board, or bank/vault cue). Do not copy the Snipe radar literally across every game.
3. Define the accent once in the theme token scope and use it for the eyebrow, focal graphic, live/status detail, focused states, and CTA. Keep secondary actions neutral.
4. Preserve the shared page rhythm: mode identity → short explanation → mechanic visual/status → primary action → secondary actions → optional concise feature proof.
5. Keep copy short and outcome-focused. A visitor should understand the mode before needing to start a match.
6. Use the same loading/empty/ready vocabulary across pages, but tailor the data and action behavior to the game.
7. Reuse app components and behavioral patterns; isolate only the mode-specific visual and domain logic.
8. Match responsive behavior to each page's content. Prefer one-screen entry hubs when possible, with explicit compact-height rules and no inaccessible tiny controls.

### Suggested mode translation

| Mode | Signature visual direction | Keep from Snipe |
| --- | --- | --- |
| Rank | Ranked ladder, ordered player tiles, or a clean ascending/descending motif | Live status, strong prompt, one dominant start action |
| Draft | Formation/pitch or player-card arrangement | Mode identity, compact action group, lightweight feature proof |
| Bank | Secure vault / question-bank cue | Dark premium surface, state clarity, accessible CTA and secondary path |

These are directions, not final art decisions; select the motif that accurately reflects each mode's mechanic.

## 9. Practical implementation checklist

- [ ] Add the route and its `data-game` scope; add the game metadata to `GAMES` if it is a new mode.
- [ ] Add localized English and Arabic title, tagline, description, action, and state strings.
- [ ] Define page colors in theme tokens; keep local effects and layout rules in a route-specific stylesheet.
- [ ] Compose the hero, signature visual, data/status, primary action, and secondary routes in that order.
- [ ] Handle loading, empty, ready, error, and submission states explicitly.
- [ ] Use shared button/input/modal/icon primitives where their semantics fit.
- [ ] Check header clearance, safe areas, mobile and short-landscape layouts, Arabic RTL, keyboard focus, and reduced motion.
- [ ] Keep decoration low contrast and ensure it never blocks pointer input or text legibility.
- [ ] Confirm scroll behavior is appropriate for the page's actual content.

## 10. Source map

- Page composition and behavior: [`src/app/snipe/page.tsx`](../../src/app/snipe/page.tsx)
- Page-specific visual tokens and motion: [`src/styles/snipe-hub.css`](../../src/styles/snipe-hub.css)
- Shared game accent tokens: [`src/styles/theme.css`](../../src/styles/theme.css)
- Shared route composition and mode registry: [`src/config/games.ts`](../../src/config/games.ts)
- Global typography, direction, focus, and reduced-motion base: [`src/app/globals.css`](../../src/app/globals.css)
- Font loading and global providers: [`src/app/layout.tsx`](../../src/app/layout.tsx)
- Header and route viewport behavior: [`src/components/layout/header.tsx`](../../src/components/layout/header.tsx), [`src/components/layout/main-wrapper.tsx`](../../src/components/layout/main-wrapper.tsx)
- Shared home mode pattern for comparison: [`src/components/home/home-lobby.tsx`](../../src/components/home/home-lobby.tsx)
