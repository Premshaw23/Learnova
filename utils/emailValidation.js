const COMMON_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];

export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function suggestEmailCorrection(email) {
  if (!email.includes("@")) return null;

  const [local, domain] = email.toLowerCase().split("@");
  if (!local || !domain) return null;

  const typoMap = {
    "gmil.com": "gmail.com",
    "gmai.com": "gmail.com",
    "gmail.co": "gmail.com",
    "yaho.com": "yahoo.com",
    "yahoo.co": "yahoo.com",
    "outlok.com": "outlook.com",
    "hotmial.com": "hotmail.com",
  };

  if (typoMap[domain]) {
    return `${local}@${typoMap[domain]}`;
  }

  return null;
}