# Quick Start - READY TO USE! ✅

## The automation is now configured for UUNA Font Creator!

All selectors have been updated based on your screenshots. Just install and run!

---

## 1. Install Dependencies
```bash
npm install
npx playwright install chromium
```

## 2. Run Test
```bash
npm run draw test-data/simple-test.json
```

---

## What Will Happen

The automation will:

1. **Launch browser** (you'll see Chrome open)
2. **Navigate** to http://154.85.41.14/#fontapp
3. **For each glyph:**
   - Click on a canvas box (opens drawing interface)
   - Draw the strokes on the large canvas (you'll see green highlight)
   - Click "Done" button
   - Return to main grid
4. **Click "Save Font"** button at the top

### Test Data: `simple-test.json`

This file contains 3 glyphs:
- **Box 0**: `!` (exclamation mark)
- **Box 2**: `#` (hash symbol)
- **Box 6**: `0` (zero)

You should see the automation draw these one by one!

---

## Configuration (Already Done!)

✅ **Selectors updated** to `canvas.fontcreater_canvas`
✅ **Workflow implemented**: Click → Draw → Done
✅ **Buttons mapped**: Done, Next, Back, Save Font
✅ **Error handling** added

---

## Troubleshooting

### If it can't find the canvas boxes:

Run the detector to verify:
```bash
npm run detect-selectors
```

Should highlight canvases in GREEN.

### If drawing appears in wrong location:

- Check that you're on page 1 (shows "1 / 4" at bottom)
- The test uses boxes 0, 2, and 6 (not 0, 1, 2)

### If "Done" button doesn't click:

- Manually verify the "Done" button appears after clicking a canvas
- Check DevTools to ensure button text is exactly "Done"

---

## Custom Glyphs

Create your own JSON file:

```json
{
  "fontName": "MyFont",
  "glyphs": [
    {
      "char": "!",
      "strokes": [
        [[0.5, 0.1], [0.5, 0.6]],
        [[0.45, 0.75], [0.55, 0.85]]
      ]
    }
  ]
}
```

Then run:
```bash
npm run draw path/to/your-file.json
```

---

## Next Steps

1. ✅ **Test the automation** - Run the simple test
2. **Create more glyphs** - Add more characters to JSON
3. **Map characters** - Ensure correct box positions
4. **Add page navigation** - Auto-click "Next Page" for A-Z
5. **Integrate CV pipeline** - Connect image processing

---

## Key Files

- `src/config.ts` - Selectors (line 37: `canvas.fontcreater_canvas`)
- `src/automation/fontCreatorClient.ts` - Main workflow
- `test-data/simple-test.json` - Test glyphs
- `SETUP-GUIDE.md` - Detailed documentation
- `CHANGES.md` - What was updated

---

## Support

**Everything should work now!** The code is configured for your UUNA setup.

If you encounter issues, check:
1. Are you on the main grid page (page 1/4)?
2. Is the browser version of UUNA the same as the screenshots?
3. Run `npm run detect-selectors` to verify selectors still work
