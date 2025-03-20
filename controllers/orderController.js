const Order = require("../models/Order");
const admin = require('firebase-admin');
const User = require("../models/User")
const pushNotificationController = require("./pushNotificationController")



async function placeOrder(req, res) {

    const newOrder = new Order({
        ...req.body, userId: req.user.id

    });

    //samuelnoye35@gmail.com
    //password123456789

    try {
        await newOrder.save();
        const orderId = newOrder._id
        const riders = await User.find({userType: "Rider"})
        const riderTokens = riders.map(rider => rider.fcm).filter(token => token);
        if (riderTokens.length > 0) {
            // await pushNotificationController.sendPushNotification(riderTokens, );
            
        }
        await pushNotificationController.sendPushNotification(newOrder.customerFcm, "Order created", "Your Order as been placed", newOrder);
        res.status(201).json({ status: true, message: "Order placed successfully", orderId: orderId });
        console.log(orderId)
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}

async function getUserOrder(req, res) {
    const userId = req.user.id;
    const { paymentStatus, orderStatus } = req.query;
    let query = { userId };

    if (paymentStatus) {
        query.paymentStatus = paymentStatus;
    };

    if (orderStatus === orderStatus) {
        query.orderStatus = orderStatus;
    };

    try {
        const orders = await Order.find(query).populate({
            path: 'orderItem.foodId',
            select: "imageUrl title rating time"
        });
        res.status(200).json(orders)
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}

async function getOrdersByRestaurantId(req, res) {
    const { restaurantId } = req.params;
    const { orderStatus, paymentStatus } = req.params;

    // Validate the required parameters
    if (!restaurantId || !orderStatus || !paymentStatus) {
        return res.status(400).json({ status: false, message: "restaurantId, orderStatus, and paymentStatus are required" });
    }

    let query = { restaurantId, orderStatus, paymentStatus };

    try {
        const orders = await Order.find(query).populate({
            path: 'orderItems.foodId',
            select: "imageUrl title rating time"
        });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}



// async function updateOrderStatus(req, res) {
//     const { orderId, orderStatus } = req.params; // Access orderStatus from params

//     // Optional: You can validate orderStatus if you want to restrict it to certain values
//     if (!orderStatus) {
//         return res.status(400).json({ status: false, message: "Order status is required" });
//     }

//     try {
//         const order = await Order.findByIdAndUpdate(orderId, { orderStatus }, { new: true });

//         if (!order) {
//             return res.status(404).json({ status: false, message: "Order not found" });
//         }

//         res.status(201).json({ status: true, message: "Order status updated successfully", order });
//     } catch (error) {
//         console.error("Update order status error:", error);
//         res.status(500).json({ status: false, message: error.message });
//     }
// }


async function updateOrderStatus(req, res) { 
    const { orderId, orderStatus } = req.params;
    try {
        // Validate the order status
        const validStatuses = ["Placed", "Accepted", "Preparing", "Manual", "Cancelled", "Delivered", "Ready", "Out_For_Delivery"];
        if (!validStatuses.includes(orderStatus)) {
            return res.status(400).json({ status: false, message: "Invalid order status" });
        }

        // Find and update the order
        const order = await Order.findByIdAndUpdate(orderId, { orderStatus: orderStatus }, { new: true });

        if (!order) { 
            return res.status(404).json({ status: false, message: "Order not found" });
        }

        // Custom message for each status
        const statusMessages = {
            "Placed": { title: "Order Placed", body: "Your order has been placed successfully!" },
            "Accepted": { title: "Order Accepted", body: "Your order has been accepted by the restaurant!" },
            "Preparing": { title: "Order Preparing", body: "Your order is being prepared by the kitchen!" },
            "Manual": { title: "Order Update", body: "Your order status has been manually updated!" },
            "Cancelled": { title: "Order Cancelled", body: "Your order has been cancelled." },
            "Delivered": { title: "Order Delivered", body: "Your order has been delivered. Enjoy your meal!" },
            "Ready": { title: "Order Ready", body: "Your order is ready for pickup!" },
            "Out_For_Delivery": { title: "Out for Delivery", body: "Your order is on its way to you!" }
        };

        const { title, body } = statusMessages[orderStatus] || { title: "Order Update", body: `Your order is now ${orderStatus}` };

        // Send push notification if an FCM token is available
        try {
            if (order.customerFcm) {
                await pushNotificationController.sendPushNotification(order.customerFcm, title, body, order);
            }
        } catch(e) {
            console.log(`error ${e}`)
        }

        res.status(200).json({ status: true, message: "Order status updated successfully", order });

    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ status: false, message: error.message });
    }
}





async function getOrdersByStatusAndPayment(req, res) {
    const userId = req.user.id
    const { paymentStatus, orderStatus } = req.query;

    // Validate required query parameters
    if (!userId || !paymentStatus || !orderStatus) {
        return res.status(400).json({ status: false, message: "paymentStatus and orderStatus are required" });
    }

    let query = { paymentStatus, orderStatus };

    try {
        const orders = await Order.find(query).populate({
            path: 'orderItems.foodId',
            select: "imageUrl title rating time"
        });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}

async function getAllOrdersByRestaurantId(req, res) {
    const restaurantId = req.params.restaurantId;

    // if (!mongoose.Types.ObjectId.isValid(id)) {
    //     return res.status(400).json({
    //         status: false,
    //         message: 'Invalid restaurantId format',
    //     });
    // }

    try {
        // Find orders by restaurantId
        const orders = await Order.find({ restaurantId: restaurantId });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}


async function getAllUserOrders(req, res) {
    const userId = req.user.id;

    try {
        const orders = await Order.find({
            userId,
            orderStatus: { $nin: ["Delivered", "Cancelled"] }
        }).populate({
            path: 'orderItems.foodId',
            select: "imageUrl title rating time"
        });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}

async function getDeliveredAndCancelledOrders(req, res) {
    const userId = req.user.id;

    try {
        const orders = await Order.find({
            userId,
            orderStatus: { $in: ["Delivered", "Cancelled"] }
        }).populate({
            path: 'orderItems.foodId',
            select: "imageUrl title rating time"
        });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}

async function getAllOrdersByOrderStatus(req, res) {
    const { orderStatus, paymentStatus } = req.params;

    try {
        const orders = await Order.find({
            orderStatus: orderStatus,
            paymentStatus: paymentStatus
        }).populate({
            path: 'orderItems.foodId',
            select: "imageUrl title rating time"
        });
        res.status(200).json(orders);

    } catch (error) {
        res.status(500).json({ status: false, message: error.message })
    }
}

async function getOrderByOrderId(req, res) {
    const { orderId } = req.params;

    try {
        const orders = await Order.findById(orderId).populate({
            path: 'orderItems.foodId',
            select: "imageUrl title rating time"
        });
        res.status(200).json(orders);

    } catch (error) {
        res.status(500).json({ status: false, message: error.message })
    }
}

module.exports = { placeOrder, getDeliveredAndCancelledOrders, getAllUserOrders, getUserOrder, getOrdersByRestaurantId, updateOrderStatus, getOrdersByStatusAndPayment, getAllOrdersByRestaurantId, getAllOrdersByOrderStatus, getOrderByOrderId }
