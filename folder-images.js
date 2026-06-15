/**
 * folder-images.js — auto-load the first image found in each per-slot folder.
 *
 * Drop ANY image (jpg/jpeg/png/webp/avif/gif) into images/<slot-id>/ and it
 * shows up in the matching <image-slot> automatically — no file naming or
 * HTML editing needed.
 *
 * How it finds the image, in order:
 *   1) Apache/XAMPP directory listing — fetch images/<slot-id>/ and scrape the
 *      auto-generated index for the first image link. Works for ANY filename.
 *   2) Common-name fallback — if directory listing is off, try a short list of
 *      predictable names (1.jpg, photo.png, cover.webp, ...).
 *
 * A user drag-drop onto a slot (image-slot.js sidecar) still wins — this only
 * fills slots the user hasn't filled, by setting the element's `src` attribute,
 * which image-slot.js treats as the initial/fallback image.
 */
(() => {
  const FOLDER = 'images';
  const EXTS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'];
  const FALLBACK_BASENAMES = ['1', 'photo', 'cover', 'main', 'img', 'image'];
  const IMG_RE = /\.(jpe?g|png|webp|avif|gif)(?:\?.*)?$/i;

  // Scrape an Apache (or similar) auto-index page for the first image href.
  async function fromDirectoryListing(dir) {
    try {
      const res = await fetch(dir + '/', { cache: 'no-store' });
      if (!res.ok) return null;
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('text/html')) return null;
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const links = Array.from(doc.querySelectorAll('a[href]'));
      for (const a of links) {
        const href = a.getAttribute('href') || '';
        // Skip parent-dir, query-sort, and absolute links.
        if (href.startsWith('?') || href.startsWith('/') || href.includes('..')) continue;
        if (IMG_RE.test(href)) {
          return dir + '/' + href.split('/').pop();
        }
      }
    } catch (_) {}
    return null;
  }

  // HEAD/GET-probe a candidate URL; resolve it only if it actually exists and
  // is an image (a 404 page can return 200 with HTML in some setups).
  function exists(url) {
    return fetch(url, { method: 'HEAD', cache: 'no-store' })
      .then((r) => {
        if (!r.ok) return false;
        const ct = r.headers.get('content-type') || '';
        return ct.startsWith('image/') || ct === '';
      })
      .catch(() => false);
  }

  async function fromCommonNames(dir) {
    for (const base of FALLBACK_BASENAMES) {
      for (const ext of EXTS) {
        const url = dir + '/' + base + '.' + ext;
        if (await exists(url)) return url;
      }
    }
    return null;
  }

  async function resolveFor(slot) {
    const id = slot.id;
    if (!id) return;
    const dir = FOLDER + '/' + id;
    const found = (await fromDirectoryListing(dir)) || (await fromCommonNames(dir));
    if (found && !slot.getAttribute('src')) {
      slot.setAttribute('src', found);
    }
  }

  function run() {
    const slots = document.querySelectorAll('image-slot[id]');
    slots.forEach((slot) => { resolveFor(slot); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
