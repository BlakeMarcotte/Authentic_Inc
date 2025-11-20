'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';

const ADMIN_EMAIL = 'admin@authenticink.com';

interface User {
  uid: string;
  email: string;
  createdAt: string;
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
  const [users, setUsers] = useState<User[]>([]);
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
        await loadUsers();
        await loadHandwritingData();
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/list-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: ADMIN_EMAIL }),
      });

      const data = await response.json();
      if (data.users) {
        setUsers(data.users);
      }
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setMessage('');

    try {
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          adminEmail: ADMIN_EMAIL,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✓ User created: ${newEmail}`);
        setNewEmail('');
        setNewPassword('');
        await loadUsers();
      } else {
        setMessage(`✗ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('✗ Failed to create user');
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
              <div className="text-2xl font-semibold text-indigo-600">{users.length}</div>
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
              {users.length === 0 ? (
                <p className="text-gray-400 text-center py-8 font-light">No clients yet</p>
              ) : (
                users.map((clientUser) => {
                  const data = handwritingData[clientUser.uid];
                  return (
                    <div
                      key={clientUser.uid}
                      className="p-4 border border-gray-200 rounded-xl hover:border-indigo-300 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{clientUser.email}</div>
                          <div className="text-xs text-gray-400 mt-1 font-light">
                            Created: {new Date(clientUser.createdAt).toLocaleDateString()}
                          </div>
                          {data && (
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
                          )}
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
