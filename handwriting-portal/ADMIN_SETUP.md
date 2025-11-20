# Admin Portal Setup Guide

## Initial Setup

### 1. Create Admin Account

First, you need to create the admin account in Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `authentic-ink`
3. Click **Authentication** in the left sidebar
4. Click **Users** tab
5. Click **Add User** button
6. Enter:
   - **Email**: `admin@authenticink.com`
   - **Password**: Choose a secure password (save this!)
7. Click **Add User**

### 2. Set Up Service Account (for programmatic user creation)

To allow the admin dashboard to create users:

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Click **Service Accounts** tab
3. Click **Generate New Private Key**
4. Save the JSON file securely
5. Open the JSON file and copy the entire contents
6. In your `.env.local` file, paste it as one line:

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"authentic-ink",...}
```

### 3. Access Admin Portal

1. Navigate to: `http://localhost:3000/admin`
2. Login with `admin@authenticink.com` and your password
3. You'll be redirected to the admin dashboard

## Using the Admin Dashboard

### Creating Client Accounts

1. **Enter Email**: Client's email address
2. **Generate Password**: Click "Generate" for a secure random password
   - Or manually enter a password
3. **Click "Create Client Account"**
4. Share credentials with the client:
   - Login URL: `https://your-domain.com`
   - Email: (their email)
   - Password: (generated password)

### Managing Clients

- View all client accounts
- See registration dates
- Track completion status:
  - Characters captured
  - Story written
  - Thank you letter completed
- Monitor in-progress sessions

### Dashboard Stats

- **Total Clients**: Number of client accounts created
- **Completed Sessions**: Clients who finished all steps
- **In Progress**: Clients who started but haven't completed

## Firebase Firestore Rules

Make sure your Firestore rules allow admin access:

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

## Security Notes

- **Admin email is hardcoded**: `admin@authenticink.com`
- Only this email can access the admin portal
- Service account key should never be committed to Git
- Use environment variables for all sensitive data
- Consider using Firebase Security Rules for additional protection

## Alternative: Manual User Creation

If you prefer not to use the API route, you can create users manually:

1. Go to Firebase Console → Authentication
2. Click "Add User"
3. Enter email and password
4. Share credentials with client

## Troubleshooting

### "Unauthorized" Error
- Verify you're logged in as `admin@authenticink.com`
- Check that FIREBASE_SERVICE_ACCOUNT is set correctly

### Users Not Loading
- Check Firestore rules
- Verify Firebase project ID matches
- Check browser console for errors

### Can't Create Users
- Verify service account JSON is correct
- Make sure it's on ONE line in .env.local
- Restart dev server after changing .env.local
