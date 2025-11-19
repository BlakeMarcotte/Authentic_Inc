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

    // "Back" button - returns to main grid
    backButton: 'button.fontcreater_btn:has-text("Back")',

    // "Save Font" button at the top
    saveFontButton: 'button:has-text("Save Font")',

    // "Ok" button on success dialog after saving
    okButton: 'button:has-text("Ok")',
  },
};
