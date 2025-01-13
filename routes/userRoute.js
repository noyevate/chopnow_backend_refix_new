// routes/user.js
const express = require('express');
const { getUser, verifyPhone, verifyPin,resetPassword, resetVendorPassword, verifyEmail, resendVendorOTP, ChangePassword, verifyVendorOtpPin, deleteUser,requestOTPForgotPIN, changePhone, updateUserName,verifyOTPForgotPIN, resetPIN, changePin, } = require('../controllers/userController');
const {verifyTokenAndAuthorization} = require('../middlewares/verifyToken')

const router = express.Router();

router.post('/forgot-pin/:phone', requestOTPForgotPIN);
router.post('/forgot-pin/verify-otp', verifyOTPForgotPIN);
router.put('/forgot-pin/reset', resetPIN);
router.get("/", verifyTokenAndAuthorization, getUser);
router.post('/verify-phone/:id/:otp', verifyPhone);
router.put('/updateUserName/:id/:first_name/:last_name', verifyTokenAndAuthorization, updateUserName);
router.put('/updateUserName/:id/:phone', verifyTokenAndAuthorization, changePhone);
router.post('/verifyPin/:id/:pin', verifyTokenAndAuthorization, verifyPin);
router.put('/changePin/:id/:pin', changePin);
router.post('/reset-vendor/:email/:usertype', resetVendorPassword);
router.post('/verify-vendor-otp/:userId/:otp', verifyVendorOtpPin);
router.post('/resend-vendor-otp/:id', resendVendorOTP);
router.post('/reverify-vendor/:id/:otp', verifyEmail);
router.put('/change-Vendor-Password/:id/:password', ChangePassword);
router.put('/resset-password/:id/:password/:password1', resetPassword);



router.delete('/deleteUser/:id', verifyTokenAndAuthorization, deleteUser);

router.delete("/", verifyTokenAndAuthorization, deleteUser);

module.exports = router;
