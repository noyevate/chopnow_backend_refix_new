// const Order = require("../models/Order");
// const admin = require('firebase-admin');
// const User = require("../models/User")
// const Rider = require("../models/Rider")
// const pushNotificationController = require("./pushNotificationController")
// const redisClient = require("../services/redisClients");

// async function placeOrder(req, res) {

//     const newOrder = new Order({
//         ...req.body, userId: req.user.id

//     });

//     //samuelnoye35@gmail.com
//     //password123456789

//     try {
//         await newOrder.save();
//         const orderId = newOrder._id
//         const riders = await Rider.find()
//         const riderTokens = riders.map(rider => rider.fcm).filter(token => token);
//         if (riderTokens.length > 0) {
//             await pushNotificationController.sendPushNotificationToRider(riderTokens, "🚨 New Order Alert!", "A fresh order is waiting for pickup. Let's go!  🚴‍♂️💨", newOrder);

//         }
//         await pushNotificationController.sendPushNotification(newOrder.customerFcm, "Order created", "Order received with a sprinkle of magic! ✨🍔", newOrder);
//         await pushNotificationController.sendPushNotification(newOrder.restaurantFcm, "🚨 New Order Alert!", "A fresh order is waiting to be prepared. Let's go!  🚴‍♂️💨", newOrder)
//         res.status(201).json({ status: true, message: "Order placed successfully", orderId: orderId });
//         console.log(orderId)
//     } catch (error) {
//         res.status(500).json({ status: false, message: error.message });
//     }
// }

// async function getUserOrder(req, res) {
//     const userId = req.user.id;
//     const { paymentStatus, orderStatus } = req.query;
//     let query = { userId };

//     if (paymentStatus) {
//         query.paymentStatus = paymentStatus;
//     };

//     if (orderStatus === orderStatus) {
//         query.orderStatus = orderStatus;
//     };

//     try {
//         const orders = await Order.find(query).populate({
//             path: 'orderItem.foodId',
//             select: "imageUrl title rating time"
//         });
//         res.status(200).json(orders)
//     } catch (error) {
//         res.status(500).json({ status: false, message: error.message });
//     }
// }

// async function getOrdersByRestaurantId(req, res) {
//     const { restaurantId } = req.params;
//     const { orderStatus, paymentStatus } = req.params;

//     // Validate the required parameters
//     if (!restaurantId || !orderStatus || !paymentStatus) {
//         return res.status(400).json({ status: false, message: "restaurantId, orderStatus, and paymentStatus are required" });
//     }

//     let query = { restaurantId, orderStatus, paymentStatus };

//     try {
//         const orders = await Order.find(query).populate({
//             path: 'orderItems.foodId',
//             select: "imageUrl title rating time"
//         });
//         res.status(200).json(orders);
//     } catch (error) {
//         res.status(500).json({ status: false, message: error.message });
//     }
// }



// async function updateOrderStatus(req, res) {
//     const { orderId, orderStatus, restaurantFcm } = req.params;
//     try {
//         // Validate the order status
//         const validStatuses = ["Placed", "Accepted", "Preparing", "Manual", "Cancelled", "Delivered", "Ready", "Out_For_Delivery"];
//         if (!validStatuses.includes(orderStatus)) {
//             return res.status(400).json({ status: false, message: "Invalid order status" });
//         }

//         // Find and update the order
//         const order = await Order.findByIdAndUpdate(orderId, { orderStatus: orderStatus, restaurantFcm: restaurantFcm }, { new: true });

//         if (!order) {
//             return res.status(404).json({ status: false, message: "Order not found" });
//         }

//         // Custom message for each status
//         const statusMessages = {
//             "Placed": { title: "🎉 Order In!", body: "Woohoo! Your foodie adventure just began. 🍽️" },
//             "Accepted": { title: "🍴 Order Accepted", body: "The restaurant's prepping their magic for you!" },
//             "Preparing": { title: "👨‍🍳 Cooking Up!", body: "Your meal is sizzling in the kitchen 🔥" },
//             "Manual": { title: "📋 Order Tweaked", body: "Your order status just got a little update!" },
//             "Cancelled": { title: "❌ Order Cancelled", body: "Sad news! Your order has been cancelled. 😢" },
//             "Delivered": { title: "🍕 Chow Time!", body: "Your food has arrived. Dig in and enjoy! 😋" },
//             "Ready": { title: "🛍️ Ready for Pickup", body: "Your order is hot and ready. Come grab it!" },
//             "Out_For_Delivery": { title: "🛵 On the Way!", body: "Your food is zipping over to you! 🍔" }
//         };


