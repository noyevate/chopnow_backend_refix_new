const express = require('express');
const router = express.Router();
const riderController = require('../controllers/riderController');
const {verifyTokenAndAuthorization} = require('../middlewares/verifyToken');

router.post("/",  riderController.createRider);
router.get("/search",  riderController.searchRestaurant);
router.put('/assign-rider/:orderId/:riderId', riderController.assignRiderToOrder);


module.exports = router;