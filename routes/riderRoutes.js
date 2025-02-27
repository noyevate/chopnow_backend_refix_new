const express = require('express');
const router = express.Router();
const riderController = require('../controllers/riderController');
const { verifyTokenAndAuthorization } = require('../middlewares/verifyToken');

router.post("/", riderController.createRider);
router.get("/search", riderController.searchRestaurant);
router.put('/assign-rider/:orderId/:riderId', riderController.assignRiderToOrder);
router.put('/reject-order/:orderId/:riderId', riderController.rejectOrder);
router.get('/current-trip/:driverId', riderController.currentTrip);
router.get('/completed-trips/:driverId', riderController.completedTrips);
router.get("/fetch-order/by/:orderStatus/:paymentStatus/:riderId", riderController.getAllOrdersByOrderStatus);
router.get("/restaurant_orders/:restaurantId/:orderStatus/:paymentStatus/:riderId", riderController.getOrdersByOnlyRestaurantId);
router.get('/orders/delivered/:driverId', riderController.getDeliveredOrdersByRider);
router.patch('/update-user-image/:riderId/userImageUrl', riderController.updateUserImageUrl);
router.patch('/update-driver-license-image/:riderId/driverLicenseImageUrl', riderController.updateDriverLicenseImageUrl);
router.patch('/update-particulars-image/:riderId/particularsImageUrl', riderController.updateParticularsImageUrl);
router.patch('/update-vehicle-image/:riderId/vehicleImgUrl', riderController.updateVehicleImgUrl);



module.exports = router;