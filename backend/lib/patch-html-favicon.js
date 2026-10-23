const FAVICON_LINES = [
  '<link rel="icon" href="/favicon.ico" sizes="any">',
  '<link rel="icon" type="image/png" href="/favicon.png">',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
  '<link rel="manifest" href="/site.webmanifest">',
];

const FAVICON_BLOCK = FAVICON_LINES.join("\n  ");

const FAVICON_MARKER = 'href="/favicon.ico"';

function patchHtmlFavicon(html) {
  if (!html) return html;
  if (html.includes(FAVICON_MARKER)) return html;

  const block = `\n  ${FAVICON_BLOCK}\n`;

  const oldSingle =
    /<link\s+rel="icon"\s+type="image\/png"\s+href="\/favicon\.png"\s*\/?>\s*/i;
  if (oldSingle.test(html)) {
    return html.replace(oldSingle, block);
  }

  const headMatch = html.match(/<head[^>]*>/i);
  if (!headMatch) return html;

  const idx = headMatch.index + headMatch[0].length;
  return html.slice(0, idx) + block + html.slice(idx);
}

module.exports = { patchHtmlFavicon, FAVICON_BLOCK };
