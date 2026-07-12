import { resolve4, resolve6 } from "dns/promises";

const ALLOWED_PORTS = new Set([80, 443]);

const PRIVATE_IPV4_RANGES = [
  { start: "10.0.0.0", end: "10.255.255.255" },
  { start: "100.64.0.0", end: "100.127.255.255" },
  { start: "127.0.0.0", end: "127.255.255.255" },
  { start: "169.254.0.0", end: "169.254.255.255" },
  { start: "172.16.0.0", end: "172.31.255.255" },
  { start: "192.168.0.0", end: "192.168.255.255" },
  { start: "198.18.0.0", end: "198.19.255.255" },
];

const BLOCKED_HOSTNAMES = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "::",
  "metadata.google.internal",
  "instance-data",
  "169.254.169.254",
];

function ipToNumber(ip) {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isIPv4InPrivateRange(ip) {
  const ipNum = ipToNumber(ip);
  for (const range of PRIVATE_IPV4_RANGES) {
    const startNum = ipToNumber(range.start);
    const endNum = ipToNumber(range.end);
    if (ipNum >= startNum && ipNum <= endNum) {
      return true;
    }
  }
  return false;
}

function isIPv6Private(ip) {
  const normalized = ip.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true;
  if (normalized.startsWith("fc00:") || normalized.startsWith("fd00:")) return true;
  if (normalized.startsWith("fe80:")) return true;
  if (normalized.startsWith("2001:db8:")) return true;
  return false;
}

function validateHostname(hostname) {
  const lowerHostname = hostname.toLowerCase();

  for (const blocked of BLOCKED_HOSTNAMES) {
    if (lowerHostname === blocked) {
      return { valid: false, reason: `Hostname "${hostname}" is blocked` };
    }
  }

  if (lowerHostname.endsWith(".internal") || lowerHostname.endsWith(".local")) {
    return { valid: false, reason: `Internal/local hostnames are not allowed` };
  }

  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(lowerHostname)) {
    if (isIPv4InPrivateRange(lowerHostname)) {
      return { valid: false, reason: `IP address ${hostname} is in a private range` };
    }
  }

  return { valid: true };
}

async function resolveAndValidate(hostname) {
  const hostnameCheck = validateHostname(hostname);
  if (!hostnameCheck.valid) {
    return hostnameCheck;
  }

  const errors = [];

  try {
    const ipv4Addresses = await resolve4(hostname, { ttl: true });
    for (const { address } of ipv4Addresses) {
      if (isIPv4InPrivateRange(address)) {
        errors.push(`Resolved to private IP: ${address}`);
      }
    }
  } catch (err) {
    if (err.code !== "ENODATA") {
      errors.push(`IPv4 resolution failed: ${err.message}`);
    }
  }

  try {
    const ipv6Addresses = await resolve6(hostname, { ttl: true });
    for (const { address } of ipv6Addresses) {
      if (isIPv6Private(address)) {
        errors.push(`Resolved to private IPv6: ${address}`);
      }
    }
  } catch (err) {
    if (err.code !== "ENODATA") {
      errors.push(`IPv6 resolution failed: ${err.message}`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, reason: errors.join("; ") };
  }

  return { valid: true };
}

export async function validateWebhookUrl(urlString) {
  let url;
  try {
    url = new URL(urlString);
  } catch {
    return { valid: false, reason: "Invalid URL format" };
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return { valid: false, reason: "Only HTTP and HTTPS protocols are allowed" };
  }

  const port = url.port ? parseInt(url.port, 10) : (url.protocol === "https:" ? 443 : 80);
  if (!ALLOWED_PORTS.has(port)) {
    return { valid: false, reason: `Port ${port} is not allowed. Only ports 80 and 443 are permitted` };
  }

  const hostname = url.hostname;
  const validation = await resolveAndValidate(hostname);
  if (!validation.valid) {
    return validation;
  }

  return { valid: true };
}
