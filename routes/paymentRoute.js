
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middlewares/verifyToken');

// POST /api/payment/initialize -> Called by the customer app to start a payment
router.post('/initialize', verifyToken, paymentController.initializePayment);

// POST /api/payment/webhook -> Called by Paystack servers to confirm a payment
router.post('/webhook', paymentController.paystackWebhook);

router.post('/verify-and-update', verifyToken, paymentController.verifyPaymentAndUpdateOrder);

router.post('/payout/restaurant', paymentController.payoutRestaurant);

router.post('/payout/rider', paymentController.payoutRider);

module.exports = router;