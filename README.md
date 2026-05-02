# Ossama Alami personal site

A single-page personal website and text-based visual experiment.

## Visual Experience

- Refined Glyph Field
- Random Welcomes
- Rare Echoes:
- Ghost Telemetry:

## Local Development

This project uses Cloudflare Pages and Functions. To test the site locally with full functionality (including the Ghost Echoes feature), use the Wrangler CLI:

```sh
npx wrangler pages dev .
```

Then open <http://localhost:8788>.

### Visitor Echoes
The "Visitor Echoes" feature creates a shared, haunted experience by recording and playing back the mouse movements of previous visitors.
- **Recording:** Your mouse path is recorded locally (up to 400 points) and saved to Cloudflare KV when you leave the page or every 20 seconds.
- **Playback:** When a new visitor arrives, the site fetches the most recent visitor's path and plays it back as a faint, shimmering violet trail that glides smoothly across the background glyphs.
- **Fluidity:** The ghost uses linear interpolation to ensure movement is organic and 60fps, even if the recording was low-fidelity.

## Deployment

The project is connected to Cloudflare Pages via GitHub. Pushing to the `main` branch will trigger an automatic deployment.

## Files

- `index.html` — page content and metadata
- `styles.css` — layout, shimmer effect, visual design
- `script.js` — mouse-reactive glyph field and ghost logic
- `functions/api/ghosts.js` — Cloudflare Pages Function for shared visitor state
- `wrangler.toml` — Cloudflare Pages configuration
