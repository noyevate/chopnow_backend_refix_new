const admin = require("firebase-admin");

// Load Firebase service account key (download from Firebase console)
const serviceAccount = require("../chopnow-5110f-firebase-adminsdk-okmba-1674c2d0f5.json");

if (!admin.apps.length) {
  admin.initializeApp({
      credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
  });
}

module.exports = admin;
