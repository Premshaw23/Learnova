# Dark Mode Quick Start - Learnova

## 🚀 Quick Integration (5 Minutes)

### Step 1: Update app/layout.js

```javascript
// BEFORE
import { ThemeProvider } from "@/components/ThemeProvider";

// AFTER
import { ThemeProvider } from "@/contexts/ThemeContext";
```

That's it! Your app now has dark mode context.

### Step 2: Add Theme Toggle to Navbar

Open `components/Navbar.js` and add this import:

```javascript
import ThemeToggle from "@/components/ThemeToggle";
import { useThemeContext } from "@/contexts/ThemeContext";
```

Then add this in your navbar return JSX (before the closing nav tag):

```javascript
const { mounted } = useThemeContext();

return (
  <nav className="...">
    {/* Your existing navbar content */}

    {/* Add this at the end, right before closing nav */}
    {mounted && (
      <div className="flex items-center gap-3 ml-auto">
        <ThemeToggle />
      </div>
    )}
  </nav>
);
```

### Step 3: Update One Component

Pick any component (e.g., cards, dashboard) and add dark mode classes:

```javascript
// BEFORE
<div className="bg-white rounded-lg p-6 shadow-md">
  Content
</div>

// AFTER
<div className="
  bg-white dark:bg-slate-800
  rounded-lg p-6
  shadow-md dark:shadow-lg
  transition-colors duration-300
">
  Content
</div>
```

### Step 4: Test!

```bash
npm run dev
```

Open http://localhost:3000 and click the theme toggle button in the navbar.

---

## 🎨 Common Dark Mode Patterns

### Pattern 1: Cards
```javascript
<div className="
  bg-white dark:bg-slate-800
  border border-gray-200 dark:border-slate-700
  rounded-lg p-6
  shadow-md dark:shadow-lg
  transition-all duration-300
">
  Card content
</div>
```

### Pattern 2: Text
```javascript
<p className="
  text-gray-700 dark:text-gray-300
  transition-colors duration-300
">
  Text content
</p>
```

### Pattern 3: Buttons
```javascript
<button className="
  bg-purple-600 hover:bg-purple-700
  dark:bg-purple-600 dark:hover:bg-purple-500
  text-white
  transition-colors duration-300
">
  Button
</button>
```

### Pattern 4: Forms
```javascript
<input
  type="text"
  className="
    bg-white dark:bg-slate-800
    border border-gray-300 dark:border-slate-600
    text-gray-900 dark:text-white
    placeholder-gray-500 dark:placeholder-gray-400
    rounded-lg px-4 py-2
    focus:outline-none focus:ring-2 focus:ring-purple-500
    transition-colors duration-300
  "
  placeholder="Enter text..."
/>
```

### Pattern 5: Sections
```javascript
<section className="
  bg-gray-50 dark:bg-slate-950
  py-8 px-4
  transition-colors duration-300
">
  <h2 className="text-gray-900 dark:text-white">
    Section Title
  </h2>
</section>
```

---

## 📚 Using the Theme Hook

```javascript
"use client";

import { useThemeContext } from "@/contexts/ThemeContext";

export default function MyComponent() {
  const { theme, isDark, mounted, toggleTheme } = useThemeContext();

  if (!mounted) return null;

  return (
    <div>
      <p>Theme: {theme}</p>
      <p>Dark mode: {isDark ? "ON" : "OFF"}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

---

## 🔧 Updating Key Components

### StudentDashboard

Add to the main wrapper:

```javascript
<div className="
  min-h-screen
  bg-gray-50 dark:bg-slate-950
  transition-colors duration-300
">
```

Add to each card:

```javascript
className="
  bg-white dark:bg-slate-800
  border border-gray-200 dark:border-slate-700
  rounded-lg p-6
  shadow-sm dark:shadow-md
  hover:shadow-md dark:hover:shadow-lg
  transition-all duration-300
"
```

### Navbar

```javascript
<nav className="
  bg-white dark:bg-slate-900
  border-b border-gray-200 dark:border-slate-800
  transition-colors duration-300
">
  {/* content */}
</nav>
```

### Forms

```javascript
<form className="
  bg-white dark:bg-slate-800
  p-6 rounded-lg
  border border-gray-200 dark:border-slate-700
  transition-colors duration-300
">
```

### Tables

```javascript
<table className="
  bg-white dark:bg-slate-800
  border border-gray-200 dark:border-slate-700
">
  <thead className="
    bg-gray-50 dark:bg-slate-900
    border-b border-gray-200 dark:border-slate-700
  ">
```

---

## ✨ Pro Tips

1. **Always add transitions:**
   ```css
   transition-colors duration-300
   ```

2. **Use the dark: prefix:**
   ```css
   bg-white dark:bg-slate-800
   ```

3. **Check mounted state:**
   ```javascript
   const { mounted } = useThemeContext();
   if (!mounted) return null;
   ```

4. **Import from right place:**
   ```javascript
   // Correct
   import { useThemeContext } from "@/contexts/ThemeContext";
   
   // Wrong
   import { useTheme } from "next-themes"; // This is fine too, but useThemeContext is better
   ```

5. **Test both modes:**
   - Click the toggle button
   - Check system settings theme detection
   - Verify localStorage persistence

---

## 🎯 Integration Checklist

- [ ] Updated `app/layout.js` with new ThemeProvider
- [ ] Added ThemeToggle to Navbar
- [ ] Added dark mode classes to 5+ components
- [ ] Tested theme toggle functionality
- [ ] Verified localStorage persistence
- [ ] Checked all colors are readable in both themes
- [ ] Ran `npm run build` successfully
- [ ] Tested on mobile device
- [ ] No console errors or warnings

---

## 🐛 Common Issues & Fixes

### Issue: "useThemeContext must be used within a ThemeProvider"
**Fix:** Make sure `app/layout.js` has ThemeProvider wrapping all children

### Issue: Theme toggles but styles don't change
**Fix:** Make sure you added `dark:` classes to your components

### Issue: Hydration mismatch warning
**Fix:** Check `mounted` state before rendering theme-dependent UI

### Issue: Theme doesn't persist after refresh
**Fix:** Check browser console for localStorage errors

---

## 📱 Testing Checklist

- [ ] Light mode looks good
- [ ] Dark mode looks good
- [ ] Toggle button works
- [ ] Theme persists after page reload
- [ ] System theme detection works
- [ ] Mobile responsive in both themes
- [ ] Text readable (good contrast)
- [ ] Images/logos visible in both themes
- [ ] No broken styles
- [ ] Animations smooth

---

**That's it! You now have a working dark mode system. Happy coding! 🚀**
