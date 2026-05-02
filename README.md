# Ossama Alami personal site

A single-page personal website and text-based visual experiment.

## Local preview

Because this is a static site, you can open `index.html` directly in a browser, or run a tiny local server from this directory:

```sh
python3 -m http.server 8788
```

Then open <http://localhost:8788>.

## Deploy to Cloudflare Pages

```sh
wrangler pages deploy . --project-name=alami
```

## Files

- `index.html` — page content and metadata
- `styles.css` — layout, shimmer effect, visual design
- `script.js` — mouse-reactive glyph field
