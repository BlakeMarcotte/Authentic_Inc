import { NextResponse } from 'next/server';
import { auth as adminAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

if (getApps().length === 0) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      };

  initializeApp({
    credential: cert(serviceAccount),
  });
}

export async function POST(request: Request) {
  try {
    const { adminEmail } = await request.json();

    if (adminEmail !== 'admin@authenticink.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const listUsersResult = await adminAuth().listUsers(1000);
    const users = listUsersResult.users
      .filter(user => user.email !== 'admin@authenticink.com')
      .map(user => ({
        uid: user.uid,
        email: user.email,
        createdAt: user.metadata.creationTime,
      }));

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to list users' },
      { status: 500 }
    );
  }
}
