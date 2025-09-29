// routes/priceRoute.js
const express = require('express');
const router = express.Router();
const priceController = require('../controllers/priceController');
const { verifyAdmin } = require('../middlewares/verifyToken');

// GET /api/price/
// Fetches the current price configuration. No data needs to be sent.
router.get("/", verifyAdmin, priceController.getPrice);


// Example Body: { "basePrice": 9.99, "serviceFee": 1.50 }
router.post("/", priceController.createPrice);

// Example Body: { "basePrice": 10.99 }
router.patch("/base", verifyAdmin, priceController.updatePrice);

// Example Body: { "serviceFee": 2.00 }
router.patch("/service", verifyAdmin, priceController.updateServiceFee);

module.exports = router;