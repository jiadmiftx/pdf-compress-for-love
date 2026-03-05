---
description: How to build and deploy the PDF Compressor app to Firebase Hosting
---

# Deploy to Firebase Hosting

## Prerequisites
- Node.js installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Logged in to Firebase (`firebase login`)
- Git configured with remote `origin` pointing to `github.com/jiadmiftx/pdf-compress-for-love`

## Steps

### 1. Install dependencies (if needed)
// turbo
```bash
npm install
```

### 2. Run local dev server to verify changes
```bash
npm run dev
```
Open http://localhost:5173 (or next available port) and verify everything works.

### 3. Build for production
// turbo
```bash
npm run build
```
This outputs optimized files to `dist/`. Verify no build errors.

### 4. Preview production build locally (optional)
```bash
npx vite preview
```

### 5. Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```
Deployed URL: https://pdf-compress-for-love.web.app

### 6. Commit and push to GitHub
```bash
git add -A
git commit -m "Your commit message here"
git push origin main
```

### 7. Verify deployment
// turbo
```bash
echo "✅ Deployed! Check: https://pdf-compress-for-love.web.app"
```

## Quick Deploy (All-in-One)
For rapid deploy when you're confident in the changes:
```bash
npm run build && firebase deploy --only hosting && git add -A && git commit -m "Deploy update" && git push origin main
```

## Rollback
If something goes wrong, rollback to previous version:
```bash
firebase hosting:channel:list
firebase hosting:rollback
```

## Social Media Preview Cache
After deploying OG image changes, clear social media caches:
- **Facebook:** https://developers.facebook.com/tools/debug/
- **Twitter:** https://cards-dev.twitter.com/validator
- **LinkedIn:** https://www.linkedin.com/post-inspector/
