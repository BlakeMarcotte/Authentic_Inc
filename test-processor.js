const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Character mapping
const CHARACTERS = ['!', 'A', '0'];

async function processImage(imagePath) {
  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    const width = metadata.width || 1000;
    const height = metadata.height || 1000;

    // Process: grayscale -> threshold -> negate
    const processed = await image
      .grayscale()
      .threshold(128)
      .negate()
      .raw()
      .toBuffer();

    // Extract points
    const points = extractPoints(processed, width, height);
    
    if (points.length === 0) {
      console.log(`⚠️  No handwriting detected in ${path.basename(imagePath)}`);
      return [];
    }

    // Normalize coordinates
    const normalized = points.map(p => ({
      x: p.x / width,
      y: p.y / height,
    }));

    console.log(`✓ Processed ${path.basename(imagePath)}: ${points.length} points extracted`);
    return normalized;
  } catch (error) {
    console.error(`✗ Error processing ${imagePath}:`, error.message);
    return [];
  }
}

function extractPoints(data, width, height) {
  const points = [];
  const samplingDistance = 5;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const pixel = data[idx];
      
      // If black pixel (handwriting)
      if (pixel > 128) {
        // Sample every Nth point to reduce data size
        if (points.length === 0) {
          points.push({ x, y });
        } else {
          const last = points[points.length - 1];
          const distance = Math.sqrt(
            Math.pow(x - last.x, 2) + Math.pow(y - last.y, 2)
          );
          
          if (distance >= samplingDistance) {
            points.push({ x, y });
          }
        }
      }
    }
  }
  
  return sortByProximity(points);
}

function sortByProximity(points) {
  if (points.length <= 1) return points;
  
  const sorted = [];
  const remaining = [...points];
  
  sorted.push(remaining.shift());
  
  while (remaining.length > 0) {
    const last = sorted[sorted.length - 1];
    let nearestIndex = 0;
    let nearestDistance = Infinity;
    
    for (let i = 0; i < remaining.length; i++) {
      const distance = Math.sqrt(
        Math.pow(remaining[i].x - last.x, 2) +
        Math.pow(remaining[i].y - last.y, 2)
      );
      
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }
    
    sorted.push(remaining.splice(nearestIndex, 1)[0]);
  }
  
  return sorted;
}

async function main() {
  console.log('\n🚀 Processing test images...\n');

  const testDir = path.join(__dirname, 'test-data');
  const imageFiles = [
    'exclamation.png',
    'A.png',
    'zero.png'
  ];

  const glyphs = [];

  for (let i = 0; i < imageFiles.length; i++) {
    const imagePath = path.join(testDir, imageFiles[i]);
    const char = CHARACTERS[i];
    
    console.log(`Processing "${char}" from ${imageFiles[i]}...`);
    
    try {
      await fs.access(imagePath);
    } catch {
      console.log(`⚠️  File not found: ${imagePath}`);
      console.log(`   Please create this file first.\n`);
      continue;
    }

    const points = await processImage(imagePath);
    
    if (points.length > 0) {
      // Convert to stroke format (array of [x,y] pairs)
      const stroke = points.map(p => [p.x, p.y]);
      
      glyphs.push({
        char: char,
        strokes: [stroke]
      });
    }
  }

  if (glyphs.length === 0) {
    console.log('\n❌ No glyphs processed. Make sure image files exist in test-data/\n');
    return;
  }

  // Create JSON output
  const output = {
    fontName: `test_${new Date().toISOString().split('T')[0]}`,
    glyphs: glyphs
  };

  // Save to file
  const outputPath = path.join(testDir, 'test-output.json');
  await fs.writeFile(outputPath, JSON.stringify(output, null, 2));

  console.log(`\n✅ Success! Processed ${glyphs.length} character(s)`);
  console.log(`📄 Output saved to: ${outputPath}\n`);
  console.log('Preview:');
  console.log(JSON.stringify(output, null, 2).substring(0, 500) + '...\n');
}

main().catch(console.error);
