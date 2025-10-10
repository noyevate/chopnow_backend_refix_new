const { Restaurant, Order, Rider, RiderRating, User } = require("../models");
const pushNotificationController = require("./pushNotificationController")
// const { io } = require("../services/socket_io");
const { getIO } = require("../services/socket_io");
const { Op, literal } = require('sequelize');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');
const payoutService = require('../services/payoutService');
 


// In controllers/riderController.js


async function createRider(req, res) {
    const { userId, plateNumber } = req.body;
    logger.info(`creatig new rider profile`, { controller: 'riderController', userId: `${userId}`, endpoint: `createRider` });

    try {
        // --- Validation and Duplication Check ---
        const existingRider = await Rider.findOne({
            where: {
                [Op.or]: [
                    { userId: userId },
                    { plateNumber: plateNumber }
                ]
            }
        });

        if (existingRider) {
            if (existingRider.userId == userId) {
                logger.error(`"This user already has a rider profile.`, { controller: 'riderController', userId: `${userId}`, endpoint: `createRider` });
                return res.status(409).json({ status: false, message: "This user already has a rider profile." });
            }
            if (existingRider.plateNumber === plateNumber) {
                logger.error(`"A rider with this plate number already exists.`, { controller: 'riderController', endpoint: `createRider` });
                return res.status(409).json({ status: false, message: "A rider with this plate number already exists." });
            }
        }

        // --- Prepare Data for Creation ---
        // Flatten the nested coords object from req.body
        const riderData = {
            ...req.body,
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            latitudeDelta: req.body.latitudeDelta,
            longitudeDelta: req.body.longitudeDelta,
            postalCode: req.body.postalCode,
            title: req.body.title,
        };
        delete riderData.coords; // Remove the original redundant object

        // --- Create the Rider ---
        // Use the standard Sequelize .create() method
        const newRider = await Rider.create(riderData);

        // --- Fetch User Details (The Corrected Part) ---
        // 1. Use .findByPk() instead of .findById()
        // 2. Use the 'attributes' option instead of .select()
        const user = await User.findByPk(userId, {
            attributes: ['first_name', 'last_name']
        });

        // --- Send Push Notification ---
        await pushNotificationController.sendPushNotification(req.body.fcm, "Rider", `Your journey starts now! Ready to drive, earn, and make a difference? Let’s go!`, "");



        logger.info(`creating rider profilr successful`, { controller: 'riderController', userId: `${userId}`, endpoint: `createRider` });

        // --- Send Response ---
        res.status(201).json({
            status: true,
            message: "Rider profile added successfully",
            rider: { // Renamed from newCreateRider for clarity
                riderId: newRider.id, // Use .id
                vehicle: newRider.vehicleType,
                rating: newRider.rating,
                postalcode: newRider.postalCode, // Access flattened data
                verification: newRider.verification,
                // coords are now separate fields, so we construct the object for the response

                latitude: newRider.latitude,
                longitude: newRider.longitude,
                latitudeDelta: newRider.latitudeDelta,
                longitudeDelta: newRider.longitudeDelta,
                postalCode: newRider.postalCode,
                title: newRider.title,

                userImg: newRider.userImageUrl
            },
            user: user || null,
        });
    } catch (error) {
        logger.error(`Failed to create rider profile.: ${error.message}`, { controller: 'riderController', endpoint: `createRider` });
        res.status(500).json({ status: false, message: "Failed to create rider profile.", error: error.message });
    }
}


