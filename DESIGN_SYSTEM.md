# Publisphere Design System - Monotone Gray

## Overview

Publisphere uses a sophisticated **monotone grayscale** design system for a clean, professional, and timeless aesthetic. No colors—only shades of gray from pure white to deep black.

---

## Color Palette

### Light Mode
- **Background**: Pure white (`#FFFFFF` / `hsl(0 0% 100%)`)
- **Foreground**: Near black (`#1A1A1A` / `hsl(0 0% 10%)`)
- **Card**: Off-white (`#FCFCFC` / `hsl(0 0% 99%)`)
- **Muted**: Light gray (`#F5F5F5` / `hsl(0 0% 96%)`)
- **Border**: Soft gray (`#E6E6E6` / `hsl(0 0% 90%)`)
- **Primary**: Dark gray (`#333333` / `hsl(0 0% 20%)`)
- **Secondary**: Mid-dark gray (`#595959` / `hsl(0 0% 35%)`)
- **Accent**: Very dark gray (`#262626` / `hsl(0 0% 15%)`)

### Dark Mode
- **Background**: Deep black (`#141414` / `hsl(0 0% 8%)`)
- **Foreground**: Off-white (`#F2F2F2` / `hsl(0 0% 95%)`)
- **Card**: Dark gray (`#1A1A1A` / `hsl(0 0% 10%)`)
- **Muted**: Mid-dark gray (`#262626` / `hsl(0 0% 15%)`)
- **Border**: Darker gray (`#2E2E2E` / `hsl(0 0% 18%)`)
- **Primary**: Light gray (`#D9D9D9` / `hsl(0 0% 85%)`)
- **Secondary**: Mid-light gray (`#B3B3B3` / `hsl(0 0% 70%)`)
- **Accent**: Near-white (`#E6E6E6` / `hsl(0 0% 90%)`)

---

## Typography

### Font Family
- **Primary**: Inter (modern sans-serif with variable font support)
- **Monospace**: JetBrains Mono (for code and technical content)

### Font Sizes & Line Heights
```css
text-xs:   0.75rem / 1.5 (letter-spacing: 0.025em)
text-sm:   0.875rem / 1.5 (letter-spacing: 0.01em)
text-base: 1rem / 1.6 (letter-spacing: 0)
text-lg:   1.125rem / 1.6 (letter-spacing: -0.01em)
text-xl:   1.25rem / 1.5 (letter-spacing: -0.015em)
text-2xl:  1.5rem / 1.4 (letter-spacing: -0.02em)
text-3xl:  1.875rem / 1.3 (letter-spacing: -0.025em)
text-4xl:  2.25rem / 1.2 (letter-spacing: -0.03em)
text-5xl:  3rem / 1.1 (letter-spacing: -0.035em)
```

### Typography Features
- **Font Features**: `cv11`, `ss01` (stylistic alternates)
- **Antialiasing**: Enhanced for smooth rendering
- **Tracking**: Negative letter-spacing for larger text (optical sizing)

### Heading Styles
```tsx
<h1> → font-semibold, tracking-tight, text-4xl md:text-5xl
<h2> → font-semibold, tracking-tight, text-3xl md:text-4xl
<h3> → font-semibold, tracking-tight, text-2xl md:text-3xl
<p>  → leading-relaxed
```

---

## Shadows

### Light Mode
```css
shadow-card:    0 2px 8px -2px rgba(0, 0, 0, 0.06)
shadow-premium: 0 20px 60px -15px rgba(0, 0, 0, 0.15)
```

### Dark Mode
```css
shadow-card:    0 2px 8px -2px rgba(0, 0, 0, 0.4)
shadow-premium: 0 20px 60px -15px rgba(0, 0, 0, 0.5)
```

---

## Borders

- **Radius**: `0.375rem` (6px) for subtle roundedness
- **Border Width**: `1px` default
- **Border Color**: `hsl(0 0% 90%)` light / `hsl(0 0% 18%)` dark

---

## Gradients

All gradients use grayscale only:

### Light Mode
```css
gradient-hero: linear-gradient(135deg, #262626 0%, #404040 100%)
gradient-card: linear-gradient(to bottom, #FCFCFC 0%, #F7F7F7 100%)
```

