import { NextRequest, NextResponse } from 'next/server';
import { processHandwritingImage } from '@/lib/imageProcessing';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const strokes = await processHandwritingImage(buffer);

    return NextResponse.json({ 
      success: true,
      strokes 
    });
  } catch (error: any) {
    console.error('Image processing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process image',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
