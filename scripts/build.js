#!/usr/bin/env node

/**
 * Optimized build script for SoundSwitch Chrome Extension
 * Handles TypeScript compilation, bundling, and performance optimization
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
  cyan: '\x1b[36m',
};

// Build metrics
const buildMetrics = {
  startTime: Date.now(),
  bundleSizes: {},
  compressionRatios: {},
  buildSteps: []
};

// Utility functions
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset}  ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset}  ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset}  ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset}  ${msg}`),
  step: (msg) => console.log(`${colors.cyan}▶${colors.reset}  ${msg}`),
};

async function clean() {
  const stepStart = Date.now();
  log.step('Cleaning dist directory...');
  
  await fs.rm('dist', { recursive: true, force: true });
  await fs.mkdir('dist', { recursive: true });
  
  buildMetrics.buildSteps.push({
    name: 'Clean',
    duration: Date.now() - stepStart
  });
  
  log.success('Cleaned dist directory');
}

async function compileTypeScript() {
  const stepStart = Date.now();
  log.step('Compiling TypeScript with optimizations...');
  
  try {
    // Use production TypeScript configuration
    const tsConfigContent = {
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
        sourceMap: process.env.NODE_ENV === 'development',
        declaration: false,
        skipLibCheck: true,
        removeComments: true,
        importsNotUsedAsValues: 'remove',
        experimentalDecorators: false
      },
      include: ['src/**/*.ts'],
      exclude: ['node_modules', 'dist', 'test', '**/*.test.ts', '**/*.spec.ts']
    };
    
    await fs.writeFile('tsconfig.build.json', JSON.stringify(tsConfigContent, null, 2));
    
    execSync('npx tsc --project tsconfig.build.json', { stdio: 'inherit' });
    
    buildMetrics.buildSteps.push({
      name: 'TypeScript Compilation',
      duration: Date.now() - stepStart
    });
    
    log.success('TypeScript compilation complete');
  } catch (error) {
    log.error('TypeScript compilation failed');
    throw error;
  }
}

async function optimizeJavaScript() {
  const stepStart = Date.now();
  log.step('Optimizing JavaScript files...');
  
  try {
    const jsFiles = [
      { name: 'background.js', path: 'dist/src/background/index.js' },
      { name: 'content.js', path: 'dist/src/content/index.js' },
      { name: 'popup.js', path: 'dist/src/popup/popup.js' }
    ];
    
    for (const { name, path: filePath } of jsFiles) {
      const outputPath = `dist/${name}`;
      
      if (await fileExists(filePath)) {
        let content = await fs.readFile(filePath, 'utf8');
        
        // Basic optimizations
        content = await optimizeCode(content);
        
        await fs.writeFile(outputPath, content);
        
        // Track file sizes
        const stats = await fs.stat(outputPath);
        buildMetrics.bundleSizes[name] = stats.size;
      } else {
        log.warning(`File not found: ${filePath}`);
      }
    }
    
    buildMetrics.buildSteps.push({
      name: 'JavaScript Optimization',
      duration: Date.now() - stepStart
    });
    
    log.success('JavaScript optimization complete');
  } catch (error) {
    log.error('JavaScript optimization failed');
    throw error;
  }
}

async function optimizeCode(content) {
  // Remove console.log statements in production
  if (process.env.NODE_ENV === 'production') {
    content = content.replace(/console\.(log|debug|info)\([^)]*\);?/g, '');
  }
  
  // Remove unnecessary whitespace and comments
  content = content
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/\/\/.*$/gm, '') // Remove line comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
  
  return content;
}

async function bundleExtension() {
  const stepStart = Date.now();
  log.step('Bundling extension files...');
  
  // Copy manifest with optimization
  await copyAndOptimizeManifest();
  
  // Copy and optimize HTML files
  await copyAndOptimizeHTML();
  
  // Copy and optimize CSS files
  await copyAndOptimizeCSS();
  
  // Copy icons with compression analysis
  await copyIcons();
  
  // Clean up temporary directories
  await fs.rm('dist/src', { recursive: true, force: true });
  
  buildMetrics.buildSteps.push({
    name: 'Extension Bundling',
    duration: Date.now() - stepStart
  });
  
  log.success('Extension bundled successfully');
}

async function copyAndOptimizeManifest() {
  const manifest = JSON.parse(await fs.readFile('manifest.json', 'utf8'));
  
  // Update version from package.json
  const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
  manifest.version = packageJson.version;
  
  // Ensure all file references are correct
  manifest.background.service_worker = 'background.js';
  manifest.content_scripts[0].js = ['content.js'];
  manifest.content_scripts[0].css = ['content.css'];
  manifest.action.default_popup = 'popup.html';
  
  // Add performance hints for production
  if (process.env.NODE_ENV === 'production') {
    manifest.content_scripts[0].run_at = 'document_idle';
  }
  
  await fs.writeFile('dist/manifest.json', JSON.stringify(manifest, null, 2));
}

async function copyAndOptimizeHTML() {
  const htmlContent = await fs.readFile('src/popup/index.html', 'utf8');
  
  // Basic HTML optimization
  let optimized = htmlContent;
  if (process.env.NODE_ENV === 'production') {
    optimized = htmlContent
      .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/> </g, '><'); // Remove space between tags
  }
  
  await fs.writeFile('dist/popup.html', optimized);
}

