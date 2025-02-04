const express = require('express');
const router = express.Router();
const riderController = require('../controllers/riderController');
const {verifyTokenAndAuthorization} = require('../middlewares/verifyToken');

router.post("/",  riderController.createRider);
router.get("/search",  riderController.searchRestaurant);
router.put('/assign-rider/:orderId/:riderId', riderController.assignRiderToOrder);
router.put('/reject-order/:orderId/:riderId', riderController.rejectOrder);
router.get('/current-trip/:driverId', riderController.currentTrip);
router.get('/completed-trips/:driverId', riderController.completedTrips);


module.exports = router;