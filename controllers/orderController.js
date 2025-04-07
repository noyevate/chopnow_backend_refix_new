const Order = require("../models/Order");
const admin = require('firebase-admin');
const User = require("../models/User")
const Rider = require("../models/Rider")
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
        const riders = await Rider.find()
        const riderTokens = riders.map(rider => rider.fcm).filter(token => token);
        if (riderTokens.length > 0) {
            await pushNotificationController.sendPushNotificationToRider(riderTokens, "🚨 New Order Alert!", "A fresh order is waiting for pickup. Let's go!  🚴‍♂️💨", newOrder);

        }
        await pushNotificationController.sendPushNotification(newOrder.customerFcm, "Order created", "Order received with a sprinkle of magic! ✨🍔", newOrder);
        await pushNotificationController.sendPushNotification(newOrder.restaurantFcm, "🚨 New Order Alert!", "A fresh order is waiting to be prepared. Let's go!  🚴‍♂️💨", newOrder)
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



async function updateOrderStatus(req, res) {
    const { orderId, orderStatus, restaurantFcm } = req.params;
    try {
        // Validate the order status
        const validStatuses = ["Placed", "Accepted", "Preparing", "Manual", "Cancelled", "Delivered", "Ready", "Out_For_Delivery"];
        if (!validStatuses.includes(orderStatus)) {
            return res.status(400).json({ status: false, message: "Invalid order status" });
        }

        // Find and update the order
        const order = await Order.findByIdAndUpdate(orderId, { orderStatus: orderStatus, restaurantFcm: restaurantFcm }, { new: true });

        if (!order) {
            return res.status(404).json({ status: false, message: "Order not found" });
        }

        // Custom message for each status
        const statusMessages = {
            "Placed": { title: "🎉 Order In!", body: "Woohoo! Your foodie adventure just began. 🍽️" },
            "Accepted": { title: "🍴 Order Accepted", body: "The restaurant's prepping their magic for you!" },
            "Preparing": { title: "👨‍🍳 Cooking Up!", body: "Your meal is sizzling in the kitchen 🔥" },
            "Manual": { title: "📋 Order Tweaked", body: "Your order status just got a little update!" },
            "Cancelled": { title: "❌ Order Cancelled", body: "Sad news! Your order has been cancelled. 😢" },
            "Delivered": { title: "🍕 Chow Time!", body: "Your food has arrived. Dig in and enjoy! 😋" },
            "Ready": { title: "🛍️ Ready for Pickup", body: "Your order is hot and ready. Come grab it!" },
            "Out_For_Delivery": { title: "🛵 On the Way!", body: "Your food is zipping over to you! 🍔" }
        };


        const { title, body } = statusMessages[orderStatus] || { title: "Order Update", body: `Your order is now ${orderStatus}` };
        // Send push notification if an FCM token is available

        if (order.customerFcm) {
            await pushNotificationController.sendPushNotification(order.customerFcm, title, body, order);
        } else {
            console.log("Something went terribly wrong")
        }

        const statusMessages2 = {
            "Placed": { title_1: "🧾 New Order Alert!", body_1: "A hungry customer just placed a new order. Time to cook up some joy!" },
            "Accepted": { title_1: "✅ Order Accepted", body_1: "You've accepted the order. Let’s get choppin!! 🍳" },
            "Preparing": { title_1: "🍽️ Preparing Meal", body_1: "Cooking in progress. Let’s make this delicious!" },
            "Manual": { title_1: "🛠️ Manual Update", body_1: "You’ve manually updated this order's status." },
            "Cancelled": { title_1: "❌ Order Cancelled", body_1: "You’ve cancelled this order. The customer will be notified." },
            "Delivered": { title_1: "📦 Order Delivered", body_1: "The order has been delivered successfully. Great job!" },
            "Ready": { title_1: "🛍️ Ready for Pickup", body_1: "Meal is packed and ready. Waiting for pickup!" },
            "Out_For_Delivery": { title_1: "🚚 Out for Delivery", body_1: "Food is on the road! Hope it gets there hot and fresh! 🔥" }
        };

        const { title_1, body_1 } = statusMessages2[orderStatus] || { title: "Order Update", body: `Your order is now ${orderStatus}` };
        await pushNotificationController.sendPushNotification(restaurantFcm, title_1, body_1, order);

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
