const Restaurant = require("../models/Restaurant");
const Order = require("../models/Order");
const Rider = require("../models/Rider");
const RiderRating = require('../models/RiderRating');

async function createRider(req, res) {
    const { userId, vehicleImgUrl, vehicleType, vehicleBrand, plateNumber, guarantors, bankName, bankAccount, bankAccountName, coords } = req.body;

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
        res.status(201).json({
            status: true, message: "Rider added Successfully", newCreateRider: {
                riderId: newCreateRider._id,
                vehicle: newCreateRider.vehicleType,
                rating: newCreateRider.rating,
                postalcode: newCreateRider.coords.postalCode,
                verification: newCreateRider.verification,
                coord: newCreateRider.coords
            },
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
        const { orderId, riderId } = req.params;

        if (!orderId || !riderId) {
            return res.status(400).json({ status: false, message: "Order ID and Rider ID are required." });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ status: false, message: "Order not found." });
        }
        if (order.riderAssigned == true) {
            return res.status(404).json({ status: false, message: "Order as already been assigned." });
        }

        order.driverId = riderId;
        order.riderAssigned = true
        await order.save();

        res.status(200).json({ status: true, message: "Rider assigned successfully.", data: order });
    } catch (error) {
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
};

async function rejectOrder(req, res) {
    try {
        const { orderId, riderId } = req.params;

        if (!orderId || !riderId) {
            return res.status(400).json({ status: false, message: "Order ID and Rider ID are required." });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ status: false, message: "Order not found." });
        }
        if (order.driverId == riderId) {
            return res.status(400).json({ status: false, message: "you've already been assigned to this order" });
        }

        // Ensure rider is not added multiple times
        if (!order.rejectedBy.includes(riderId)) {
            order.rejectedBy.push(riderId);
            await order.save();
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
    const { orderStatus, paymentStatus, riderId } = req.params;

    try {
        const orders = await Order.find({
            orderStatus: orderStatus,
            paymentStatus: paymentStatus,
            riderAssigned: false, 
            driverId: "", 
            rejectedBy: { $nin: [riderId] } 
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

    const { restaurantId, orderStatus, paymentStatus, riderId } = req.params;

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
            riderId: { $nin: [riderId]}

        }).populate({
            path: 'orderItems.foodId',
            select: "imageUrl title rating time"
        });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}


// async function getDeliveredOrdersByRider(req, res) {
//     const { driverId } = req.params;

//     try {
//         if (!driverId) {
//             return res.status(400).json({ status: false, message: "Driver Id is required" });
//         }

//         const orders = await Order.find({
//             driverId: driverId,
//             orderStatus: "Delivered",
//             riderStatus: "OD"
//         }).populate({
//             path: 'orderItems.foodId',
//             select: "imageUrl title rating time"
//         });

//         res.status(200).json( orders );
//     } catch (error) {
//         res.status(500).json({ status: false, message: "Server error", error: error.message });
//     }
// }



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
        res.status(500).json({ status: false, message: "Server error"});
    }
}



module.exports = { createRider, searchRestaurant, assignRiderToOrder, rejectOrder, currentTrip, completedTrips, getAllOrdersByOrderStatus, getOrdersByOnlyRestaurantId, getDeliveredOrdersByRider }