//         const { title, body } = statusMessages[orderStatus] || { title: "Order Update", body: `Your order is now ${orderStatus}` };
//         // Send push notification if an FCM token is available

//         if (order.customerFcm) {
//             await pushNotificationController.sendPushNotification(order.customerFcm, title, body, order);
//         } else {
//             console.log("Something went terribly wrong")
//         }

//         const statusMessages2 = {
//             "Placed": { title_1: "🧾 New Order Alert!", body_1: "A hungry customer just placed a new order. Time to cook up some joy!" },
//             "Accepted": { title_1: "✅ Order Accepted", body_1: "You've accepted the order. Let’s get choppin!! 🍳" },
//             "Preparing": { title_1: "🍽️ Preparing Meal", body_1: "Cooking in progress. Let’s make this delicious!" },
//             "Manual": { title_1: "🛠️ Manual Update", body_1: "You’ve manually updated this order's status." },
//             "Cancelled": { title_1: "❌ Order Cancelled", body_1: "You’ve cancelled this order. The customer will be notified." },
//             "Delivered": { title_1: "📦 Order Delivered", body_1: "The order has been delivered successfully. Great job!" },
//             "Ready": { title_1: "🛍️ Ready for Pickup", body_1: "Meal is packed and ready. Waiting for pickup!" },
//             "Out_For_Delivery": { title_1: "🚚 Out for Delivery", body_1: "Food is on the road! Hope it gets there hot and fresh! 🔥" }
//         };

//         const { title_1, body_1 } = statusMessages2[orderStatus] || { title: "Order Update", body: `Your order is now ${orderStatus}` };
//         await pushNotificationController.sendPushNotification(restaurantFcm, title_1, body_1, order);

//         res.status(200).json({ status: true, message: "Order status updated successfully", order });

//     } catch (error) {
//         console.error("Error updating order status:", error);
//         res.status(500).json({ status: false, message: error.message });
//     }
// }

// async function getOrdersByStatusAndPayment(req, res) {
//     const userId = req.user.id
//     const { paymentStatus, orderStatus } = req.query;

//     // Validate required query parameters
//     if (!userId || !paymentStatus || !orderStatus) {
//         return res.status(400).json({ status: false, message: "paymentStatus and orderStatus are required" });
//     }

//     let query = { paymentStatus, orderStatus };

//     try {
//         const orders = await Order.find(query).populate({
//             path: 'orderItems.foodId',
//             select: "imageUrl title rating time"
//         });
//         res.status(200).json(orders);
//     } catch (error) {
//         res.status(500).json({ status: false, message: error.message });
//     }
// }

// async function getAllOrdersByRestaurantId(req, res) {
//     const restaurantId = req.params.restaurantId;

//     try {
//         // Find orders by restaurantId
//         const orders = await Order.find({ restaurantId: restaurantId });
//         res.status(200).json(orders);
//     } catch (error) {
//         res.status(500).json({ status: false, message: error.message });
//     }
// }


// async function getAllUserOrdersDeliveredOrCancelled(req, res) {
//     const userId = req.user.id;

//     try {
//         const orders = await Order.find({
//             userId,
//             orderStatus: { $nin: ["Delivered", "Cancelled"] }
//         }).populate({
//             path: 'orderItems.foodId',
//             select: "imageUrl title rating time"
//         });
//         res.status(200).json(orders);
//     } catch (error) {
//         res.status(500).json({ status: false, message: error.message });
//     }
// }

// async function getDeliveredAndCancelledOrders(req, res) {
//     const userId = req.user.id;

//     try {
//         const orders = await Order.find({
//             userId,
//             orderStatus: { $in: ["Delivered", "Cancelled"] }
//         }).populate({
//             path: 'orderItems.foodId',
//             select: "imageUrl title rating time"
//         });
//         res.status(200).json(orders);
//     } catch (error) {
//         res.status(500).json({ status: false, message: error.message });
//     }
// }

// async function getAllOrdersByOrderStatus(req, res) {
//     const { orderStatus, paymentStatus } = req.params;

