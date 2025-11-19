#!/usr/bin/env node

import { FontCreatorClient } from './automation/fontCreatorClient';
import { readGlyphData } from './utils/fileReader';
import { logger } from './utils/logger';
import { config } from './config';

/**
 * CLI entrypoint for UUNA Font Creator automation
 *
 * Usage:
 *   npm run draw <glyph-file.json>
 *   ts-node src/index.ts <glyph-file.json>
 *
 * Examples:
 *   npm run draw test-data/sample-glyphs.json
 *   npm run draw test-data/simple-test.json
 */

async function main() {
  const args = process.argv.slice(2);

  // Show usage if no arguments provided
  if (args.length === 0) {
    console.log(`
UUNA Font Creator Automation
=============================

Usage:
  npm run draw <glyph-file.json>

Arguments:
  glyph-file.json  Path to JSON file with font data (required)

Examples:
  npm run draw test-data/sample-glyphs.json
  npm run draw test-data/simple-test.json

Configuration:
  Edit src/config.ts to customize:
  - UUNA Font Creator URL (currently: ${config.baseUrl})
  - DOM selectors for drawing boxes and buttons
  - Timeouts and delays
  - Headless mode (currently: ${config.headless ? 'ON' : 'OFF'})

How it works:
  1. Browser launches (you have 10 seconds to log in)
  2. Script navigates to ${config.baseUrl}
  3. Automation draws all glyphs from your JSON file
  4. Clicks "Save Font" when done

IMPORTANT - Before First Run:
  1. Make sure the selectors in src/config.ts match your UUNA app
  2. The browser will give you 10 seconds to log in after launch
  3. The script will then navigate to the font creator page automatically
    `);
    process.exit(0);
  }

  const glyphFilePath = args[0];

  try {
    // Read and validate glyph data
    const fontData = readGlyphData(glyphFilePath);

    // Create the client
    const client = new FontCreatorClient(config);

    // Run the automation
    await client.createFont(fontData);

    logger.success('\n✓ Font automation completed successfully!\n');
    process.exit(0);
  } catch (error) {
    logger.error('\n✗ Font automation failed\n');

    if (error instanceof Error) {
      logger.error(`Error: ${error.message}`);

      if (config.verbose && error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    }

    logger.info('\nTroubleshooting:');
    logger.info('1. Check that selectors in src/config.ts match the actual DOM');
    logger.info('2. Inspect elements in the browser (F12) to find correct selectors');
    logger.info('3. Make sure the drawing boxes are visible when you run this');

    process.exit(1);
  }
}

// Run the CLI
main();
