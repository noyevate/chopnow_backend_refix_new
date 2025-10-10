const router = require('express').Router();
const orderController = require('../controllers/orderController');
const {verifyTokenAndAuthorization, verifyVendor} = require('../middlewares/verifyToken')



router.post("/", verifyTokenAndAuthorization, orderController.placeOrder);
router.get("/", verifyTokenAndAuthorization,  orderController.getUserOrder);
router.get("/user-order", verifyTokenAndAuthorization,  orderController.getAllUserOrdersDeliveredOrCancelled);
router.get("/user-order-history", verifyTokenAndAuthorization,  orderController.getDeliveredAndCancelledOrders);

router.get("/status-and-payment", verifyTokenAndAuthorization,  orderController.getOrdersByStatusAndPayment);

router.get("/:restaurantId/:orderStatus/:paymentStatus", verifyVendor, orderController.getOrdersByRestaurantId);


router.get("/:restaurantId",  verifyTokenAndAuthorization, orderController.getAllOrdersByRestaurantId);

router.get("/get-all-order/by/:orderStatus/:paymentStatus",verifyTokenAndAuthorization, orderController.getAllOrdersByOrderStatus);

// router.get("/:restaurantId/:orderStatus/:paymentStatus", verifyTokenAndAuthorization,  orderController.getOrdersByRestaurantId);
router.get('/fetch-order/:orderId', verifyTokenAndAuthorization,  orderController.getOrderByOrderId);

router.post('/resend-pin/:orderId', verifyTokenAndAuthorization, orderController.resendDeliveryPin);

router.get('/restaurant/status/:restaurantId', verifyVendor, orderController.getOrdersByRestaurant);





// order:68261af1e0dd1a313ffca3a1:riderLocation"



router.patch('/updateOrderStatus/:orderId/:orderStatus/:restaurantFcm',  verifyVendor, orderController.updateOrderStatus);

// router.patch('/updateOrderStatus/:orderId', verifyTokenAndAuthorization,  orderController.updateOrderStatus);

// router.get("/status-and-payment", verifyTokenAndAuthorization,  orderController.getOrdersByStatusAndPayment);





module.exports = router;