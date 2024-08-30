const Order = require("../models/Order");


async function placeOrder(req, res) {

    const newOrder = new Order({
        ...req.body, userId: req.user.id

    });

    //samuelnoye35@gmail.com
    //password123456789

    try {
        await newOrder.save();
        const orderId = newOrder._id
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
    const { orderStatus, paymentStatus } = req.query;

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
    const { orderId } = req.params;
    const { status } = req.body;

    try {
        const order = await Order.findByIdAndUpdate(orderId, { orderStatus: status }, { new: true });
        res.status(201).json({ status: true, message: "Order status updated successfully", order });
    } catch (error) {
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

module.exports = { placeOrder, getDeliveredAndCancelledOrders, getAllUserOrders, getUserOrder, getOrdersByRestaurantId, updateOrderStatus, getOrdersByStatusAndPayment }
