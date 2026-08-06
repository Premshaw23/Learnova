# ♿ Accessibility Guidelines (WCAG 2.1 AA)

This document provides guidelines for maintaining accessibility in Learnova. All contributors must follow these standards to ensure the platform is usable by everyone, including students with disabilities.

## Quick Reference

### ✅ Required for Every Component

1. **Semantic HTML** – Use appropriate HTML elements (`<button>`, `<nav>`, `<main>`, `<h1>`-`<h6>`)
2. **ARIA Labels** – Add `aria-label` or `aria-labelledby` to elements without visible text
3. **Keyboard Navigation** – All interactive elements must be keyboard accessible
4. **Focus Indicators** – Visible focus styles for keyboard users
5. **Alt Text** – Meaningful descriptions for all images
6. **Color Contrast** – Minimum 4.5:1 ratio for normal text, 3:1 for large text

### 🚫 Common Mistakes

- Using `<div onClick>` instead of `<button onClick>`
- Missing `alt` attributes on images
- Using color alone to convey information
- Not providing labels for form inputs
- Keyboard traps in modals/dialogs

## Testing Checklist

Before submitting a PR, verify:

- [ ] All interactive elements are keyboard accessible
- [ ] Form inputs have associated labels
- [ ] Images have meaningful alt text
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Modals trap focus correctly
- [ ] Screen reader can read all important content
- [ ] No keyboard traps exist
- [ ] `prefers-reduced-motion` is respected

## ARIA Patterns

### Buttons
```jsx
// ✅ Good
<button onClick={handleClick} aria-label="Close dialog">
  <CloseIcon />
</button>

// ❌ Bad
<div onClick={handleClick} className="button">
  <CloseIcon />
</div>
```

### Modals
```jsx
// ✅ Good
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Confirm Action</h2>
  <button onClick={onClose} aria-label="Close">✕</button>
</div>
```

### Forms
```jsx
// ✅ Good
<label htmlFor="email">Email address</label>
<input id="email" type="email" aria-required="true" aria-invalid={hasError} />
{hasError && <span role="alert">Invalid email</span>}

// ❌ Bad
<input type="email" placeholder="Email" />
```

### Live Regions
```jsx
// ✅ Good - for dynamic updates
<div aria-live="polite" aria-atomic="true">
  {notification}
</div>

// ✅ Good - for urgent alerts
<div role="alert">
  {errorMessage}
</div>
```

## Focus Management

### Focus Trap (Modals)
```jsx
import FocusTrap from '@/components/focus/FocusTrap';

<FocusTrap isActive={isOpen} onEscape={handleClose}>
  <ModalContent />
</FocusTrap>
```

### Skip Links
```jsx
import SkipLink from '@/components/focus/SkipLink';

// Place at the top of the layout
<SkipLink />
<main id="main-content">...</main>
```

### Focus Restoration
```jsx
import { saveFocus, focusFirst } from '@/lib/a11y';

// Save focus when opening a modal
const restoreFocus = saveFocus();
openModal();

// Restore focus when closing
closeModal();
restoreFocus();
```

## Color and Contrast

### Minimum Requirements
| Element | Normal Text | Large Text |
|---------|------------|------------|
| Body text | 4.5:1 | 3:1 |
| UI components | 3:1 | 3:1 |
| Focus indicators | 3:1 | 3:1 |

### Tools
- Use `checkContrast()` from `lib/a11y.js` to verify contrast ratios
- Chrome DevTools > Rendering > Emulate vision deficiencies
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

## Keyboard Navigation

### Required Shortcuts
| Shortcut | Action |
|----------|--------|
| `Tab` | Move to next focusable element |
| `Shift+Tab` | Move to previous focusable element |
| `Enter` / `Space` | Activate button/link |
| `Escape` | Close modal/dropdown |
| `Arrow keys` | Navigate within lists/menus |

### Tab Order
- Follows DOM order
- Use `tabIndex={0}` to add to tab order
- Use `tabIndex={-1}` to remove from tab order
- Never use `tabIndex` greater than 0

## Screen Reader Support

### Live Regions
```jsx
// Announce dynamic content changes
<div aria-live="polite">{statusMessage}</div>

// Announce urgent messages
<div role="alert">{errorMessage}</div>
```

### Hidden Content
```jsx
// Visually hidden but available to screen readers
<span className="sr-only">Loading...</span>
```

### Meaningful Text
```jsx
// ✅ Good
<a href="/profile">
  <Avatar />
  <span className="sr-only">View profile</span>
</a>

// ❌ Bad
<a href="/profile">
  <Avatar />
</a>
```

## Component Accessibility

### SearchModal
- Role: `dialog`
- `aria-modal="true"`
- `aria-label="Search"`
- Focus trap when open
- Escape to close

### CommandPalette
- Role: `combobox`
- `aria-expanded`
- `aria-activedescendant`
- Arrow key navigation
- Escape to close

### ChatBot
- `aria-live="polite"` for new messages
- `role="log"` for chat history
- Input labeled with `aria-label`

### VideoPlayer
- Controls keyboard accessible
- Captions toggle with `aria-pressed`
- Volume slider with `aria-valuenow`

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apd/)
- [WebAIM](https://webaim.org/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)

## Reporting Issues

If you find an accessibility issue, please:
1. Create an issue with the `accessibility` label
2. Include the WCAG criterion violated
3. Provide steps to reproduce
4. Include screenshots if applicable
