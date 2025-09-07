const router = require('express').Router();
const orderController = require('../controllers/orderController');
const {verifyTokenAndAuthorization} = require('../middlewares/verifyToken')
const redisClient = require("../services/redisClients");
const http = require("http");


const { Server } = require('socket.io');

const server = http.createServer(router);

const io = new Server(server, {
    cors: {origin: "*"}
});


router.post("/", verifyTokenAndAuthorization, orderController.placeOrder);
router.get("/", verifyTokenAndAuthorization,  orderController.getUserOrder);
router.get("/user-order", verifyTokenAndAuthorization,  orderController.getAllUserOrders);
router.get("/user-order-history", verifyTokenAndAuthorization,  orderController.getDeliveredAndCancelledOrders);

router.get("/status-and-payment", verifyTokenAndAuthorization,  orderController.getOrdersByStatusAndPayment);

router.get("/:restaurantId/:orderStatus/:paymentStatus", verifyTokenAndAuthorization, orderController.getOrdersByRestaurantId);


router.get("/:restaurantId",  verifyTokenAndAuthorization, orderController.getAllOrdersByRestaurantId);

router.get("/get-all-order/by/:orderStatus/:paymentStatus",verifyTokenAndAuthorization, orderController.getAllOrdersByOrderStatus);

// router.get("/:restaurantId/:orderStatus/:paymentStatus", verifyTokenAndAuthorization,  orderController.getOrdersByRestaurantId);
router.get('/fetch-order/:orderId', verifyTokenAndAuthorization,  orderController.getOrderByOrderId);




router.post("/rider/location", async (req, res) => {
  console.log("Api hit...");
  const { riderId, orderId, lat, lng } = req.body;

  const liveKey = `order:${orderId}:riderLocation`;
  const historyKey = `order:${orderId}:riderLocationHistory`;

  try {
    // Save live location with TTL (30s)
    await redisClient.set(
      liveKey,
      JSON.stringify({ lat, lng, orderId, riderId }),
      { EX: 300 }
    );

    // Save history of locations
    await redisClient.rPush(
      historyKey,
      JSON.stringify({ lat, lng, orderId, riderId, timestamp: Date.now() })
    );
    await redisClient.expire(historyKey, 60 * 60 * 24 * 7); // keep history for 7 days

    // Emit to customer + restaurant
    io.to(`order_${orderId}`).emit("rider:location:update", {
      riderId,
      orderId,
      lat,
      lng,
    });

    res.json({
      success: true,
      message: "Location broadcasted",
      liveLocation: await redisClient.get(liveKey),
    });
  } catch (error) {
    console.log("something went wrong with redis", error);
    res.status(500).json({ success: false, message: "Redis error" });
  }
});

// order:68261af1e0dd1a313ffca3a1:riderLocation"



router.patch('/updateOrderStatus/:orderId/:orderStatus/:restaurantFcm',  verifyTokenAndAuthorization, orderController.updateOrderStatus);
// router.patch('/updateOrderStatus/:orderId', verifyTokenAndAuthorization,  orderController.updateOrderStatus);

// router.get("/status-and-payment", verifyTokenAndAuthorization,  orderController.getOrdersByStatusAndPayment);





module.exports = router;