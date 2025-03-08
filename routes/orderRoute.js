const router = require('express').Router();
const orderController = require('../controllers/orderController');
const {verifyTokenAndAuthorization} = require('../middlewares/verifyToken')

router.post("/", verifyTokenAndAuthorization, orderController.placeOrder);
router.get("/", verifyTokenAndAuthorization,  orderController.getUserOrder);
router.get("/user-order", verifyTokenAndAuthorization,  orderController.getAllUserOrders);
router.get("/user-order-history", verifyTokenAndAuthorization,  orderController.getDeliveredAndCancelledOrders);

router.get("/status-and-payment", verifyTokenAndAuthorization,  orderController.getOrdersByStatusAndPayment);

router.get("/:restaurantId/:orderStatus/:paymentStatus", orderController.getOrdersByRestaurantId);


router.get("/:restaurantId", orderController.getAllOrdersByRestaurantId);

router.get("/get-all-order/by/:orderStatus/:paymentStatus", orderController.getAllOrdersByOrderStatus);

// router.get("/:restaurantId/:orderStatus/:paymentStatus", verifyTokenAndAuthorization,  orderController.getOrdersByRestaurantId);
router.get('/fetch-order/:orderId',   orderController.getOrderByOrderId);



router.patch('/updateOrderStatus/:orderId/:orderStatus',   orderController.updateOrderStatus);
// router.patch('/updateOrderStatus/:orderId', verifyTokenAndAuthorization,  orderController.updateOrderStatus);

// router.get("/status-and-payment", verifyTokenAndAuthorization,  orderController.getOrdersByStatusAndPayment);


module.exports = router;