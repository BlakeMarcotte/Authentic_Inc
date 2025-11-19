import { Page } from 'playwright';
import { BoundingBox, NormalizedPoint, ScreenPoint, Stroke } from '../types';
import { logger } from '../utils/logger';

/**
 * Drawing engine responsible for converting normalized coordinates
 * to screen coordinates and simulating mouse drawing
 */
export class DrawingEngine {
  constructor(
    private page: Page,
    private drawingDelay: number = 5
  ) {}

  /**
   * Converts a normalized point [0, 1] to screen coordinates
   * based on a bounding box
   */
  private normalizedToScreen(
    normalizedPoint: NormalizedPoint,
    boundingBox: BoundingBox
  ): ScreenPoint {
    const [nx, ny] = normalizedPoint;

    return {
      x: boundingBox.x + nx * boundingBox.width,
      y: boundingBox.y + ny * boundingBox.height,
    };
  }

  /**
   * Draws a single stroke on the screen
   * A stroke is a continuous line (mouse down -> move -> mouse up)
   */
  async drawStroke(stroke: Stroke, boundingBox: BoundingBox): Promise<void> {
    if (stroke.length === 0) {
      logger.warn('Attempting to draw empty stroke, skipping');
      return;
    }

    // Convert all points to screen coordinates
    const screenPoints = stroke.map((point) =>
      this.normalizedToScreen(point, boundingBox)
    );

    // Move to the starting point
    const startPoint = screenPoints[0];
    await this.page.mouse.move(startPoint.x, startPoint.y);
    logger.debug(`Starting stroke at (${startPoint.x.toFixed(1)}, ${startPoint.y.toFixed(1)})`);

    // Press mouse button down
    await this.page.mouse.down();

    // Draw the line by moving through all points
    for (let i = 1; i < screenPoints.length; i++) {
      const point = screenPoints[i];
      await this.page.mouse.move(point.x, point.y);

      // Small delay for smoother drawing (optional)
      if (this.drawingDelay > 0) {
        await this.page.waitForTimeout(this.drawingDelay);
      }
    }

    // Release mouse button
    await this.page.mouse.up();

    logger.debug(`Completed stroke with ${screenPoints.length} points`);
  }

  /**
   * Draws all strokes for a glyph in a given bounding box
   */
  async drawGlyph(
    strokes: Stroke[],
    boundingBox: BoundingBox,
    char: string
  ): Promise<void> {
    logger.info(`Drawing glyph '${char}' with ${strokes.length} stroke(s)`);

    for (let i = 0; i < strokes.length; i++) {
      const stroke = strokes[i];
      logger.debug(`Drawing stroke ${i + 1}/${strokes.length} (${stroke.length} points)`);

      await this.drawStroke(stroke, boundingBox);

      // Small delay between strokes for visual clarity during development
      if (i < strokes.length - 1) {
        await this.page.waitForTimeout(50);
      }
    }

    logger.success(`Completed drawing glyph '${char}'`);
  }

  /**
   * Helper method to visualize bounding box (useful for debugging)
   * This draws a rectangle around the bounding box
   */
  async highlightBoundingBox(boundingBox: BoundingBox, color: string = 'red'): Promise<void> {
    await this.page.evaluate(
      ({ bbox, color }) => {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = `${bbox.x}px`;
        div.style.top = `${bbox.y}px`;
        div.style.width = `${bbox.width}px`;
        div.style.height = `${bbox.height}px`;
        div.style.border = `2px solid ${color}`;
        div.style.pointerEvents = 'none';
        div.style.zIndex = '9999';
        document.body.appendChild(div);

        // Remove after 2 seconds
        setTimeout(() => div.remove(), 2000);
      },
      { bbox: boundingBox, color }
    );
  }
}
