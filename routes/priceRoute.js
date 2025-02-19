const express = require('express');
const router = express.Router();
const priceController = require('../controllers/priceController');
const {verifyTokenAndAuthorization} = require('../middlewares/verifyToken')


router.post("/:basePrice", priceController.createPrice),
router.get("/", priceController.getPrice),
router.patch("/update/:id/:basePrice", priceController.updatePrice)



module.exports = router;