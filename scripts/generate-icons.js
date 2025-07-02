#!/usr/bin/env node

/**
 * Generate icons for SoundSwitch Chrome Extension
 */

const { createCanvas } = require('canvas');
const fs = require('fs').promises;
const path = require('path');

// Icon sizes required by Chrome extensions
const ICON_SIZES = [16, 32, 48, 128];

/**
 * Draw the SoundSwitch icon
 */
function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#ff6b35');
  gradient.addColorStop(1, '#ff4500');
  
  // Draw rounded rectangle background
  const radius = size * 0.2;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();
  
  // Add shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = size * 0.1;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = size * 0.05;
  
  // Draw "S" for SoundSwitch
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('S', size / 2, size / 2 + 1);
  
  return canvas.toBuffer('image/png');
}

/**
 * Generate all icon sizes
 */
async function generateIcons() {
  console.log('🎨 Generating SoundSwitch icons...');
  
  // Ensure icons directory exists
  const iconsDir = path.join(__dirname, '..', 'icons');
  await fs.mkdir(iconsDir, { recursive: true });
  
  // Generate each icon size
  for (const size of ICON_SIZES) {
    const buffer = drawIcon(size);
    const filename = `icon-${size}.png`;
    const filepath = path.join(iconsDir, filename);
    
    await fs.writeFile(filepath, buffer);
    console.log(`✅ Generated ${filename}`);
  }
  
  // Also generate the old naming format for compatibility
  const oldNames = {
    16: 'icon16.png',
    32: 'icon32.png',
    48: 'icon48.png',
    128: 'icon128.png'
  };
  
  for (const [size, filename] of Object.entries(oldNames)) {
    const buffer = drawIcon(parseInt(size));
    const filepath = path.join(iconsDir, filename);
    await fs.writeFile(filepath, buffer);
    console.log(`✅ Generated ${filename} (legacy)`);
  }
  
  console.log('\n🎉 All icons generated successfully!');
}

// Check if canvas module is installed
async function checkDependencies() {
  try {
    require('canvas');
    return true;
  } catch (error) {
    console.error('❌ Missing dependency: canvas');
    console.log('\nPlease install the canvas module:');
    console.log('  npm install canvas');
    console.log('\nNote: canvas requires system dependencies.');
    console.log('On macOS: brew install pkg-config cairo pango libpng jpeg giflib librsvg');
    return false;
  }
}

// Run the generator
(async () => {
  if (!await checkDependencies()) {
    process.exit(1);
  }
  
  try {
    await generateIcons();
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
})(); 