async function searchRestaurant(req, res) {
    // Search term comes from the query string, e.g., /api/rider/search?title=kitchen
    const { title } = req.query;
    const controllerName = 'searchRestaurant';

    try {
        logger.info(`Searching for restaurants with title: '${title}'`, { controller: controllerName });

        if (!title) {
            logger.warn(`Search failed: title query parameter is required.`, { controller: controllerName });
            return res.status(400).json({ status: false, message: "A 'title' query parameter is required for the search." });
        }

        // --- Sequelize Logic Start ---
        
        // Find all restaurants where the title contains the search term.
        const restaurants = await Restaurant.findAll({
            where: {
                // Use the [Op.like] operator for case-insensitive partial matching.
                title: {
                    [Op.like]: `%${title}%`
                },
                // Also, only return verified restaurants in public search results.
                verification: 'Verified'
            },
            limit: 25 // It's a good practice to limit search results.
        });

        // --- End Sequelize Logic ---

        // It's standard to return an empty array [] with a 200 OK for a search that yields no results.
        logger.info(`Search found ${restaurants.length} restaurants.`, { controller: controllerName, searchTerm: title });
        res.status(200).json(restaurants);

    } catch (error) {
        logger.error(`Failed to search for restaurants: ${error.message}`, { controller: controllerName, error: error.stack });
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
}


async function assignRiderToOrder(req, res) {
    const { orderId, riderId, riderFcm } = req.params;
    const controllerName = 'assignRiderToOrder'; // For consistent logging

    try {
        logger.info(`Attempting to assign rider to order.`, { controller: controllerName, riderId, orderId });

        if (!orderId || !riderId) {
            logger.warn(`Missing orderId or riderId.`, { controller: controllerName, riderId, orderId });
            return res.status(400).json({ status: false, message: "Order ID and Rider ID are required." });
        }

        // --- Sequelize Logic Start ---

        // Step 1: Find the order by its primary key.
        const order = await Order.findByPk(orderId);

        if (!order) {
            logger.error(`Order not found.`, { controller: controllerName, orderId });
            return res.status(404).json({ status: false, message: "Order not found." });
        }

        if (order.riderAssigned === true) {
            logger.error(`Order has already been assigned.`, { controller: controllerName, orderId, existingRider: order.riderId });
            return res.status(403).json({ status: false, message: "Order has already been assigned." });
        }

        const plainTextPickupPin = Math.floor(1000 + Math.random() * 9000).toString();

        const salt = await bcrypt.genSalt(10);
        const hashedPickupPin = await bcrypt.hash(plainTextPickupPin, salt);

        // Step 2: Update the order with the new rider details in a single operation.
        // The .update() instance method saves the changes to the database.
        const updatedOrder = await order.update({
            riderId: riderId,
            riderAssigned: true,
            riderStatus: "RA",
            riderFcm: riderFcm,
            pickupPin: hashedPickupPin
        });

        // --- End Sequelize Logic ---

        // --- Post-Update Side Effects (Notifications) ---
        try {
            if (updatedOrder.customerFcm) {
                await pushNotificationController.sendPushNotification(updatedOrder.customerFcm, "Rider Assigned", "Woohoo! 🎉 A rider has been assigned to your order!", updatedOrder);
                await pushNotificationController.sendPushNotification(riderFcm, "Rider Assigned", "Woohoo! 🎉 you've been assigned to this order", updatedOrder);
                logger.info(`Notifications sent for order assignment.`, { controller: controllerName, orderId });
            }
        } catch (e) {
            logger.error(`Failed to send push notification for order assignment: ${e.message}`, { controller: controllerName, orderId });
        }

        // --- Socket.IO Event ---
        const io = getIO();
        // Use .id from Sequelize, not ._id
        io.to(`order_${updatedOrder.id}`).emit("order:assigned", { orderId: updatedOrder.id, riderId: updatedOrder.riderId });
        logger.info(`Socket event 'order:assigned' emitted.`, { controller: controllerName, orderId });

        res.status(200).json({ status: true, message: "Rider assigned successfully.", data: updatedOrder, pickupPin: plainTextPickupPin });

    } catch (error) {
        logger.error(`Failed to assign rider: ${error.message}`, { controller: controllerName, orderId, error: error.stack });
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
};

// In your riderController.js

async function rejectOrder(req, res) {
    const { orderId, riderId } = req.params;
    const { riderFcm } = req.body;
    const controllerName = 'rejectOrder';

    try {
        logger.info(`Rider attempting to reject order.`, { controller: controllerName, riderId, orderId });

        if (!orderId || !riderId) {
            // ... (validation is fine)
            return res.status(400).json({ status: false, message: "Order ID and Rider ID are required." });
        }

        const order = await Order.findByPk(orderId);

        if (!order) {
            // ... (validation is fine)
            return res.status(404).json({ status: false, message: "Order not found." });
        }

        if (order.riderId == riderId) {
            // ... (validation is fine)
            return res.status(400).json({ status: false, message: "You have already been assigned to this order..." });
        }

        let rejectedByList = order.rejectedBy || [];

        if (!rejectedByList.includes(riderId)) {

            // --- THIS IS THE FIX ---
            // Create a brand new array containing all old IDs plus the new one.
            const newRejectedByList = [...rejectedByList, riderId];

            // Now update the order with this new array.
            // This guarantees that Sequelize detects a change.
            await order.update({
                rejectedBy: newRejectedByList
            });
            // --- END FIX ---

            logger.info(`Rider successfully added to rejection list.`, { controller: controllerName, riderId, orderId });

            if (riderFcm) {
                await pushNotificationController.sendPushNotification(riderFcm, "Order Rejected", "You have successfully rejected this order.", order);
            }
        } else {
            logger.info(`Rider had already rejected this order. No action taken.`, { controller: controllerName, riderId, orderId });
        }

        res.status(200).json({ status: true, message: "Order rejected successfully." });

    } catch (error) {
        logger.error(`Failed to reject order: ${error.message}`, { controller: controllerName, orderId, error: error.stack });
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
};

async function currentTrip(req, res) {

    const { riderId } = req.params; // Changed riderId to riderId to match our schema
    const controllerName = 'currentTrip';

    try {
        logger.info(`Fetching current trip for rider.`, { controller: controllerName, riderId });

        if (!riderId) {
            logger.warn(`Rider ID is required.`, { controller: controllerName });
            return res.status(400).json({ status: false, message: "Rider ID is required" });
        }

        // --- Sequelize Logic Start ---

        const order = await Order.findOne({
            where: {
                riderId: riderId,
                paymentStatus: "Completed",
                orderStatus: {
                    [Op.notIn]: ["Delivered", "Cancelled"]
                }
            }
        });

        // --- End Sequelize Logic ---

        if (!order) {
            logger.info(`No active trips found for this rider.`, { controller: controllerName, riderId });
            return res.status(404).json([]);
        }

        logger.info(`Active trip found for rider.`, { controller: controllerName, riderId, orderId: order.id });
        res.status(200).json(order);

    } catch (error) {
        logger.error(`Failed to fetch current trip: ${error.message}`, { controller: controllerName, riderId, error: error.stack });
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
}

async function completedTrips(req, res) {
    const { riderId } = req.params;
    const controllerName = 'completedTrips';

    try {
        logger.info(`Fetching completed trips for rider.`, { controller: controllerName, riderId });

        if (!riderId) {
            logger.warn(`Rider ID is required.`, { controller: controllerName });
            return res.status(400).json({ status: false, message: "Rider ID is required" });
        }

        // --- Sequelize Logic Start ---

        // Use .findAll() because a rider can have multiple completed trips.
        const orders = await Order.findAll({
            where: {
                riderId: riderId,
                paymentStatus: "Completed",
                orderStatus: "Delivered" // Filter for only delivered orders
            },
            order: [['updatedAt', 'DESC']] // Show the most recently completed trips first
        });

        // --- End Sequelize Logic ---

        logger.info(`Found ${orders.length} completed trips for rider.`, { controller: controllerName, riderId });
        res.status(200).json(orders);

    } catch (error) {
        logger.error(`Failed to fetch completed trips: ${error.message}`, { controller: controllerName, riderId, error: error.stack });
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
};

async function getAllOrdersByOrderStatus(req, res) {
    const { riderId } = req.params;

    // The statuses come from the query string.
    // Example URL: /api/order/available/some-rider-uuid?statuses=Placed,Accepted
    const { statuses } = req.query;

    if (!riderId || !statuses) {
        return res.status(400).json({ status: false, message: "Rider ID and Order Statuses are required." });
    }

    // Split the comma-separated string of statuses into an array
    const orderStatuses = statuses.split(',');

    logger.info(`getting available orders`, { controller: 'riderController', riderId: `${riderId}`, orderId: `${statuses}`, endpoint: `getAllOrdersByOrderStatus` });

    try {
        // Optional but recommended: Check if the riderId actually exists
        const rider = await Rider.findByPk(riderId);
        if (!rider) {
            return res.status(404).json({ status: false, message: "Rider profile not found." });
        }

        const orders = await Order.findAll({
            where: {
                // 1. Order status must be one of the provided statuses
                orderStatus: {
                    [Op.in]: orderStatuses
                },

                // 2. The order must not be assigned to any rider yet
                riderAssigned: false,

                // 3. The current rider's ID must NOT be in the 'rejectedBy' JSON array.
                // We use sequelize.literal to inject a raw SQL function.
                [Op.and]: [
                    literal(`NOT JSON_CONTAINS(rejectedBy, '"${riderId}"')`)
                ]
            },
            order: [['createdAt', 'ASC']] // Show the oldest available orders first
        });

        // The defaultScope will ensure these orders include their items and food details.
        res.status(200).json(orders);

    } catch (error) {
        console.error("Error fetching available orders:", error);
        res.status(500).json({ status: false, message: "Failed to fetch available orders.", error: error.message });
    }
}


// In your controller file (e.g., riderController.js or orderController.js)

async function getAvailableOrdersForRestaurant(req, res) {
    // Rider ID and Restaurant ID come from the path
    const { restaurantId, riderId } = req.params;
    // Optional filters now come from the query string
    const { statuses, paymentStatus } = req.query;
    const controllerName = 'getAvailableOrdersForRestaurant';

    try {
        logger.info(`Fetching available orders for restaurant.`, { controller: controllerName, restaurantId, riderId, statuses, paymentStatus });

        if (!restaurantId || !riderId) {
            logger.warn(`Missing required parameters restaurantId or riderId.`, { controller: controllerName });
            return res.status(400).json({ status: false, message: "Restaurant ID and Rider ID are required." });
        }

        // --- Build the WHERE clause dynamically ---
        const whereClause = {
            restaurantId: restaurantId,
            riderAssigned: false,
            
            // The orderStatus MUST NOT be 'Delivered' or 'Cancelled'.
            orderStatus: {
                [Op.notIn]: ["Delivered", "Cancelled"]
            },

            // Check that the current rider's ID is NOT in the 'rejectedBy' JSON array
            [Op.and]: [
                literal(`NOT JSON_CONTAINS(rejectedBy, '"${riderId}"')`)
            ]
        };

        // --- THIS IS THE NEW LOGIC ---
        // If specific statuses are provided in the query string, use them.
        if (statuses) {
            const orderStatuses = statuses.split(',');
            // Add the [Op.in] condition to the existing orderStatus logic
            whereClause.orderStatus = {
                ...whereClause.orderStatus, // Keep the [Op.notIn] rule
                [Op.in]: orderStatuses   // Also require the status to be one of these
            };
        }
        // --- END NEW LOGIC ---

        // Conditionally add the paymentStatus filter if it exists
        if (paymentStatus) {
            whereClause.paymentStatus = paymentStatus;
        }

        // --- Find all matching orders ---
        const orders = await Order.findAll({
            where: whereClause,
            order: [['createdAt', 'ASC']] // Show oldest orders first
        });
        
        logger.info(`Found ${orders.length} available orders for restaurant.`, { controller: controllerName, restaurantId });
        res.status(200).json(orders);

    } catch (error) {
        logger.error(`Failed to fetch available orders for restaurant: ${error.message}`, { controller: controllerName, restaurantId, error: error.stack });
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
}


async function getDeliveredOrdersByRider(req, res) {
    const { riderId } = req.params;
    const controllerName = 'getDeliveredOrdersByRider';

    try {
        logger.info(`Fetching delivered orders for rider.`, { controller: controllerName, riderId });

        if (!riderId) {
            logger.warn(`Rider ID is required.`, { controller: controllerName });
            return res.status(400).json({ status: false, message: "Rider ID is required" });
        }

        // --- Sequelize Logic Start ---

        // Find all orders that match the criteria and include their associated RiderRating
        const orders = await Order.findAll({
            where: {
                riderId: riderId,
                orderStatus: "Delivered",
                riderStatus: "OD"
            },

            include: [{
                model: RiderRating,
                as: 'riderRatingDetails', // This MUST match the alias in models/index.js
                required: false // Use LEFT JOIN to get orders even if they haven't been rated yet
            }],
            order: [['updatedAt', 'DESC']] // Show most recently delivered first
        });

        // --- End Sequelize Logic ---

        // It's standard to return an empty array if no orders are found.
        logger.info(`Found ${orders.length} delivered orders for rider.`, { controller: controllerName, riderId });
        res.status(200).json(orders);

    } catch (error) {
        logger.error(`Failed to fetch delivered orders: ${error.message}`, { controller: controllerName, riderId, error: error.stack });
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
}

async function updateUserImageUrl(req, res) {
    const { riderId } = req.params;
    const { userImageUrl } = req.body; // Data for updates should be in the body
    const controllerName = 'updateUserImageUrl';

    try {
        logger.info(`Attempting to update user image URL for rider.`, { controller: controllerName, riderId });

        if (!userImageUrl) {
            logger.warn(`userImageUrl is required.`, { controller: controllerName, riderId });
            return res.status(400).json({ status: false, message: "userImageUrl is required in the request body." });
        }

        // --- Sequelize Logic Start ---

        // Use Model.update() to change the specific field for the matching rider.
        // It returns an array with the number of affected rows.
        const [updatedRows] = await Rider.update(
            { userImageUrl: userImageUrl }, // The data to update
            {
                where: { id: riderId } // The condition to find the correct rider
            }
        );

        // --- End Sequelize Logic ---

        if (updatedRows === 0) {
            logger.error(`Rider not found for image update.`, { controller: controllerName, riderId });
            return res.status(404).json({ status: false, message: "Rider not found." });
        }

        logger.info(`Successfully updated user image URL for rider.`, { controller: controllerName, riderId });
        res.status(200).json({
            status: true,
            message: "User image updated successfully",
            userImageUrl: userImageUrl // Return the new URL
        });

    } catch (error) {
        logger.error(`Failed to update user image URL: ${error.message}`, { controller: controllerName, riderId, error: error.stack });
        res.status(500).json({ status: false, message: "Failed to update user image", error: error.message });
    }
}

async function updateDriverLicenseImageUrl(req, res) {
    const { riderId } = req.params;
    const { driverLicenseImageUrl } = req.body;
    const controllerName = 'updateDriverLicenseImageUrl';

    try {
        logger.info(`Attempting to update driver license URL for rider.`, { controller: controllerName, riderId });

        if (!driverLicenseImageUrl) {
            logger.warn(`driverLicenseImageUrl is required.`, { controller: controllerName, riderId });
            return res.status(400).json({ status: false, message: "driverLicenseImageUrl is required in the request body." });
        }

        // --- Sequelize Logic Start ---

        // Use Model.update() to change the specific field for the matching rider.
        const [updatedRows] = await Rider.update(
            { driverLicenseImageUrl: driverLicenseImageUrl }, // The data to update
            {
                where: { id: riderId } // The condition to find the correct rider
            }
        );

        if (updatedRows === 0) {
            logger.error(`Rider not found for license image update.`, { controller: controllerName, riderId });
            return res.status(404).json({ status: false, message: "Rider not found." });
        }

        logger.info(`Successfully updated driver license URL for rider.`, { controller: controllerName, riderId });
        res.status(200).json({
            status: true,
            message: "Driver license image updated successfully",
            driverLicenseImageUrl: driverLicenseImageUrl // Return the new URL
        });

    } catch (error) {
        logger.error(`Failed to update driver license URL: ${error.message}`, { controller: controllerName, riderId, error: error.stack });
        res.status(500).json({ status: false, message: "Failed to update driver license image", error: error.message });
    }
}

async function updateParticularsImageUrl(req, res) {
    const { riderId } = req.params;
    const { particularsImageUrl } = req.body;
    const controllerName = 'updateParticularsImageUrl';

    try {
        logger.info(`Attempting to update particulars image URL for rider.`, { controller: controllerName, riderId });

        if (!particularsImageUrl) {
            logger.warn(`particularsImageUrl is required.`, { controller: controllerName, riderId });
            return res.status(400).json({ status: false, message: "particularsImageUrl is required in the request body." });
        }

        // --- Sequelize Logic Start ---

        // Use Model.update() to change the specific field for the matching rider.
        const [updatedRows] = await Rider.update(
            { particularsImageUrl: particularsImageUrl }, // The data to update
            {
                where: { id: riderId } // The condition to find the correct rider
            }
        );

        // --- End Sequelize Logic ---

        if (updatedRows === 0) {
            logger.error(`Rider not found for particulars image update.`, { controller: controllerName, riderId });
            return res.status(404).json({ status: false, message: "Rider not found." });
        }

        logger.info(`Successfully updated particulars image URL for rider.`, { controller: controllerName, riderId });
        res.status(200).json({
            status: true,
            message: "Particulars image updated successfully",
            particularsImageUrl: particularsImageUrl // Return the new URL
        });

    } catch (error) {
        logger.error(`Failed to update particulars image URL: ${error.message}`, { controller: controllerName, riderId, error: error.stack });
        res.status(500).json({ status: false, message: "Failed to update particulars image", error: error.message });
    }
}

async function updateVehicleImgUrl(req, res) {
    const { riderId } = req.params;
    const { vehicleImgUrl } = req.body;
    const controllerName = 'updateVehicleImgUrl';

    try {
        logger.info(`Attempting to update vehicle image URL for rider.`, { controller: controllerName, riderId });

        if (!vehicleImgUrl) {
            logger.warn(`vehicleImgUrl is required.`, { controller: controllerName, riderId });
            return res.status(400).json({ status: false, message: "vehicleImgUrl is required in the request body." });
        }

        // --- Sequelize Logic Start ---

        // Use Model.update() to change the specific field for the matching rider.
        const [updatedRows] = await Rider.update(
            { vehicleImgUrl: vehicleImgUrl }, // The data to update
            {
                where: { id: riderId } // The condition to find the correct rider
            }
        );

        // --- End Sequelize Logic ---

        if (updatedRows === 0) {
            logger.error(`Rider not found for vehicle image update.`, { controller: controllerName, riderId });
            return res.status(404).json({ status: false, message: "Rider not found." });
        }

        logger.info(`Successfully updated vehicle image URL for rider.`, { controller: controllerName, riderId });
        res.status(200).json({
            status: true,
            message: "Vehicle image updated successfully",
            vehicleImgUrl: vehicleImgUrl // Return the new URL
        });

    } catch (error) {
        logger.error(`Failed to update vehicle image URL: ${error.message}`, { controller: controllerName, riderId, error: error.stack });
        res.status(500).json({ status: false, message: "Failed to update vehicle image", error: error.message });
    }
}

async function getRiderById(req, res) {
    const { riderId } = req.params;
    const controllerName = 'getRiderById';

    try {
        logger.info(`Fetching rider profile by ID.`, { controller: controllerName, riderId });

        if (!riderId) {
            logger.warn(`Rider ID is required.`, { controller: controllerName });
            return res.status(400).json({ status: false, message: "Rider ID is required." });
        }

        // --- Sequelize Logic Start ---

        // Use .findByPk() which is the direct and optimized equivalent of .findById()
        const rider = await Rider.findByPk(riderId);

        // --- End Sequelize Logic ---

        if (!rider) {
            logger.error(`Rider profile not found.`, { controller: controllerName, riderId });
            return res.status(404).json({ status: false, message: "Rider not found" });
        }
        
        logger.info(`Successfully fetched rider profile.`, { controller: controllerName, riderId });
        // Sequelize returns a clean JSON object by default when sent in a response
        return res.status(200).json(rider);

    } catch (error) {
        logger.error(`Failed to fetch rider by ID: ${error.message}`, { controller: controllerName, riderId, error: error.stack });
        res.status(500).json({ status: false, message: "Failed to fetch rider", error: error.message });
    }
}

async function getRiderUserById(req, res) {
    const { userId } = req.params;
    const controllerName = 'getRiderUserById';

    try {
        logger.info(`Fetching user profile for a rider.`, { controller: controllerName, userId });

        if (!userId) {
            logger.warn(`User ID is required.`, { controller: controllerName });
            return res.status(400).json({ status: false, message: "User ID is required." });
        }

        // --- Sequelize Logic Start ---

        // Use .findOne() with a where clause to find the user by their ID
        // AND ensure their userType is 'Rider'.
        const user = await User.findOne({
            where: {
                id: userId,
                userType: "Rider"
            }
        });

        // --- End Sequelize Logic ---

        if (!user) {
            logger.error(`Rider user profile not found or user is not a rider.`, { controller: controllerName, userId });
            return res.status(404).json({ status: false, message: "Rider not found" });
        }

        // Clean the user object before sending
        const userData = user.toJSON();
        delete userData.password;
        delete userData.pin;
        delete userData.otp;
        delete userData.otpExpires;

        logger.info(`Successfully fetched rider user profile.`, { controller: controllerName, userId });
        res.status(200).json(userData);

    } catch (error) {
        logger.error(`Failed to fetch rider user profile: ${error.message}`, { controller: controllerName, userId, error: error.stack });
        res.status(500).json({ status: false, message: "Failed to fetch rider", error: error.message });
    }
}

// async function updateRiderStatus(req, res) {
//     const { orderId, riderStatus, riderFcm } = req.params;
//     try {
//         // Validate the order status
//         const validStatuses = ["NRA", "RA", "AR", "TDP", "ADP", "OD"];
//         if (!validStatuses.includes(riderStatus)) {
//             return res.status(400).json({ status: false, message: "Invalid order status" });
//         }

//         // Find and update the order
//         const order = await Order.findByIdAndUpdate(orderId, { riderStatus: riderStatus, }, { new: true });

//         if (!order) {
//             return res.status(404).json({ status: false, message: "Order not found" });
//         }

//         // Custom message for each status
//         const statusMessages = {
//             "NRA": { title: "🚴‍♂️ Rider Update", body: "No rider assigned yet! Hang tight ⏳" },
//             "RA": { title: "🚴‍♂️ Rider Update", body: "Woohoo! 🎉 A rider has been assigned to your order!" },
//             "AR": { title: "🚴‍♂️ Rider Update", body: "Your rider has arrived at the restaurant! 🍽️" },
//             "TDP": { title: "🚴‍♂️ Rider Update", body: "On the way! 🛵 Your order is heading to you! 📍" },
//             "ADP": { title: "🚴‍♂️ Rider Update", body: "Your rider is at your location! 🚪 Open up! 🙌" },
//             "OD": { title: "🎉 Order Delivered!", body: "Enjoy your meal! 😋🍽️" },
//         };




//         const { title, body } = statusMessages[riderStatus] || { title: "Order Update", body: `Your order is now ${riderStatus}` };

//         // Send push notification if an FCM token is available
//         try {
//             if (order.customerFcm) {
//                 await pushNotificationController.sendPushNotification(order.customerFcm, title, body, order);
//             }
//         } catch (e) {
//             console.log(`error ${e}`)
//         }
//         console.log(riderFcm)
//         const riderStatusMessages = {
//             "NRA": {
//                 title: "📦 Order Update",
//                 body: "Waiting for an order to be assigned... ⏳"
//             },
//             "RA": {
//                 title: "📦 Order Update",
//                 body: "You've been assigned a new order! 🚀 Check details and head to the restaurant."
//             },
//             "AR": {
//                 title: "🏠 Arrival Confirmed",
//                 body: "You’ve arrived at the restaurant! 🍽️ Confirm pickup when ready."
//             },
//             "TDP": {
//                 title: "🛵 Delivery in Progress",
//                 body: "You're on your way to deliver the order! 🚀 Stay safe!"
//             },
//             "ADP": {
//                 title: "📍 Arrived at Destination",
//                 body: "You've reached the customer's location! 🚪 Tap to notify them."
//             },
//             "OA": {
//                 title: "✅ Order Completed",
//                 body: "Order delivered successfully! 🎉 Great job!"
//             },
//         };
//         const { title2, body2 } = riderStatusMessages[riderStatus] || { title: "Order Update", body: `Your order is now ${riderStatus}` };
//         if (riderStatus === "OD") {
//             const io = getIO();
//             // Emit an event to the specific room for this order
//             io.to(`order_${orderId}`).emit("order:delivered", { orderId: orderId });
//             console.log(`Sent 'order:delivered' event to room order_${orderId}`);
//         }

//         try {

//         } catch (error) {
//             await pushNotificationController.sendPushNotification(riderFcm, title2, body2, order);
//         }

//         res.status(200).json({ status: true, message: "Order status updated successfully", order });

//     } catch (error) {
//         console.error("Error updating order status:", error);
//         res.status(500).json({ status: false, message: error.message });
//     }
// }



async function updateRiderStatus(req, res) {
    // Data for updates should be in the body for flexibility
    const { orderId, riderStatus, riderFcm } = req.params;
    const controllerName = 'updateRiderStatus';

    try {
        logger.info(`Attempting to update rider status for order.`, { controller: controllerName, orderId, riderStatus });
        
        // --- Validation ---
        const validStatuses = ["NRA", "RA", "AR", "TDP", "ADP", "OD"];
        if (!validStatuses.includes(riderStatus)) {
            logger.warn(`Invalid riderStatus provided: ${riderStatus}`, { controller: controllerName, orderId });
            return res.status(400).json({ status: false, message: "Invalid order status" });
        }
        

        const updateData = {
            riderStatus: riderStatus
        };

        // 2. Conditionally add the main orderStatus if the rider is marking it as delivered.
        if (riderStatus === "OD") {
            updateData.orderStatus = "Delivered";
        }
        // --- Sequelize Logic Start ---
        
        // Step 1: Update the order's status.
        const [updatedRows] = await Order.update(
            updateData,
            // { riderStatus: riderStatus },
            { where: { id: orderId } }
        );

        if (updatedRows === 0) {
            logger.error(`Order not found for status update.`, { controller: controllerName, orderId });
            return res.status(404).json({ status: false, message: "Order not found" });
        }

        // Step 2: Fetch the full, updated order object to use for notifications.
        // This will be populated with orderItems due to the defaultScope.
        const order = await Order.findByPk(orderId);
        
        // --- End Sequelize Logic ---

        // --- Post-Update Side Effects (Notifications & Sockets) ---
        
        // Notification to the Customer
        const statusMessages = {
            "NRA": { title: "🚴‍♂️ Rider Update", body: "No rider assigned yet! Hang tight ⏳" },
            "RA": { title: "🚴‍♂️ Rider Update", body: "Woohoo! 🎉 A rider has been assigned to your order!" },
            "AR": { title: "🚴‍♂️ Rider Update", body: "Your rider has arrived at the restaurant! 🍽️" },
            "TDP": { title: "🚴‍♂️ Rider Update", body: "On the way! 🛵 Your order is heading to you! 📍" },
            "ADP": { title: "🚴‍♂️ Rider Update", body: "Your rider is at your location! 🚪 Open up! 🙌" },
            "OD": { title: "🎉 Order Delivered!", body: "Enjoy your meal! 😋🍽️" },
        };
        const { title, body } = statusMessages[riderStatus] || { title: "Order Update", body: `Your order is now ${riderStatus}` };
        if (order.customerFcm) {
            await pushNotificationController.sendPushNotification(order.customerFcm, title, body, order);
        }

        // Notification to the Rider
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
        if (riderFcm) {
            await pushNotificationController.sendPushNotification(riderFcm, title2, body2, order);
        }
        
        // Socket.IO event for "Order Delivered"
        if (riderStatus === "OD") {
            const io = getIO();
            io.to(`order_${orderId}`).emit("order:delivered", { orderId: orderId });
            logger.info(`Sent 'order:delivered' socket event.`, { controller: controllerName, orderId });
        }

        logger.info(`Rider status updated successfully.`, { controller: controllerName, orderId, newStatus: riderStatus });
        res.status(200).json({ status: true, message: "Order status updated successfully", order });

    } catch (error) {
        logger.error(`Failed to update rider status: ${error.message}`, { controller: controllerName, orderId, error: error.stack });
        res.status(500).json({ status: false, message: "Server error", error: error.message });
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

async function getRiderUserByRiderId(req, res) {
    // 1. Get the ID of the Rider Profile from the URL parameters
    const { riderId } = req.params;
    const controllerName = 'getRiderUserByRiderId';

    try {
        logger.info(`Fetching user profile associated with a rider profile.`, { controller: controllerName, riderId });

        if (!riderId) {
            logger.warn(`Rider ID is required.`, { controller: controllerName });
            return res.status(400).json({ status: false, message: "Rider ID is required." });
        }

        // --- Sequelize Logic Start ---
        
        // 2. Find the Rider by its primary key and "include" the associated User.
        // This performs a JOIN in the background.
        const rider = await Rider.findByPk(riderId, {
            include: [{
                model: User,
                as: 'userProfile', // This alias MUST match the one in models/index.js
                attributes: {
                    // 3. Exclude sensitive fields directly in the query for security and efficiency.
                    exclude: ['password', 'pin', 'otp', 'otpExpires', 'profile', 'username']
                }
            }]
        });

        // --- End Sequelize Logic ---

        if (!rider) {
            logger.error(`Rider profile not found.`, { controller: controllerName, riderId });
            return res.status(404).json({ status: false, message: "Rider profile not found" });
        }
        
        // The User object will be nested inside the Rider object.
        if (!rider.userProfile) {
            logger.error(`Data integrity issue: Rider profile exists but associated user not found.`, { controller: controllerName, riderId });
            return res.status(404).json({ status: false, message: "Associated user account not found" });
        }

        logger.info(`Successfully fetched user profile for rider.`, { controller: controllerName, riderId, userId: rider.userProfile.id });
        // 4. Send back ONLY the nested user profile object.
        res.status(200).json(rider.userProfile);

    } catch (error) {
        logger.error(`Failed to fetch user profile for rider: ${error.message}`, { controller: controllerName, riderId, error: error.stack });
        res.status(500).json({ status: false, message: "Failed to fetch user", error: error.message });
    }
}


async function verifyDeliveryAndPayout(req, res) {
    const { orderId, pin } = req.params;
    // const { pin } = req.body; // PIN should be sent in the body
    const controllerName = 'verifyDeliveryAndPayout';

    try {
        logger.info(`Rider attempting to verify delivery PIN for order.`, { controller: controllerName, orderId });

        if (!pin || pin.length !== 4) {
            return res.status(400).json({ status: false, message: "A 4-digit PIN is required." });
        }

        const order = await Order.findByPk(orderId, {
            // We need the restaurant details for the payout
            include: [{ model: Restaurant, as: 'restaurant' }]
        });

        if (!order || !order.deliveryPin) {
            return res.status(404).json({ status: false, message: "Order not found or no delivery PIN is set." });
        }

        if (order.orderStatus === 'Delivered') {
            logger.warn(`Attempt to verify PIN for an order that has already been delivered.`, { controller: controllerName, orderId });
            return res.status(400).json({ status: false, message: "This order has already been marked as delivered." });
        }
        // --- PIN VERIFICATION ---
        const isPinValid = await bcrypt.compare(pin, order.deliveryPin);

        if (!isPinValid) {
            logger.warn(`Incorrect delivery PIN attempt for order.`, { controller: controllerName, orderId });
            return res.status(400).json({ status: false, message: "Incorrect PIN." });
        }

        // --- PIN IS CORRECT, PROCEED WITH PAYOUT AND STATUS UPDATE ---
        logger.info(`Delivery PIN verified for order. Proceeding with payout.`, { controller: controllerName, orderId });
         logger.info(`Delivery PIN verified for order. Proceeding with payouts.`, { controllerName, orderId });

        // 1. Trigger the Payouts
        const restaurantPayoutPromise = payoutService.triggerRestaurantPayout(order);
        const riderPayoutPromise = payoutService.triggerRiderPayout(order);

        // Run both payout requests in parallel for efficiency
        const [restaurantResult, riderResult] = await Promise.all([restaurantPayoutPromise, riderPayoutPromise]);
        
        // Check if either payout failed.
        if (!restaurantResult.success || !riderResult.success) {
            logger.error(`One or more payouts failed for order.`, { controllerName, orderId, restaurantResult, riderResult });
            // Even if payout fails, we might still mark the order as delivered.
            // This is a business logic decision. For now, let's stop and return an error.
            return res.status(500).json({ status: false, message: "Payment processing failed. Please contact support." });
        }


        // 1. Trigger the Payout (Your existing payout logic would go here)
        // const payoutResponse = await triggerPayoutFunction(order.deliveryFee, order.restaurant.bank, ...);
        // if (!payoutResponse.success) {
        //   return res.status(500).json({ status: false, message: "Payment processing failed." });
        // }

        // 2. Update the Order and Rider Status to Delivered
        await order.update({
            orderStatus: 'Delivered',
            riderStatus: 'OD',
            paymentStatus: 'Completed' // Or whatever the final payment status should be
        });

        // 3. Send notifications and socket events
        const io = getIO();
        io.to(`order_${orderId}`).emit("order:delivered", { orderId: orderId });
        // ... send push notifications to customer ...

        res.status(200).json({ status: true, message: "Delivery confirmed and payment initiated." });

    } catch (error) {
        logger.error(`Failed to verify delivery: ${error.message}`, { controller: controllerName, orderId, error: error.stack });
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
}


async function resendPickupPin(req, res) {
    // Rider's PROFILE ID comes from the URL, order ID also from the URL
    const { orderId, riderId } = req.params;
    const controllerName = 'resendPickupPin';

    try {
        logger.info(`Rider requesting resend of pickup PIN.`, { controller: controllerName, orderId, riderId });

        if (!orderId || !riderId) {
            return res.status(400).json({ status: false, message: "Order ID and Rider ID are required." });
        }

        // --- NEW LOGIC: FIND THEN CHECK ---

        // Step 1: Find the order by its primary key.
        const order = await Order.findByPk(orderId);

        // Check if the order exists and is in a valid state
        if (!order || !order.pickupPin || order.orderStatus === 'Delivered' || order.orderStatus === 'Cancelled') {
            return res.status(404).json({ status: false, message: "Active order not found." });
        }
        
        // Step 2: Manually check if the order is assigned to the rider making the request.
        // This is the application-level authorization check.
        if (order.riderId !== riderId) {
            logger.warn(`Authorization failed: Rider tried to resend PIN for an order not assigned to them.`, { controller: controllerName, orderId, requestRiderId: riderId, actualRiderId: order.riderId });
            return res.status(403).json({ status: false, message: "Forbidden: This order is not assigned to you." });
        }

        // --- END NEW LOGIC ---

        // --- Logic to generate and send the NEW PIN ---
        const newPlainTextPin = Math.floor(1000 + Math.random() * 9000).toString();
        const salt = await bcrypt.genSalt(10); // You need to generate salt here
        const newHashedPin = await bcrypt.hash(newPlainTextPin, salt);
        
        await order.update({ pickupPin: newHashedPin });

        // Send the NEW plain-text PIN to the rider's device via push notification
        if (order.riderFcm) {
            await pushNotificationController.sendPushNotification(order.riderFcm, "Your Pickup PIN", `Your new pickup PIN for order #${order.orderSubId} is ${newPlainTextPin}.`);
        }

        logger.info(`Successfully resent new pickup PIN for order.`, { controller: controllerName, orderId, riderId });
        res.status(200).json({ status: true, message: `A new pickup PIN has been sent to your device.`, pickupPin: newPlainTextPin });

    } catch (error) {
        logger.error(`Failed to resend pickup PIN: ${error.message}`, { controller: controllerName, orderId, error: error.stack });
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
}



module.exports = {
    createRider, searchRestaurant, assignRiderToOrder, rejectOrder, currentTrip, completedTrips,
    getAllOrdersByOrderStatus, getAvailableOrdersForRestaurant, getDeliveredOrdersByRider,
    updateUserImageUrl, updateDriverLicenseImageUrl, updateParticularsImageUrl, updateVehicleImgUrl,
    getRiderById, getRiderUserById, updateRiderStatus, getRiderByUserId,
    getRiderUserByRiderId, verifyDeliveryAndPayout, resendPickupPin
}



// lrange order:682df4a32d550ac1f22977ed:locationHistory 0 -1
