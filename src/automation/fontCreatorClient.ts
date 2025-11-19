import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { FontData, Glyph, UUNACredentials, AutomationConfig } from '../types';
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
    logger.step(1, 5, 'Launching browser');

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
   */
  async navigate(): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    logger.step(2, 5, 'Navigating to Font Creator');
    logger.info(`URL: ${this.config.baseUrl}`);

    await this.page.goto(this.config.baseUrl, {
      waitUntil: 'networkidle',
      timeout: this.config.timeout,
    });

    logger.success('Navigation complete');
  }

  /**
   * Logs into the UUNA Font Creator
   * NOTE: This is a placeholder implementation. You'll need to update
   * the selectors and logic based on the actual login flow.
   */
  async login(credentials: UUNACredentials): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    logger.step(3, 5, 'Logging in');

    try {
      // Wait for login form to appear
      // NOTE: Update these selectors after inspecting the actual app
      await waitForElement(this.page, selectors.login.usernameInput, this.config.timeout);

      // Fill in credentials
      await this.page.fill(selectors.login.usernameInput, credentials.username);
      await this.page.fill(selectors.login.passwordInput, credentials.password);

      // Click login button
      await this.page.click(selectors.login.submitButton);

      // Wait for navigation after login
      await this.page.waitForLoadState('networkidle', { timeout: this.config.timeout });

      logger.success('Login successful');
    } catch (error) {
      logger.error('Login failed. Please check the selectors in config.ts');
      throw error;
    }
  }

  /**
   * Draws a single glyph in the specified canvas
   */
  async drawGlyphAtIndex(glyph: Glyph, canvasIndex: number): Promise<void> {
    if (!this.page || !this.drawingEngine) {
      throw new Error('Browser not initialized');
    }

    logger.info(`Drawing glyph '${glyph.char}' at canvas index ${canvasIndex}`);

    // Get the canvas element at this index
    const canvasLocator = await getNthGlyphCanvas(
      this.page,
      canvasIndex,
      selectors.fontCreator.glyphCanvas
    );

    // Get the bounding box for coordinate conversion
    const boundingBox = await getBoundingBox(canvasLocator);

    logger.debug(`Canvas bounding box: x=${boundingBox.x}, y=${boundingBox.y}, w=${boundingBox.width}, h=${boundingBox.height}`);

    // Optional: Highlight the bounding box for debugging
    if (!this.config.headless && this.config.verbose) {
      await this.drawingEngine.highlightBoundingBox(boundingBox, 'blue');
      await this.page.waitForTimeout(500); // Brief pause to see the highlight
    }

    // Draw the glyph
    await this.drawingEngine.drawGlyph(glyph.strokes, boundingBox, glyph.char);
  }

  /**
   * Draws all glyphs from the font data
   * This is a simple sequential implementation
   */
  async drawAllGlyphs(fontData: FontData): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    logger.step(4, 5, `Drawing ${fontData.glyphs.length} glyphs`);

    // Wait for the glyph canvases to be ready
    await waitForElement(
      this.page,
      selectors.fontCreator.glyphCanvas,
      this.config.timeout
    );

    // Get all available canvases
    const canvases = await findGlyphCanvases(
      this.page,
      selectors.fontCreator.glyphCanvas
    );

    logger.info(`Found ${canvases.length} available canvas slots`);

    if (canvases.length === 0) {
      throw new Error('No glyph canvases found. Check selectors in config.ts');
    }

    // Draw each glyph
    for (let i = 0; i < fontData.glyphs.length; i++) {
      const glyph = fontData.glyphs[i];

      // For now, draw glyphs sequentially in order
      // In a more advanced version, you might map characters to specific positions
      if (i >= canvases.length) {
        logger.warn(
          `More glyphs (${fontData.glyphs.length}) than canvases (${canvases.length}). Some glyphs will be skipped.`
        );
        break;
      }

      await this.drawGlyphAtIndex(glyph, i);

      // Small delay between glyphs
      await this.page.waitForTimeout(200);
    }

    logger.success(`All glyphs drawn successfully`);
  }

  /**
   * Saves the font with the given name
   */
  async saveFont(fontName: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    logger.step(5, 5, `Saving font as '${fontName}'`);

    try {
      // Check if there's a font name input field
      const nameInputExists = await this.page.locator(selectors.fontCreator.fontNameInput).count();

      if (nameInputExists > 0) {
        logger.info('Entering font name');
        await this.page.fill(selectors.fontCreator.fontNameInput, fontName);
      } else {
        logger.warn('Font name input not found. The font may use a default name.');
      }

      // Click the save button
      logger.info('Clicking Save Font button');
      await this.page.click(selectors.fontCreator.saveFontButton);

      // Wait for save operation to complete
      // This might need adjustment based on actual app behavior
      await this.page.waitForTimeout(3000);

      logger.success(`Font '${fontName}' saved successfully!`);
    } catch (error) {
      logger.error('Failed to save font. Check the selectors in config.ts');
      throw error;
    }
  }

  /**
   * Main automation flow: draws a complete font from data
   */
  async createFont(fontData: FontData, credentials: UUNACredentials): Promise<void> {
    try {
      logger.info(`\n${'='.repeat(60)}`);
      logger.info(`Starting font creation: ${fontData.fontName}`);
      logger.info(`${'='.repeat(60)}\n`);

      await this.launch();
      await this.navigate();
      await this.login(credentials);
      await this.drawAllGlyphs(fontData);
      await this.saveFont(fontData.fontName);

      logger.info(`\n${'='.repeat(60)}`);
      logger.success(`Font creation complete!`);
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
