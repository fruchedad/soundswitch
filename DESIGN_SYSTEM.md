# SoundSwitch Design System

## Overview

The SoundSwitch extension has been redesigned with a modern, minimal approach focusing on clean typography, refined spacing, and subtle micro-interactions. This design system ensures consistency across all UI components while providing an attractive and intuitive user experience.

## Design Principles

### 1. Minimalism
- Clean, uncluttered interfaces
- Essential elements only
- Generous white space
- Reduced visual noise

### 2. Typography-First
- Inter/System fonts for crisp readability
- Consistent type scale
- Proper line heights for optimal reading
- Antialiased text rendering

### 3. Subtle Interactions
- Gentle hover states
- Smooth transitions (150-200ms)
- Scale-based micro-interactions
- Progressive disclosure

### 4. Modern Color Palette
- Blue-based accent colors for trustworthiness
- Neutral grays for text hierarchy
- Semantic colors for status indicators
- Support for dark mode

## Color System

### Primary Colors
```css
--accent-primary: #3b82f6    /* Primary blue */
--accent-secondary: #06b6d4  /* Cyan accent */
```

### Neutral Palette
```css
--text-primary: #0f172a      /* Near black */
--text-secondary: #64748b    /* Medium gray */
--text-tertiary: #94a3b8     /* Light gray */
--bg-primary: #ffffff        /* Pure white */
--bg-secondary: #f8fafc      /* Light gray background */
--border-light: #e2e8f0      /* Subtle borders */
--border-medium: #cbd5e1     /* Medium borders */
```

### Semantic Colors
```css
--success: #10b981           /* Green for success states */
--warning: #f59e0b           /* Amber for warnings */
--error: #ef4444             /* Red for errors */
```

### Dark Mode Support
Automatic dark mode adaptation using `prefers-color-scheme: dark`:
- Inverted backgrounds (dark to light)
- Adjusted text colors for contrast
- Maintained semantic color meanings

## Typography Scale

### Headings
- **Main Title**: 18px, weight 600, tight letter-spacing
- **Section Headers**: 12px, weight 600, uppercase, tracked

### Body Text
- **Primary**: 14px, weight 400, 1.5 line-height
- **Secondary**: 13px, weight 400
- **Small**: 12px, weight 500
- **Micro**: 11px, weight 500

## Spacing System

Based on 4px grid system:
- **xs**: 4px
- **sm**: 8px  
- **md**: 12px
- **lg**: 16px
- **xl**: 20px
- **2xl**: 24px

## Border Radius

Consistent rounding for modern feel:
- **sm**: 6px (checkboxes, small elements)
- **md**: 8px (buttons, cards)  
- **lg**: 12px (containers, panels)
- **xl**: 16px (floating elements)

## Component Guidelines

### Cards & Containers
- White backgrounds with subtle borders
- Light shadows for elevation
- Generous internal padding (16-20px)
- Rounded corners (8-12px)

### Buttons
- **Primary**: Gradient backgrounds, white text
- **Secondary**: White background, subtle borders
- **Interactive States**: Scale transforms (98-97%)
- **Hover**: Background color shifts
- **Focus**: Blue outline rings

### Form Elements
- Custom checkbox styling
- Consistent 16px height for inputs
- Blue accent colors when active
- Subtle border styling

### Account Items
- Clean list styling
- Avatar + text layout
- Active states with left border accent
- Hover actions with opacity transitions

## Animation Guidelines

### Timing
- **Fast**: 150ms (hover states, small changes)
- **Medium**: 200ms (button interactions)
- **Slow**: 300ms (page transitions, complex animations)

### Easing
- `ease` for most interactions
- `ease-in-out` for longer animations
- Linear for loading spinners

### Micro-interactions
- Scale down on active states (0.97-0.98)
- Translate up on hover (-1 to -2px)
- Opacity changes for secondary states

## Accessibility Features

### Keyboard Navigation
- Focus-visible outlines
- Tab order preservation
- ARIA labels and roles
- Screen reader support

### Reduced Motion
- Respects `prefers-reduced-motion: reduce`
- Minimal animation alternatives
- Instant transitions when requested

### Color Contrast
- WCAG AA compliant contrast ratios
- Semantic color usage
- Dark mode optimization

## Layout Patterns

### Popup Container
- 360px fixed width
- 480px minimum height
- Flex column layout
- Elevated card appearance

### Section Spacing
- 20px between sections
- 12px header to content spacing
- Progressive disclosure for complex features

### Content Hierarchy
- Clear visual separation
- Consistent spacing patterns
- Logical reading flow

## Implementation Notes

### CSS Variables
All colors, spacing, and sizing use CSS custom properties for easy theming and maintenance.

### Browser Support
- Modern evergreen browsers
- CSS Grid and Flexbox
- CSS custom properties
- Backdrop-filter support

### Performance
- Minimal CSS bundle size
- Efficient animations
- Optimized for extension environment

## Future Considerations

### Extensibility
- Design system ready for new components
- Consistent patterns established
- Theme-ready architecture

### Responsive Design
- Mobile-first approach if needed
- Flexible component sizing
- Adaptive spacing

### Component Library
- Reusable component patterns
- Documented interaction states
- Consistent API design

---

This design system provides a solid foundation for a modern, accessible, and maintainable user interface that users will find both attractive and intuitive to use.