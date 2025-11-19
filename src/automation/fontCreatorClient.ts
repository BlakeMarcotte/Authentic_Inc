import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { FontData, Glyph, AutomationConfig } from '../types';
import { DrawingEngine } from './drawingEngine';
import { getBoundingBox, findGlyphCanvases, getNthGlyphCanvas, waitForElement } from './selectors';
import { selectors } from '../config';
import { logger } from '../utils/logger';

/**
 * Main client for automating the UUNA Font Creator web application
 */
export class FontCreatorClient {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private drawingEngine: DrawingEngine | null = null;

  constructor(private config: AutomationConfig) {}

  /**
   * Launches the browser and navigates to the Font Creator app
   */
  async launch(): Promise<void> {
    logger.step(1, 3, 'Launching browser');

    this.browser = await chromium.launch({
      headless: this.config.headless,
      // Slow down actions in non-headless mode for visibility
      slowMo: this.config.headless ? 0 : 50,
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });

    this.page = await this.context.newPage();
    this.drawingEngine = new DrawingEngine(this.page, this.config.drawingDelay);

    logger.success('Browser launched successfully');
  }

  /**
   * Navigates to the UUNA Font Creator URL
   * Assumes you're already logged in or the page doesn't require login
   */
  async navigate(): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    logger.step(2, 3, 'Navigating to Font Creator');
    logger.info(`URL: ${this.config.baseUrl}`);

    await this.page.goto(this.config.baseUrl, {
      waitUntil: 'domcontentloaded',
      timeout: this.config.timeout,
    });

    logger.success('Navigation complete');

    // Give user 20 seconds to manually log in
    logger.info('Waiting 20 seconds for you to log in...');
    await this.page.waitForTimeout(20000);
    logger.success('Continuing with automation');

    logger.info('Waiting for drawing boxes to load...');

