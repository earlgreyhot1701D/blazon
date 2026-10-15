'use strict';
// validate.js: shape checks for both directions. Pure logic, no network.
// In:  what the browser sends to POST /motto. Never trusted.
// Out: what Gemma returns. Never trusted either.

const MAX_WORD_CHARS = 40;    // matches maxlength on #word-input
const MAX_BLAZON_CHARS = 120; // real blazons top out at 61 chars (checked over 3,000 words, Oct 15)
const MAX_MOTTO_CHARS = 80;
const MAX_LORE_CHARS = 600;

// Letters in any language, digits, space, apostrophe, hyphen, period.
const WORD_OK = /^[\p{L}\p{N} '\-.]+$/u;
// Real blazons only use English letters, spaces, commas, and periods. Anything else is tampering.
const BLAZON_OK = /^[A-Za-z ,.]+$/;

// Returns { ok: true, value: { word, blazon } } or { ok: false, error }.
function checkMottoBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'bad_request' };
  if (typeof body.word !== 'string' || typeof body.blazon !== 'string') return { ok: false, error: 'bad_request' };
  const word = body.word.trim();
  const blazon = body.blazon.trim();
  if (!word || !blazon) return { ok: false, error: 'bad_request' };
  if (word.length > MAX_WORD_CHARS || blazon.length > MAX_BLAZON_CHARS) return { ok: false, error: 'too_large' };
  if (!WORD_OK.test(word) || !BLAZON_OK.test(blazon)) return { ok: false, error: 'bad_request' };
  return { ok: true, value: { word, blazon } };
}

function clean(s) {
  // Drop control characters, collapse whitespace. The control-char range is the point here.
  // eslint-disable-next-line no-control-regex
  return String(s).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Returns { ok: true, value: { motto, lore } } or { ok: false, why } (why is a short code, safe to log).
function checkMottoOutput(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, why: 'not_object' };
  if (typeof raw.motto !== 'string' || typeof raw.lore !== 'string') return { ok: false, why: 'missing_fields' };
  const motto = clean(raw.motto);
  const lore = clean(raw.lore);
  if (!motto || !lore) return { ok: false, why: 'empty' };
  if (motto.length > MAX_MOTTO_CHARS) return { ok: false, why: 'motto_long' };
  if (lore.length > MAX_LORE_CHARS) return { ok: false, why: 'lore_long' };
  // The browser renders with textContent, so markup is harmless there. Reject it anyway:
  // markup or links in a motto mean the model followed something it shouldn't have.
  const suspicious = /[<>]|https?:|www\./i;
  if (suspicious.test(motto) || suspicious.test(lore)) return { ok: false, why: 'suspicious' };
  return { ok: true, value: { motto, lore } };
}

module.exports = {
  MAX_WORD_CHARS, MAX_BLAZON_CHARS, MAX_MOTTO_CHARS, MAX_LORE_CHARS,
  checkMottoBody, checkMottoOutput
};
