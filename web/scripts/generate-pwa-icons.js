#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create a simple SVG icon for PWA
const createSVGIcon = (size) => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <circle cx="${size * 0.5}" cy="${size * 0.4}" r="${size * 0.15}" fill="white" opacity="0.9"/>
  <path d="M ${size * 0.35} ${size * 0.6} L ${size * 0.5} ${size * 0.75} L ${size * 0.65} ${size * 0.6}" stroke="white" stroke-width="${size * 0.03}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
};

// Ensure icons directory exists
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate icons
const sizes = [192, 512];
sizes.forEach(size => {
  const svg = createSVGIcon(size);
  const filePath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(filePath, svg);
  console.log(`Generated ${filePath}`);
});

console.log('PWA icons generated successfully!');
console.log('Note: For production, replace these with proper PNG icons.');
