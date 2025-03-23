# PWA Setup Instructions

To set up the PWA functionality completely, add the following script to your package.json:

```json
"scripts": {
  // ...existing scripts
  "generate-icons": "node scripts/generate-icons.js",
  "pwa-build": "npm run build && node scripts/generate-icons.js"
}
```

Then run:

```bash
npm run pwa-build
```

## Manual Icon Creation

If the automatic icon generation doesn't work, you can manually create the following icons from the SVG:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

And place them in the `public/icons/` directory.

## Testing the PWA

To test the PWA:
1. Build the application using `npm run build`
2. Serve the build directory using a static server (`npx serve -s dist`)
3. Open the application in Chrome and use the DevTools Application tab to verify the PWA setup
4. Use Lighthouse to audit your PWA implementation

## Notes for Apple Devices

For better iOS support, add the following to your index.html:

```html
<link rel="apple-touch-icon" href="/icons/icon-192x192.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Dental Schedule">
```
