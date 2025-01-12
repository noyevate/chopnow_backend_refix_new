const express = require('express');
const { createAccount, setPIN, login, loginVendor, loginRider, validatePhone, createRiderAccount, validateEmail, resendOTP,  validatePassword, createRestaurantAccount } = require('../controllers/authControllers');

const router = express.Router();

router.post('/create-account', createAccount);
router.post('/create-restaurant-account', createRestaurantAccount);
router.post('/create_rider_account', createRiderAccount);
router.post('/set-pin/:id/:pin', setPIN);
router.post('/resend-otp/:id', resendOTP);
router.post('/login/:phone/:pin', login);
router.post('/verify-phone/:phone', validatePhone);
router.post('/verify-password/:password/:id', validatePassword);
router.post('/verify-email/:email', validateEmail);
router.post('/vendor', loginVendor);
router.post('/rider', loginRider);


module.exports = router;