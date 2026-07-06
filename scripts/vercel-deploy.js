#!/usr/bin/env node
/**
 * Vercel deployment preparation script
 * Ensures all assets are properly optimized and references are correct before deployment
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

/**
 * Check if all referenced background images exist
 */
async function checkBackgroundImages() {
  console.log('🔍 Checking background image references...');
  
  const layoutPath = path.join(rootDir, 'src/layouts/Layout.astro');
  const publicDir = path.join(rootDir, 'public');
  
  try {
    const layoutContent = await fs.readFile(layoutPath, 'utf-8');
    
    // Extract all background image URLs
    const urlPattern = /url\(["']?([^"')\s]+)["']?\)/g;
    const urls = [];
    let match;
    
    while ((match = urlPattern.exec(layoutContent)) !== null) {
      if (match[1].includes('/assets/backgrounds/') && !match[1].includes('.svg')) {
        urls.push(match[1]);
      }
    }
    
    console.log(`Found ${urls.length} background image references`);
    
    // Check if files exist
    const missingFiles = [];
    for (const url of urls) {
      const filePath = path.join(publicDir, url);
      try {
        await fs.access(filePath);
        console.log(`✅ ${url}`);
      } catch {
        missingFiles.push(url);
        console.log(`❌ ${url} - MISSING`);
      }
    }
    
    if (missingFiles.length > 0) {
      console.log(`\n⚠️  ${missingFiles.length} background images are missing!`);
      return false;
    }
    
    console.log('✅ All background images found');
    return true;
    
  } catch (error) {
    console.error('Error checking background images:', error);
    return false;
  }
}

/**
 * Verify environment variables
 */
async function checkEnvironmentVariables() {
  console.log('\n🔍 Checking environment variables...');

  const recommendedVars = [
    'PORTFOLIO_DATA_MODE',
    'PORTFOLIO_API_BASE_URL',
    'PORTFOLIO_API_ORIGIN',
    'PORTFOLIO_API_TOKEN',
    'PORTFOLIO_SHOWCASE_SLUG',
  ];

  let envContent = '';
  try {
    const envPath = path.join(rootDir, '.env');
    envContent = await fs.readFile(envPath, 'utf-8');
  } catch (error) {
    // .env doesn't exist locally, fall back to process.env
  }

  const detected = recommendedVars.filter((varName) => {
    if (envContent.includes(`${varName}=`)) return true;
    return Boolean(process.env[varName]);
  });

  if (detected.length > 0) {
    console.log(`✅ Variables detectées: ${detected.join(', ')}`);
  }

  const missingPortfolioVars = ['PORTFOLIO_DATA_MODE', 'PORTFOLIO_API_BASE_URL', 'PORTFOLIO_API_ORIGIN', 'PORTFOLIO_API_TOKEN'].filter(
    (varName) => !detected.includes(varName),
  );

  if (missingPortfolioVars.length > 0) {
    console.log(`⚠️  Variables portfolio non détectées: ${missingPortfolioVars.join(', ')}`);
    console.log('Assurez-vous qu’elles sont configurées dans Vercel pour que le portfolio charge les données ZodBack en production via integrations-api.zodev.live.');
  }

  const portfolioModeMatch = envContent.match(/^PORTFOLIO_DATA_MODE=(.+)$/m);
  const portfolioMode =
    portfolioModeMatch?.[1]?.trim() || process.env.PORTFOLIO_DATA_MODE || '';

  // Vérification stricte des variables de production
  const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

  if (isProduction && portfolioMode !== 'api-required') {
    console.error(`❌ ERREUR: PORTFOLIO_DATA_MODE=${portfolioMode}. En production, "api-required" est OBLIGATOIRE pour garantir l'utilisation de l'API comme seule source de vérité.`);
    return false;
  } else if (portfolioMode && portfolioMode !== 'api-required') {
    console.log(`⚠️  PORTFOLIO_DATA_MODE=${portfolioMode}. Il est recommandé d'utiliser "api-required" pour toute utilisation non locale.`);
  }

  const portfolioBaseUrlMatch = envContent.match(/^PORTFOLIO_API_BASE_URL=(.+)$/m);
  const portfolioBaseUrl =
    portfolioBaseUrlMatch?.[1]?.trim() || process.env.PORTFOLIO_API_BASE_URL || '';

  const canonicalBaseUrl = 'https://integrations-api.zodev.live';
  if (isProduction && portfolioBaseUrl !== canonicalBaseUrl) {
    console.error(`❌ ERREUR: PORTFOLIO_API_BASE_URL=${portfolioBaseUrl}. En production, le seul host autorisé est le canonique "${canonicalBaseUrl}".`);
    return false;
  } else if (portfolioBaseUrl && portfolioBaseUrl !== canonicalBaseUrl) {
    console.log(`⚠️  PORTFOLIO_API_BASE_URL=${portfolioBaseUrl}. Le host canonique d'integration est "${canonicalBaseUrl}". L'ancien host api.zodev.live est obsolète.`);
  }

  const canonicalOrigin = 'https://my.zodev.live';
  const portfolioOriginMatch = envContent.match(/^PORTFOLIO_API_ORIGIN=(.+)$/m);
  const portfolioOrigin =
    portfolioOriginMatch?.[1]?.trim() || process.env.PORTFOLIO_API_ORIGIN || '';

  if (isProduction && portfolioOrigin !== canonicalOrigin) {
    console.error(`❌ ERREUR: PORTFOLIO_API_ORIGIN=${portfolioOrigin}. En production, le seul origin autorisé est "${canonicalOrigin}".`);
    return false;
  }

  console.log('✅ Environment variables check completed');
  return true;
}

