const express = require('express');
const router = express.Router();
const riderController = require('../controllers/riderController');
const { verifyRider, verifyTokenAndAuthorization } = require('../middlewares/verifyToken');

router.post("/", riderController.createRider);
router.get("/search", verifyRider, riderController.searchRestaurant);
router.get("/:riderId", verifyTokenAndAuthorization, riderController.getRiderById);
router.get("/user/:userId", verifyRider, riderController.getRiderUserById);
router.get("/rider_details/:userId", riderController.getRiderByUserId);
router.get("/available/:riderId", verifyRider, riderController.getAllOrdersByOrderStatus);



router.get('/current-trip/:riderId', verifyRider, riderController.currentTrip);
router.get('/completed-trips/:riderId', verifyRider, riderController.completedTrips);

router.get("/restaurant_orders/:restaurantId/:riderId", verifyRider, riderController.getAvailableOrdersForRestaurant);
router.get('/orders/delivered/:riderId', verifyRider, riderController.getDeliveredOrdersByRider);

router.get('/rider-user-account/:riderId', verifyTokenAndAuthorization, riderController.getRiderUserByRiderId);

router.post('/resend-pickup-pin/:orderId/:riderId', verifyRider, riderController.resendPickupPin);

router.patch('/update-user-image/:riderId/userImageUrl', verifyRider, riderController.updateUserImageUrl);
router.patch('/update-driver-license-image/:riderId/driverLicenseImageUrl', verifyRider,riderController.updateDriverLicenseImageUrl);
router.patch('/update-particulars-image/:riderId/particularsImageUrl', verifyRider, riderController.updateParticularsImageUrl);
router.patch('/update-vehicle-image/:riderId/vehicleImgUrl', verifyRider, riderController.updateVehicleImgUrl);

router.put('/assign-rider/:orderId/:riderId/:riderFcm', verifyRider, riderController.assignRiderToOrder);
router.put('/reject-order/:orderId/:riderId/:riderfcm', verifyRider, riderController.rejectOrder);

router.patch('/update-riderStatus/:orderId/:riderStatus/:riderFcm', verifyRider, riderController.updateRiderStatus);
router.post('/verify-delivery/:orderId/:pin', verifyRider, riderController.verifyDeliveryAndPayout);



module.exports = router;

