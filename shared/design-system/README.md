# SYMBI Design System

A comprehensive design system for the SYMBI ecosystem, providing consistent UI components, themes, and patterns across all applications.

## Overview

The SYMBI Design System ensures visual and functional consistency across SYMBI-Resonate, SYMBI-Symphony, and SYMBI-Vault. It includes:

- **Theme Configuration**: Colors, typography, spacing, and other design tokens
- **Component Library**: Reusable React components
- **Hooks**: Custom React hooks for common functionality
- **Utilities**: Helper functions for styling and layout

## Installation

```bash
npm install @symbi/design-system
```

## Usage

### Theme

```typescript
import { symbiTheme } from '@symbi/design-system/theme';

// Access theme values
const primaryColor = symbiTheme.colors.primary[500];
const baseFontSize = symbiTheme.typography.fontSize.base;
const mediumSpacing = symbiTheme.spacing[4];
```

### CSS Variables

```typescript
import { generateCssVariables } from '@symbi/design-system/theme';

// Generate CSS custom properties
const cssVars = generateCssVariables(symbiTheme);
```

## Theme Structure

### Colors

- **Primary**: Main brand color (indigo)
- **Secondary**: Supporting brand color (purple)
- **Accent**: Highlight color (cyan)
- **Neutral**: Grayscale colors
- **Semantic**: Success, warning, error, info

### Typography

- **Font Family**: Inter (sans-serif), Fira Code (monospace)
- **Font Sizes**: xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl
- **Font Weights**: light, normal, medium, semibold, bold
- **Line Heights**: tight, normal, relaxed

### Spacing

Consistent spacing scale from 0 to 24 (0px to 96px)

### Border Radius

- none, sm, base, md, lg, xl, 2xl, full

### Shadows

- sm, base, md, lg, xl, 2xl, inner

### Breakpoints

- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Storybook

```bash
npm run storybook
```

## Contributing

Please follow the SYMBI contribution guidelines when adding new components or modifying the design system.