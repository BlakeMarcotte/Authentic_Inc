import { auth } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export async function createClientUser(email: string, password: string) {
  try {
    const currentUser = auth.currentUser;
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    if (currentUser) {
      await auth.updateCurrentUser(currentUser);
    }
    
    return {
      success: true,
      uid: userCredential.user.uid,
      email: userCredential.user.email,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create user');
  }
}
