import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../utils/sanitizeHtml.js';

describe('Stored XSS HTML Sanitizer Security Tests (#4214)', () => {
  it('strips <script> tags and inline JavaScript execution payloads', () => {
    const maliciousInput = '<p>Course Intro</p><script>alert("XSS Attack!")</script><b>Learn More</b>';
    const output = sanitizeHtml(maliciousInput);

    expect(output).not.toContain('<script>');
    expect(output).not.toContain('alert');
    expect(output).toContain('<p>Course Intro</p>');
    expect(output).toContain('<b>Learn More</b>');
  });

  it('strips <iframe>, <object>, <embed>, and <svg> malicious tags', () => {
    const maliciousInput = '<div>Header</div><iframe src="http://evil.com"></iframe><svg onload="alert(1)"></svg><embed src="malware.swf">';
    const output = sanitizeHtml(maliciousInput);

    expect(output).not.toContain('iframe');
    expect(output).not.toContain('embed');
    expect(output).not.toContain('svg');
    expect(output).toContain('<div>Header</div>');
  });

  it('strips inline event handlers (onerror, onload, onclick, onmouseover)', () => {
    const maliciousInput = '<img src="invalid.jpg" onerror="alert(document.cookie)" onload="stealData()" />';
    const output = sanitizeHtml(maliciousInput);

    expect(output).not.toContain('onerror');
    expect(output).not.toContain('onload');
    expect(output).not.toContain('alert');
  });

  it('strips javascript: and data: URIs in href and src attributes', () => {
    const maliciousInput = '<a href="javascript:alert(1)">Click Here</a><a href="data:text/html;base64,PHNjcmlwdD4=">Payload</a>';
    const output = sanitizeHtml(maliciousInput);

    expect(output).not.toContain('javascript:');
    expect(output).not.toContain('data:');
  });

  it('enforces rel="noopener noreferrer" and target="_blank" on external links', () => {
    const input = '<a href="https://example.com/resource">Resource Link</a>';
    const output = sanitizeHtml(input);

    expect(output).toContain('rel="noopener noreferrer"');
    expect(output).toContain('target="_blank"');
  });

  it('preserves valid safe rich-text formatting tags and structure', () => {
    const safeInput = '<h2>Module 1</h2><p>Welcome to <b>Web Development</b>. Visit <i>our site</i> for details.</p><ul><li>Topic 1</li></ul>';
    const output = sanitizeHtml(safeInput);

    expect(output).toBe(safeInput);
  });

  it('returns empty string for null, undefined, or empty inputs', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
  });
});
