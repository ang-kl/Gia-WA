// WhatsApp message formatting + markup escape.
//
// WhatsApp text rendering supports a tiny markup vocabulary:
//   *bold*   _italic_   ~strike~   `monospace`
// Any of those characters appearing inside user- or data-derived strings
// will corrupt the rendered message (e.g. a venue named "Cafe ~Lao~ Beijing"
// renders with "Lao" stricken through). This is the WhatsApp analog of
// Soleat's HTML-escape risk flagged by gia-preflight (BUILD-PLAN §4.5).

const MARKUP_CHARS = ['*', '_', '~', '`'];

/**
 * Escape WhatsApp markup characters in a string by wrapping each in a
 * zero-width-space sandwich. The ZWSP (U+200B) is invisible in the WhatsApp
 * client but breaks the markup tokenizer's pairing, so `~Lao~` becomes
 * `~​Lao​~` and renders literally as `~Lao~`.
 *
 * @param {unknown} input
 * @returns {string}
 */
export function escapeMarkup(input) {
  if (input === null || input === undefined) return '';
  const s = String(input);
  let out = '';
  for (const ch of s) {
    if (MARKUP_CHARS.includes(ch)) {
      out += '​' + ch + '​';
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * Render a venue block in WhatsApp markup. Mirrors the shape of Soleat's
 * formatTechniqueVenueBlock but emits WhatsApp text instead of HTML.
 *
 * @param {{ name: string, cuisine?: string, distance_m?: number, rationale?: string, url?: string }} v
 * @returns {string}
 */
export function renderVenue(v) {
  const name = escapeMarkup(v.name ?? 'Unknown');
  const lines = [`*${name}*`];
  if (v.cuisine) lines.push(`_${escapeMarkup(v.cuisine)}_`);
  if (typeof v.distance_m === 'number' && Number.isFinite(v.distance_m)) {
    lines.push(`${Math.round(v.distance_m)} m away`);
  }
  if (v.rationale) lines.push(escapeMarkup(v.rationale));
  if (v.url) lines.push(v.url);
  return lines.join('\n');
}

/**
 * Render a numbered list of venues separated by blank lines. Caller is
 * responsible for splitting into multiple messages if the total exceeds
 * WhatsApp's 1024-char per-text-body limit.
 *
 * @param {Array<Parameters<typeof renderVenue>[0]>} venues
 * @returns {string}
 */
export function renderVenueList(venues) {
  return venues
    .map((v, i) => `${i + 1}. ${renderVenue(v)}`)
    .join('\n\n');
}

/**
 * Hard chunk a body to WhatsApp's 1024-character limit, splitting on
 * sentence/newline boundaries when possible.
 *
 * @param {string} body
 * @param {number} [limit=1024]
 * @returns {string[]}
 */
export function chunkForWhatsApp(body, limit = 1024) {
  if (typeof body !== 'string') throw new TypeError('chunkForWhatsApp: body must be string');
  if (body.length <= limit) return [body];
  const chunks = [];
  let remaining = body;
  while (remaining.length > limit) {
    const slice = remaining.slice(0, limit);
    const breakAt = Math.max(
      slice.lastIndexOf('\n\n'),
      slice.lastIndexOf('\n'),
      slice.lastIndexOf('. '),
      slice.lastIndexOf(' '),
    );
    const cut = breakAt > 0 ? breakAt : limit;
    chunks.push(remaining.slice(0, cut).trimEnd());
    remaining = remaining.slice(cut).trimStart();
  }
  if (remaining.length) chunks.push(remaining);
  return chunks;
}
