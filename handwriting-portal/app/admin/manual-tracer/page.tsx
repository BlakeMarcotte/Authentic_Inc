'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';

const ADMIN_EMAIL = 'admin@authenticink.com';

interface Point {
  x: number;
  y: number;
}

export default function ManualTracer() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [charName, setCharName] = useState('');
  const [strokes, setStrokes] = useState<Point[][]>([[]]);
  const [currentStrokeIndex, setCurrentStrokeIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [selectedUser, setSelectedUser] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/admin');
      } else {
        setUser(user);
        await loadUsers();
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    redraw();
  }, [strokes, currentStrokeIndex, image]);

  const loadUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      const usersData: Record<string, string> = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        usersData[doc.id] = data.email;
      });
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const scale = Math.min(800 / img.width, 800 / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        redraw();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (image) {
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    }

    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#00FFFF', '#FFFF00'];

    strokes.forEach((stroke, strokeIndex) => {
      if (stroke.length === 0) return;

      const isCurrentStroke = strokeIndex === currentStrokeIndex;
      const color = colors[strokeIndex % colors.length];

      ctx.strokeStyle = color;
      ctx.lineWidth = isCurrentStroke ? 3 : 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();

      stroke.forEach((point, i) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(point.x, point.y, isCurrentStroke ? 5 : 3, 0, Math.PI * 2);
        ctx.fill();

        if (isCurrentStroke) {
          ctx.fillStyle = 'white';
          ctx.font = '10px monospace';
          ctx.fillText((i + 1).toString(), point.x - 3, point.y + 3);
        }
      });
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) {
      setMessage('⚠️ Please upload an image first');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newStrokes = [...strokes];
    newStrokes[currentStrokeIndex].push({ x, y });
    setStrokes(newStrokes);
  };

  const startNewStroke = () => {
    if (strokes[currentStrokeIndex].length === 0) {
      setMessage('⚠️ Current stroke is empty. Add points before creating a new stroke.');
      return;
    }

    setStrokes([...strokes, []]);
    setCurrentStrokeIndex(strokes.length);
    setMessage('');
  };

  const undoLastPoint = () => {
    if (strokes[currentStrokeIndex].length > 0) {
      const newStrokes = [...strokes];
      newStrokes[currentStrokeIndex].pop();
      setStrokes(newStrokes);
    }
  };

  const clearAll = () => {
    if (confirm('Clear all points and strokes?')) {
      setStrokes([[]]);
      setCurrentStrokeIndex(0);
      setMessage('');
    }
  };

  const switchStroke = (index: number) => {
    setCurrentStrokeIndex(index);
  };

  const saveToFirebase = async () => {
    if (!selectedUser) {
      setMessage('⚠️ Please select a user');
      return;
    }

    const char = charName.trim();
    if (!char) {
      setMessage('⚠️ Please enter a character name');
      return;
    }

    const totalPoints = strokes.reduce((sum, s) => sum + s.length, 0);
    if (totalPoints === 0) {
      setMessage('⚠️ No points marked. Click on the image to add points.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not found');

      const filteredStrokes = strokes.filter(s => s.length > 0);

      const normalizedStrokes = filteredStrokes.map(stroke =>
        stroke.map(p => ({
          x: p.x / canvas.width,
          y: p.y / canvas.height
        }))
      );

      const sessionRef = doc(db, 'handwriting-sessions', selectedUser);
      
      const glyphData = {
        char: char,
        strokes: normalizedStrokes.map(stroke => ({ points: stroke })),
        timestamp: Date.now(),
        source: 'manual-tracer'
      };

      await setDoc(
        sessionRef,
        {
          glyphs: [glyphData],
          lastUpdated: Date.now(),
          email: users[selectedUser],
        },
        { merge: true }
      );

      setMessage(`✓ Saved ${char} with ${totalPoints} points across ${filteredStrokes.length} stroke(s) for ${users[selectedUser]}`);
      
      setTimeout(() => {
        setStrokes([[]]);
        setCurrentStrokeIndex(0);
        setCharName('');
        setImage(null);
        setMessage('');
      }, 2000);
    } catch (error: any) {
      setMessage(`✗ Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const totalPoints = strokes.reduce((sum, s) => sum + s.length, 0);
  const currentPoints = strokes[currentStrokeIndex].length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="text-2xl text-gray-600 font-light">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Manual Point Tracer</h1>
              <p className="text-gray-500 font-light mt-1">Click points along character centerline</p>
            </div>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-6 py-2.5 bg-gray-400 text-white rounded-xl font-medium hover:bg-gray-500 transition-all shadow-sm"
            >
              Back to Dashboard
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
            <div className="text-sm text-blue-800">
              <strong>Instructions:</strong><br />
              1. Select a user account<br />
              2. Upload a character image (PNG/JPG)<br />
              3. Enter the character name<br />
              4. Click 20-50 points along the centerline<br />
              5. Press "New Stroke" between separate strokes<br />
              6. Save to Firebase
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select User Account
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all text-gray-900"
              >
                <option value="">Choose a user...</option>
                {Object.entries(users).map(([userId, email]) => (
                  <option key={userId} value={userId}>{email}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Character Name
              </label>
              <input
                type="text"
                value={charName}
                onChange={(e) => setCharName(e.target.value)}
                placeholder="e.g., A"
                maxLength={1}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Character Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={startNewStroke}
              className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-all shadow-sm"
            >
              New Stroke
            </button>
            <button
              onClick={undoLastPoint}
              className="px-6 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-all shadow-sm"
            >
              Undo Point
            </button>
            <button
              onClick={clearAll}
              className="px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-all shadow-sm"
            >
              Clear All
            </button>
            <button
              onClick={saveToFirebase}
              disabled={saving || !selectedUser}
              className="px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {saving ? 'Saving...' : 'Save to Firebase'}
            </button>
          </div>

          <div className="flex gap-3 mb-6 flex-wrap">
            {strokes.map((stroke, i) => (
              <button
                key={i}
                onClick={() => switchStroke(i)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  i === currentStrokeIndex
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Stroke {i + 1} ({stroke.length} pts)
              </button>
            ))}
          </div>

          <div className="border-2 border-gray-300 rounded-2xl overflow-hidden inline-block mb-6">
            <canvas
              ref={canvasRef}
              width={800}
              height={800}
              onClick={handleCanvasClick}
              className="cursor-crosshair bg-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-center">
              <div className="text-2xl font-semibold text-indigo-600">{totalPoints}</div>
              <div className="text-sm text-gray-600 font-light">Total Points</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
              <div className="text-2xl font-semibold text-green-600">{currentPoints}</div>
              <div className="text-sm text-gray-600 font-light">Current Stroke</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center">
              <div className="text-2xl font-semibold text-purple-600">{strokes.length}</div>
              <div className="text-sm text-gray-600 font-light">Total Strokes</div>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-sm ${
              message.startsWith('✓')
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-amber-50 border border-amber-200 text-amber-700'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