async function copyAndOptimizeCSS() {
  const cssFiles = [
    { src: 'src/content.css', dest: 'dist/content.css' },
    { src: 'src/popup/popup.css', dest: 'dist/popup.css' }
  ];
  
  for (const { src, dest } of cssFiles) {
    if (await fileExists(src)) {
      let content = await fs.readFile(src, 'utf8');
      
      // Basic CSS optimization
      if (process.env.NODE_ENV === 'production') {
        content = content
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
          .replace(/\s+/g, ' ') // Collapse whitespace
          .replace(/; /g, ';') // Remove space after semicolons
          .replace(/ {/g, '{') // Remove space before braces
          .trim();
      }
      
      await fs.writeFile(dest, content);
      
      // Track file size
      const stats = await fs.stat(dest);
      buildMetrics.bundleSizes[path.basename(dest)] = stats.size;
    }
  }
}

async function copyIcons() {
  await fs.mkdir('dist/icons', { recursive: true });
  const iconDir = await fs.readdir('icons');
  let totalIconSize = 0;
  
  for (const icon of iconDir) {
    if (icon.endsWith('.png')) {
      await fs.copyFile(`icons/${icon}`, `dist/icons/${icon}`);
      const stats = await fs.stat(`dist/icons/${icon}`);
      totalIconSize += stats.size;
    }
  }
  
  buildMetrics.bundleSizes['icons'] = totalIconSize;
}

async function createProductionManifest() {
  const stepStart = Date.now();
  log.step('Processing manifest for production...');
  
  const manifest = JSON.parse(await fs.readFile('dist/manifest.json', 'utf8'));
  
  // Add production optimizations
  if (process.env.NODE_ENV === 'production') {
    // Optimize content script injection
    if (manifest.content_scripts) {
      manifest.content_scripts.forEach(script => {
        script.run_at = 'document_idle';
        script.all_frames = false; // Better performance
      });
    }
  }
  
  await fs.writeFile('dist/manifest.json', JSON.stringify(manifest, null, 2));
  
  buildMetrics.buildSteps.push({
    name: 'Manifest Processing',
    duration: Date.now() - stepStart
  });
  
  log.success('Manifest processed');
}

async function validateBuild() {
  const stepStart = Date.now();
  log.step('Validating build...');
  
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
      const stats = await fs.stat(`dist/${file}`);
      buildMetrics.bundleSizes[file] = buildMetrics.bundleSizes[file] || stats.size;
      log.success(`Found: ${file} (${formatBytes(stats.size)})`);
    } catch {
      log.error(`Missing: ${file}`);
      valid = false;
    }
  }
  
  if (!valid) {
    throw new Error('Build validation failed');
  }
  
  buildMetrics.buildSteps.push({
    name: 'Build Validation',
    duration: Date.now() - stepStart
  });
  
  log.success('Build validation passed');
}

async function generateBuildReport() {
  const stepStart = Date.now();
  log.step('Generating build report...');
  
  const totalSize = Object.values(buildMetrics.bundleSizes).reduce((a, b) => a + b, 0);
  const totalDuration = Date.now() - buildMetrics.startTime;
  
  const report = {
    timestamp: new Date().toISOString(),
    totalDuration,
    totalSize,
    bundleSizes: buildMetrics.bundleSizes,
    buildSteps: buildMetrics.buildSteps,
    environment: process.env.NODE_ENV || 'development'
  };
  
  // Write report to file
  await fs.writeFile('dist/build-report.json', JSON.stringify(report, null, 2));
  
  // Console report
  console.log(`\n${colors.bright}📊 Build Report${colors.reset}`);
  console.log(`${colors.cyan}Total build time:${colors.reset} ${totalDuration}ms`);
  console.log(`${colors.cyan}Total bundle size:${colors.reset} ${formatBytes(totalSize)}\n`);
  
  console.log(`${colors.bright}📦 Bundle Sizes:${colors.reset}`);
  Object.entries(buildMetrics.bundleSizes).forEach(([file, size]) => {
    console.log(`  ${file}: ${formatBytes(size)}`);
  });
  
  console.log(`\n${colors.bright}⏱️  Build Steps:${colors.reset}`);
  buildMetrics.buildSteps.forEach(step => {
    console.log(`  ${step.name}: ${step.duration}ms`);
  });
  
  buildMetrics.buildSteps.push({
    name: 'Build Report',
    duration: Date.now() - stepStart
  });
}

async function build() {
  console.log(`\n${colors.bright}🚀 Building SoundSwitch Chrome Extension${colors.reset}\n`);
  
  try {
    await clean();
    await compileTypeScript();
    await optimizeJavaScript();
    await bundleExtension();
    await createProductionManifest();
    await validateBuild();
    await generateBuildReport();
    
    console.log(`\n${colors.green}${colors.bright}✅ Build completed successfully!${colors.reset}`);
    console.log(`\n📦 Extension ready in ${colors.bright}dist/${colors.reset} directory\n`);
  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}❌ Build failed:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Utility functions
async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run build
(async () => {
  // Set production environment if not specified
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }
  
  await build();
})(); 