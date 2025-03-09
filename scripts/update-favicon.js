// Script to update the favicon for TaskPilot with Telegram integration
const fs = require('fs');
const path = require('path');

// Define the SVG content for the new favicon
// This keeps the TaskPilot checkmark but adds a subtle Telegram blue gradient
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#0088cc" />
    </linearGradient>
  </defs>
  <path d="M0 0h24v24H0z" fill="none"/>
  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="url(#gradient)"/>
</svg>`;

// Path to the favicon file
const faviconPath = path.join(__dirname, '..', 'public', 'favicon.svg');

// Write the new favicon
try {
  fs.writeFileSync(faviconPath, svgContent);
  console.log(`New favicon generated at: ${faviconPath}`);
  console.log('The favicon now uses a gradient from TaskPilot blue to Telegram blue.');
  console.log('Refresh your browser to see the updated favicon.');
} catch (error) {
  console.error('Error writing favicon:', error);
  console.log('\nIf the script fails, you can manually update the favicon by:');
  console.log('1. Opening public/favicon.svg in a text editor');
  console.log('2. Replacing its contents with:');
  console.log('\n' + svgContent + '\n');
}
