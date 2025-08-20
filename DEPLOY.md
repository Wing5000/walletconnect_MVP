# Deployment Guide

## Prerequisites
- Node.js \>=18
- Vercel CLI (`npm i -g vercel`)

## Environment variables
Copy `.env.example` to `.env.local` and provide values:

```sh
cp .env.example .env.local
# edit .env.local and set:
# NEXT_PUBLIC_WC_PROJECT_ID=...
# NEXT_PUBLIC_PRIVY_APP_ID=...
```

## Local verification
Install dependencies and run checks:

```sh
npm ci
npm run lint
npm run build
npx vercel build
```

A successful `vercel build` ends with output similar to:

```
Done with "package.json"
Created output directory: .vercel/output
```

## Deploying
After tests pass, deploy with:

```sh
vercel --prod
```

The deployment should complete without runtime errors.
