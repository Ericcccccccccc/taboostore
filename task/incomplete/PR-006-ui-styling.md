# PR-006: UI Styling & Polish

## Objective
Create a polished, responsive UI with clean styling and smooth interactions.

## Prerequisites
- PR-004 completed (screen components)
- PR-005 completed (game logic working)

## Tasks

### Files to Update

1. **`frontend/src/App.css`** - Enhance global styles
2. **`frontend/src/components/styles.css`** - Polish component styles
3. **`frontend/index.html`** - Add meta tags and favicon
4. **`frontend/public/favicon.ico`** - Add game icon

### Styling Requirements

#### Design System
```css
:root {
  /* Colors */
  --color-primary: #2563eb;     /* Blue */
  --color-success: #16a34a;     /* Green */
  --color-danger: #dc2626;      /* Red */
  --color-warning: #eab308;     /* Yellow */
  --color-neutral: #6b7280;     /* Gray */

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 2rem;

  /* Borders */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
}
```

#### Component Styles

**StartScreen**
- Centered form layout
- Clear input labels
- Styled select dropdowns
- Prominent start button

**GameScreen**
- Timer: Large, bold, top-center
- Word: Extra large font, centered
- Divider: Thick horizontal line
- Forbidden words: Clear bullet list
- Buttons: Full width on mobile, side-by-side on desktop

**EndScreen**
- Score summary card
- Color-coded result list
- Clear action buttons

#### Responsive Breakpoints
```css
/* Mobile first approach */
/* Default: 320px - 767px */

/* Tablet */
@media (min-width: 768px) { }

/* Desktop */
@media (min-width: 1024px) { }
```

### Animations & Transitions

```css
/* Button interactions */
.button {
  transition: all 0.2s ease;
}
.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
.button:active {
  transform: translateY(0);
}

/* Screen transitions */
.screen-enter {
  opacity: 0;
  transform: translateX(20px);
}
.screen-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: all 0.3s ease;
}
```

### Accessibility
- Focus styles for keyboard navigation
- ARIA labels on interactive elements
- Color contrast WCAG AA compliant
- Touch targets minimum 44x44px

### Dark Mode (Optional for MVP)
```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #1f2937;
    --color-text: #f9fafb;
    /* Adjust other colors */
  }
}
```

## Acceptance Criteria
- [ ] Consistent styling across all screens
- [ ] Responsive on mobile (320px+)
- [ ] Buttons have clear hover/active states
- [ ] Timer is prominently displayed
- [ ] Forbidden words clearly separated
- [ ] Smooth transitions between screens
- [ ] No layout shifts during gameplay
- [ ] Touch-friendly on mobile devices

## Visual Requirements
- [ ] Clean, modern aesthetic
- [ ] High contrast for readability
- [ ] Consistent spacing throughout
- [ ] Clear visual hierarchy
- [ ] Professional appearance

## Testing Checklist
- [ ] Test on iPhone SE (375px width)
- [ ] Test on iPad (768px width)
- [ ] Test on desktop (1920px width)
- [ ] Check touch interactions on mobile
- [ ] Verify keyboard navigation works
- [ ] Test with browser zoom 200%

## Notes
- Keep it simple - no complex animations
- Focus on readability and usability
- Ensure fast paint times
- Test on real devices if possible

## Completion Documentation
When complete, move this file to `task/complete/` and add:
- List of all files created/modified
- Screenshots across devices
- Lighthouse scores
- Any browser-specific fixes applied