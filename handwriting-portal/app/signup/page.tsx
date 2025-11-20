'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';

export default function SignupPage() {
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    loadInvitation(token);
  }, [searchParams]);

  const loadInvitation = async (token: string) => {
    try {
      const invitesRef = collection(db, 'invitations');
      const q = query(invitesRef, where('token', '==', token));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError('Invitation not found or invalid');
        setLoading(false);
        return;
      }

      const inviteDoc = snapshot.docs[0];
      const data = inviteDoc.data();

      if (data.used) {
        setError('This invitation has already been used');
        setLoading(false);
        return;
      }

      if (data.expiresAt < Date.now()) {
        setError('This invitation has expired');
        setLoading(false);
        return;
      }

      setInviteData({ ...data, docId: inviteDoc.id });
      setLoading(false);
    } catch (error) {
      console.error('Error loading invitation:', error);
      setError('Failed to load invitation');
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setCreating(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, inviteData.email, password);

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: inviteData.email,
        createdAt: Date.now(),
        createdBy: inviteData.createdBy,
        status: 'active',
        testMode: inviteData.testMode || false,
      });

      await updateDoc(doc(db, 'invitations', inviteData.docId), {
        used: true,
        usedAt: Date.now(),
        userId: userCredential.user.uid,
      });

      router.push('/capture');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login instead.');
      } else {
        setError(error.message || 'Failed to create account');
      }
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="text-2xl text-gray-600 font-light">Loading...</div>
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8 border border-gray-200 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-500 mb-6 font-light">{error}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-all"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8 border border-gray-200">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">✨</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
          <p className="text-gray-500 font-light">You've been invited to join Authentic Ink</p>
        </div>

        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Email:</span> {inviteData?.email}
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Create Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={creating}
            className="w-full px-6 py-3.5 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {creating ? 'Creating Account...' : 'Create Account & Start'}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6 font-light">
          Already have an account? <a href="/" className="text-indigo-500 hover:text-indigo-600">Login</a>
        </p>
      </div>
    </div>
  );
}
