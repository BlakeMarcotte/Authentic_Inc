#!/usr/bin/env node

import { FontCreatorClient } from './automation/fontCreatorClient';
import { readGlyphData } from './utils/fileReader';
import { logger } from './utils/logger';
import { config } from './config';
import { UUNACredentials } from './types';

/**
 * CLI entrypoint for UUNA Font Creator automation
 *
 * Usage:
 *   npm run draw <glyph-file.json> [username] [password]
 *   ts-node src/index.ts <glyph-file.json> [username] [password]
 *
 * Examples:
 *   npm run draw test-data/sample-glyphs.json
 *   npm run draw customer-fonts/john-doe.json myuser mypass
 */

async function main() {
  const args = process.argv.slice(2);

  // Show usage if no arguments provided
  if (args.length === 0) {
    console.log(`
UUNA Font Creator Automation
=============================

Usage:
  npm run draw <glyph-file.json> [username] [password]

Arguments:
  glyph-file.json  Path to JSON file with font data (required)
  username         UUNA account username (optional, will prompt if needed)
  password         UUNA account password (optional, will prompt if needed)

Examples:
  npm run draw test-data/sample-glyphs.json
  npm run draw customer-fonts/john-doe.json myuser mypass

Configuration:
  Edit src/config.ts to customize:
  - UUNA Font Creator URL
  - DOM selectors for login and drawing
  - Timeouts and delays
  - Headless mode (currently: ${config.headless ? 'ON' : 'OFF'})

Note:
  Before running, you MUST inspect the UUNA Font Creator web app
  and update the selectors in src/config.ts to match the actual DOM.
    `);
    process.exit(0);
  }

  const glyphFilePath = args[0];

  // Get credentials (for now, from command line or hardcoded)
  // In production, you might want to use environment variables or a secure config
  const credentials: UUNACredentials = {
    username: args[1] || process.env.UUNA_USERNAME || '',
    password: args[2] || process.env.UUNA_PASSWORD || '',
  };

  // Validate credentials are provided
  if (!credentials.username || !credentials.password) {
    logger.error('Credentials not provided!');
    console.log(`
Please provide credentials in one of these ways:
1. Command line arguments:
   npm run draw ${glyphFilePath} <username> <password>

2. Environment variables:
   set UUNA_USERNAME=your-username
   set UUNA_PASSWORD=your-password
   npm run draw ${glyphFilePath}

3. Hardcode them in src/index.ts (not recommended for production)
    `);
    process.exit(1);
  }

  try {
    // Read and validate glyph data
    const fontData = readGlyphData(glyphFilePath);

    // Create the client
    const client = new FontCreatorClient(config);

    // Run the automation
    await client.createFont(fontData, credentials);

    logger.success('\n✓ Font creation completed successfully!\n');
    process.exit(0);
  } catch (error) {
    logger.error('\n✗ Font creation failed\n');

    if (error instanceof Error) {
      logger.error(`Error: ${error.message}`);

      if (config.verbose && error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    }

    process.exit(1);
  }
}

// Run the CLI
main();
