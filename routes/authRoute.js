const express = require('express');
const { createAccount, setPIN, login, loginVendor, loginRider, validatePhone, createRiderAccount, validateEmail, resendOTP,  validatePassword, createRestaurantAccount } = require('../controllers/authControllers');

const router = express.Router();
const redisClient = require("../services/redisClients");
const http = require("http");


// const { Server } = require('socket.io');

// const server = http.createServer(router);

// const io = new Server(server, {
//     cors: {origin: "*"}
// });

router.post( '/create-account', createAccount);
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

// router.get("/get-order/:orderId/location", async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const data = await redisClient.get(`order:${orderId}:riderLocation`);

//     if (!data) {
//       return res.status(404).json({ status: false, message: "No location available" });
//     }

//     res.json({ status: true, location: JSON.parse(data) });
//   } catch (error) {
//     res.status(500).json({ status: false, error: error.message });
//   }
// });

// router.get("/get-order/:orderId/location-history", async (req, res) => {
//   try {
//     const { orderId } = req.params;

//     // Fetch all history (latest 50 entries for example)
//     const history = await redisClient.lRange(
//       `order:${orderId}:riderLocationHistory`,
//       0,
//       49
//     );

//     if (!history || history.length === 0) {
//       return res.status(404).json({ status: false, message: "No history available" });
//     }

//     res.json({
//       status: true,
//       history: history.map((item) => JSON.parse(item)),
//     });
//   } catch (error) {
//     res.status(500).json({ status: false, error: error.message });
//   }
// });



module.exports = router;