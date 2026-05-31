// Masked passcode state handler
export function maskCode(code) {
  return '*'.repeat(code.length);
}
