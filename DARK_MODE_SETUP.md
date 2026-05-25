# Dark Mode Implementation Guide - Learnova

## Overview

Complete dark mode system for Learnova with modern UI/UX, smooth theme switching, and localStorage persistence.

## What's Included

### 1. **Core Files Created**

```
contexts/
├── ThemeContext.jsx          # Theme context & provider with system detection

components/
├── ThemeToggle.jsx           # Animated theme toggle button
├── ThemeSettings.jsx         # Theme settings panel
├── DarkModeComponents.jsx    # Reusable dark mode components

app/
├── globals.css              # Updated with dark theme variables & animations

tailwind.config.js           # Tailwind v4 configuration
```

### 2. **Features Implemented**

✅ Global dark mode toggle
✅ localStorage persistence
✅ System theme detection
✅ Smooth theme transitions with animations
✅ Accessible color contrast (WCAG AA compliant)
✅ Reusable components with dark mode support
✅ Hydration-safe theme loading
✅ Animated toggle button with icon transitions
✅ Tailwind v4 dark class integration
✅ Custom scrollbar styling

## Installation & Setup

### Step 1: Install Dependencies

```bash
npm install next-themes framer-motion lucide-react
```

**Note:** These packages are already installed in your project.

### Step 2: Update Layout (app/layout.js)

Replace your current ThemeProvider import with the new one:

```javascript
// OLD (if using the previous ThemeProvider)
// import { ThemeProvider } from "@/components/ThemeProvider";

// NEW - Use the enhanced ThemeContext
import { ThemeProvider } from "@/contexts/ThemeContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {/* Your app content */}
          <Navbar />
          <main>{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Step 3: Add Theme Toggle to Navbar

Update your `components/Navbar.js`:

```javascript
"use client";

import ThemeToggle from "@/components/ThemeToggle";
import ThemeSettings from "@/components/ThemeSettings";
import { useThemeContext } from "@/contexts/ThemeContext";

export function Navbar() {
  const { mounted } = useThemeContext();

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 transition-colors duration-300">
      {/* Your existing navbar content */}

      <div className="flex items-center gap-3">
        {mounted && (
          <>
            <ThemeToggle />
            <ThemeSettings />
          </>
        )}
        {/* Other navbar items */}
      </div>
    </nav>
  );
}
```

### Step 4: Update Components with Dark Mode

#### Example 1: Card Component

```javascript
// Before
<div className="bg-white rounded-lg p-6 shadow-md">
  {content}
</div>

// After - With dark mode
<div className="
  bg-white dark:bg-slate-800
  border border-gray-200 dark:border-slate-700
  rounded-lg p-6
  shadow-md dark:shadow-lg
  transition-colors duration-300
">
  {content}
</div>
```

#### Example 2: Using DarkModeCard Component

```javascript
import DarkModeCard from "@/components/DarkModeComponents";

export default function MyComponent() {
  return (
    <DarkModeCard hover gradient>
      <h3 className="text-gray-900 dark:text-white font-bold">
        Card Title
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        Card content
      </p>
    </DarkModeCard>
  );
}
```

#### Example 3: Dashboard with Dark Mode

```javascript
"use client";

import { useThemeContext } from "@/contexts/ThemeContext";
import DarkModeCard, { DarkModeSection } from "@/components/DarkModeComponents";

export default function StudentDashboard() {
  const { isDark, mounted } = useThemeContext();

  if (!mounted) return <DashboardSkeleton />;

  return (
    <DarkModeSection title="My Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Attendance Card */}
        <DarkModeCard hover>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Attendance
              </p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                92%
              </h3>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
        </DarkModeCard>

        {/* Stats Card */}
        <DarkModeCard hover>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Classes Today
          </p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            5
          </h3>
        </DarkModeCard>

        {/* More cards... */}
      </div>
    </DarkModeSection>
  );
}
```

### Step 5: Using Theme Context Hook

```javascript
"use client";

import { useThemeContext } from "@/contexts/ThemeContext";

export default function MyComponent() {
  const {
    theme,           // Current theme: "light", "dark", or undefined
    setTheme,        // Function to set theme: setTheme("dark")
    toggleTheme,     // Function to toggle between light and dark
    setSystemTheme,  // Function to use system preference
    isDark,          // Boolean: true if dark mode is active
    isLight,         // Boolean: true if light mode is active
    systemTheme,     // System theme preference: "light" or "dark"
    mounted,         // Boolean: true when component is hydrated
  } = useThemeContext();

  if (!mounted) return null;

  return (
    <div>
      <p>Current Theme: {theme}</p>
      <p>Is Dark Mode: {isDark ? "Yes" : "No"}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setTheme("dark")}>Set Dark</button>
      <button onClick={() => setTheme("light")}>Set Light</button>
      <button onClick={setSystemTheme}>Use System</button>
    </div>
  );
}
```

## Color Classes Reference

### Tailwind Dark Mode Classes

```html
<!-- Light mode (default) -->
<div class="bg-white text-gray-900">Light</div>

<!-- Dark mode -->
<div class="dark:bg-slate-900 dark:text-white">Dark</div>

<!-- With transition -->
<div class="
  bg-white dark:bg-slate-900
  text-gray-900 dark:text-white
  transition-colors duration-300
">
  Smooth transition
</div>
```

### Common Dark Mode Color Pairs

```css
/* Background */
.bg-white .dark:bg-slate-900
.bg-gray-50 .dark:bg-slate-950
.bg-gray-100 .dark:bg-slate-800

