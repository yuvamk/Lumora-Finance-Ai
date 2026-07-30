# Lumora AI — UI Design System

This document outlines the visual language, design tokens, color palettes, and component styles for Lumora AI.

---

## 1. Aesthetic Identity & Inspiration
Lumora AI's design language feels premium, responsive, clean, and functional.
* **Inspiration:** Apple Wallet (card layering), Copilot Money (typography, large charts), Linear (dark mode depth, border shadows).
* **Atmosphere:** Deep dark modes, soft gradients, clean cards, and responsive micro-animations using Framer Motion.

---

## 2. Design Tokens & Styling (Tailwind CSS v4 Configuration)

### Color Palette
Tailwind v4 tokens defined in HSL for smooth light/dark mode transition.

| Token | Light Mode Value | Dark Mode Value | Usage |
|---|---|---|---|
| `--background` | `0 0% 100%` (Pure White) | `224 71% 4%` (Rich Deep Slate) | Core canvas background |
| `--card` | `0 0% 98%` (Soft Gray) | `224 71% 6%` (Subtle Card Slate) | Panels, containers |
| `--primary` | `263 70% 50%` (Vibrant Indigo) | `263 90% 64%` (Electric Indigo) | Active states, major buttons |
| `--accent` | `185 80% 45%` (Muted Teal) | `185 95% 55%` (Cyan Green) | Financial positive markers (income) |
| `--destructive` | `0 84% 60%` (Coral Red) | `0 84% 50%` (Vivid Red) | Warnings, debt, expenses |
| `--border` | `220 13% 91%` (Muted Border) | `217 19% 15%` (Deep Border) | Card grids and dividers |

### Typography
* **Primary Font:** `Outfit`, Sans-serif (via Google Fonts). Premium, geometric rounded look.
* **Mono Font (Numbers):** `JetBrains Mono` or `SF Mono`. Enhances data scanning readability.

---

## 3. Mobile-First Layout Configuration

Lumora AI implements a rigid mobile-first viewport layout:

```
┌────────────────────────────────────────┐
│  [Top Bar: Profile & System Alerts]     │
├────────────────────────────────────────┤
│                                        │
│  [Main Viewport Scroll Area]           │
│  - Financial Health Summary Card       │
│  - Weekly Cash Flow Chart              │
│  - Quick Action Forms                  │
│                                        │
├────────────────────────────────────────┤
│  [FAB: Quick-Add Transaction / OCR]    │
├────────────────────────────────────────┤
│  [Bottom Nav Bar]                      │
│  Home  •  Analytics  •  [AI]  •  More  │
└────────────────────────────────────────┘
```

### Mobile Layout Specifications
* **Height:** Lock viewport height to `100dvh` (Dynamic Viewport Height) to prevent double scrolling scrollbar issues on mobile Safari/Chrome.
* **Bottom Navigation:** Float or stick navigation bar within thumb-reach zone. Includes tap feedback animations.
* **Floating Action Button (FAB):** Centralized quick action button to immediately open Receipt Upload or Manual Transaction addition.
* **Touch Targets:** Minimum tap boundary of `48px` x `48px` for all clickable elements.

---

## 4. Chart Aesthetics
Charts are built with **Recharts** and styled dynamically:
* **Gradients:** Areas use soft gradients fading to transparent at the bottom.
* **Tooltips:** Custom HTML glassmorphic tooltips reflecting numbers immediately.
* **Axis Labels:** Clean formatters, showing currency symbol and shortened abbreviations (e.g., "$1.2k" instead of "$1200.00").
