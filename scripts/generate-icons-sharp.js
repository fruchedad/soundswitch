#!/usr/bin/env node

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICON_SIZES = [16, 32, 48, 128];
const OUTPUT_DIR = path.join(__dirname, '..', 'icons');

// SVG template for the icon
const createSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF8C00;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FF4500;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="${size * 0.02}"/>
      <feOffset dx="${size * 0.02}" dy="${size * 0.02}" result="offsetblur"/>
      <feFlood flood-color="#000000" flood-opacity="0.3"/>
      <feComposite in2="offsetblur" operator="in"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.45}" fill="url(#grad)" filter="url(#shadow)"/>
  
  <!-- Sound wave icon -->
  <g transform="translate(${size/2}, ${size/2})">
    <!-- Speaker cone -->
    <path d="M ${-size * 0.15} ${-size * 0.1} 
             L ${-size * 0.05} ${-size * 0.15} 
             L ${-size * 0.05} ${size * 0.15} 
             L ${-size * 0.15} ${size * 0.1} 
             Z" 
          fill="white" opacity="0.9"/>
    
    <!-- Sound waves -->
    <path d="M ${size * 0.05} ${-size * 0.08} 
             Q ${size * 0.15} 0 ${size * 0.05} ${size * 0.08}" 
          stroke="white" stroke-width="${size * 0.03}" fill="none" opacity="0.8"/>
    <path d="M ${size * 0.05} ${-size * 0.15} 
             Q ${size * 0.25} 0 ${size * 0.05} ${size * 0.15}" 
          stroke="white" stroke-width="${size * 0.03}" fill="none" opacity="0.6"/>
    
    <!-- Switch indicator -->
    <circle cx="${size * 0.15}" cy="0" r="${size * 0.06}" fill="white" opacity="0.9"/>
    <circle cx="${size * 0.15}" cy="0" r="${size * 0.03}" fill="#FF4500"/>
  </g>
</svg>
`;

async function generateIcons() {
  console.log('🎨 Generating SoundSwitch icons with sharp...\n');

  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  for (const size of ICON_SIZES) {
    const svgContent = createSvg(size);
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}.png`);
    
    try {
      // Convert SVG to PNG using sharp
      await sharp(Buffer.from(svgContent))
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated ${outputPath}`);
    } catch (error) {
      console.error(`❌ Error generating icon-${size}.png:`, error.message);
    }
  }
  
  // Also create icon16.png, icon32.png, etc. (without dash) for compatibility
  console.log('\n📋 Creating compatibility copies...');
  for (const size of ICON_SIZES) {
    const sourcePath = path.join(OUTPUT_DIR, `icon-${size}.png`);
    const destPath = path.join(OUTPUT_DIR, `icon${size}.png`);
    
    try {
      await fs.copyFile(sourcePath, destPath);
      console.log(`✅ Created ${destPath}`);
    } catch (error) {
      console.error(`❌ Error creating ${destPath}:`, error.message);
    }
  }

  console.log('\n🎉 Icon generation complete!');
}

// Run the generator
generateIcons().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 