const express = require('express');
const { createAccount, setPIN, login, loginVendor, validatePhone, validateEmail, resendOTP, createRestaurantAccount } = require('../controllers/authControllers');

const router = express.Router();

router.post('/create-account', createAccount);
router.post('/create-restaurant-account', createRestaurantAccount);
router.post('/set-pin/:id/:pin', setPIN);
router.post('/resend-otp/:id', resendOTP);
router.post('/login/:phone/:pin', login);
router.post('/verify-phone/:phone', validatePhone);
router.post('/verify-email/:email', validateEmail);
router.post('/vendor', loginVendor);


module.exports = router;