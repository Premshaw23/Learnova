# Timer Cleanup Best Practices

## Overview

This document outlines the best practices for managing timers (setTimeout/setInterval) in the Learnova codebase to prevent memory leaks.

## Problem

Timers that are not properly cleaned up when components unmount can cause memory leaks, leading to:
- Increased memory usage over time
- Unwanted function executions after component unmount
- Potential performance degradation

## Solution

All timers created in `useEffect` hooks must have a cleanup function that clears the timer when the component unmounts.

## Best Practices

### 1. Always Use Cleanup Functions

```javascript
// ✅ CORRECT - With cleanup
useEffect(() => {
  const timer = setTimeout(() => {
    // do something
  }, 1000);
  
  return () => clearTimeout(timer);
}, []);

// ❌ INCORRECT - No cleanup
useEffect(() => {
  setTimeout(() => {
    // do something
  }, 1000);
}, []);
```

### 2. Use Custom Hooks for Common Patterns

The codebase provides custom hooks in `hooks/useTimer.js` for standardized timer management:

#### useTimeout
```javascript
import { useTimeout } from '@/hooks/useTimer';

useTimeout(() => {
  // execute after delay
}, 1000);
```

#### useInterval
```javascript
import { useInterval } from '@/hooks/useTimer';

useInterval(() => {
  // execute every second
}, 1000);
```

### 3. Clear Multiple Timers

When managing multiple timers, clear all of them in the cleanup:

```javascript
useEffect(() => {
  const timer1 = setTimeout(fn1, 1000);
  const timer2 = setTimeout(fn2, 2000);
  const interval = setInterval(fn3, 1000);
  
  return () => {
    clearTimeout(timer1);
    clearTimeout(timer2);
    clearInterval(interval);
  };
}, []);
```

### 4. Use Refs for Timer IDs When Needed

For complex scenarios, use refs to track timer IDs:

```javascript
const timerRef = useRef(null);

useEffect(() => {
  timerRef.current = setTimeout(() => {
    // do something
  }, 1000);
  
  return () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };
}, []);
```

## Current Implementation Status

All timers in the codebase have been verified to have proper cleanup:

### Components with Timer Cleanup
- ✅ `hooks/useIdleTimeout.js` - Clears all timers on unmount
- ✅ `components/TeacherDashboardComponent.js` - Cleans up interval and timeout
- ✅ `components/dashboard/Dashboard.jsx` - Cleans up timeout
- ✅ `components/StudentDashboard.js` - Cleans up interval and timeout
- ✅ `components/InstituteDashboard.js` - Cleans up timeout and interval
- ✅ `app/page.js` - Cleans up scroll/mouse timeouts
- ✅ `components/AchievementSection.jsx` - Cleans up toast timers
- ✅ `components/NoticeSearch.jsx` - Cleans up debounce timeout
- ✅ `components/ProtectedRoute.js` - Cleans up auth timeout
- ✅ `components/ui-block/SplitText.js` - Cleans up animation timeout
- ✅ `contexts/NotificationContext.js` - Cleans up all notification timers
- ✅ `hooks/useDebouncedValue.js` - Uses useTimeout hook with auto-cleanup
- ✅ `app/activity/page.js` - Cleans up counter interval
- ✅ `app/productivity/page.js` - Cleans up timer interval
- ✅ `app/verify/page.js` - Cleans up cooldown interval
- ✅ `components/OfflineIndicator.js` - Cleans up queue check interval

### Timers Without Cleanup (Intentional)
The following timers don't need cleanup because they're not in useEffect:
- Event handlers with one-time delays (ChatBot, InstallPWA, RegisterForm, Timetable, CopyInviteButton)
- Async function delays (productivity page redirect)

These are safe because they execute once and don't persist after the function completes.

## Adding New Timers

When adding new timers to the codebase:

1. **Check if a custom hook exists** - Use `useTimeout` or `useInterval` from `hooks/useTimer.js`
2. **Always add cleanup** - If using native setTimeout/setInterval, add a cleanup function
3. **Document the purpose** - Add comments explaining why the timer is needed
4. **Test unmounting** - Verify the timer clears when navigating away

## ESLint Rules

Consider adding ESLint rules to catch missing timer cleanup:

```json
{
  "rules": {
    "react-hooks/exhaustive-deps": "warn",
    "no-restricted-syntax": [
      "error",
      {
        "selector": "CallExpression[callee.name='setTimeout'][parent.type!='ReturnStatement']",
        "message": "setTimeout must be used in useEffect with cleanup"
      },
      {
        "selector": "CallExpression[callee.name='setInterval'][parent.type!='ReturnStatement']",
        "message": "setInterval must be used in useEffect with cleanup"
      }
    ]
  }
}
```

## References

- React Documentation: [Using the Effect Hook](https://react.dev/reference/react/useEffect)
- React Documentation: [Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)
