#!/usr/bin/env node

/**
 * Custom build script for SoundSwitch Chrome Extension
 * Handles TypeScript compilation and Chrome extension bundling
 */

import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

// Utility functions
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset}  ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset}  ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset}  ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset}  ${msg}`),
};

async function clean() {
  log.info('Cleaning dist directory...');
  await fs.rm('dist', { recursive: true, force: true });
  await fs.mkdir('dist', { recursive: true });
  log.success('Cleaned dist directory');
}

async function compileTypeScript() {
  log.info('Compiling TypeScript...');
  try {
    execSync('npx tsc --project tsconfig.build.json', { stdio: 'inherit' });
    log.success('TypeScript compilation complete');
  } catch (error) {
    log.error('TypeScript compilation failed');
    throw error;
  }
}

async function bundleExtension() {
  log.info('Bundling extension files...');
  
  // Copy manifest
  await fs.copyFile('manifest.json', 'dist/manifest.json');
  
  // Copy HTML files
  await fs.copyFile('src/popup/index.html', 'dist/popup.html');
  
  // Copy CSS files
  await fs.copyFile('src/content.css', 'dist/content.css');
  await fs.copyFile('src/popup/popup.css', 'dist/popup.css');
  
  // Copy and process JavaScript files
  // The TypeScript compiler outputs to dist/src, so we need to move files
  await fs.rename('dist/src/background/index.js', 'dist/background.js');
  await fs.rename('dist/src/content/index.js', 'dist/content.js');
  await fs.rename('dist/src/popup/popup.js', 'dist/popup.js');
  
  // Copy icons
  await fs.mkdir('dist/icons', { recursive: true });
  const iconDir = await fs.readdir('icons');
  for (const icon of iconDir) {
    if (icon.endsWith('.png')) {
      await fs.copyFile(`icons/${icon}`, `dist/icons/${icon}`);
    }
  }
  
  // Clean up temporary directories
  await fs.rm('dist/src', { recursive: true, force: true });
  
  log.success('Extension bundled successfully');
}

async function createProductionManifest() {
  log.info('Processing manifest for production...');
  
  const manifest = JSON.parse(await fs.readFile('dist/manifest.json', 'utf8'));
  
  // Update version from package.json
  const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
  manifest.version = packageJson.version;
  
  // Ensure all file references are correct
  manifest.background.service_worker = 'background.js';
  manifest.content_scripts[0].js = ['content.js'];
  manifest.content_scripts[0].css = ['content.css'];
  manifest.action.default_popup = 'popup.html';
  
  await fs.writeFile('dist/manifest.json', JSON.stringify(manifest, null, 2));
  log.success('Manifest processed');
}

async function validateBuild() {
  log.info('Validating build...');
  
  const requiredFiles = [
    'manifest.json',
    'background.js',
    'content.js',
    'content.css',
    'popup.html',
    'popup.js',
    'popup.css',
  ];
  
  let valid = true;
  for (const file of requiredFiles) {
    try {
      await fs.access(`dist/${file}`);
      log.success(`Found: ${file}`);
    } catch {
      log.error(`Missing: ${file}`);
      valid = false;
    }
  }
  
  if (!valid) {
    throw new Error('Build validation failed');
  }
  
  log.success('Build validation passed');
}

async function build() {
  console.log(`\n${colors.bright}🚀 Building SoundSwitch Chrome Extension${colors.reset}\n`);
  
  try {
    await clean();
    await compileTypeScript();
    await bundleExtension();
    await createProductionManifest();
    await validateBuild();
    
    console.log(`\n${colors.green}${colors.bright}✅ Build completed successfully!${colors.reset}`);
    console.log(`\n📦 Extension ready in ${colors.bright}dist/${colors.reset} directory\n`);
  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}❌ Build failed:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Create TypeScript build config if it doesn't exist
async function createTsConfig() {
  const tsConfigBuild = {
    compilerOptions: {
      target: 'ES2022',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      module: 'ES2022',
      moduleResolution: 'node',
      resolveJsonModule: true,
      isolatedModules: true,
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true,
      esModuleInterop: true,
      forceConsistentCasingInFileNames: true,
      allowSyntheticDefaultImports: true,
      types: ['chrome'],
      outDir: 'dist',
      rootDir: '.',
      sourceMap: true,
      declaration: false,
      skipLibCheck: true
    },
    include: ['src/**/*.ts'],
    exclude: ['node_modules', 'dist', 'test', '**/*.test.ts']
  };
  
  await fs.writeFile('tsconfig.build.json', JSON.stringify(tsConfigBuild, null, 2));
}

// Run build
(async () => {
  await createTsConfig();
  await build();
})(); 