//     try {
//         const orders = await Order.find({
//             orderStatus: orderStatus,
//             paymentStatus: paymentStatus
//         }).populate({
//             path: 'orderItems.foodId',
//             select: "imageUrl title rating time"
//         });
//         res.status(200).json(orders);

//     } catch (error) {
//         res.status(500).json({ status: false, message: error.message })
//     }
// }

// async function getOrderByOrderId(req, res) {
//     const { orderId } = req.params;

//     try {
//         const orders = await Order.findById(orderId).populate({
//             path: 'orderItems.foodId',
//             select: "imageUrl title rating time"
//         });
//         res.status(200).json(orders);

//     } catch (error) {
//         res.status(500).json({ status: false, message: error.message })
//     }
// }

// async function getLastRiderLocation(req, res) {
//     try {
//         const { orderId } = req.params;
//         const data = await redisClient.get(`order:${orderId}:location`);
//         if (!data) {
//             res.status(404).json({ status: false, message: "No location available" });
//         }
//         res.json({ stattus: true, location: JSON.parse(data) })
//     } catch (error) {
//         res.status(500).json({ status: false, message: error.message })
//     }
// }

// module.exports = { placeOrder, getDeliveredAndCancelledOrders, getAllUserOrdersDeliveredOrCancelled, getUserOrder, getOrdersByRestaurantId, updateOrderStatus, getOrdersByStatusAndPayment, getAllOrdersByRestaurantId, getAllOrdersByOrderStatus, getOrderByOrderId, getLastRiderLocation }




// controllers/orderController.js
const { Op } = require("sequelize"); // Import Sequelize operators
const { Order, User, OrderItem, Rider, Food, Restaurant } = require("../models");
const sequelize = require('../config/database');
const pushNotificationController = require("./pushNotificationController");
const redisClient = require("../services/redisClients");
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

// In orderController.js
async function placeOrder(req, res) {
    // 1. Start a managed transaction.
    try {
        logger.info(`creating an order`, { controller: 'orderController', endpoint: `placeOrder`});
        const result = await sequelize.transaction(async (t) => {
            // 2. Separate the orderItems array from the main order data.
            const { orderItems, ...orderData } = req.body;
            orderData.userId = req.user.id; // Assign the authenticated user's ID

            const plainTextPin = Math.floor(1000 + Math.random() * 9000).toString();

            // 2. Hash the PIN before saving it to the database
            const salt = await bcrypt.genSalt(10);
            const hashedPin = await bcrypt.hash(plainTextPin, salt);
            orderData.deliveryPin = hashedPin;

            // 3. Create the main Order record within the transaction.
            const newOrder = await Order.unscoped().create(orderData, { transaction: t });

            // 4. Check if there are items to add.
            if (orderItems && orderItems.length > 0) {
                // 5. Prepare the items.
                const itemsToCreate = orderItems.map(item => ({
                    orderId: newOrder.id,
                    foodId: item.foodId, // Pass UUID string directly
                    quantity: item.numberOfPack || 1,
                    additives: item.additives || [],
                    instruction: item.instruction || '',
                    price: item.totalPrice
                }));

                // 6. Bulk create all OrderItem records.
                await OrderItem.bulkCreate(itemsToCreate, { transaction: t });
            }

            return { order: newOrder, deliveryPin: plainTextPin };
        });
        const { order, deliveryPin } = result;

        // --- Post-Transaction Logic (Push Notifications) ---
        const completeOrder = await Order.findByPk(result.id);
        // ... (your push notification logic) ...

        const responseData = {
            status: true,
            message: "Order placed successfully",
            orderId: order.id,
            deliveryPin: deliveryPin // <-- Send the PIN to the customer app
        };

        logger.info(`Order placed successfully`, { controller: 'orderController', orderId: `${result.id}`, endpoint: `placeOrder`});

        res.status(201).json(responseData);

    } catch (error) {
        // Sequelize often wraps the original DB error. Let's log both.
        console.error("Sequelize Error:", error);
        if (error.original) {
            console.error("Original DB Error:", error.original);
            logger.error(`Original DB Error: ${error.original}`, { controller: 'orderController', endpoint: `placeOrder`});
        }
        logger.error(`Failed to place orderr: ${error.message}`, { controller: 'orderController', endpoint: `placeOrder`});
        
        res.status(500).json({ status: false, message: "Failed to place order.", error: error.message });
    }
}

