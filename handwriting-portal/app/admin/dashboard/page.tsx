'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';

const ADMIN_EMAIL = 'admin@authenticink.com';

interface HandwritingData {
  email: string;
  glyphCount: number;
  hasStory: boolean;
  hasThankYou: boolean;
  completedAt?: number;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [handwritingData, setHandwritingData] = useState<Record<string, HandwritingData>>({});
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/admin');
      } else {
        setUser(user);
        await loadHandwritingData();
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadHandwritingData = async () => {
    try {
      const sessionsRef = collection(db, 'handwriting-sessions');
      const snapshot = await getDocs(sessionsRef);
      
      const data: Record<string, HandwritingData> = {};
      snapshot.forEach((doc) => {
        const sessionData = doc.data();
        data[doc.id] = {
          email: sessionData.email,
          glyphCount: sessionData.glyphs?.length || 0,
          hasStory: !!sessionData.story,
          hasThankYou: !!sessionData.thankYouLetter,
          completedAt: sessionData.completedAt,
        };
      });
      
      setHandwritingData(data);
    } catch (error) {
      console.error('Error loading handwriting data:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setMessage('');

    try {
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const currentUser = auth.currentUser;
      
      const userCredential = await createUserWithEmailAndPassword(auth, newEmail, newPassword);
      
      if (currentUser) {
        await auth.updateCurrentUser(currentUser);
      }

      setMessage(`✓ User created: ${newEmail}`);
      setNewEmail('');
      setNewPassword('');
      await loadHandwritingData();
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setMessage('✗ Error: Email already in use');
      } else if (error.code === 'auth/weak-password') {
        setMessage('✗ Error: Password should be at least 6 characters');
      } else {
        setMessage(`✗ Error: ${error.message}`);
      }
    } finally {
      setCreating(false);
    }
  };

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  const copyLoginLink = (email: string, password: string) => {
    const link = `${window.location.origin}?email=${encodeURIComponent(email)}`;
    navigator.clipboard.writeText(`Login Link: ${link}\nEmail: ${email}\nPassword: ${password}`);
    setMessage(`✓ Copied credentials for ${email}`);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/admin');
  };

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
        <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8 mb-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-500 font-light mt-1">Manage client handwriting accounts</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2.5 bg-gray-400 text-white rounded-xl font-medium hover:bg-gray-500 transition-all shadow-sm"
            >
              Logout
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
              <div className="text-2xl font-semibold text-indigo-600">{Object.keys(handwritingData).length}</div>
              <div className="text-sm text-gray-600 font-light">Total Clients</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <div className="text-2xl font-semibold text-green-600">
                {Object.values(handwritingData).filter(d => d.completedAt).length}
              </div>
              <div className="text-sm text-gray-600 font-light">Completed Sessions</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="text-2xl font-semibold text-amber-600">
                {Object.values(handwritingData).filter(d => !d.completedAt && d.glyphCount > 0).length}
              </div>
              <div className="text-sm text-gray-600 font-light">In Progress</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Client</h2>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="client@example.com"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Auto-generate or enter"
                    required
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all text-gray-900 placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-all"
                  >
                    Generate
                  </button>
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded-xl text-sm ${
                  message.startsWith('✓') 
                    ? 'bg-green-50 border border-green-200 text-green-700' 
                    : 'bg-red-50 border border-red-200 text-red-600'
                }`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={creating}
                className="w-full px-6 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {creating ? 'Creating...' : 'Create Client Account'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Client Accounts</h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Object.keys(handwritingData).length === 0 ? (
                <p className="text-gray-400 text-center py-8 font-light">No clients yet</p>
              ) : (
                Object.entries(handwritingData).map(([userId, data]) => {
                  return (
                    <div
                      key={userId}
                      className="p-4 border border-gray-200 rounded-xl hover:border-indigo-300 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{data.email}</div>
                          <div className="text-xs text-gray-400 mt-1 font-light">
                            User ID: {userId.substring(0, 8)}...
                          </div>
                          <div className="mt-2 flex gap-2 text-xs">
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg">
                              {data.glyphCount} chars
                            </span>
                            {data.completedAt && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg">
                                ✓ Complete
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
