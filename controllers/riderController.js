const Restaurant = require("../models/Restaurant");
const Order = require("../models/Order");
const Rider = require("../models/Rider");
const RiderRating = require('../models/RiderRating');
const User = require('../models/User');
const pushNotificationController = require("./pushNotificationController")
// const { io } = require("../services/socket_io");
const { getIO } = require("../services/socket_io");


async function createRider(req, res) {
    const { userId, vehicleImgUrl, vehicleType, vehicleBrand, plateNumber, guarantors, bankName, bankAccount, bankAccountName, coords, fcm } = req.body;

    try {

        const existingRider = await Rider.findOne({ $or: [{ userId }] });

        if (existingRider) {
            if (existingRider.userId.toString() === userId) {
                return res.status(400).json({ status: false, message: "User already has a created a rider" });
            } else if (existingRider.title === title) {
                return res.status(400).json({ status: false, message: "A rider with this title already exists" });
            }
        }
        const newCreateRider = new Rider(req.body);
        await newCreateRider.save();

        // Fetch user details based on userId
        await pushNotificationController.sendPushNotification(fcm, "Rider", `Your journey starts now! Ready to drive, earn, and make a difference? Let’s go! `, "")
        const user = await User.findById(userId).select("first_name last_name"); // Select only required fields
        res.status(201).json({
            status: true, message: "Rider added Successfully", newCreateRider: {

                riderId: newCreateRider._id,
                vehicle: newCreateRider.vehicleType,
                rating: newCreateRider.rating,
                postalcode: newCreateRider.coords.postalCode,
                verification: newCreateRider.verification,
                coord: newCreateRider.coords,
                userImg: newCreateRider.userImageUrl
            },
            user: user || null,
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}


async function searchRestaurant(req, res) {
    try {
        const { title } = req.query;

        if (!title) {
            return res.status(400).json({ status: false, message: "restaurant name is required for search." });
        }

        // Perform a case-insensitive search using a regex pattern
        const restaurants = await Restaurant.find({ title: { $regex: title, $options: 'i' } });

        if (restaurants.length === 0) {
            return res.status(404).json({ status: false, message: "No restaurants found." });
        }

        res.status(200).json(restaurants);
    } catch (error) {
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
};


async function assignRiderToOrder(req, res) {
    try {
        const { orderId, userId, riderFcm } = req.params;

        if (!orderId || !userId) {
            return res.status(400).json({ status: false, message: "Order ID and User ID are required." });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ status: false, message: "Order not found." });
        }
        if (order.riderAssigned == true) {
            return res.status(404).json({ status: false, message: "Order as already been assFigned." });
        }

        order.driverId = userId;
        order.riderAssigned = true
        order.riderStatus = "RA"
        order.riderFcm = riderFcm
        await order.save();

        console.log(order.customerFcm)
        console.log(riderFcm)
        try {
            if (order.customerFcm) {

                await pushNotificationController.sendPushNotification(order.customerFcm, "Rider Assigned", "Woohoo! 🎉 A rider has been assigned to your order!", order);
                await pushNotificationController.sendPushNotification(riderFcm, "Rider Assigned", "Woohoo! 🎉 you've been assigned to this order", order);
            }

        } catch (e) {
            console.log(`error ${e}`)
        }
        
        console.log("socket io conection")

        const io = getIO();
        const order_Id = order._id
        const rider_Id = order.driverId 
    io.to(`order_${order._id}`).emit("order:assigned", { order_Id, rider_Id})

        res.status(200).json({ status: true, message: "Rider assigned successfully.", data: order });
    } catch (error) {
        console.log(error)
        res.status(500).json({ status: false, message: "Server error", error: error.message });
        
    }
};

async function rejectOrder(req, res) {
    try {
        const { orderId, userId, fcm } = req.params;

        if (!orderId || !usrId) {
            return res.status(400).json({ status: false, message: "Order ID and Rider ID are required." });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ status: false, message: "Order not found." });
        }
        if (order.driverId == userId) {
            return res.status(400).json({ status: false, message: "you've already been assigned to this order" });
        }

        // Ensure rider is not added multiple times
        if (!order.rejectedBy.includes(userId)) {
            order.rejectedBy.push(userId);
            await order.save();
            await pushNotificationController.sendPushNotification(riderFcm, "Order Rejected", "you've rejected this order", order);
        }

        res.status(200).json({ status: true, message: "Order rejected successfully.", data: order });
    } catch (error) {
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
};

async function currentTrip(req, res) {
    try {
        const { driverId } = req.params;

        if (!driverId) {
            return res.status(400).json({ status: false, message: "Driver ID is required" });
        }

        const order = await Order.findOne({
            driverId: driverId,
            paymentStatus: "Completed",
            orderStatus: { $nin: ["Delivered", "Cancelled"] }
        });

        if (!order) {
            return res.status(404).json({ status: false, message: "No active trips found for this driver" });
        }

        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
}

async function completedTrips(req, res) {
    try {
        const { driverId } = req.params;

        if (!driverId) {
            return res.status(400).json({ status: false, message: "Driver ID is required" });
        }

        const orders = await Order.find({
            driverId,
            paymentStatus: "Completed",
            orderStatus: "Delivered" // Only fetch delivered orders
        });

        if (orders.length === 0) {
            return res.status(404).json({ status: false, message: "No completed trips found" });
        }

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
};

async function getAllOrdersByOrderStatus(req, res) {
    const { orderStatus, paymentStatus, userId } = req.params;

    try {
        const orders = await Order.find({
            orderStatus: orderStatus,
            paymentStatus: paymentStatus,
            riderAssigned: false,
            driverId: "",
            rejectedBy: { $nin: [userId] }
        }).populate({
            path: 'orderItems.foodId',
            select: "imageUrl title rating time"
        });

        res.status(200).json(orders);

    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}

async function getOrdersByOnlyRestaurantId(req, res) {

    const { restaurantId, orderStatus, paymentStatus, userId } = req.params;

    // Validate the required parameters
    if (!restaurantId || !orderStatus || !paymentStatus) {
        return res.status(400).json({ status: false, message: "restaurantId, orderStatus, and paymentStatus are required" });
    }

    try {
        const orders = await Order.find({
            restaurantId: restaurantId,
            orderStatus: orderStatus,
            paymentStatus: paymentStatus,
            driverId: "",
            riderAssigned: false,
            riderId: { $nin: [userId] }

        }).populate({
            path: 'orderItems.foodId',
            select: "imageUrl title rating time"
        });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}

async function getDeliveredOrdersByRider(req, res) {
    const { driverId } = req.params;

    try {
        // Check if driverId is provided
        if (!driverId) {
            return res.status(400).json({ status: false, message: "Driver Id is required" });
        }

        // Fetch delivered orders with riderStatus as OD
        const orders = await Order.find({
            driverId: driverId,
            orderStatus: "Delivered",
            riderStatus: "OD"
        }).populate({
            path: 'orderItems.foodId',
            select: "imageUrl title rating time"
        });

        // If no orders are found
        if (orders.length === 0) {
            return res.status(404).json({ status: false, message: "No delivered orders found" });
        }

        // Fetch rider rating for each order
        const ordersWithRatings = await Promise.all(
            orders.map(async (order) => {
                const rating = await RiderRating.findOne({ orderId: order._id, riderId: driverId });
                return {
                    ...order._doc,
                    riderRating: rating || null
                };
            })
        );

        res.status(200).json(ordersWithRatings);
    } catch (error) {
        res.status(500).json({ status: false, message: "Server error" });
    }
}

async function updateUserImageUrl(req, res) {
    const { riderId } = req.params;
    let { userImageUrl } = req.body;

    try {
        const rider = await Rider.findById(riderId);
        if (!rider) {
            return res.status(404).json({ status: false, message: "Rider not found" });
        }


        rider.userImageUrl = userImageUrl;
        await rider.save();

        res.status(200).json({
            status: true,
            message: "User image updated successfully",
            userImageUrl: rider.userImageUrl // Return a properly formatted URL
        });

    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to update user image", error: error.message });
    }
}

async function updateDriverLicenseImageUrl(req, res) {
    const { riderId, } = req.params;
    let { driverLicenseImageUrl } = req.body;

    try {
        const rider = await Rider.findById(riderId);
        if (!rider) {
            return res.status(404).json({ status: false, message: "Rider not found" });
        }


        rider.driverLicenseImageUrl = driverLicenseImageUrl;
        await rider.save();

        res.status(200).json({ status: true, message: "Driver license image updated successfully", driverLicenseImageUrl: rider.driverLicenseImageUrl });

    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to update driver license image", error: error.message });
    }
}

async function updateParticularsImageUrl(req, res) {
    const { riderId } = req.params;

    let { particularsImageUrl } = req.body;

    try {
        const rider = await Rider.findById(riderId);
        if (!rider) {
            return res.status(404).json({ status: false, message: "Rider not found" });
        }

        rider.particularsImageUrl = particularsImageUrl;
        await rider.save();

        res.status(200).json({ status: true, message: "Particulars image updated successfully", particularsImageUrl: rider.particularsImageUrl });

    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to update particulars image", error: error.message });
    }
}

async function updateVehicleImgUrl(req, res) {
    const { riderId, } = req.params;
    let { vehicleImgUrl } = req.body;

    try {
        const rider = await Rider.findById(riderId);
        if (!rider) {
            return res.status(404).json({ status: false, message: "Rider not found" });
        }


        rider.vehicleImgUrl = vehicleImgUrl;
        await rider.save();

        res.status(200).json({ status: true, message: "Vehicle image updated successfully", vehicleImgUrl: rider.vehicleImgUrl });

    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to update vehicle image", error: error.message });
    }
}

async function getRiderById(req, res) {
    const { riderId } = req.params;

    try {

        const rider = await Rider.findById(riderId)
        if (!rider) {
            return res.status(404).json({ status: false, message: "Rider not found" })
        }
        return res.status(200).json(rider)
    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to fetch rider" })
    }
}

async function getRiderUserById(req, res) {
    const { userId } = req.params;

    try {

        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ status: false, message: "Rider not found" })
        }
        if (user.userType != "Rider") {
            return res.status(404).json({ status: false, message: "Rider not found" })
        }
        return res.status(200).json(user)
    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to fetch rider" })
    }
}

async function updateRiderStatus(req, res) {
    const { orderId, riderStatus, riderFcm } = req.params;
    try {
        // Validate the order status
        const validStatuses = ["NRA", "RA", "AR", "TDP", "ADP", "OD"];
        if (!validStatuses.includes(riderStatus)) {
            return res.status(400).json({ status: false, message: "Invalid order status" });
        }

        // Find and update the order
        const order = await Order.findByIdAndUpdate(orderId, { riderStatus: riderStatus, }, { new: true });

        if (!order) {
            return res.status(404).json({ status: false, message: "Order not found" });
        }

        // Custom message for each status
        const statusMessages = {
            "NRA": { title: "🚴‍♂️ Rider Update", body: "No rider assigned yet! Hang tight ⏳" },
            "RA": { title: "🚴‍♂️ Rider Update", body: "Woohoo! 🎉 A rider has been assigned to your order!" },
            "AR": { title: "🚴‍♂️ Rider Update", body: "Your rider has arrived at the restaurant! 🍽️" },
            "TDP": { title: "🚴‍♂️ Rider Update", body: "On the way! 🛵 Your order is heading to you! 📍" },
            "ADP": { title: "🚴‍♂️ Rider Update", body: "Your rider is at your location! 🚪 Open up! 🙌" },
            "OD": { title: "🎉 Order Delivered!", body: "Enjoy your meal! 😋🍽️" },
        };




        const { title, body } = statusMessages[riderStatus] || { title: "Order Update", body: `Your order is now ${riderStatus}` };

        // Send push notification if an FCM token is available
        try {
            if (order.customerFcm) {
                await pushNotificationController.sendPushNotification(order.customerFcm, title, body, order);
            }
        } catch (e) {
            console.log(`error ${e}`)
        }
        console.log(riderFcm)
        const riderStatusMessages = {
            "NRA": {
                title: "📦 Order Update",
                body: "Waiting for an order to be assigned... ⏳"
            },
            "RA": {
                title: "📦 Order Update",
                body: "You've been assigned a new order! 🚀 Check details and head to the restaurant."
            },
            "AR": {
                title: "🏠 Arrival Confirmed",
                body: "You’ve arrived at the restaurant! 🍽️ Confirm pickup when ready."
            },
            "TDP": {
                title: "🛵 Delivery in Progress",
                body: "You're on your way to deliver the order! 🚀 Stay safe!"
            },
            "ADP": {
                title: "📍 Arrived at Destination",
                body: "You've reached the customer's location! 🚪 Tap to notify them."
            },
            "OA": {
                title: "✅ Order Completed",
                body: "Order delivered successfully! 🎉 Great job!"
            },
        };
        const { title2, body2 } = riderStatusMessages[riderStatus] || { title: "Order Update", body: `Your order is now ${riderStatus}` };
        if (riderStatus === "OD") {
            const io = getIO();
            // Emit an event to the specific room for this order
            io.to(`order_${orderId}`).emit("order:delivered", { orderId: orderId });
            console.log(`Sent 'order:delivered' event to room order_${orderId}`);
        }

        try {

        } catch (error) {
            await pushNotificationController.sendPushNotification(riderFcm, title2, body2, order);
        }

        res.status(200).json({ status: true, message: "Order status updated successfully", order });

    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ status: false, message: error.message });
    }
}


async function getRiderByUserId(req, res) {
    const { userId } = req.params;

    try {

        const rider = await Rider.findOne({ userId })
        if (!rider) {
            return res.status(404).json({ status: false, message: "Rider not found" })
        }
        return res.status(200).json(rider)
    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to fetch rider" })
    }
}




module.exports = {
    createRider, searchRestaurant, assignRiderToOrder, rejectOrder, currentTrip, completedTrips,
    getAllOrdersByOrderStatus, getOrdersByOnlyRestaurantId, getDeliveredOrdersByRider,
    updateUserImageUrl, updateDriverLicenseImageUrl, updateParticularsImageUrl, updateVehicleImgUrl,
    getRiderById, getRiderUserById, updateRiderStatus, getRiderByUserId
}



// lrange order:682df4a32d550ac1f22977ed:locationHistory 0 -1
