# ERAN website

Marketing site for ERAN, built on the ERAN Design System (Figma). Plain HTML, CSS and JavaScript with no build step.

## Run locally

```bash
python3 -m http.server 5178
```

Then open http://localhost:5178.

## Structure

- `index.html` — page markup
- `css/styles.css` — design tokens (colour, type, spacing, motion) and all styles
- `js/main.js` — animations and interactions (GSAP, ScrollTrigger and Lenis load from CDNs)
- `assets/brand/` — logo and plane symbol SVGs
- `assets/img/` — illustration library, compressed to WebP

Copy, stats, prices and testimonials are placeholders.
