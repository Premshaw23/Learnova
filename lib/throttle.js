export function throttle(fn, limit = 200) {
  let inThrottle = false;
  let lastArgs = null;

  return function (...args) {
    lastArgs = args;
    if (inThrottle) return;
    inThrottle = true;
    fn.apply(this, lastArgs);
    setTimeout(() => {
      inThrottle = false;
      if (lastArgs !== args) {
        fn.apply(this, lastArgs);
      }
    }, limit);
  };
}
