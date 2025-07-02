#!/usr/bin/env node

/**
 * Create placeholder icons for SoundSwitch Chrome Extension
 * Simple script that doesn't require canvas dependencies
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple 1x1 orange PNG as base64
const PLACEHOLDER_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'base64'
);

const ICON_SIZES = [16, 32, 48, 128];

async function createPlaceholderIcons() {
  console.log('🎨 Creating placeholder icons...');
  
  const iconsDir = path.join(__dirname, '..', 'icons');
  await fs.mkdir(iconsDir, { recursive: true });
  
  // Create icons with both naming conventions
  for (const size of ICON_SIZES) {
    // New naming format
    await fs.writeFile(
      path.join(iconsDir, `icon-${size}.png`),
      PLACEHOLDER_PNG
    );
    
    // Old naming format
    await fs.writeFile(
      path.join(iconsDir, `icon${size}.png`),
      PLACEHOLDER_PNG
    );
    
    console.log(`✅ Created placeholder icon-${size}.png and icon${size}.png`);
  }
  
  console.log('\n⚠️  These are placeholder icons!');
  console.log('To generate proper icons, either:');
  console.log('1. Open icons/generate_icons.html in a browser and save each canvas');
  console.log('2. Install canvas module and run: node scripts/generate-icons.js');
}

// Run the script
createPlaceholderIcons().catch(error => {
  console.error('❌ Error creating icons:', error.message);
  process.exit(1);
}); 