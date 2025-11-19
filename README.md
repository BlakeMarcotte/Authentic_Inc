# UUNA Font Creator Automation

Browser automation tool for automating handwriting font creation in the UUNA TEK Font Creator web application.

## Overview

This project automates the manual process of tracing handwriting characters in UUNA's web-based Font Creator app. Instead of manually drawing each character with a digital pen, this tool:

1. Takes normalized stroke data (from a separate image processing pipeline)
2. Opens the UUNA Font Creator in a browser
3. Simulates mouse movements to "draw" each character
4. Saves the completed font to UUNA's cloud

The result is a `.gfont` file that can be downloaded and used with the UUNA TEK iAuto desktop application.

## Project Structure

```
uuna-font-automation/
├── src/
│   ├── types.ts                 # TypeScript type definitions
│   ├── config.ts                # Configuration and DOM selectors
│   ├── automation/
│   │   ├── fontCreatorClient.ts # Main automation orchestrator
│   │   ├── drawingEngine.ts     # Coordinate mapping and drawing
│   │   └── selectors.ts         # DOM helper functions
│   ├── utils/
│   │   ├── logger.ts            # Logging utility
│   │   └── fileReader.ts        # JSON file reading/validation
│   └── index.ts                 # CLI entrypoint
├── test-data/
│   └── sample-glyphs.json       # Example glyph data
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Install Playwright browsers:**

```bash
npx playwright install chromium
```

## Configuration

### IMPORTANT: Update Selectors Before Running

Before using this tool, you **MUST** inspect the UUNA Font Creator web app and update the DOM selectors in `src/config.ts`:

1. Open the UUNA Font Creator in your browser: `http://154.85.41.14/#fontapp`
2. Open browser DevTools (F12)
3. Inspect the following elements and update `src/config.ts`:
   - Login form inputs (username, password)
   - Login submit button
   - Glyph canvas elements or drawing areas
   - Save font button
   - Font name input (if applicable)

### Configuration Options

Edit `src/config.ts` to customize:

- `headless`: Set to `false` during development to see the browser (default: `false`)
- `baseUrl`: UUNA Font Creator URL
- `timeout`: Page load and element wait timeout (default: 30 seconds)
- `drawingDelay`: Delay between mouse movements in milliseconds (default: 5ms)
- `verbose`: Enable detailed logging (default: `true`)

## Usage

### Basic Usage

```bash
npm run draw test-data/sample-glyphs.json <username> <password>
```

### Using Environment Variables

```bash
# Windows
set UUNA_USERNAME=your-username
set UUNA_PASSWORD=your-password
npm run draw test-data/sample-glyphs.json

# Linux/Mac
export UUNA_USERNAME=your-username
export UUNA_PASSWORD=your-password
npm run draw test-data/sample-glyphs.json
```

### Development Mode

For development with TypeScript compilation:

```bash
npm run build
npm start test-data/sample-glyphs.json <username> <password>
```

## Glyph Data Format

The automation expects JSON files with the following structure:

```json
{
  "fontName": "CustomerName_2025-01-18",
  "glyphs": [
    {
      "char": "A",
      "strokes": [
        [
          [0.2, 0.9],
          [0.5, 0.1],
          [0.5, 0.15]
        ],
        [
          [0.5, 0.1],
          [0.8, 0.9]
        ]
      ]
    }
  ]
}
```

### Data Format Specifications

- **fontName**: String identifier for the font
- **glyphs**: Array of glyph objects
  - **char**: Single character string (e.g., "A", "b", "3", "!")
  - **strokes**: Array of stroke arrays
    - Each stroke is an array of `[x, y]` coordinate pairs
    - **Coordinates must be normalized to [0, 1] range**
      - `0` = left/top edge of glyph box
      - `1` = right/bottom edge of glyph box
    - Each stroke represents a continuous line (mouse down → move → mouse up)

### Example: Drawing the Letter "L"

