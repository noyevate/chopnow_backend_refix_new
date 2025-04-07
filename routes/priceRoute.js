const express = require('express');
const router = express.Router();
const priceController = require('../controllers/priceController');
const {verifyAdmin} = require('../middlewares/verifyToken')

router.patch("/:serviceFee", verifyAdmin, priceController.updateServiceFee);
router.post("/:basePrice/:serviceFee", verifyAdmin, priceController.createPrice),

router.get("/", verifyAdmin, priceController.getPrice),

router.patch("/update/:id/:basePrice", verifyAdmin, priceController.updatePrice)



module.exports = router;