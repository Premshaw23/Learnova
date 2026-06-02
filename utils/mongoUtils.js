/**
 * MongoDB query safety utilities.
 * Provides helpers for sanitising user-supplied input before it reaches
 * MongoDB queries, preventing ReDoS and field-name injection attacks.
 */

/**
 * Escapes all PCRE metacharacters in a string so it is safe to use as a
 * literal substring pattern inside a MongoDB $regex query.
 *
 * Without this, raw user input is evaluated as a full regular expression by
 * MongoDB's PCRE engine. Catastrophically backtracking patterns such as
 * (a+)+$ can hang a query thread indefinitely, denying service to all users.
 *
 * @param {string} raw       - User-supplied search string
 * @param {number} maxLength - Hard cap applied before escaping (default 100)
 * @returns {string} Escaped literal string safe for use in $regex
 */
export function escapeRegex(raw, maxLength = 100) {
  if (typeof raw !== "string") return "";
  // Truncate first so the escape pass operates on a bounded string
  return raw.slice(0, maxLength).replace(/[-[\]{}()*+?.,\\^$|#\s/]/g, "\\$&");
}

/**
 * Validates a client-supplied sort field against an explicit allowlist,
 * falling back to a safe default when the value is unrecognised.
 *
 * Without this, arbitrary field names can be injected as MongoDB sort keys,
 * leaking internal document structure and enabling unexpected query behaviour.
 *
 * @param {string}      field        - Client-supplied sort field name
 * @param {Set<string>} allowedFields - Allowlist of permitted field names
 * @param {string}      defaultField  - Fallback used when field is not allowed
 * @returns {string} A safe sort field name guaranteed to be in allowedFields
 */
export function sanitizeSortField(field, allowedFields, defaultField = "createdAt") {
  if (typeof field !== "string" || !allowedFields.has(field)) {
    return defaultField;
  }
  return field;
}