/**
 * Check build configuration
 */
async function checkBuildConfig() {
  console.log('\n🔍 Checking build configuration...');
  
  try {
    // Check package.json
    const packagePath = path.join(rootDir, 'package.json');
    const packageContent = await fs.readFile(packagePath, 'utf-8');
    const packageJson = JSON.parse(packageContent);
    
    if (packageJson.scripts.build !== 'astro build') {
      console.log('❌ Build script should be "astro build" for Vercel deployment');
      return false;
    }
    
    const astroConfigPath = path.join(rootDir, 'astro.config.mjs');
    const astroConfig = await fs.readFile(astroConfigPath, 'utf-8');

    if (!astroConfig.includes("@astrojs/vercel")) {
      console.log('❌ Astro config must use the Vercel adapter');
      return false;
    }

    const vercelPath = path.join(rootDir, 'vercel.json');
    try {
      const vercelContent = await fs.readFile(vercelPath, 'utf-8');
      const vercelConfig = JSON.parse(vercelContent);

      if (vercelConfig.buildCommand && vercelConfig.buildCommand !== 'bun run build') {
        console.log('❌ Vercel build command should be "bun run build" when vercel.json is present');
        return false;
      }
    } catch (error) {
      console.log('ℹ️  No vercel.json found; using Astro Vercel adapter defaults.');
    }
    
    console.log('✅ Build configuration is correct');
    return true;
    
  } catch (error) {
    console.error('Error checking build configuration:', error);
    return false;
  }
}

/**
 * Main deployment check function
 */
async function main() {
  console.log('🚀 Vercel Deployment Pre-check\n');
  
  const checks = [
    await checkBackgroundImages(),
    await checkEnvironmentVariables(),
    await checkBuildConfig()
  ];
  
  const allPassed = checks.every(check => check);
  
  if (allPassed) {
    console.log('\n✅ All deployment checks passed! Ready for Vercel deployment.');
    console.log('\nNext steps:');
    console.log('1. Commit your changes: git add . && git commit -m "Fix deployment issues"');
    console.log('2. Push to your repository: git push');
    console.log('3. Vercel will automatically deploy the changes');
  } else {
    console.log('\n❌ Some deployment checks failed. Please fix the issues above before deploying.');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url.startsWith('file:')) {
  const modulePath = fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    main().catch(error => {
      console.error('❌ Deployment check failed:', error);
      process.exit(1);
    });
  }
}

export { main as vercelDeployCheck };
