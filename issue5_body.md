## Description

Learnova has 237 components across the codebase, but there is no systematic accessibility (a11y) audit or WCAG 2.1 AA compliance strategy. A quick scan reveals missing ARIA labels, insufficient color contrast, lack of keyboard navigation support, and no screen reader testing. This affects students with disabilities who represent a significant portion of the education platform's potential users.

## Why This Is Important

- **Legal compliance**: Educational platforms must comply with Section 508 and WCAG 2.1 AA standards
- **User base**: Students with visual, motor, or cognitive disabilities need accessible interfaces
- **SEO benefits**: Accessible markup improves search engine indexing and discoverability
- **Brand reputation**: Accessibility issues can lead to negative press and legal challenges

## Proposed Implementation

### 1. Accessibility Testing Infrastructure
- Add `jest-axe` for automated axe-core testing in component tests
- Add `@axe-core/react` for runtime accessibility checking in development
- Create `tests/accessibility/` directory with comprehensive a11y test suites
- Add Playwright accessibility snapshots for E2E tests

### 2. ARIA and Semantic HTML Audit
- Audit all 237 components for missing ARIA labels, roles, and states
- Add `aria-label`, `aria-labelledby`, `aria-describedby` where needed
- Replace non-semantic elements with proper HTML5 semantic elements
- Ensure all interactive elements have visible focus indicators

### 3. Keyboard Navigation
- Implement logical tab order across all forms and interactive components
- Add keyboard shortcuts for power users (Ctrl+K for command palette, etc.)
- Ensure all modals, dropdowns, and dialogs are fully keyboard-navigable
- Add skip-to-content links and landmark regions
- Test and fix keyboard traps in complex components (calendar, whiteboard, chatbot)

### 4. Color and Contrast
- Audit all color combinations for WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text)
- Add high-contrast mode toggle in settings
- Ensure information is not conveyed by color alone (add icons, patterns, or text labels)
- Update the theme system to include accessible color palettes

### 5. Screen Reader Support
- Add live regions (`aria-live`) for dynamic content updates (notifications, attendance status, quiz results)
- Ensure all charts and graphs have text alternatives
- Add meaningful alt text for all images (especially face recognition placeholders)
- Test with NVDA, VoiceOver, and JAWS screen readers

### 6. Specific Component Fixes
- **AttendanceCalendar.jsx**: Add keyboard navigation for date picker
- **AttendanceChart.js**: Add screen reader data table alternative
- **AttendanceHeatmap.jsx**: Add text description for color-coded heatmap
- **ChatBot.js**: Ensure chat history is accessible to screen readers
- **CommandPalette.js**: Fix keyboard trap and add ARIA combobox pattern
- **LearnovaChatbot.jsx**: Add live region for streaming responses
- **MotivationCard.js**: Add proper heading hierarchy
- **SearchModal.js**: Implement ARIA dialog pattern
- **ShortcutsModal.js**: Fix macOS shortcut rendering for screen readers
- **VideoPlayer.jsx**: Add captions controls and keyboard shortcuts
- **VirtualWhiteboard.jsx**: Add alternative text description for drawings
- **VolumetricPlanner.jsx**: Ensure 3D content has 2D fallback

### 7. Focus Management
- Implement focus trapping in modals and dialogs
- Add focus restoration when closing overlays
- Implement `prefers-reduced-motion` media query support
- Add `prefers-color-scheme` support for automatic dark/light mode

### 8. Documentation
- Create `docs/accessibility.md` with guidelines for contributors
- Add accessibility checklist to PR template
- Create component-level a11y documentation

## Files to Modify/Create
- `tests/accessibility/axe-audit.test.js` - Global axe audit
- `tests/accessibility/keyboard-navigation.test.js` - Keyboard tests
- `tests/accessibility/screen-reader.test.js` - Screen reader tests
- `lib/a11y.js` - Accessibility utilities
- `components/focus/FocusTrap.jsx` - Focus trap component
- `components/focus/SkipLink.jsx` - Skip navigation component
- `components/accessibility/HighContrastToggle.jsx` - Contrast mode toggle
- `components/accessibility/ReducedMotionToggle.jsx` - Motion preferences
- Update all 237 components with ARIA attributes
- Update all chart/graph components with text alternatives
- Update `docs/accessibility.md` - Contributor guidelines
- Update `.github/PULL_REQUEST_TEMPLATE.md` - Add a11y checklist

## Expected Impact

- **Compliance**: WCAG 2.1 AA certification readiness
- **Inclusivity**: Platform usable by students with disabilities
- **Quality**: Better semantic HTML improves SEO and maintainability
- **Developer Knowledge**: Team learns accessibility best practices
