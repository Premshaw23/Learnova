// Registration password strength validation regex
export function isStrongPassword(pwd) {
  const rules = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return rules.test(pwd);
}
