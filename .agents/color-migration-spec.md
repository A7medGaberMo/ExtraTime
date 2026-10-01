# ExtraTime color-system migration spec (authoritative)

`src/styles/theme.css` is the ONLY file allowed to contain raw color literals
(hex, `rgb()`, `rgba()`). Everything else consumes tokens.

## HARD RULES — do not violate

1. **Only change colors.** Never touch JSX structure, element order, layout
   classes (`flex`, `grid`, `p-*`, `h-*`, `gap-*`, `rounded-*`, `absolute`,
   `z-*`, sizes, breakpoints), copy/text/i18n keys, props, hooks, state, or
   game logic. If a rename would require restructuring, choose a token class
   instead.
2. Never edit `src/styles/theme.css` or `src/app/globals.css` — not your files.
3. Never introduce a new dependency.
4. `white/NN`, `black/NN`, `currentColor`, `transparent`, `inherit` are allowed
   and are NOT violations — leave them alone. (`black/NN` is only invalid
   *inside* a `shadow-[...]` arbitrary value; see §4.)
5. Do not add new props or wrapper elements.

## §1 Layer 1 tokens (game-independent)

| Token | Use for |
|---|---|
| `canvas` | app/page background (`--et-canvas`) |
| `surface` | cards, HUDs, panels |
| `surface-2` | raised/inset surfaces |
| `well` | deep gradient midpoint inside card bodies |
| `foreground` | primary text |
| `muted` | secondary/label text |
| `line` | hairlines/dividers |
| `brand` / `brand-light` / `brand-deep` | ExtraTime gold logo & brand marks only |
| `success` | correct answers, win, positive |
| `danger` | wrong answers, loss, destructive |
| `warning` | timers running low, cautions |
| `info` | neutral informational highlights |
| `tier-icon` `tier-hero` `tier-ultimate` `tier-master` `tier-elite` `tier-gold` `tier-silver` `tier-bronze` | FUT card tier palette (game-independent) |
| `avatar-1..6` / `avatar-N-light` | seeded user-identity palette |

## §2 Layer 3 / game tokens (resolve from nearest `[data-game]`)

`game-accent`, `game-accent-light`, `game-accent-deep`, `game-on-accent`,
`game-glow`, `game-tint`, `game-grad-from`, `game-grad-to`.
Plus `card-sheen` (card bg+border), `hud-sheen`, and shadows
`shadow-elev-1|2|3`, `shadow-game-glow`.

Any of these used **outside** a `[data-game]` scope falls back to brand gold —
that is intended and safe.

## §3 Class rename table

### Game accent (gold → this game's accent)
| Legacy | Replace with |
|---|---|
| `text-gold`, `text-gold-light`, `text-gold-deep` | `text-game-accent`, `text-game-accent-light`, `text-game-accent-deep` |
| `bg-gold*`, `border-gold*`, `ring-gold*`, `from-gold*`, `via-gold*`, `to-gold*` | same prefix with `game-accent` (keep any `/opacity`) |
| `shadow-gold*` | `shadow-game-accent*` (keep `/opacity`) |
| `gold/10`, `gold/25`, `gold/[0.05]`… | `game-accent/10`, `game-accent/25`, `game-accent/[0.05]`… |
| `divide-gold*`, `placeholder-gold*`, `decoration-gold*` | `*-game-accent*` |
| `text-slate-950` **on an accent/gradient button** | `text-game-on-accent` |

### Neutrals
| Legacy | Replace with |
|---|---|
| `slate-950`, `zinc-950` | `canvas` |
| `slate-900`, `zinc-900` | `surface` |
| `slate-850`, `slate-800`, `zinc-800` | `surface-2` |
| `slate-700`, `zinc-700` | `line` |
| `slate-500`, `slate-400`, `zinc-500`, `zinc-400` | `muted` |
| `slate-300`, `slate-200`, `slate-100`, `zinc-300`, `zinc-200` | `foreground` |
| `steel` | `muted` |
| `vivid`, `bold-green` | `brand` |

