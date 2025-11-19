import { AutomationConfig } from './types';

/**
 * Base configuration for UUNA Font Creator automation
 */
export const config: AutomationConfig = {
  // Set to false during development to see what's happening
  headless: false,

  // UUNA Font Creator URL (update this with the actual URL when testing)
  baseUrl: 'http://154.85.41.14/#fontapp',

  // Timeouts in milliseconds
  timeout: 30000, // 30 seconds for page loads and element waits

  // Drawing delay for smoother mouse movements (adjust as needed)
  drawingDelay: 5, // 5ms between points

  // Enable verbose logging
  verbose: true,
};

/**
 * DOM Selectors for UUNA Font Creator
 * These will need to be updated based on actual inspection of the web app
 *
 * IMPORTANT: Inspect the UUNA web app and update these selectors!
 */
export const selectors = {
  // Login page selectors
  login: {
    usernameInput: 'input[name="username"]', // Update after inspecting
    passwordInput: 'input[name="password"]', // Update after inspecting
    submitButton: 'button[type="submit"]',   // Update after inspecting
  },

  // Font creator page selectors
  fontCreator: {
    // Container for all glyph canvases/boxes
    glyphContainer: '.glyph-container',      // Update after inspecting

    // Individual glyph canvas or drawing area
    // May need to be more specific, e.g., 'canvas.glyph-canvas'
    glyphCanvas: 'canvas',                   // Update after inspecting

    // The glyph boxes might have data attributes like data-char="A"
    glyphBox: '[data-char]',                 // Update after inspecting

    // Save font button
    saveFontButton: 'button.save-font',      // Update after inspecting

    // Font name input field
    fontNameInput: 'input[name="fontName"]', // Update after inspecting
  },
};

/**
 * Character map - defines the order and which characters are in which positions
 * This may need to be updated based on how UUNA organizes the glyph grid
 */
export const CHARACTER_MAP = {
  // Uppercase letters
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),

  // Lowercase letters
  lowercase: 'abcdefghijklmnopqrstuvwxyz'.split(''),

  // Digits
  digits: '0123456789'.split(''),

  // Common punctuation
  punctuation: [' ', '.', ',', '!', '?', ';', ':', "'", '"', '-', '(', ')'],
};

/**
 * Get the expected index of a character in the UUNA grid
 * This assumes a specific layout - will need to be adjusted based on actual app
 */
export function getCharacterIndex(char: string): number {
  const allChars = [
    ...CHARACTER_MAP.uppercase,
    ...CHARACTER_MAP.lowercase,
    ...CHARACTER_MAP.digits,
    ...CHARACTER_MAP.punctuation,
  ];

  const index = allChars.indexOf(char);
  if (index === -1) {
    throw new Error(`Character '${char}' not found in character map`);
  }

  return index;
}