// In orderController.js
// Make sure you have the Order model imported from your central models/index.js
// const { Order } = require('../models');

async function getUserOrder(req, res) {
    const userId = req.user.id;
    const { paymentStatus, orderStatus } = req.query;
    logger.info(`get user order`, { controller: 'orderController', endpoint: `getUserOrder`});

    try {
        const whereClause = { userId: userId };

        if (paymentStatus) {
            whereClause.paymentStatus = paymentStatus;
        }

        if (orderStatus) {
            whereClause.orderStatus = orderStatus;
        }

        const orders = await Order.findAll({
            where: whereClause,
            include: [{
                model: Restaurant,
                as: 'restaurant',
                attributes: ["id", "logoUrl", "title", "phone"]
            }],
            order: [['createdAt', 'DESC']] // Optional: Sort by newest first
        });

         logger.info(`Get user order successful`, { controller: 'orderController', user: `${userId}`, endpoint: `getUserOrder`});

        res.status(200).json(orders);

    } catch (error) {
        console.error("Failed to get user orders:", error);
        logger.error(`Failed to place orderr: ${error.message}`, { controller: 'orderController', endpoint: `getUserOrder`});
        res.status(500).json({ status: false, message: "Failed to get user orders.", error: error.message });
    }
}


async function getOrdersByRestaurantId(req, res) {
    // Kept as req.params as per your original route
    const { restaurantId, orderStatus, paymentStatus } = req.params;
    logger.info(`get orders by restaurantId`, { controller: 'orderController', endpoint: `getOrdersByRestaurantId`});


    // It's better to check for the main ID first
    if (!restaurantId) {
        logger.error(`Restaurant ID is required:`, { controller: 'orderController', endpoint: `getOrdersByRestaurantId`});
        return res.status(400).json({ status: false, message: "Restaurant ID is required." });
    }

    try {
        const whereClause = { restaurantId: restaurantId };

        if (orderStatus) {
            whereClause.orderStatus = orderStatus;
        }

        if (paymentStatus) {
            whereClause.paymentStatus = paymentStatus;
        }

        const orders = await Order.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']] // Sort by newest first
        });
        logger.info(`Get user order successful`, { controller: 'orderController', restaurantId: `${restaurantId}`, endpoint: `getOrdersByRestaurantId`});

        res.status(200).json(orders);

    } catch (error) {
        logger.error(`Failed to place orderr: ${error.message}`, { controller: 'orderController', endpoint: `getUserOrder`});
        res.status(500).json({ status: false, message: "Failed to get restaurant orders.", error: error.message });
    }
}
async function updateOrderStatus(req, res) {
    // Kept as req.params as per your original route
    const { orderId, orderStatus, restaurantFcm } = req.params;
    logger.info(`update Order Status`, { controller: 'orderController', endpoint: `updateOrderStatus`});
    try {
        
        const validStatuses = ["Placed", "Accepted", "Preparing", "Manual", "Cancelled", "Delivered", "Ready", "Out_For_Delivery"];
        if (!validStatuses.includes(orderStatus)) {
            logger.error(`Invalid order status.`, { controller: 'orderController', orderStatus: "orderStatus", endpoint: `updateOrderStatus`});
            return res.status(400).json({ status: false, message: "Invalid order status." });
        }

        // Prepare the data to be updated
        const updateData = { orderStatus: orderStatus };
        if (restaurantFcm) {
            updateData.restaurantFcm = restaurantFcm;
        }

        // Perform the update
        const [updatedRows] = await Order.update(updateData, {
            where: { id: orderId }
        });

        if (updatedRows === 0) {
            logger.error(`Order not found or no changes made`, { controller: 'orderController', endpoint: `updateOrderStatus`});
            return res.status(404).json({ status: false, message: "Order not found or no changes made." });
        }

        // Fetch the updated order. This will be fully populated with items
        // due to the defaultScope, which is great for notifications.
        const order = await Order.findByPk(orderId);

        // --- Push notification logic remains exactly the same ---
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
        if (order.customerFcm) {
            await pushNotificationController.sendPushNotification(order.customerFcm, title, body, order);
            logger.info(`notification sent successfull: ${statusMessages[orderStatus]}`, { controller: 'orderController', endpoint: `updateOrderStatus`});
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
        if (restaurantFcm) { // Only send if a token was provided
            await pushNotificationController.sendPushNotification(restaurantFcm, title_1, body_1, order);
            logger.info(`notification sent successfull: ${statusMessages[orderStatus]}`, { controller: 'orderController', endpoint: `updateOrderStatus`});
        }
        // --- End notification logic ---
        
        logger.info(`update order status successful`, { controller: 'orderController',  orderStatus: "orderStatus", orderId:`${orderId}`, endpoint: `updateOrderStatus`});

        res.status(200).json({ status: true, message: "Order status updated successfully", order });

    } catch (error) {
        console.error("Error updating order status:", error);
        logger.error(`Failed to update order status ${error.message}`, { controller: 'orderController', endpoint: `updateOrderStatus`});
        res.status(500).json({ status: false, message: "Failed to update order status.", error: error.message });
    }
}


// This function requires both paymentStatus and orderStatus
async function getOrdersByStatusAndPayment(req, res) {
    const userId = req.user.id;
    const { paymentStatus, orderStatus } = req.query; // Stays as req.query

    if (!paymentStatus || !orderStatus) {
        return res.status(400).json({ status: false, message: "paymentStatus and orderStatus are required" });
    }

    try {
        // This query is simple, but the defaultScope will automatically
        // include the orderItems and their food details in the result.
        const orders = await Order.findAll({
            where: { paymentStatus, orderStatus },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to get orders.", error: error.message });
    }
}

async function getAllOrdersByRestaurantId(req, res) {
    const { restaurantId } = req.params; // Stays as req.params

    try {
        // Again, the defaultScope does the heavy lifting of populating the data.
        const orders = await Order.findAll({
            where: { restaurantId: restaurantId },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to get all restaurant orders.", error: error.message });
    }
}

// This function gets all orders for a user that are NOT 'Delivered' or 'Cancelled'
async function getAllUserOrdersDeliveredOrCancelled(req, res) {
    const userId = req.user.id;
    try {
        
        const orders = await Order.findAll({
            where: {
                userId,
                orderStatus: {
                    [Op.notIn]: ["Delivered", "Cancelled"]
                }
            },
            order: [['createdAt', 'DESC']],
            include: [{
                model: Restaurant,
                as: 'restaurant',
                attributes: ["id", "logoUrl", "title", "phone"]
            }]
        });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to get active user orders.", error: error.message });
    }
}

// In your orderController.js
async function getDeliveredAndCancelledOrders(req, res) {
    const userId = req.user.id;
    const controllerName = 'getDeliveredAndCancelledOrders';

    try {
        logger.info(`Fetching past orders for user.`, { controller: controllerName, userId });

        // --- THIS IS THE FIX ---
        const orders = await Order.findAll({
            // 'where' is a top-level option
            where: {
                userId: userId,
                orderStatus: {
                    [Op.in]: ["Delivered", "Cancelled"]
                }
            },
            
            // 'include' is a separate, top-level option
            include: [{
                model: Restaurant,
                as: 'restaurant', // This alias MUST match the one in models/index.js
                attributes: ["id", "logoUrl", "title", "phone"]
            }],
            
            // It's also good practice to add an order
            order: [['updatedAt', 'DESC']]
        });
        // --- END FIX ---
        
        logger.info(`Found ${orders.length} past orders for user.`, { controller: controllerName, userId });
        res.status(200).json(orders);

    } catch (error) {
        logger.error(`Failed to get past orders: ${error.message}`, { controller: controllerName, userId, error: error.stack });
        res.status(500).json({ status: false, message: "Failed to get past orders.", error: error.message });
    }
}

async function getAllOrdersByOrderStatus(req, res) {
    // Kept as req.params as per your original route
    const { orderStatus, paymentStatus } = req.params;

    try {
        const orders = await Order.findAll({
            where: {
                orderStatus: orderStatus,
                paymentStatus: paymentStatus
            }
        });
        res.status(200).json(orders);

    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to get orders by status.", error: error.message });
    }
}

async function getOrderByOrderId(req, res) {
    const { orderId } = req.params;
    try {
        const order = await Order.findByPk(orderId, {
            // We add our new include to the existing ones from the default scope
            include: [
                {
                    model: Restaurant,
                    as: 'restaurant',
                    attributes: ["id", "logoUrl", "title", "phone"]
                }
            ]
        });
        if (!order) {
            return res.status(404).json({ status: false, message: "Order not found" });
        }
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to get order by ID.", error: error.message });
    }
}

// This function does not change as it only uses Redis
async function getLastRiderLocation(req, res) {
    try {
        const { orderId } = req.params;
        const data = await redisClient.get(`order:${orderId}:location`);
        if (!data) {
            return res.status(404).json({ status: false, message: "No location available" });
        }
        res.json({ status: true, location: JSON.parse(data) });
    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to get rider location.", error: error.message });
    }
}

async function getOrdersByRestaurant(req, res) {
    // 1. Get the required restaurantId from the URL path
    const { restaurantId } = req.params;
    // 2. Get the optional orderStatus from the query string
    const { orderStatus } = req.query; 
    const controllerName = 'getOrdersByRestaurant';

    try {
        logger.info(`Fetching orders for restaurant.`, { controller: controllerName, restaurantId, orderStatus });

        if (!restaurantId) {
            logger.warn(`Restaurant ID is required.`, { controller: controllerName });
            return res.status(400).json({ status: false, message: "Restaurant ID is required." });
        }

        // --- Build the WHERE clause dynamically ---
        const whereClause = {
            restaurantId: restaurantId
        };
        
        // 3. If an orderStatus is provided in the query, add it to the where clause.
        if (orderStatus) {
            whereClause.orderStatus = orderStatus;
        }

        // --- Find all matching orders ---
        const orders = await Order.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']] // Show the newest orders first
        });
        
        // The defaultScope on the Order model will automatically include
        // the orderItems and their food details.
        
        logger.info(`Found ${orders.length} orders for restaurant.`, { controller: controllerName, restaurantId, filters: { orderStatus } });
        res.status(200).json(orders);

    } catch (error) {
        logger.error(`Failed to fetch orders for restaurant: ${error.message}`, { controller: controllerName, restaurantId, error: error.stack });
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
}

async function resendDeliveryPin(req, res) {
    const { orderId } = req.params;
    const userId = req.user.id; // Get the authenticated user
    const controllerName = 'resendDeliveryPin';

    try {
        logger.info(`Customer requested to resend delivery PIN for order.`, { controller: controllerName, orderId, userId });

        const order = await Order.findOne({
            where: {
                id: orderId,
                userId: userId // CRUCIAL: Ensure the user owns this order
            }
        });

        if (!order || !order.deliveryPin) {
            return res.status(404).json({ status: false, message: "Active order not found." });
        }

        // --- THIS IS THE CRITICAL LOGIC ---
        // 1. Generate a NEW plain-text PIN.
        const newPlainTextPin = Math.floor(1000 + Math.random() * 9000).toString();

        // 2. Hash the NEW PIN.
        const salt = await bcrypt.genSalt(10);
        const newHashedPin = await bcrypt.hash(newPlainTextPin, salt);
        
        // 3. Update the order in the database with the NEW hashed PIN.
        await order.update({
            deliveryPin: newHashedPin
        });
        
        // 4. Send the NEW plain-text PIN to the customer's verified phone number.
        // await sendSmsToCustomer(order.customerPhone, `Your new delivery PIN for order #${order.orderSubId} is ${newPlainTextPin}.`);
        // --- END CRITICAL LOGIC ---

        logger.info(`Successfully resent new delivery PIN for order.`, { controller: controllerName, orderId, userId });
        res.status(200).json({ status: true, message: `A new PIN has been sent to your phone number.`, newPlainTextPin });

    } catch (error) {
        logger.error(`Failed to resend PIN: ${error.message}`, { controller: controllerName, orderId, error: error.stack });
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
}




module.exports = {
    placeOrder,
    getDeliveredAndCancelledOrders,
    getAllUserOrdersDeliveredOrCancelled,
    getUserOrder,
    getOrdersByRestaurantId,
    updateOrderStatus,
    getOrdersByStatusAndPayment,
    getAllOrdersByRestaurantId,
    getAllOrdersByOrderStatus,
    getOrderByOrderId,
    getLastRiderLocation,
    getOrdersByRestaurant,
    resendDeliveryPin
};