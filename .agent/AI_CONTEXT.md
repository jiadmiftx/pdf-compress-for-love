# PDF Compressor — AI Context

## Project Overview
A **client-side PDF compressor** web application. All processing happens in the browser — no files are ever uploaded to a server.

**Live URL:** https://pdf-compress-for-love.web.app  
**GitHub:** https://github.com/jiadmiftx/pdf-compress-for-love  
**Firebase Project:** `pdf-compress-for-love`

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 7 |
| Styling | Tailwind CSS v4 + PostCSS |
| PDF Processing | `pdf-lib` (rebuild) + `pdfjs-dist` (render) |
| File Download | `file-saver` + `jszip` (batch ZIP) |
| Icons | `lucide-react` |
| Analytics | Firebase Analytics (GA4) |
| Hosting | Firebase Hosting |
| CI/CD | GitHub Actions → Firebase deploy |

## Project Structure

```
pdf-compress/
├── public/
│   ├── favicon.svg          # Custom SVG app icon
│   └── og-image.png         # Social media preview image
├── src/
│   ├── main.jsx             # React entry point
│   ├── App.jsx              # Root component wrapper
│   ├── PdfCompressorApp.jsx # Main UI component (all features)
│   ├── pdfCompressor.js     # Core compression logic
│   ├── analytics.js         # Firebase Analytics + custom events
│   └── index.css            # Tailwind + custom animations
├── index.html               # HTML with SEO, OG, Twitter Card tags
├── vite.config.js           # Vite build config
├── postcss.config.js        # PostCSS for Tailwind
├── firebase.json            # Firebase Hosting config (serves dist/)
├── .firebaserc              # Firebase project linking
└── package.json             # Dependencies & scripts
```

## Key Features
- **Drag & drop** or click to upload multiple PDFs
- **3 compression levels**: High (small file), Medium, Low (best quality)
- **Batch processing** with per-file progress bars
- **Before/after size comparison** with percentage savings badge
- **Individual download** or **Download All as ZIP**
- **Responsive mobile layout** with stacked controls
- **Dark theme** with glassmorphism + micro-animations

## Compression Logic (`pdfCompressor.js`)
1. Read PDF with `pdfjs-dist` → render each page to canvas
2. Convert canvas to JPEG at quality level (0.4 / 0.6 / 0.75)
3. Scale factor applied (0.6x / 0.8x / 1.0x)
4. Rebuild PDF with `pdf-lib` embedding JPEG images
5. Return compressed Blob + size info

## Analytics Events (`analytics.js`)

| Event | Parameters | When |
|---|---|---|
| `files_uploaded` | file_count, total_size_kb | Files added |
| `compression_start` | quality_level, file_count | Compress All clicked |
| `file_compressed` | original_size_kb, compressed_size_kb, savings_percent, page_count, quality_level | Each file done |
| `file_download` | download_type (single/zip), file_size_kb | Download clicked |
| `compression_error` | error_message | Compression fails |

## Build & Deploy

```bash
npm run dev          # Local dev server (Vite HMR)
npm run build        # Production build → dist/
firebase deploy      # Deploy dist/ to Firebase Hosting
```

## Important Notes
- **100% client-side** — no backend, no server, no file uploads
- Firebase config is in `src/analytics.js` (API key is safe to expose for client-side Firebase)
- OG image URL hardcoded to `https://pdf-compress-for-love.web.app/og-image.png`
- Large chunks warning is expected (pdf.worker.mjs ~2MB) — acceptable for this use case
- The `pdfjs-dist` worker is loaded from CDN via `GlobalWorkerOptions.workerSrc`

## Credits
- **Copyright:** @angginrisnaw
- **Developer:** @jiadmiftx (GitHub / Instagram)
