# Handwriting Capture Portal

A web application for capturing clients' handwriting data to create personalized fonts. Optimized for tablets and iPads.

## Features

- **Canvas Drawing**: Touch-optimized drawing interface for capturing handwriting strokes
- **97 Characters**: Captures all letters (A-Z, a-z), numbers (0-9), and special characters
- **Real-time Stroke Capture**: Records exact coordinates and stroke order
- **Story & Letter Capture**: Captures natural writing samples for profiling
- **Firebase Integration**: Saves all data with user authentication
- **Progress Tracking**: Auto-saves progress, resume anytime
- **JSON Export**: Download complete handwriting data in automation-ready format

## Setup

### 1. Install Dependencies

```bash
cd handwriting-portal
npm install
```

### 2. Configure Firebase

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Email/Password Authentication**
3. Create a **Firestore Database**
4. Copy your Firebase config to `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Set Up Firestore Rules

In Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /handwriting-sessions/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Creating Client Accounts

### Option 1: Firebase Console (Manual)

1. Go to Firebase Console → Authentication
2. Click "Add User"
3. Enter client email and password
4. Share credentials with client: `http://your-domain.com?email=client@example.com`

### Option 2: Admin Script (Automated)

Create `scripts/create-user.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function createUser(email, password) {
  try {
    const user = await admin.auth().createUser({
      email: email,
      password: password,
    });
    console.log(`✓ User created: ${email}`);
    console.log(`Unique link: https://your-domain.com?email=${email}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

createUser('client@example.com', 'secure-password-123');
```

## Usage Flow

### For Clients:

1. **Login** → Use provided email/password
2. **Draw Characters** → Draw all 97 characters (one at a time)
   - Use finger or stylus
   - Multiple strokes allowed
   - Undo/Clear available
   - Auto-saves progress
3. **Write Story** → Write about their day
4. **Write Thank You Letter** → Example letter
5. **Download JSON** → Complete handwriting data

### For Admins:

1. Create user accounts via Firebase
2. Share unique login links
3. Access completed data in Firestore:
   - Collection: `handwriting-sessions`
   - Document ID: User's UID
   - Fields: `glyphs`, `story`, `thankYouLetter`

## Data Structure

### Firestore Document

```javascript
{
  userId: "user-uid",
  email: "client@example.com",
  glyphs: [
    {
      char: "A",
      strokes: [
        [[0.2, 0.1], [0.5, 0.9], ...],  // First stroke (normalized coordinates)
        [[0.5, 0.9], [0.8, 0.1], ...]   // Second stroke
      ],
      timestamp: 1234567890
    }
  ],
  story: "Today I went to...",
  thankYouLetter: "Dear John, Thank you for...",
  createdAt: 1234567890,
  completedAt: 1234567899
}
```

### Downloaded JSON (for automation)

```json
{
  "fontName": "client_2025-01-18",
  "glyphs": [
    {
      "char": "A",
      "strokes": [
        [[0.2, 0.1], [0.5, 0.9]],
        [[0.5, 0.9], [0.8, 0.1]]
      ]
    }
  ]
}
```

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel dashboard.

### Other Platforms

Works on any Next.js host (Netlify, Railway, etc.)

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Firebase** - Auth + Database
- **HTML Canvas** - Drawing capture

## Character List

- **Punctuation**: ! " # $ % & ' ( ) * + , - . / : ; < = > ? @ [ \\ ] ^ _ \` { | } ~ || " " ... / "
- **Numbers**: 0-9
- **Uppercase**: A-Z
- **Lowercase**: a-z

Total: 97 characters

## Troubleshooting

### Firebase Connection Issues
- Check `.env.local` has correct credentials
- Verify Firebase project is active
- Check browser console for errors

### Canvas Not Drawing
- Ensure touch events are enabled
- Try different browser (Chrome/Safari recommended)
- Check device compatibility

### Data Not Saving
- Verify Firestore rules allow writes
- Check user is authenticated
- Look at Firebase Console logs

## Support

For issues, check Firebase Console logs and browser console errors.
