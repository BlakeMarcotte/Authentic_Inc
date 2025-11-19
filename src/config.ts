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
 *
 * TO UPDATE THESE:
 * 1. Open http://154.85.41.14/#fontapp in your browser
 * 2. Press F12 to open DevTools
 * 3. Click the "Select Element" tool (top-left of DevTools)
 * 4. Click on each element below and copy the selector from DevTools
 */
export const selectors = {
  // Font creator page selectors
  fontCreator: {
    // Small canvas boxes in the main grid view
    // Use a simple canvas selector
    glyphBox: 'canvas',

    // When you click a box, the drawing interface opens with these elements:
    // Large canvas for actual drawing
    drawingCanvas: 'canvas',

    // "Done" button - confirms the drawing and closes the drawing interface
    doneButton: 'button:has-text("Done")',

    // "Next" button - moves to the next character after Done
    nextCharButton: 'button:has-text("Next")',

    // "Clear" button - clears the current drawing
    clearButton: 'button:has-text("Clear")',

    // "Undo" button - undoes last stroke
    undoButton: 'button:has-text("Undo")',

    // "Back" button - returns to main grid (class: fontcreater_btn)
    backButton: 'button.fontcreater_btn:has-text("Back")',

    // "Save Font" button at the top
    saveFontButton: 'button:has-text("Save Font")',

    // "Settings" button
    settingsButton: 'button:has-text("Settings")',

    // Next/Previous page buttons (for multi-page support later)
    nextPageButton: 'button:has-text("Next Page")',
    previousPageButton: 'button:has-text("Previous Page")',

    // Page indicator (shows "1 / 4")
    pageIndicator: 'text=/\\d+\\s*\\/\\s*\\d+/',
  },
};

/**
 * Character map - based on the visible layout in the screenshot
 * Page 1 visible characters: !, ", #, $, %, &, (, ), *, +, ,, -, ., /, 0-9, :, ;
 * This matches the order they appear in the UUNA grid (left-to-right, top-to-bottom)
 */
export const CHARACTER_MAP = {
  // Page 1 - Punctuation and digits (from screenshot)
  page1: [
    '!', '"', '#', '$', '%', '&', '(', ')', // Row 1 (some visible)
    '*', '+', ',', '-', '.', '/', '0', '1', '2', // Row 2
    '3', '4', '5', '6', '7', '8', '9', ':', ';', // Row 3
  ],

  // Note: Pages 2-4 likely contain:
  // - Uppercase letters A-Z
  // - Lowercase letters a-z
  // - Additional special characters
  // We'll add these as needed after testing page 1
};

/**
 * Get the expected index of a character in the UUNA grid for page 1
 * Returns -1 if character not found on page 1
 */
export function getCharacterIndex(char: string): number {
  const index = CHARACTER_MAP.page1.indexOf(char);
  return index;
}
