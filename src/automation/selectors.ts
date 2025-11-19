import { Page, Locator } from 'playwright';
import { BoundingBox } from '../types';
import { logger } from '../utils/logger';

/**
 * Helper functions for finding and interacting with DOM elements
 */

/**
 * Gets the bounding box of an element
 */
export async function getBoundingBox(locator: Locator): Promise<BoundingBox> {
  const box = await locator.boundingBox();

  if (!box) {
    throw new Error('Could not get bounding box for element');
  }

  return {
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
  };
}

/**
 * Finds all glyph canvas elements on the page
 * Returns an array of locators for each canvas
 */
export async function findGlyphCanvases(
  page: Page,
  selector: string
): Promise<Locator[]> {
  logger.info(`Looking for glyph canvases with selector: ${selector}`);

  // Wait for at least one canvas to appear
  await page.waitForSelector(selector, { timeout: 10000 });

  // Get all matching elements
  const canvases = await page.locator(selector).all();

  logger.success(`Found ${canvases.length} glyph canvas element(s)`);

  return canvases;
}

/**
 * Finds a specific glyph canvas by character
 * This assumes the canvas or its parent has a data-char attribute
 */
export async function findGlyphCanvasByChar(
  page: Page,
  char: string,
  selector: string
): Promise<Locator | null> {
  logger.debug(`Looking for canvas for character '${char}'`);

  // Try to find by data-char attribute
  const locator = page.locator(`${selector}[data-char="${char}"]`);

  const count = await locator.count();

  if (count === 0) {
    logger.warn(`No canvas found for character '${char}'`);
    return null;
  }

  if (count > 1) {
    logger.warn(`Multiple canvases found for character '${char}', using first one`);
  }

  return locator.first();
}

/**
 * Gets the nth glyph canvas (0-indexed)
 * Useful when canvases are in a predictable order but don't have data attributes
 */
export async function getNthGlyphCanvas(
  page: Page,
  index: number,
  selector: string
): Promise<Locator> {
  logger.debug(`Getting glyph canvas at index ${index}`);

  const locator = page.locator(selector).nth(index);

  // Verify it exists
  const count = await page.locator(selector).count();

  if (index >= count) {
    throw new Error(`Index ${index} out of bounds. Only ${count} canvases found.`);
  }

  return locator;
}

/**
 * Waits for a selector to be visible and ready
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout: number = 10000
): Promise<void> {
  logger.debug(`Waiting for element: ${selector}`);

  await page.waitForSelector(selector, {
    state: 'attached',
    timeout,
  });

  logger.debug(`Element ready: ${selector}`);
}
