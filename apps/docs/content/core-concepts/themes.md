---
title: Themes & Design Playground
description: Design tokens, 70+ Google Fonts, button shapes, and visual theming.
order: 5
---

## Theme Model

Themes define the visual identity of a site through design tokens. Each site can have multiple themes with one active at a time.

### Theme Properties

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Theme name |
| `baseTheme` | string | Preset: `netrun-dark`, `kog`, `intirkon`, `minimal`, `frost` |
| `isActive` | boolean | Whether this is the active theme |
| `tokens` | object | Design tokens (colors, typography, spacing, effects) |
| `customCss` | string | Additional custom CSS |

### Token Structure

```json
{
  "tokens": {
    "colors": {
      "primary": "#90b9ab",
      "secondary": "#c084fc",
      "background": "#0a0a0a",
      "foreground": "#e5e5e5"
    },
    "typography": {
      "headingFont": "Futura",
      "bodyFont": "Inter",
      "baseSize": 16,
      "headingWeight": 700
    },
    "spacing": {
      "sectionPadding": "80px",
      "blockGap": "24px"
    },
    "effects": {
      "borderRadius": "8px",
      "shadow": "0 4px 12px rgba(0,0,0,0.15)",
      "glassBlur": "12px"
    }
  }
}
```

## Theme API

All routes are under `/api/v1/sites/:siteId/themes`.

### List themes

```
GET /api/v1/sites/:siteId/themes
```

Query params: `page`, `limit`, `baseTheme`, `isActive`.

### Get active theme

```
GET /api/v1/sites/:siteId/themes/active
```

### Create a theme

```
POST /api/v1/sites/:siteId/themes
```

### Activate a theme

```
POST /api/v1/sites/:siteId/themes/:id/activate
```

Deactivates all other themes for this site.

### Duplicate a theme

```
POST /api/v1/sites/:siteId/themes/:id/duplicate
```

```json
{ "name": "My Theme Copy" }
```

### Public theme

Consumer sites fetch the active theme without authentication:

```
GET /api/v1/public/sites/:siteSlug/theme
```

## Design Playground

The admin panel includes a visual Design Playground with:

- **70+ Google Fonts** -- searchable font browser
- **Custom font upload** -- `.woff2`, `.ttf`, `.otf` files
- **Button shapes** -- rounded, pill, square, with size variants
- **Spacing controls** -- section padding, block gaps
- **Shadow presets** -- subtle, medium, dramatic
- **Glass effects** -- backdrop blur with opacity

## Theme Presets

| Preset | Description |
|--------|-------------|
| `netrun-dark` | Dark theme with sage green accents (#90b9ab) |
| `kog` | KOG CRM brand theme |
| `intirkon` | Intirkon BI platform theme |
| `minimal` | Clean, light theme with minimal styling |
| `frost` | Frost reference implementation theme |

The `ThemeProvider` React context from `@netrun-cms/theme` applies tokens as CSS variables.