    // Wait for at least one glyph box to appear
    try {
      await waitForElement(this.page, selectors.fontCreator.glyphBox, this.config.timeout);
      logger.success('Drawing boxes found and ready');
    } catch (error) {
      logger.error('Could not find drawing boxes. Check the selector in config.ts');
      logger.info('Current selector: ' + selectors.fontCreator.glyphBox);
      logger.info('Right-click on a white drawing box in the browser, select "Inspect", and update the selector');
      throw error;
    }
  }

  /**
   * Draws a single glyph in the specified box and saves it
   * NEW WORKFLOW:
   * 1. Click on the small canvas to open drawing mode
   * 2. Wait for large drawing canvas to appear
   * 3. Draw strokes on the large canvas
   * 4. Click "Done" to confirm
   * 5. Click "Save Font"
   * 6. Click "Ok" on success dialog
   * 7. Click "Back" to return to grid
   */
  async drawGlyphAtIndex(glyph: Glyph, boxIndex: number): Promise<void> {
    if (!this.page || !this.drawingEngine) {
      throw new Error('Browser not initialized');
    }

    logger.info(`[${boxIndex + 1}] Drawing glyph '${glyph.char}' at box index ${boxIndex}`);

    // STEP 1: Click on the small canvas box to open drawing mode
    const boxLocator = await getNthGlyphCanvas(
      this.page,
      boxIndex,
      selectors.fontCreator.glyphBox
    );

    logger.debug('Clicking canvas to open drawing mode...');
    await boxLocator.click();

    // STEP 2: Wait for the large drawing canvas to appear
    await this.page.waitForTimeout(500); // Brief wait for animation
    await waitForElement(this.page, selectors.fontCreator.drawingCanvas, 5000);

    logger.debug('Drawing interface opened');

    // STEP 3: Get the bounding box of the LARGE drawing canvas
    const drawingCanvasLocator = this.page.locator(selectors.fontCreator.drawingCanvas).first();
    const boundingBox = await getBoundingBox(drawingCanvasLocator);

    logger.debug(`Drawing canvas bounding box: x=${boundingBox.x}, y=${boundingBox.y}, w=${boundingBox.width}, h=${boundingBox.height}`);

    // Optional: Highlight the bounding box for debugging
    if (!this.config.headless && this.config.verbose) {
      await this.drawingEngine.highlightBoundingBox(boundingBox, 'lime');
      await this.page.waitForTimeout(500);
    }

    // STEP 4: Draw the glyph on the large canvas
    await this.drawingEngine.drawGlyph(glyph.strokes, boundingBox, glyph.char);

    // Small pause to see the drawing
    await this.page.waitForTimeout(300);

    // STEP 5: Click "Done" button to confirm
    logger.debug('Clicking "Done" button...');
    await this.page.click(selectors.fontCreator.doneButton);

    // Wait for the drawing interface to close
    await this.page.waitForTimeout(500);

    logger.success(`Glyph '${glyph.char}' drawn and confirmed`);

    // STEP 6: Click "Save Font"
    logger.info('Clicking "Save Font" button');
    await this.page.click(selectors.fontCreator.saveFontButton);
    await this.page.waitForTimeout(2000);

    // STEP 7: Click "Ok" on success dialog
    logger.info('Waiting for success dialog...');
    await waitForElement(this.page, selectors.fontCreator.okButton, 5000);
    logger.info('Clicking "Ok" button');
    await this.page.click(selectors.fontCreator.okButton);
    await this.page.waitForTimeout(1000);

    // STEP 8: Click "Back" to return to grid
    logger.info('Clicking "Back" to return to grid');
    await this.page.click(selectors.fontCreator.backButton);
    await this.page.waitForTimeout(1000);

    logger.success(`Glyph '${glyph.char}' saved successfully!\n`);
  }

  /**
   * Draws all glyphs from the font data
   * Each glyph is saved individually before moving to the next
   */
  async drawAllGlyphs(fontData: FontData): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    logger.info(`\n[STEP 3/3] Drawing and saving ${fontData.glyphs.length} glyphs\n`);

    // Wait for the glyph boxes to be ready on main grid
    await waitForElement(
      this.page,
      selectors.fontCreator.glyphBox,
      this.config.timeout
    );

    // Get all available boxes
    const canvases = await findGlyphCanvases(
      this.page,
      selectors.fontCreator.glyphBox
    );

    logger.info(`Found ${canvases.length} available drawing box slots on this page`);

    if (canvases.length === 0) {
      throw new Error('No glyph boxes found. Check the glyphBox selector in config.ts');
    }

    // Draw each glyph
    for (let i = 0; i < fontData.glyphs.length; i++) {
      const glyph = fontData.glyphs[i];

      // For now, draw glyphs sequentially in order
      // In a more advanced version, you might map characters to specific positions
      if (i >= canvases.length) {
        logger.warn(
          `More glyphs (${fontData.glyphs.length}) than boxes (${canvases.length}). Some glyphs will be skipped.`
        );
        break;
      }

      try {
        await this.drawGlyphAtIndex(glyph, i);

        // Make sure we're back on the main grid before proceeding to next glyph
        // Wait for the grid to be visible again
        await this.page.waitForTimeout(300);
        await waitForElement(this.page, selectors.fontCreator.glyphBox, 5000);

      } catch (error) {
        logger.error(`Failed to draw glyph '${glyph.char}' at index ${i}`);

        // Try to recover by clicking Back button if we're stuck in drawing mode
        const backButtonVisible = await this.page.locator(selectors.fontCreator.backButton).isVisible();
        if (backButtonVisible) {
          logger.warn('Attempting to return to main grid...');
          await this.page.click(selectors.fontCreator.backButton);
          await this.page.waitForTimeout(1000);
        }

        throw error;
      }
    }

    logger.success(`All ${Math.min(fontData.glyphs.length, canvases.length)} glyphs drawn successfully\n`);
  }

  /**
   * Saves the font with the given name
   */
  async saveFont(fontName?: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    logger.step(3, 3, 'Saving font');

    try {
      // Click the save button
      logger.info('Clicking "Save Font" button');
      await this.page.click(selectors.fontCreator.saveFontButton);

      // Wait for save operation to complete
      await this.page.waitForTimeout(2000);

      logger.success('Save Font button clicked!');

      // Wait for and click the "Ok" button on the success dialog
      logger.info('Waiting for success dialog...');
      await waitForElement(this.page, selectors.fontCreator.okButton, 5000);

      logger.info('Clicking "Ok" button');
      await this.page.click(selectors.fontCreator.okButton);

      await this.page.waitForTimeout(1000);
      logger.success('Font saved successfully!');
    } catch (error) {
      logger.error('Failed to save font');
      logger.info('Current selector: ' + selectors.fontCreator.saveFontButton);
      logger.info('Inspect the "Save Font" button and update the selector in config.ts');
      throw error;
    }
  }

  /**
   * Main automation flow: draws a complete font from data
   * Gives user 20 seconds to log in after browser launches
   * Each glyph is saved individually
   */
  async createFont(fontData: FontData): Promise<void> {
    try {
      logger.info(`\n${'='.repeat(60)}`);
      logger.info(`Starting font creation: ${fontData.fontName}`);
      logger.info(`Total glyphs to draw: ${fontData.glyphs.length}`);
      logger.info(`${'='.repeat(60)}\n`);

      await this.launch();
      await this.navigate();
      await this.drawAllGlyphs(fontData);

      logger.info(`\n${'='.repeat(60)}`);
      logger.success(`Font creation complete!`);
      logger.success(`All ${fontData.glyphs.length} glyphs saved individually!`);
      logger.info(`${'='.repeat(60)}\n`);

      // Keep browser open for a moment to see the result
      if (!this.config.headless) {
        logger.info('Keeping browser open for 5 seconds...');
        await this.page!.waitForTimeout(5000);
      }
    } catch (error) {
      logger.error('Font creation failed');
      throw error;
    } finally {
      await this.close();
    }
  }

  /**
   * Closes the browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      logger.info('Closing browser');
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
      this.drawingEngine = null;
    }
  }
}
