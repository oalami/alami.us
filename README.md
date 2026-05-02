# Ossama Alami personal site

A single-page personal website and text-based visual experiment.

## Local Development

This project uses Cloudflare Pages and Functions. To test the site locally with full functionality (including the Ghost Echoes feature), use the Wrangler CLI:

```sh
npx wrangler pages dev .
```

Then open <http://localhost:8788>.

### Ghost Echoes
The "Ghost Echoes" feature uses Cloudflare KV to store and display recent visitor trails. When running locally, Wrangler simulates the KV store. To test it:
1. Open the local URL in two separate browser windows.
2. Move your mouse in one window.
3. Wait a few seconds to see the "ghost" appear in the other window.

## Deployment

The project is connected to Cloudflare Pages via GitHub. Pushing to the `main` branch will trigger an automatic deployment.

## Files

- `index.html` — page content and metadata
- `styles.css` — layout, shimmer effect, visual design
- `script.js` — mouse-reactive glyph field and ghost logic
- `functions/api/ghosts.js` — Cloudflare Pages Function for shared visitor state
- `wrangler.toml` — Cloudflare Pages configuration
