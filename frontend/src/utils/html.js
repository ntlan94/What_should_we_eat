/**
 * ============================================================================
 * Project: What Should We Eat?
 * File: frontend/src/utils/html.js
 * Description: HTML escaping and URL sanitization helpers to prevent XSS and
 *              unsafe URL schemes in dynamically rendered templates.
 * Author: Thanh Lan Ngo
 * Collaborators: Jovian Niko Soesilo
 * Date Created: 2026-11-21
 * Last Modified: 2026-11-21
 * Modified by: Thanh Lan Ngo
 * ============================================================================
 */

const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escapes special HTML characters so untrusted strings are safe inside innerHTML.
 */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => HTML_ESCAPE_MAP[character]);
}

/**
 * Validates image/link URLs to permit only http(s), data:image/, or relative paths.
 */
export function safeUrl(url, fallback = '') {
  if (typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }
  return fallback;
}