const admin = require("firebase-admin");

// Load Firebase service account key (download from Firebase console)
const serviceAccount = require("../chopnow-5110f-firebase-adminsdk-okmba-1674c2d0f5.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
