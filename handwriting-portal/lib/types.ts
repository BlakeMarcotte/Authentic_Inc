export type NormalizedPoint = [number, number];

export type Stroke = NormalizedPoint[];

export interface Glyph {
  char: string;
  strokes: Stroke[];
  timestamp: number;
}

export interface HandwritingSession {
  userId: string;
  email: string;
  glyphs: Glyph[];
  story?: string;
  thankYouLetter?: string;
  createdAt: number;
  completedAt?: number;
}

export const CHARACTERS = [
  '!', '"', '#', '$', '%', '&', "'", '(', ')', '*',
  '+', ',', '-', '.', '/', '0', '1', '2', '3', '4',
  '5', '6', '7', '8', '9', ':', ';', '<', '=', '>',
  '?', '@', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
  'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
  'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '[', '\\',
  ']', '^', '_', '`', 'a', 'b', 'c', 'd', 'e', 'f',
  'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p',
  'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  '{', '|', '}', '~'
];

export const TEST_CHARACTERS = ['!', 'A', '0'];
