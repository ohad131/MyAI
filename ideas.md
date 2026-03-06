# MyAI — Design Brainstorm

## Chosen Design Philosophy: **Liquid Metal Precision**

**Design Movement:** Post-Apple Liquid Glass × Industrial Metal UI  
**Probability:** 0.08

### Core Principles
1. **Material Hierarchy** — Glass floats above metal. Metal is the foundation. Never reverse.
2. **Chromatic Duality** — Light = cool chrome-silver; Dark = warm brushed gold. The accent color shifts with the mode.
3. **Surgical Minimalism** — Every pixel earns its place. No decorative noise, only functional beauty.
4. **Kinetic Restraint** — Animations are micro and purposeful: blur-fade, shimmer, not bounce.

### Color Philosophy
- **Light Mode (Liquid Silver):** Background `#F4F5F7` (cool off-white), surfaces `#E8EAED` (metallic silver), glass `rgba(255,255,255,0.55)` with `backdrop-filter: blur(20px)`, accent `#3B82F6` (chrome-blue).
- **Dark Mode (Liquid Gold):** Background `#0F0E0C` (near-black with warm undertone), surfaces `#1C1A16` (dark brushed metal), glass `rgba(30,26,20,0.7)` with `backdrop-filter: blur(24px)`, accent `#D4A843` (liquid gold).
- Borders: 1px, `rgba(255,255,255,0.18)` light / `rgba(212,168,67,0.25)` dark.

### Layout Paradigm
- **Asymmetric 3-column shell:** Fixed narrow icon sidebar (64px) + expandable label sidebar (220px) + main content area.
- Top bar is a glass strip floating above the metal base — `position: sticky`, `backdrop-filter: blur`.
- No centered hero layouts. Everything is edge-anchored, tool-like.

### Signature Elements
1. **Hairline luminous borders** — 1px borders with subtle glow matching the accent.
2. **Metal sheen gradient** — Subtle `linear-gradient` on panel surfaces simulating brushed metal.
3. **Glass overlay panels** — Context panels, modals, command palette use `backdrop-filter: blur(20px)` with semi-transparent tinted backgrounds.

### Interaction Philosophy
- Keyboard-first: every action has a shortcut hint.
- Hover states: subtle `box-shadow` lift + accent border glow.
- Focus states: accent-colored ring, never default browser outline.

### Animation
- Overlay entrance: `opacity 0→1` + `blur 8px→0` over 180ms ease-out.
- Sidebar expand: `width` transition 200ms cubic-bezier(0.4, 0, 0.2, 1).
- Button shimmer: `background-position` sweep on hover, 400ms.
- Toast slide: from bottom-right, 200ms spring.

### Typography System
- **Display/Headings:** `Inter` 600–700, tight letter-spacing (-0.02em).
- **Body:** `Inter` 400–500, normal spacing.
- **Code:** `JetBrains Mono` or `Fira Code`, 13px.
- **Labels/Caps:** `Inter` 500, 0.08em letter-spacing, uppercase for status chips.
