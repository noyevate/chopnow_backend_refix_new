// routes/user.js
const express = require('express');
const { getUser, verifyPhone, verifyPin,resetPassword, resetVendorPassword, verifyEmail, resendVendorOTP, ChangePassword, verifyVendorOtpPin, deleteUser,requestOTPForgotPIN, changePhone, updateUserName,verifyOTPForgotPIN, resetPIN, changePin, verifyUserMailOtpPin} = require('../controllers/userController');
const {verifyTokenAndAuthorization} = require('../middlewares/verifyToken')
const logger = require('../utils/logger');



const router = express.Router();

router.get('/test-logs', (req, res) => {
    // This creates a child logger just for this test, which is a good pattern
    const testLogger = logger.child({ controller: 'LogTest' });

    testLogger.info('This is an informational message.', { data: 'Some extra info' });
    testLogger.warn('This is a warning message.', { code: 'WARN-123' });
    testLogger.error('This is a simulated error message.', { error: 'Simulated Error Stack' });

    res.status(200).json({ status: true, message: "Logs have been generated. Check your console, files, and Azure." });
});

router.post('/forgot-pin/:email', requestOTPForgotPIN);
// router.post('/forgot-pin/verify-otp', verifyOTPForgotPIN);
router.put('/forgot-pin/reset', resetPIN);
router.get("/", verifyTokenAndAuthorization, getUser);
router.post('/verify-phone/:id/:otp', verifyPhone);
router.put('/updateUserName/:id/:first_name/:last_name', verifyTokenAndAuthorization, updateUserName);
router.put('/updateUserPhone/:id/:phone', verifyTokenAndAuthorization, changePhone);
router.post('/verifyPin/:id/:pin', verifyTokenAndAuthorization, verifyPin);
router.put('/changePin/:id/:pin', changePin);
router.post('/reset-vendor/:email/:userType', resetVendorPassword);
router.post('/verify-vendor-otp/:userId/:otp', verifyVendorOtpPin);
router.post('/resend-vendor-otp/:id', resendVendorOTP);
router.post('/reverify-vendor/:id/:otp', verifyEmail);
router.put('/change-Vendor-Password/:id/:password', ChangePassword);
router.put('/resset-password/:id/:password/:password1', resetPassword);
router.post('/verify-mail/:userId/:otp', verifyUserMailOtpPin);



router.delete('/deleteUser/:id', verifyTokenAndAuthorization, deleteUser);

router.delete("/", verifyTokenAndAuthorization, deleteUser);

module.exports = router;
