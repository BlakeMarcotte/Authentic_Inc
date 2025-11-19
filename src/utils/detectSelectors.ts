#!/usr/bin/env node

/**
 * Selector Detection Helper
 *
 * This script opens the UUNA Font Creator and helps you identify
 * the correct selectors for the drawing boxes and buttons.
 *
 * Usage: npm run detect-selectors
 */

import { chromium } from 'playwright';
import { config } from '../config';
import { logger } from './logger';

async function detectSelectors() {
  logger.info('Starting selector detection...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  try {
    logger.info(`Navigating to: ${config.baseUrl}`);
    await page.goto(config.baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    logger.info('\n' + '='.repeat(60));
    logger.info('SELECTOR DETECTION RESULTS');
    logger.info('='.repeat(60) + '\n');

    // Test different possible selectors for drawing boxes
    const possibleBoxSelectors = [
      'canvas.fontcreater_canvas',  // CORRECT for UUNA
      'canvas',
      'canvas.glyph',
      'canvas.char',
      'canvas.drawing',
      'div.glyph-box canvas',
      'div.char-box canvas',
      'svg',
      'svg.drawing-area',
      '[data-char]',
      '[data-glyph]',
      '.glyph-container > *',
      '.char-grid > *',
    ];

    logger.info('Testing possible selectors for DRAWING BOXES:\n');

    for (const selector of possibleBoxSelectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > 0) {
          logger.success(`✓ "${selector}" - Found ${count} elements`);

          // Highlight the first few elements
          if (count >= 3) {
            await page.evaluate((sel) => {
              const elements = document.querySelectorAll(sel);
              elements.forEach((el, index) => {
                if (index < 3 && el instanceof HTMLElement) {
                  el.style.border = '3px solid lime';
                  el.style.boxShadow = '0 0 10px lime';
                }
              });
            }, selector);
            logger.info(`  → Highlighted first 3 elements in GREEN`);
          }
        }
      } catch (e) {
        // Invalid selector, skip
      }
    }

    logger.info('\n' + '-'.repeat(60) + '\n');

    // Test possible selectors for Save Font button
    const possibleButtonSelectors = [
      'button:has-text("Save Font")',
      'button:has-text("Save")',
      '#saveBtn',
      '#saveFontBtn',
      'button.save',
      'button.save-font',
      'button[onclick*="save"]',
      'input[type="button"][value*="Save"]',
    ];

    logger.info('Testing possible selectors for SAVE FONT BUTTON:\n');

    for (const selector of possibleButtonSelectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > 0) {
          logger.success(`✓ "${selector}" - Found ${count} element(s)`);

          // Highlight the button
          await page.evaluate((sel) => {
            const button = document.querySelector(sel);
            if (button instanceof HTMLElement) {
              button.style.border = '3px solid orange';
              button.style.boxShadow = '0 0 15px orange';
            }
          }, selector);
          logger.info(`  → Highlighted in ORANGE`);
        }
      } catch (e) {
        // Invalid selector, skip
      }
    }

    logger.info('\n' + '='.repeat(60));
    logger.info('INSTRUCTIONS:');
    logger.info('='.repeat(60) + '\n');
    logger.info('1. Look at the browser window');
    logger.info('2. GREEN borders = drawing boxes found');
    logger.info('3. ORANGE border = Save Font button found');
    logger.info('4. Copy the selector that works and update src/config.ts\n');
    logger.info('The browser will stay open for 30 seconds...\n');

    await page.waitForTimeout(30000);

  } catch (error) {
    logger.error('Error during detection:');
    console.error(error);
  } finally {
    await browser.close();
    logger.info('Browser closed');
  }
}

detectSelectors();
