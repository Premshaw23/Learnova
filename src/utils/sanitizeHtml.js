/**
 * HTML Sanitizer for Rich-Text Fields (Course Descriptions, User Comments, etc.)
 * Prevents Stored Cross-Site Scripting (XSS) by stripping dangerous tags,
 * event handlers, and unsafe URI protocols.
 */

const ALLOWED_TAGS = new Set([
  'p', 'b', 'i', 'em', 'strong', 'u', 's', 'sub', 'sup',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'br', 'hr',
  'blockquote', 'code', 'pre', 'span', 'div', 'a'
]);

const FORBIDDEN_TAGS = new Set([
  'script', 'iframe', 'object', 'embed', 'style', 'link',
  'form', 'input', 'button', 'select', 'option', 'textarea',
  'base', 'meta', 'applet'
]);

/**
 * Sanitize raw HTML string to prevent XSS.
 * @param {string} html - Raw rich-text HTML string
 * @returns {string} Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') {
    return '';
  }

  let sanitized = html;

  // 1. Remove dangerous tags and their contents
  FORBIDDEN_TAGS.forEach((tag) => {
    const tagRegex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>|<${tag}[^>]*\\/?>`, 'gi');
    sanitized = sanitized.replace(tagRegex, '');
  });

  // 2. Remove all inline event handlers (e.g., onerror=..., onload=..., onclick=...)
  sanitized = sanitized.replace(/\s+on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');

  // 3. Remove dangerous URIs (javascript:, vbscript:, data:) in href or src attributes
  sanitized = sanitized.replace(/(href|src)\s*=\s*(?:'|")?\s*(?:javascript|vbscript|data):[^'"\s>]*(?:'|")?/gi, '');

  // 4. Enforce rel="noopener noreferrer" on external anchor tags
  sanitized = sanitized.replace(/<a\s+([^>]*href=["'][^"']+["'][^>]*)>/gi, (match, p1) => {
    let tagContent = p1;
    // Check if rel attribute exists
    if (/rel=["']/i.test(tagContent)) {
      tagContent = tagContent.replace(/rel=["'][^"']*["']/gi, 'rel="noopener noreferrer"');
    } else {
      tagContent += ' rel="noopener noreferrer"';
    }
    // Set target="_blank" for external links if not present
    if (!/target=["']/i.test(tagContent)) {
      tagContent += ' target="_blank"';
    }
    return `<a ${tagContent}>`;
  });

  return sanitized;
}

export default sanitizeHtml;
