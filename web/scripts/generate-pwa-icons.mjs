#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Generate all required icons
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
sizes.forEach(size => {
  const svg = createSVGIcon(size);
  const filePath = path.join(iconsDir, `icon-${size}x${size}.png`);
  
  // For now, we'll create SVG files and note that PNG conversion is needed
  const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`Generated ${svgPath}`);
});

// Create shortcut icons
const createShortcutIcon = (name, size) => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-${name}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad-${name})"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Arial, sans-serif" font-size="${size * 0.3}" font-weight="bold">${name.charAt(0).toUpperCase()}</text>
</svg>`;
};

// Generate shortcut icons
const shortcuts = ['create', 'mypolls'];
shortcuts.forEach(name => {
  const svg = createShortcutIcon(name, 96);
  const filePath = path.join(iconsDir, `shortcut-${name}.svg`);
  fs.writeFileSync(filePath, svg);
  console.log(`Generated ${filePath}`);
});

// Create action icons for notifications
const createActionIcon = (name, size) => {
  const icons = {
    view: `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="#3b82f6"/>
      <path d="M ${size*0.3} ${size*0.4} L ${size*0.5} ${size*0.6} L ${size*0.7} ${size*0.4}" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    dismiss: `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="#ef4444"/>
      <path d="M ${size*0.3} ${size*0.3} L ${size*0.7} ${size*0.7} M ${size*0.7} ${size*0.3} L ${size*0.3} ${size*0.7}" stroke="white" stroke-width="3" stroke-linecap="round"/>
    </svg>`
  };
  return icons[name] || icons.view;
};

// Generate action icons
const actions = ['view', 'dismiss'];
actions.forEach(name => {
  const svg = createActionIcon(name, 24);
  const filePath = path.join(iconsDir, `action-${name}.svg`);
  fs.writeFileSync(filePath, svg);
  console.log(`Generated ${filePath}`);
});

console.log('\nPWA icons generated successfully!');
console.log('Generated files:');
console.log('- Main app icons (72x72 to 512x512)');
console.log('- Shortcut icons (create, mypolls)');
console.log('- Action icons (view, dismiss)');
console.log('\nNote: These are SVG files. For production, convert to PNG format.');
console.log('You can use tools like ImageMagick or online converters to convert SVG to PNG.');
