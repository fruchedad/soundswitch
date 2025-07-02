#!/usr/bin/env node

/**
 * Smoke test script for SoundSwitch extension
 * Basic validation of built extension
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Running smoke tests...');

// Check if dist directory exists
const distPath = path.join(__dirname, '..', 'dist');
try {
  await fs.access(distPath);
} catch {
  console.error('❌ dist directory not found. Run npm run build first.');
  process.exit(1);
}

// Check for required files
const requiredFiles = [
  'manifest.json',
  'background.js',
  'content.js',
  'popup.html',
  'popup.js',
  'content.css',
  'popup.css'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  const filePath = path.join(distPath, file);
  try {
    await fs.access(filePath);
    console.log(`✅ Found: ${file}`);
  } catch {
    console.error(`❌ Required file missing: ${file}`);
    allFilesExist = false;
  }
}

// Check manifest.json structure
try {
  const manifestPath = path.join(distPath, 'manifest.json');
  const manifestContent = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestContent);
  
  // Basic manifest validation
  const requiredFields = ['manifest_version', 'name', 'version', 'permissions'];
  for (const field of requiredFields) {
    if (!manifest[field]) {
      console.error(`❌ Missing required field in manifest: ${field}`);
      allFilesExist = false;
    }
  }
  
  if (manifest.manifest_version !== 3) {
    console.error('❌ Manifest version must be 3');
    allFilesExist = false;
  }
  
  console.log('✅ Manifest validation passed');
} catch (error) {
  console.error('❌ Failed to parse manifest.json:', error.message);
  allFilesExist = false;
}

// Check icons
const iconsPath = path.join(distPath, 'icons');
try {
  await fs.access(iconsPath);
  const iconFiles = await fs.readdir(iconsPath);
  const requiredIcons = ['icon-16.png', 'icon-32.png', 'icon-48.png', 'icon-128.png'];
  
  for (const icon of requiredIcons) {
    if (iconFiles.includes(icon)) {
      console.log(`✅ Found icon: ${icon}`);
    } else {
      console.warn(`⚠️  Missing icon: ${icon}`);
    }
  }
} catch {
  console.warn('⚠️  Icons directory not found');
}

if (allFilesExist) {
  console.log('✅ All smoke tests passed!');
  process.exit(0);
} else {
  console.error('❌ Some smoke tests failed');
  process.exit(1);
} 