// This file re-exports everything from authService.supabase.js
// This ensures backward compatibility with any imports that still reference authService.js

export * from './authService.supabase.js';

// We don't need to export a default since we're re-exporting everything