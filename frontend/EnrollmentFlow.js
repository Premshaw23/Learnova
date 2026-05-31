// Disable course enrollment buttons on submission click
export function useThrottleSubmit(submitFn) {
  let isSubmitting = false;
  return async (...args) => {
    if (isSubmitting) return;
    isSubmitting = true;
    await submitFn(...args);
    isSubmitting = false;
  };
}