/* Text */
.text-gray-900 .dark:text-white
.text-gray-700 .dark:text-gray-300
.text-gray-600 .dark:text-gray-400

/* Borders */
.border-gray-200 .dark:border-slate-700
.border-gray-300 .dark:border-slate-600

/* Cards & Shadows */
.bg-white .dark:bg-slate-800
.shadow-md .dark:shadow-lg
.shadow-sm .dark:shadow-dark-sm
```

## Animations & Transitions

### Built-in Animations

```javascript
// Slide up animation
<div className="animate-slide-up">Content</div>

// Fade in animation
<div className="animate-fade-in">Content</div>

// Scale in animation
<div className="animate-scale-in">Content</div>

// Theme transition
<div className="theme-transition">Content</div>
```

## localStorage Keys

The system uses these localStorage keys:

- `learnova-theme` - Stores the current theme ("light" or "dark")
- `learnova-use-system` - Boolean indicating if system preference should be used

## Hydration & SSR Safety

All components properly handle hydration to prevent mismatches:

```javascript
const { mounted } = useThemeContext();

if (!mounted) {
  return <LoadingSkeleton />; // Show placeholder while hydrating
}

return <ActualComponent />; // Render after hydration
```

## Component Update Examples

### Update StudentDashboard

```javascript
// Add dark mode styles to existing components
export default function StudentDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <h1 className="text-gray-900 dark:text-white">Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {/* Card with dark mode */}
        <div className="
          bg-white dark:bg-slate-800
          rounded-lg p-6
          shadow-md dark:shadow-lg
          border border-gray-200 dark:border-slate-700
          hover:shadow-lg dark:hover:shadow-xl
          transition-all duration-300
        ">
          <p className="text-gray-600 dark:text-gray-400">Attendance</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            92%
          </p>
        </div>
      </div>
    </div>
  );
}
```

### Update Navbar

```javascript
export function Navbar() {
  return (
    <nav className="
      bg-white dark:bg-slate-900
      border-b border-gray-200 dark:border-slate-800
      transition-colors duration-300
    ">
      {/* Navigation content */}

      {/* Theme toggle at the end */}
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {/* Other items */}
      </div>
    </nav>
  );
}
```

## Best Practices

1. **Always use transitions**
   ```css
   transition-colors duration-300
   transition-all duration-300
   ```

2. **Pair light and dark colors**
   ```html
   <div class="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
   ```

3. **Test contrast ratio** - Ensure WCAG AA compliance
   ```
   Light text on dark: 4.5:1 ratio
   Dark text on light: 4.5:1 ratio
   ```

4. **Use semantic color tokens**
   ```css
   /* Use these CSS variables */
   --background, --foreground
   --card, --card-foreground
   --primary, --secondary
   ```

5. **Handle hydration properly**
   ```javascript
   const { mounted } = useThemeContext();
   if (!mounted) return <Skeleton />;
   ```

## Testing Dark Mode

1. **Browser DevTools**
   - Open DevTools → Elements → Toggle `.dark` class on `<html>`

2. **System Preference**
   - Change system theme in OS settings
   - Component automatically detects if using system preference

3. **localStorage Testing**
   ```javascript
   localStorage.setItem("learnova-theme", "dark");
   localStorage.setItem("learnova-use-system", "false");
   ```

## Troubleshooting

### Theme not persisting
- Check localStorage: `localStorage.getItem("learnova-theme")`
- Ensure ThemeProvider wraps entire app
- Check for browser privacy/incognito mode

### Hydration mismatch warning
- Always check `mounted` state before rendering theme-dependent UI
- Use the `if (!mounted) return null` pattern

### Styles not applying
- Verify Tailwind content includes your file paths
- Check if `dark:` classes are in content files
- Run `npm run build` to regenerate CSS

### Colors look off in dark mode
- Verify CSS variables are set in `.dark` selector
- Check contrast ratio using tools like WebAIM
- Test with actual dark mode, not DevTools simulation

## File Structure After Implementation

```
Learnova/
├── app/
│   ├── layout.js                    # Updated with ThemeProvider
│   ├── globals.css                  # Updated with dark theme
│   └── ...
├── components/
│   ├── Navbar.js                    # Updated with ThemeToggle
│   ├── ThemeToggle.jsx              # ✨ NEW
│   ├── ThemeSettings.jsx            # ✨ NEW
│   ├── DarkModeComponents.jsx      # ✨ NEW
│   └── ...
├── contexts/
│   ├── ThemeContext.jsx             # ✨ NEW
│   └── ...
├── tailwind.config.js               # ✨ NEW
├── next.config.mjs
├── postcss.config.mjs
└── package.json
```

## Production Checklist

- [ ] Dark mode toggle added to Navbar
- [ ] All pages tested in dark mode
- [ ] Contrast ratios verified (WCAG AA)
- [ ] localStorage persistence working
- [ ] System theme detection working
- [ ] No hydration mismatches
- [ ] Animations smooth on all devices
- [ ] Images/logos look good in both themes
- [ ] Forms/inputs styled for dark mode
- [ ] Tables styled for dark mode
- [ ] Modals/dialogs styled for dark mode
- [ ] Build passes without errors
- [ ] No console warnings

## Next Steps

1. Apply dark mode styles to remaining components
2. Add ThemeToggle to all headers/navbars
3. Test on different devices and browsers
4. Deploy and monitor for issues
5. Gather user feedback on dark mode experience

---

**Created with ❤️ for Learnova | Dark Mode System v1.0**