```json
{
  "char": "L",
  "strokes": [
    [
      [0.2, 0.1],
      [0.2, 0.8]
    ],
    [
      [0.2, 0.8],
      [0.7, 0.8]
    ]
  ]
}
```

This draws:
1. Vertical line from top-left to bottom-left
2. Horizontal line from bottom-left to bottom-right

## How It Works

### 1. Coordinate Conversion

The drawing engine converts normalized coordinates `[0, 1]` to screen coordinates:

```typescript
x_screen = boundingBox.x + normalizedX * boundingBox.width
y_screen = boundingBox.y + normalizedY * boundingBox.height
```

### 2. Mouse Simulation

For each stroke:
1. Move mouse to start point
2. Press mouse button down
3. Move through all points in the stroke
4. Release mouse button

### 3. Automation Flow

```
Launch Browser
    ↓
Navigate to UUNA Font Creator
    ↓
Login with credentials
    ↓
Wait for glyph canvases to load
    ↓
For each glyph:
  - Get canvas bounding box
  - Convert normalized coords to screen coords
  - Simulate mouse drawing
    ↓
Click "Save Font" button
    ↓
Close browser
```

## Development Tips

### Enable Visual Debugging

In `src/config.ts`, set:
```typescript
headless: false,
verbose: true,
```

This will:
- Show the browser window
- Highlight bounding boxes in blue before drawing
- Display detailed logs

### Testing Single Glyphs

Create a minimal test file with just one glyph:

```json
{
  "fontName": "SingleGlyphTest",
  "glyphs": [
    {
      "char": "A",
      "strokes": [
        [[0.1, 0.9], [0.5, 0.1], [0.9, 0.9]]
      ]
    }
  ]
}
```

### Adjusting Drawing Speed

If strokes are too fast or too slow:

```typescript
// In src/config.ts
drawingDelay: 10, // Increase for slower, more visible drawing
```

### Troubleshooting Selectors

If elements aren't found:

1. Check browser console logs for the actual error
2. Inspect the UUNA web app's DOM structure
3. Update selectors in `src/config.ts`
4. Test with a single operation at a time

Common selector issues:
- Login form might use different input names
- Canvases might be in a shadow DOM
- Elements might load dynamically (add waits)

## API Integration (Future)

This tool is designed to integrate with a separate image processing pipeline that:

1. Accepts scanned handwriting templates
2. Extracts character strokes using computer vision
3. Outputs normalized stroke data in the JSON format above

The automation layer (this project) is completely decoupled from the CV pipeline.

## Security Notes

- **Never commit credentials** to version control
- Use environment variables or a secure credential manager
- The `.gitignore` excludes `credentials.json` and similar files

## Known Limitations

1. **DOM Selectors**: Must be manually updated for each version of UUNA's web app
2. **Character Mapping**: Currently maps glyphs sequentially to canvas slots
3. **Single Page**: Assumes all glyphs fit on one page
4. **No Error Recovery**: If drawing fails partway through, the font is incomplete

## Future Enhancements

- [ ] Smart character-to-position mapping using character codes
- [ ] Multi-page support for fonts with many glyphs
- [ ] Retry logic for failed strokes
- [ ] Web UI for uploading handwriting samples
- [ ] Integration with image processing pipeline
- [ ] Progress tracking and partial saves

## Troubleshooting

### "Element not found" errors

- Inspect the UUNA web app and update selectors in `src/config.ts`
- Check if the page structure has changed
- Ensure elements are loaded (increase timeout if needed)

### Strokes drawing in wrong location

- Verify the canvas bounding box is correct
- Check if canvases are being selected in the right order
- Enable visual debugging to see bounding box highlights

### Login fails

- Verify credentials are correct
- Check if login flow has changed
- Update login selectors in `src/config.ts`

### Font not saving

- Verify the save button selector
- Check if there's a confirmation dialog
- Look for error messages in the browser console

## Support

For issues or questions, inspect the browser console output and check:
1. Are the selectors correct?
2. Is the page structure what you expect?
3. Are there any JavaScript errors in the console?

## License

ISC