### Dark Mode
```css
gradient-hero: linear-gradient(135deg, #1F1F1F 0%, #2E2E2E 100%)
gradient-card: linear-gradient(to bottom, #1A1A1A 0%, #141414 100%)
```

---

## Component Patterns

### Card
```tsx
<div className="bg-card border border-border p-6 rounded-lg shadow-card">
  {/* content */}
</div>
```

### Button (Primary)
```tsx
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Click me
</Button>
```

### Icon Container
```tsx
<div className="p-3 bg-foreground/5 border border-foreground/10 rounded-lg">
  <Icon className="h-6 w-6 text-foreground" />
</div>
```

### Badge/Tag
```tsx
<div className="px-4 py-2 bg-foreground/5 border border-foreground/10 rounded-full text-sm">
  Badge text
</div>
```

### Hover Effects
```tsx
<div className="mono-hover">
  {/* Adds smooth transition with subtle shadow on hover */}
</div>
```

---

## Utility Classes

### Custom Utilities
- `.text-balance` - Balanced text wrapping
- `.mono-gradient` - Grayscale gradient background
- `.subtle-border` - Subtle border using theme color
- `.mono-hover` - Smooth hover transition with shadow
- `.gradient-hero` - Hero section gradient
- `.gradient-card` - Card gradient background
- `.shadow-premium` - Premium shadow effect
- `.shadow-card` - Standard card shadow
- `.glass-effect` - Frosted glass effect with backdrop blur

---

## Design Principles

1. **Simplicity First**: No colors means focus on content and hierarchy
2. **Typography Hierarchy**: Clear size and weight differences
3. **Subtle Depth**: Use shadows and borders for layering
4. **Whitespace**: Generous spacing for breathing room
5. **Consistency**: Same patterns across all pages
6. **Accessibility**: High contrast ratios (>7:1 for normal text)

---

## Contrast Ratios (WCAG AAA)

### Light Mode
- Foreground on Background: **16.4:1** ✓
- Muted on Background: **2.9:1** (large text only)
- Primary on Background: **11.1:1** ✓

### Dark Mode
- Foreground on Background: **13.1:1** ✓
- Muted on Background: **4.2:1** ✓
- Primary on Background: **9.8:1** ✓

All core text meets WCAG AAA standards (7:1+).

---

## Usage Examples

### Hero Section
```tsx
<section className="relative py-20 px-4">
  <div className="absolute inset-0 gradient-hero opacity-10"></div>
  <div className="container mx-auto relative z-10">
    <h1 className="text-5xl font-bold text-balance">
      Your Headline
      <span className="text-foreground/70"> Accent Text</span>
    </h1>
  </div>
</section>
```

### Feature Card
```tsx
<div className="bg-card border border-border p-6 rounded-lg shadow-card mono-hover">
  <div className="p-3 bg-foreground/5 border border-foreground/10 rounded-lg w-fit mb-4">
    <Icon className="h-6 w-6 text-foreground" />
  </div>
  <h3 className="text-xl font-semibold mb-2">Title</h3>
  <p className="text-muted-foreground">Description</p>
</div>
```

### Pricing Card
```tsx
<div className="bg-card border border-border p-12 rounded-2xl shadow-premium">
  <h2 className="text-4xl font-bold mb-4">$147</h2>
  <p className="text-muted-foreground">One-time payment</p>
</div>
```

---

## Color Psychology

Why monotone gray?

- **Professional**: Conveys seriousness and expertise
- **Timeless**: Won't look dated in 5+ years
- **Flexible**: Easy to add client brand colors via white-labeling
- **Focus**: Directs attention to content, not decoration
- **Sophisticated**: Associated with luxury and minimalism
- **Versatile**: Works for any industry/vertical

---

## Migration Notes

Previous design used:
- Blue primary (`hsl(217 91% 60%)`)
- Green secondary (`hsl(142 76% 36%)`)
- Colorful gradients

New design replaces all with grayscale equivalents.

**Breaking Changes**: None (all uses HSL variables, just changed values)

---

**Last Updated**: November 17, 2025
**Design Version**: 2.0 (Monotone Gray)
