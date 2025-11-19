/**
 * Represents a 2D point with normalized coordinates [0, 1]
 */
export type NormalizedPoint = [number, number];

/**
 * A stroke is an array of normalized points
 * Each stroke represents a continuous line (pen down -> move -> pen up)
 */
export type Stroke = NormalizedPoint[];

/**
 * A glyph (character) with its strokes
 */
export interface Glyph {
  /** The character this glyph represents (e.g., "A", "b", "3", "!") */
  char: string;
  /** Array of strokes that make up this character */
  strokes: Stroke[];
}

/**
 * The complete font data structure
 */
export interface FontData {
  /** Name for the font (will be used when saving in UUNA) */
  fontName: string;
  /** Array of all glyphs in the font */
  glyphs: Glyph[];
}

/**
 * Screen coordinates after mapping from normalized space
 */
export interface ScreenPoint {
  x: number;
  y: number;
}

/**
 * Bounding box of a canvas/drawing area
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Login credentials for UUNA Font Creator
 */
export interface UUNACredentials {
  username: string;
  password: string;
}

/**
 * Configuration for the automation
 */
export interface AutomationConfig {
  /** Whether to run browser in headless mode */
  headless: boolean;
  /** Base URL of the UUNA Font Creator app */
  baseUrl: string;
  /** Timeout for navigation and element waits (ms) */
  timeout: number;
  /** Delay between mouse movements (ms) for more natural drawing */
  drawingDelay: number;
  /** Whether to enable verbose logging */
  verbose: boolean;
}
