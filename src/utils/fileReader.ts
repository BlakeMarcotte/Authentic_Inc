import { readFileSync } from 'fs';
import { FontData, Glyph } from '../types';
import { logger } from './logger';

/**
 * Reads and validates a glyph JSON file
 */
export function readGlyphData(filePath: string): FontData {
  logger.info(`Reading glyph data from: ${filePath}`);

  try {
    const fileContent = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent) as FontData;

    // Validate the structure
    validateFontData(data);

    logger.success(`Loaded ${data.glyphs.length} glyphs for font: ${data.fontName}`);
    return data;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Failed to read glyph data: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Validates that the font data has the correct structure
 */
function validateFontData(data: any): asserts data is FontData {
  if (!data || typeof data !== 'object') {
    throw new Error('Font data must be an object');
  }

  if (!data.fontName || typeof data.fontName !== 'string') {
    throw new Error('Font data must have a "fontName" string property');
  }

  if (!Array.isArray(data.glyphs)) {
    throw new Error('Font data must have a "glyphs" array property');
  }

  // Validate each glyph
  data.glyphs.forEach((glyph: any, index: number) => {
    validateGlyph(glyph, index);
  });
}

/**
 * Validates a single glyph
 */
function validateGlyph(glyph: any, index: number): asserts glyph is Glyph {
  if (!glyph || typeof glyph !== 'object') {
    throw new Error(`Glyph at index ${index} must be an object`);
  }

  if (!glyph.char || typeof glyph.char !== 'string' || glyph.char.length !== 1) {
    throw new Error(`Glyph at index ${index} must have a "char" property with a single character`);
  }

  if (!Array.isArray(glyph.strokes)) {
    throw new Error(`Glyph at index ${index} must have a "strokes" array property`);
  }

  // Validate each stroke
  glyph.strokes.forEach((stroke: any, strokeIndex: number) => {
    if (!Array.isArray(stroke)) {
      throw new Error(
        `Stroke ${strokeIndex} of glyph '${glyph.char}' must be an array of points`
      );
    }

    // Validate each point in the stroke
    stroke.forEach((point: any, pointIndex: number) => {
      if (
        !Array.isArray(point) ||
        point.length !== 2 ||
        typeof point[0] !== 'number' ||
        typeof point[1] !== 'number'
      ) {
        throw new Error(
          `Point ${pointIndex} in stroke ${strokeIndex} of glyph '${glyph.char}' must be [number, number]`
        );
      }

      // Validate coordinates are in [0, 1] range
      if (point[0] < 0 || point[0] > 1 || point[1] < 0 || point[1] > 1) {
        throw new Error(
          `Point ${pointIndex} in stroke ${strokeIndex} of glyph '${glyph.char}' has coordinates outside [0, 1] range: [${point[0]}, ${point[1]}]`
        );
      }
    });
  });
}
