# Vercel Deployment Fix Guide

This guide addresses the deployment issues where local changes aren't appearing on Vercel.

## Issues Identified and Fixed

### 1. **Image Asset Resolution Problems**
- **Problem**: Build warnings about background images not resolving at build time
- **Cause**: CSS references to `.jpg` files that were optimized and moved to `unused_images`
- **Fix**: Updated `src/layouts/Layout.astro` to use optimized `.webp` versions

### 2. **Build Process Issues**
- **Problem**: Image optimization script running during build could cause timing issues
- **Cause**: `build` script included image optimization which is resource-intensive
- **Fix**: Separated build scripts - `build` now only runs Astro build, `build:with-images` includes optimization

### 3. **Environment Variables**
- **Problem**: Missing production environment configuration
- **Fix**: Created `.env.production` file and updated Vercel configuration

### 4. **Serverless Compatibility**
- **Problem**: Previous serverless compatibility issues
- **Fix**: Updated `astro.config.mjs` with better Vercel adapter configuration

## Deployment Steps

### Step 1: Run Pre-deployment Check
```bash
pnpm run deploy-check
```
This will verify:
- All background images exist
- Environment variables are set
- Build configuration is correct

### Step 2: Test Local Build
```bash
pnpm run build
```
Ensure the build completes without errors.

### Step 3: Environment Variables in Vercel
Make sure these environment variables are set in your Vercel dashboard:

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add the following variables:

```
PORTFOLIO_DATA_MODE = api-required
PORTFOLIO_API_BASE_URL = https://api.zodev.live
PORTFOLIO_API_ORIGIN = https://my.zodev.live
PORTFOLIO_API_TOKEN = <project token>
PORTFOLIO_SHOWCASE_SLUG = main-portfolio
NODE_ENV = production
```

The legacy Supabase-backed `/docs` module has been archived and is no longer part of the active production surface.

### Step 4: Force Rebuild on Vercel
To ensure Vercel picks up all changes:

1. **Option A: Trigger via Git**
   ```bash
   git add .
   git commit -m "Fix Vercel deployment issues - update image references and build config"
   git push
   ```

2. **Option B: Manual Redeploy**
   - Go to your Vercel dashboard
   - Click on your project
   - Go to the "Deployments" tab
   - Click the three dots on the latest deployment
   - Select "Redeploy"

### Step 5: Clear Vercel Cache (if needed)
If changes still don't appear:

1. In Vercel dashboard, go to Settings > Functions
2. Clear the function cache
3. Redeploy

## Troubleshooting

### If Images Still Don't Load
1. Check the browser's Network tab for 404 errors
2. Verify image paths in the deployed site
3. Run `pnpm run optimize-images` locally and commit the changes

### If Environment Variables Don't Work
1. Verify they're set in Vercel dashboard
2. Make sure they're set for the correct environment (Production/Preview)
3. Redeploy after setting variables

### If Build Fails on Vercel
1. Check the build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Verify Node.js version compatibility

## Files Modified

1. `vercel.json` - Added environment variables and build configuration
2. `package.json` - Updated build scripts and added deploy-check
3. `src/layouts/Layout.astro` - Fixed background image references
4. `astro.config.mjs` - Improved Vercel adapter configuration
5. `.env.production` - Production environment variables
6. `scripts/vercel-deploy.js` - Pre-deployment verification script

## Verification

After deployment, verify:
1. Site loads correctly at your Vercel URL
2. Background images display properly
3. All functionality works as expected
4. No console errors in browser dev tools

## Next Steps

1. Run the deployment check: `pnpm run deploy-check`
2. Commit and push changes
3. Monitor the Vercel deployment
4. Test the deployed site thoroughly

If you continue to experience issues, check the Vercel deployment logs for specific error messages.
