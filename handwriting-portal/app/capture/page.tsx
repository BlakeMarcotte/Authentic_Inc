'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import DrawingCanvas from '@/components/DrawingCanvas';
import TextCapture from '@/components/TextCapture';
import { CHARACTERS, Glyph, Stroke, NormalizedPoint } from '@/lib/types';

type CaptureStage = 'drawing' | 'story' | 'thankyou' | 'complete';

export default function CapturePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [glyphs, setGlyphs] = useState<Glyph[]>([]);
  const [stage, setStage] = useState<CaptureStage>('drawing');
  const [story, setStory] = useState('');
  const [thankYouLetter, setThankYouLetter] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/');
      } else {
        setUser(user);
        await loadExistingProgress(user.uid);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadExistingProgress = async (userId: string) => {
    try {
      const docRef = doc(db, 'handwriting-sessions', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const loadedGlyphs = (data.glyphs || []).map((g: any) => ({
          char: g.char,
          strokes: g.strokes.map((stroke: any[]) => stroke.map((point: any) => [point.x, point.y] as NormalizedPoint)),
          timestamp: g.timestamp,
        }));
        
        setGlyphs(loadedGlyphs);
        setCurrentCharIndex(loadedGlyphs.length || 0);
        setStory(data.story || '');
        setThankYouLetter(data.thankYouLetter || '');

        if (data.completedAt) {
          setStage('complete');
        } else if (data.thankYouLetter) {
          setStage('complete');
        } else if (data.story) {
          setStage('thankyou');
        } else if (loadedGlyphs.length >= CHARACTERS.length) {
          setStage('story');
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const saveProgress = async (updatedGlyphs?: Glyph[], updatedStory?: string, updatedThankYou?: string) => {
    if (!user) return;

    const glyphsData = (updatedGlyphs || glyphs).map(g => ({
      char: g.char,
      strokes: g.strokes.map(stroke => stroke.map(point => ({ x: point[0], y: point[1] }))),
      timestamp: g.timestamp,
    }));

    const sessionData = {
      userId: user.uid,
      email: user.email || '',
      glyphs: glyphsData,
      glyphCount: glyphsData.length,
      story: updatedStory !== undefined ? updatedStory : story,
      thankYouLetter: updatedThankYou !== undefined ? updatedThankYou : thankYouLetter,
      createdAt: Date.now(),
      completedAt: (stage === 'complete' || (updatedThankYou && updatedStory)) ? Date.now() : null,
    };

    try {
      await setDoc(doc(db, 'handwriting-sessions', user.uid), sessionData);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleGlyphComplete = (strokes: Stroke[]) => {
    const newGlyph: Glyph = {
      char: CHARACTERS[currentCharIndex],
      strokes,
      timestamp: Date.now(),
    };

    const updatedGlyphs = [...glyphs, newGlyph];
    setGlyphs(updatedGlyphs);
    saveProgress(updatedGlyphs);
  };

  const handleNext = () => {
    if (currentCharIndex < CHARACTERS.length - 1) {
      setCurrentCharIndex(currentCharIndex + 1);
    } else {
      setStage('story');
    }
  };

  const handlePrevious = () => {
    if (currentCharIndex > 0) {
      setGlyphs(glyphs.slice(0, -1));
      setCurrentCharIndex(currentCharIndex - 1);
    }
  };

  const handleStoryComplete = (text: string) => {
    setStory(text);
    saveProgress(glyphs, text);
    setStage('thankyou');
  };

  const handleThankYouComplete = async (text: string) => {
    setThankYouLetter(text);
    await saveProgress(glyphs, story, text);
    setStage('complete');
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (stage === 'complete') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-lg p-8 text-center border border-gray-200">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl font-semibold text-gray-900 mb-4">Complete!</h1>
          <p className="text-xl text-gray-500 mb-8 font-light">
            Thank you for capturing your handwriting. Your data has been saved successfully.
          </p>

          <div className="bg-gray-50 rounded-2xl p-6 mb-6 text-left border border-gray-200">
            <h2 className="font-medium text-gray-800 mb-2">Session Summary:</h2>
            <ul className="space-y-1 text-gray-600 font-light">
              <li>✓ {glyphs.length} characters captured</li>
              <li>✓ Story written ({story.length} characters)</li>
              <li>✓ Thank you letter written ({thankYouLetter.length} characters)</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-800">
              <p className="font-medium mb-1">✓ All data saved to cloud</p>
              <p className="text-indigo-600 font-light">Your handwriting data is securely stored and accessible by your administrator.</p>
            </div>
            
            <button
              onClick={handleLogout}
              className="px-8 py-3 bg-gray-500 text-white rounded-xl font-medium hover:bg-gray-600 transition-all shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'thankyou') {
    return (
      <TextCapture
        title="Write a Thank You Letter"
        prompt="Write an example of a thank you letter you would send to someone. This helps capture your natural writing style."
        placeholder="Dear [Name],

Thank you so much for..."
        onComplete={handleThankYouComplete}
        onPrevious={() => setStage('story')}
      />
    );
  }

  if (stage === 'story') {
    return (
      <TextCapture
        title="Tell Us About Your Day"
        prompt="Write a short story about your day. This helps us understand your natural writing style and word choices."
        placeholder="Today was an interesting day. I started my morning by..."
        onComplete={handleStoryComplete}
        onPrevious={() => {
          setStage('drawing');
          setCurrentCharIndex(CHARACTERS.length - 1);
        }}
      />
    );
  }

  return (
    <DrawingCanvas
      character={CHARACTERS[currentCharIndex]}
      onComplete={handleGlyphComplete}
      onNext={handleNext}
      onPrevious={currentCharIndex > 0 ? handlePrevious : undefined}
      hasPrevious={currentCharIndex > 0}
      progress={{
        current: currentCharIndex + 1,
        total: CHARACTERS.length,
      }}
    />
  );
}
