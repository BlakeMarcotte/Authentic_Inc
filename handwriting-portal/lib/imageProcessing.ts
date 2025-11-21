import sharp from 'sharp';

export interface ProcessedStroke {
  points: { x: number; y: number }[];
}

export async function processHandwritingImage(
  imageBuffer: Buffer
): Promise<ProcessedStroke[]> {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const width = metadata.width || 1000;
    const height = metadata.height || 1000;

    const processed = await image
      .grayscale()
      .threshold(128)
      .negate()
      .toBuffer();

    const { data } = await sharp(processed)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const points = extractPointsFromBinary(
      data,
      width,
      height
    );

    if (points.length === 0) {
      throw new Error('No handwriting detected in image');
    }

    const normalizedPoints = points.map(p => ({
      x: p.x / width,
      y: p.y / height,
    }));

    return [{ points: normalizedPoints }];
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process handwriting image');
  }
}

function extractPointsFromBinary(
  data: Buffer,
  width: number,
  height: number
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const visited = new Set<string>();
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const pixel = data[idx];
      
      if (pixel > 128) {
        const key = `${x},${y}`;
        if (!visited.has(key)) {
          visited.add(key);
          if (shouldSamplePoint(x, y, points)) {
            points.push({ x, y });
          }
        }
      }
    }
  }
  
  if (points.length === 0) {
    return [];
  }

  return sortPointsByProximity(points);
}

function shouldSamplePoint(
  x: number,
  y: number,
  existingPoints: { x: number; y: number }[]
): boolean {
  if (existingPoints.length === 0) return true;
  
  const samplingDistance = 5;
  
  const lastPoint = existingPoints[existingPoints.length - 1];
  const distance = Math.sqrt(
    Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2)
  );
  
  return distance >= samplingDistance;
}

function sortPointsByProximity(
  points: { x: number; y: number }[]
): { x: number; y: number }[] {
  if (points.length <= 1) return points;
  
  const sorted: { x: number; y: number }[] = [];
  const remaining = [...points];
  
  sorted.push(remaining.shift()!);
  
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
