# UUNA Font Creator Automation - Project Status

## Current Status: Phase 1A Complete ✓

We have successfully created an automation script that draws and saves handwriting glyphs in the UUNA Font Creator web application.

---

## What We've Built

### Automated Workflow
The script automates the following process for each glyph:

1. **Click** on the canvas box for the character
2. **Draw** the glyph using stroke data from JSON
3. **Click "Done"** to confirm the drawing
4. **Click "Save Font"** to save the glyph
5. **Click "Ok"** on the success dialog
6. **Click "Back"** to return to the grid
7. **Repeat** for the next glyph

### Current Capabilities
- ✅ Launches browser with 20-second login window
- ✅ Navigates to UUNA Font Creator page
- ✅ Draws multiple glyphs sequentially (currently 3: !, #, 0)
- ✅ Saves each glyph individually before moving to next
- ✅ Handles all UI interactions (Done, Save Font, Ok, Back buttons)
- ✅ Converts normalized stroke coordinates [0,1] to screen pixels
- ✅ Simulates smooth mouse movements for drawing

### How to Run

```bash
npm run draw test-data/simple-test.json
```

**What happens:**
1. Browser launches
2. You have **20 seconds** to log in manually
3. Script navigates to the font creator page
4. Automation draws all 3 glyphs from the JSON file
5. Each glyph is saved individually before moving to the next

### Test Data Format

The JSON file contains normalized stroke data (coordinates in 0-1 range):

```json
{
  "fontName": "SimpleTest",
  "glyphs": [
    {
      "char": "!",
      "strokes": [
        [[0.5, 0.1], [0.5, 0.6]],
        [[0.45, 0.75], [0.55, 0.75], [0.55, 0.85], [0.45, 0.85], [0.45, 0.75]]
      ]
    }
  ]
}
```

---

## Phase 1: Complete Symbol Coverage (NEXT STEP)

### Objective
Build a script that can draw **every symbol** with **multiple styles** per character.

### Requirements

#### 1. Full Character Set Coverage
- **Page 1:** Punctuation and digits (!, ", #, $, %, &, (, ), *, +, ,, -, ., /, 0-9, :, ;)
- **Page 2:** Uppercase letters (A-Z)
- **Page 3:** Lowercase letters (a-z)
- **Page 4:** Additional special characters
- **Total:** ~95 characters

#### 2. Multi-Style Support
For each character, save **3 different handwritten styles**:

```json
{
  "fontName": "MyHandwriting",
  "glyphs": [
    {
      "char": "A",
      "style": "style1",
      "strokes": [...]
    },
    {
      "char": "A",
      "style": "style2",
      "strokes": [...]
    },
    {
      "char": "A",
      "style": "style3",
      "strokes": [...]
    }
  ]
}
```

#### 3. Page Navigation
- Implement **"Next Page"** button click to move between pages 1-4
- Track current page position
- Map characters to their correct pages

#### 4. Character-to-Position Mapping
Instead of sequential drawing (index 0, 1, 2...), map each character to its correct box:
- `!` → Box 0 (Page 1)
- `"` → Box 1 (Page 1)
- `A` → Box 0 (Page 2)
- etc.

### Deliverables for Phase 1
- [ ] JSON file with all 95+ characters, 3 styles each (~285 total glyphs)
- [ ] Updated automation script that:
  - [ ] Navigates between pages
  - [ ] Maps characters to correct positions
  - [ ] Handles all character types (letters, numbers, punctuation)
- [ ] Complete font saved in UUNA with all variations

---

## Phase 2: Image Processing Pipeline (FUTURE)

### Objective
Build a tool that converts **handwritten character images** into the **JSON stroke format** needed by the automation script.

### Why This Is Needed
Currently, we manually create JSON files with stroke coordinates. This is not scalable for:
- Multiple handwriting styles
- Different users' handwriting
- Large character sets

### Proposed Pipeline

```
Handwriting Image → Processing → JSON Strokes → Automation → UUNA Font
     (PNG/JPG)                      (output)        (input)
```

#### Input
- Images of handwritten characters (one per image, or grid)
- Example: User writes "A" on paper/tablet, takes photo

#### Processing Steps
1. **Image preprocessing**
   - Grayscale conversion
   - Noise reduction
   - Binarization (black/white)

2. **Skeleton extraction**
   - Thin the character down to single-pixel-wide strokes
   - Identify stroke centerlines

3. **Stroke vectorization**
   - Convert pixel paths to vector coordinates
   - Detect stroke start/end points
   - Separate individual strokes (lift pen events)

4. **Normalization**
   - Scale coordinates to [0, 1] range
   - Center the character in bounding box
   - Preserve aspect ratio

5. **JSON export**
   - Output in format compatible with current automation

#### Technologies to Explore
- **OpenCV** - Image processing library
- **scikit-image** - Python image processing
- **Potrace** - Bitmap to vector tracing
- **Custom algorithms** - Stroke order detection

### Deliverables for Phase 2
- [ ] Image upload/input system
- [ ] Processing pipeline (image → strokes)
- [ ] JSON generator
- [ ] Integration with Phase 1 automation
- [ ] Web UI or CLI tool for batch processing

---

## Summary

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1A** | ✅ **COMPLETE** | Basic automation: Draw 3 glyphs, save individually |
| **Phase 1B** | 🔄 **NEXT** | Full character set (95+ chars), multi-style, page navigation |
| **Phase 2** | 📋 **PLANNED** | Image processing pipeline to generate JSON stroke data |

---

## Current Architecture

```
┌─────────────────────────────────────────────────────┐
│                     User Input                       │
│              (JSON stroke data file)                 │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│             npm run draw <file.json>                 │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│              src/index.ts (CLI)                      │
│              - Parses arguments                      │
│              - Loads JSON file                       │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│       FontCreatorClient (Orchestrator)               │
│       - Launches browser                             │
│       - 20 second login delay                        │
│       - Navigates to UUNA page                       │
│       - Loops through glyphs                         │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│         For Each Glyph:                              │
│         1. Click canvas box                          │
│         2. DrawingEngine.drawGlyph()                 │
│         3. Click "Done"                              │
│         4. Click "Save Font"                         │
│         5. Click "Ok"                                │
│         6. Click "Back"                              │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│                  UUNA Font Creator                   │
│              (Font saved to cloud)                   │
└─────────────────────────────────────────────────────┘
```

---

## Next Steps

1. **Immediate:** Create comprehensive JSON file with more characters
2. **Short-term:** Implement page navigation and character mapping
3. **Medium-term:** Design image processing pipeline
4. **Long-term:** Build end-to-end handwriting → font workflow

---

## Repository Structure

```
Authentic_Inc/
├── src/
│   ├── index.ts                    # CLI entry point
│   ├── config.ts                   # Selectors & configuration
│   ├── types.ts                    # TypeScript interfaces
│   ├── automation/
│   │   ├── fontCreatorClient.ts    # Main orchestrator
│   │   ├── drawingEngine.ts        # Coordinate conversion & drawing
│   │   └── selectors.ts            # DOM helper functions
│   └── utils/
│       ├── fileReader.ts           # JSON validation & loading
│       └── logger.ts               # Console logging
├── test-data/
│   ├── simple-test.json            # Current test (3 glyphs)
│   └── sample-glyphs.json          # Additional samples
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript config
├── README.md                       # Main documentation
└── PROJECT-STATUS.md               # This file
```

---

**Last Updated:** November 19, 2025
**Status:** Phase 1A Complete, Ready for Phase 1B
