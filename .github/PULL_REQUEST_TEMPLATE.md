## Description

<!-- Briefly describe the changes in this PR -->

## Related Issue

<!-- Link to the issue this PR addresses -->

Closes #

## Type of Change

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] ♿ Accessibility improvement
- [ ] 🔧 Refactoring (no functional changes)

## Changes Made

<!-- List the key changes -->

-

## Screenshots

<!-- If applicable, add screenshots to demonstrate visual changes -->

## Accessibility Checklist

All PRs must meet WCAG 2.1 AA standards. Please verify:

### Semantic HTML
- [ ] Using appropriate HTML elements (`<button>`, `<nav>`, `<main>`, etc.)
- [ ] Heading hierarchy is logical (h1 → h2 → h3)
- [ ] Lists use `<ul>`, `<ol>`, or `<dl>`

### ARIA
- [ ] Interactive elements have accessible names (`aria-label` or visible text)
- [ ] Dynamic content uses `aria-live` regions
- [ ] State changes are announced to screen readers
- [ ] Roles are used where semantic HTML isn't sufficient

### Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order follows logical flow
- [ ] Focus indicators are visible
- [ ] No keyboard traps exist
- [ ] Modals/dialogs trap focus correctly
- [ ] Focus is restored when closing overlays

### Color and Contrast
- [ ] Text contrast meets 4.5:1 (normal) or 3:1 (large)
- [ ] UI component contrast meets 3:1
- [ ] Information is not conveyed by color alone

### Forms
- [ ] All inputs have associated labels
- [ ] Error messages are linked to inputs via `aria-describedby`
- [ ] Required fields use `aria-required`
- [ ] Form validation is announced to screen readers

### Images and Media
- [ ] Images have meaningful alt text
- [ ] Decorative images use `alt=""`
- [ ] Videos have captions
- [ ] Charts/graphs have text alternatives

### Motion
- [ ] Animations respect `prefers-reduced-motion`
- [ ] No content flashes more than 3 times per second

## Testing

### Automated Tests
- [ ] All existing tests pass
- [ ] New tests added for new functionality
- [ ] Accessibility tests added (if applicable)

### Manual Testing
- [ ] Tested with keyboard only
- [ ] Tested with screen reader (if applicable)
- [ ] Tested in high contrast mode
- [ ] Tested with reduced motion

## Additional Notes

<!-- Any other information reviewers should know -->
