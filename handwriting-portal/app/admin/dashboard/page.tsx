'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';

const ADMIN_EMAIL = 'admin@authenticink.com';

interface UserInfo {
  email: string;
  createdAt: number;
  status: string;
}

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
  const [users, setUsers] = useState<Record<string, UserInfo>>({});
  const [handwritingData, setHandwritingData] = useState<Record<string, HandwritingData>>({});
  const [newEmail, setNewEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/admin');
      } else {
        setUser(user);
        await loadUsers();
        await loadHandwritingData();
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      const usersData: Record<string, UserInfo> = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        usersData[doc.id] = {
          email: data.email,
          createdAt: data.createdAt,
          status: data.status || 'pending',
        };
      });
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

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

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setMessage('');

    try {
      const { setDoc, doc } = await import('firebase/firestore');
      
      const token = Array.from({ length: 32 }, () => 
        Math.random().toString(36)[2] || '0'
      ).join('');
      
      const inviteId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await setDoc(doc(db, 'invitations', inviteId), {
        id: inviteId,
        email: newEmail,
        token,
        createdAt: Date.now(),
        createdBy: ADMIN_EMAIL,
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000),
        used: false,
      });

      const inviteLink = `${window.location.origin}/signup?token=${token}`;
      
      await navigator.clipboard.writeText(inviteLink);
      
      setMessage(`✓ Invitation created for ${newEmail}\n\n📋 Link copied to clipboard!\n\nShare this link:\n${inviteLink}`);
      setNewEmail('');
    } catch (error: any) {
      setMessage(`✗ Error: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };


  const downloadUserData = async (userId: string, email: string) => {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'handwriting-sessions', userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setMessage('✗ No data found for this user');
        return;
      }

      const data = docSnap.data();
      const glyphs = (data.glyphs || []).map((g: any) => ({
        char: g.char,
        strokes: g.strokes.map((stroke: any[]) => 
          stroke.map((point: any) => [point.x, point.y])
        ),
      }));

      const jsonData = {
        fontName: `${email.split('@')[0]}_${new Date().toISOString().split('T')[0]}`,
        glyphs,
      };

      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${jsonData.fontName}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setMessage(`✓ Downloaded data for ${email}`);
    } catch (error) {
      setMessage('✗ Failed to download user data');
      console.error(error);
    }
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
              <div className="text-2xl font-semibold text-indigo-600">{Object.keys(users).length}</div>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Invitation Link</h2>
            <p className="text-sm text-gray-500 mb-4 font-light">Generate a unique signup link for a client. Link expires in 30 days.</p>
            
            <form onSubmit={handleCreateInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Email
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

              {message && (
                <div className={`p-3 rounded-xl text-sm whitespace-pre-wrap ${
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
                {creating ? 'Creating...' : 'Generate Invitation Link'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Client Accounts</h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Object.keys(users).length === 0 ? (
                <p className="text-gray-400 text-center py-8 font-light">No clients yet</p>
              ) : (
                Object.entries(users).map(([userId, userInfo]) => {
                  const sessionData = handwritingData[userId];
                  return (
                    <div
                      key={userId}
                      className="p-4 border border-gray-200 rounded-xl hover:border-indigo-300 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{userInfo.email}</div>
                          <div className="text-xs text-gray-400 mt-1 font-light">
                            Created: {new Date(userInfo.createdAt).toLocaleDateString()}
                          </div>
                          {sessionData ? (
                            <div className="mt-2 flex gap-2 text-xs flex-wrap">
                              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg">
                                {sessionData.glyphCount} chars
                              </span>
                              {sessionData.completedAt ? (
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg">
                                  ✓ Complete
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg">
                                  In Progress
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="mt-2">
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">
                                Not Started
                              </span>
                            </div>
                          )}
                        </div>
                        {sessionData && sessionData.completedAt && (
                          <button
                            onClick={() => downloadUserData(userId, userInfo.email)}
                            className="ml-3 px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-medium hover:bg-indigo-600 transition-all"
                          >
                            Download JSON
                          </button>
                        )}
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
