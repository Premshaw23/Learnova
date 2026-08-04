/**
 * ============================================================================
 * ⏭️ SKIP LINK COMPONENT (Issue #4226)
 * ============================================================================
 * Provides skip navigation links for keyboard users.
 * These links are visually hidden until focused, allowing keyboard users
 * to bypass repetitive navigation and jump to main content.
 *
 * Usage:
 *   <SkipLink />
 *   <SkipLink links={[{ href: '#main', label: 'Skip to content' }]} />
 */

import React from "react";
import { SKIP_LINKS } from "@/lib/a11y";

/**
 * Default styles for skip links (visually hidden until focused).
 */
const styles = {
  skipLink: {
    position: "absolute",
    top: "-100%",
    left: 0,
    zIndex: 9999,
    padding: "12px 24px",
    backgroundColor: "#1e293b",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "14px",
    textDecoration: "none",
    borderRadius: "0 0 8px 0",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    transition: "top 0.2s ease",
  },
  skipLinkFocus: {
    top: 0,
  },
};

/**
 * A single skip link that becomes visible on focus.
 */
function SkipLinkItem({ href, label }) {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <a
      href={href}
      className="skip-link"
      style={{
        ...styles.skipLink,
        ...(isFocused ? styles.skipLinkFocus : {}),
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onClick={(e) => {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.focus();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }}
    >
      {label}
    </a>
  );
}

/**
 * SkipLink component.
 *
 * @param {Object} props
 * @param {Array} [props.links] - Custom skip links. Defaults to SKIP_LINKS.
 */
export default function SkipLink({ links = SKIP_LINKS }) {
  return (
    <nav aria-label="Skip navigation" className="skip-links">
      {links.map((link) => (
        <SkipLinkItem key={link.id} href={link.href} label={link.label} />
      ))}
    </nav>
  );
}