### Semantic states
| Legacy | Replace with | When |
|---|---|---|
| `emerald-*`, `green-*` | `success` | correct / positive |
| `rose-*`, `red-*` | `danger` | wrong / negative / destructive |
| `amber-*`, `orange-*`, `yellow-*` | `warning` | warning, low timer |
| `sky-*`, `blue-*` | `info` | informational |
| `purple-*`, `violet-*`, `fuchsia-*` | `tier-master` | tier/rank decoration |
| `cyan-*` | `game-accent` | when it IS the game's accent (rank) |
| `lime` | `brand` | |

**Judgement call:** if an amber/orange/cyan value is being used as *this game's
decorative accent* (buttons, borders, glows, icons) rather than as a warning or
info state, map it to `game-accent` instead of `warning`/`info`. Warning states
(timer low, caution copy) always stay `warning`.

### Card tier hexes
Replace tier literals with the `tier-*` tokens (`--et-tier-*`), mapping by
meaning (icon/hero/ultimate/master/elite/gold/silver/bronze), not by hue.

## §4 Arbitrary values & literals

Shadow colors — keep the geometry, swap only the color literal:
| Legacy | Replace with |
|---|---|
| `rgba(0,0,0,0.3)` … `0.95` in `shadow-[...]` | `var(--et-shade-30)` … `var(--et-shade-95)` (match the alpha; see theme.css for the exact list) |
| `rgba(255,255,255,0.03…0.95)` in `shadow-[...]` | `var(--et-hi-03)` … `var(--et-hi-95)` (match alpha) |
| `rgba(229,184,66,*)` / gold glow in `shadow-[...]` | `var(--game-glow)` |
| `rgba(...,0)` / fully transparent | `transparent` |

Backgrounds / gradients in arbitrary values:
| Legacy | Replace with |
|---|---|
| `bg-[#05070b]`, `bg-[#05070B]` | `bg-canvas` |
| `bg-[#0a0e17]`, `bg-[#090d15]`, `bg-[#0b0f19]`, `bg-[#0b0f18]` | `bg-well` |
| `bg-[#0b0f17]` | `bg-surface` |
| `bg-[#111723]`, `bg-[#101520]`, `bg-[#161d2b]` | `bg-surface-2` |
| `from-[#…]`, `via-[#…]`, `to-[#…]` | `from-well` / `via-well` / `to-canvas` etc. (keep `/opacity` suffixes, e.g. `via-well/95`) |
| `bg-[#080d16]`, `via-[#05080e]`, `to-[#020306]` (pitch) | `bg-[var(--et-pitch-from)]` etc. |
| `text-[#E5B842]`, `#D4AF37`, `#F5D77F` | `text-brand`, `text-brand-deep`, `text-brand-light` |
| any other `#hex` | the closest Layer 1 / tier token listed above |

**Inline `style={{}}` and SVG `fill`/`stroke` attributes:** use
`var(--token)` strings — e.g. `style={{ color: 'var(--et-success)' }}`,
`stroke="var(--et-texture-emerald)"`. These are valid CSS.

**Exception — canvas 2D:** `getContext('2d').fillStyle` cannot parse `var()`.
The only such file is `src/components/shared/confetti.tsx`; resolve tokens at
runtime with
`getComputedStyle(document.documentElement).getPropertyValue('--et-confetti-1')`.

## §5 Self-check (run before you report done)

```bash
grep -rEn "#[0-9a-fA-F]{3,8}|rgba?\(|(gold|amber|orange|zinc|cyan|sky|slate|purple)-[0-9]" <your files>
```
Must return **nothing**. Also confirm you did not introduce `text-gold`,
`bg-steel`, `text-vivid`, `bg-lime`, `text-bold-green` (these classes no longer
exist and render unstyled).
