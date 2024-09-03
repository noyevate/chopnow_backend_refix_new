// routes/user.js
const express = require('express');
const { getUser, verifyPhone, verifyPin, changePin, deleteUser,requestOTPForgotPIN, changePhone, updateUserName,verifyOTPForgotPIN, resetPIN, changePin, } = require('../controllers/userController');
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


router.delete('/deleteUser/:id', verifyTokenAndAuthorization, deleteUser);

router.delete("/", verifyTokenAndAuthorization, deleteUser);

module.exports = router;
