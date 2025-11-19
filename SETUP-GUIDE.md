# Quick Setup Guide

## Step 1: Install Dependencies

```bash
npm install
npx playwright install chromium
```

## Step 2: Find the Correct Selectors

This is the **most important step**! The automation needs to know how to find the drawing boxes.

### Finding the Drawing Box Selector

1. **Open the UUNA Font Creator** in your browser:
   ```
   http://154.85.41.14/#fontapp
   ```

2. **Open DevTools**:
   - Press `F12`
   - Or right-click anywhere and select "Inspect"

3. **Select the Element Picker**:
   - Click the "Select element" icon in the top-left of DevTools
   - It looks like a cursor in a box: 🔍

4. **Click on a white drawing box** in the grid (e.g., the box for "!")

5. **Look at the HTML that gets highlighted**. It might look like:
   ```html
   <canvas id="char_0" width="200" height="200"></canvas>
   ```
   or
   ```html
   <div class="glyph-box" data-char="!">
     <canvas></canvas>
   </div>
   ```
   or
   ```html
   <svg class="drawing-area"></svg>
   ```

6. **Determine the selector**:
   - If it's a `<canvas>` directly: use `'canvas'`
   - If it's a canvas with a class: use `'canvas.classname'`
   - If it's an SVG: use `'svg'`
   - If it's a div with a specific class: use `'div.glyph-box'` or whatever the class is

7. **Update `src/config.ts`**:
   ```typescript
   fontCreator: {
     glyphBox: 'canvas',  // <-- UPDATE THIS LINE
   ```

### Finding the Save Font Button Selector

1. In DevTools, use the element picker again
2. Click on the **"Save Font"** button at the top
3. Look at the HTML:
   ```html
   <button id="saveBtn">Save Font</button>
   ```
   or
   ```html
   <button class="btn-save" onclick="saveFont()">Save Font</button>
   ```

4. The current selector uses text matching:
   ```typescript
   saveFontButton: 'button:has-text("Save Font")',
   ```

   This should work, but if it doesn't, try:
   ```typescript
   saveFontButton: '#saveBtn',          // If it has an ID
   saveFontButton: 'button.btn-save',   // If it has a class
   saveFontButton: 'button[onclick*="save"]',  // If it has onclick
   ```

## Step 3: Run a Test

Start with the simple test file (only 3 glyphs):

```bash
npm run draw test-data/simple-test.json
```

### What Should Happen:

1. Browser window opens (not headless by default)
2. Navigates to UUNA Font Creator
3. You should see:
   - Blue boxes appear briefly around each drawing area (highlighting)
   - Mouse cursor moving and drawing in each box
   - First box: Draws "!"
   - Third box (skipping second): Draws "#"
   - Seventh box: Draws "0"

### If It Fails:

**Error: "Could not find drawing boxes"**
- The `glyphBox` selector is wrong
- Inspect the page and update the selector

**Error: "Failed to click Save Font button"**
- The `saveFontButton` selector is wrong
- Inspect the button and update the selector

**Drawing in wrong location**
- The selector might be finding the wrong elements
- Use DevTools to check how many elements match your selector:
  ```javascript
  document.querySelectorAll('canvas').length  // How many matches?
  ```

## Step 4: Test with More Glyphs

Once the simple test works, try the full sample:

```bash
npm run draw test-data/sample-glyphs.json
```

## Common Selector Patterns

### Pattern 1: Simple canvas
```typescript
glyphBox: 'canvas'
```

### Pattern 2: Canvas with class
```typescript
glyphBox: 'canvas.glyph-canvas'
```

### Pattern 3: Div containing canvas
```typescript
glyphBox: 'div.char-box canvas'
```

### Pattern 4: SVG elements
```typescript
glyphBox: 'svg.drawing-area'
```

### Pattern 5: Elements with data attributes
```typescript
glyphBox: '[data-glyph]'
```

## Testing Selectors in Browser Console

Open the browser console (F12 → Console tab) and test your selector:

```javascript
// How many elements does this find?
document.querySelectorAll('canvas').length

// Show all matching elements
document.querySelectorAll('canvas')

// Highlight the first match
document.querySelectorAll('canvas')[0].style.border = '5px solid red'
```

## Configuration Options

Edit `src/config.ts`:

```typescript
export const config = {
  headless: false,        // Set to true to run without visible browser
  baseUrl: '...',         // UUNA Font Creator URL
  timeout: 30000,         // 30 seconds
  drawingDelay: 5,        // Delay between mouse movements (ms)
  verbose: true,          // Show detailed logs
};
```

## Troubleshooting

### Browser doesn't open
```bash
# Reinstall Playwright browsers
npx playwright install chromium
```

### TypeScript errors
```bash
# Rebuild
npm run build
```

### "Module not found" errors
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```
