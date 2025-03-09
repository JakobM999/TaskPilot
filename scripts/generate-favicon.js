// Script to generate a new favicon for TaskPilot with Telegram integration
const fs = require('fs');
const path = require('path');

// Define the SVG content for the new favicon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#0088cc" />
    </linearGradient>
  </defs>
  <circle cx="12" cy="12" r="11" fill="url(#gradient)" />
  <!-- Checkmark (TaskPilot) -->
  <path d="M8.5 12.5l2 2 5-5" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
  <!-- Paper airplane (Telegram) -->
  <path d="M17 8l-7.5 3.5L12 15l1.5-2.5L17 8z" fill="white" />
</svg>`;

// Path to the favicon file
const faviconPath = path.join(__dirname, '..', 'public', 'favicon.svg');

// Write the new favicon
fs.writeFileSync(faviconPath, svgContent);

console.log(`New favicon generated at: ${faviconPath}`);
console.log('The favicon now includes both TaskPilot and Telegram elements.');
