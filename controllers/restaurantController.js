const { Restaurant, User, Order } = require("../models"); // Import from the central models/index.js
const logger = require('../utils/logger');



const { Op } = require("sequelize");
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

async function addRestaurant(req, res) {
    const { title, userId } = req.body;

    try {
        // Sequelize: Use Op.or to check for existing restaurant by userId OR title
        const existingRestaurant = await Restaurant.findOne({
            where: {
                [Op.or]: [
                    { userId: userId },
                    { title: title }
                ]
            }
        });

        if (existingRestaurant) {
            // Sequelize uses strict equality (===) for numbers, so no .toString() is needed
            if (existingRestaurant.userId = userId) {
                return res.status(409).json({ status: false, message: "User already has a restaurant" }); // 409 Conflict
            } else if (existingRestaurant.title === title) {
                return res.status(409).json({ status: false, message: "A restaurant with this title already exists" });
            }
        }

        // --- Prepare data for creation ---
        // Flatten the coords object and rename coords.title to addressTitle
        const restaurantData = {
            ...req.body,
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            latitudeDelta: req.body.latitudeDelta,
            longitudeDelta: req.body.longitudeDelta,
            address: req.body.address,
            addressTitle: req.body.title, // Renamed field
        };
        delete restaurantData.coords; // Remove the original coords object

        // Sequelize: Use .create() to add the new restaurant
        const newRestaurant = await Restaurant.create(restaurantData);

        // Send back a clean, formatted response
        res.status(201).json({
            status: true,
            message: "Restaurant added Successfully",
            restaurant: { // Renamed from newRestaurant to restaurant for clarity
                restaurantId: newRestaurant.id, // Use .id in Sequelize
                title: newRestaurant.title,
                rating: newRestaurant.rating,
                address: newRestaurant.address,
                verification: newRestaurant.verification,
                code: newRestaurant.code
            }
        });
    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to add restaurant.", error: error.message });
    }
}


async function getRestaurantById(req, res) {
    const { id } = req.params;
    try {
        // Sequelize: .findByPk is the direct equivalent of .findById
        const restaurant = await Restaurant.findByPk(id);

        if (!restaurant) {
            return res.status(404).json({ status: false, message: "Restaurant not found." });
        }
        res.status(200).json(restaurant);
    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to get restaurant.", error: error.message });
    }
}


async function getRestaurantByUser(req, res) {
    const { userId } = req.params;

    try {
        // Sequelize: .findOne({ where: ... }) is the equivalent
        const restaurant = await Restaurant.findOne({ where: { userId: userId } });
        if (!restaurant) {
            return res.status(404).json({ status: false, message: "Restaurant not found for this user." });
        }
        res.status(200).json(restaurant);
    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to get restaurant.", error: error.message });
    }
}


async function getRestaurantbyUserId(req, res) {
    const userId = req.user.id; // From middleware
    try {        
        const restaurant = await Restaurant.findOne({ where: { userId: userId } });

        if (!restaurant) {
            return res.status(404).json({ status: false, message: "Restaurant not found for this user." });
        }
        res.status(200).json(restaurant);
    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to get restaurant.", error: error.message });
    }
}


async function getRandomRestaurant(req, res) {
    const { code } = req.params;
    try {
        let randomRestaurants = []; // Renamed for clarity

        const baseWhereClause = {
            isAvailabe: true,
            verification: 'Verified'
        };

        if (code) {
            randomRestaurants = await Restaurant.findAll({
                where: {
                    ...baseWhereClause, // Spread the base filters
                    code: code
                },
                order: sequelize.random(),
                limit: 20
            });
        }

        // If the first search yielded no results, do the fallback search
        if (randomRestaurants.length === 0) {
            randomRestaurants = await Restaurant.findAll({
                where: baseWhereClause, // Use the base filters
                order: sequelize.random(),
                limit: 5
            });
        }

        res.status(200).json(randomRestaurants);
    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to get random restaurants.", error: error.message });
    }
}

async function getAllNearbyRestaurant(req, res) {
    const { code } = req.params;
    try {
        let allNearbyRestaurants = [];
        const baseWhereClause = {
            isAvailabe: true,
            verification: 'Verified'
        };

        if (code) {
            // Find all restaurants matching the code
            allNearbyRestaurants = await Restaurant.findAll({
                where: {
                    ...baseWhereClause,
                    code: code
                }
            });
        }

        // If no code was provided or no restaurants matched, fall back
        if (allNearbyRestaurants.length === 0) {
            allNearbyRestaurants = await Restaurant.findAll({
                where: { where: baseWhereClause, isAvailabe: true } // Note the typo 'isAvailabe' from your model
            });
        }

        res.status(200).json(allNearbyRestaurants);
    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to get nearby restaurants.", error: error.message });
    }
}


async function restaurantAvailability(req, res) {
    try {
        const { id } = req.params; // Renamed from restaurantId for clarity
        const restaurant = await Restaurant.findByPk(id);

        if (!restaurant) {
            return res.status(404).json({ status: false, message: 'Restaurant not found' });
        }

        // Toggle the value and update the record
        const updatedRestaurant = await restaurant.update({
            // Use the exact field name from your model, including the typo
            isAvailabe: !restaurant.isAvailabe
        });

        res.status(200).json(updatedRestaurant);
    } catch (error) {
        res.status(500).json({ status: false, message: 'Failed to update availability.', error: error.message });
    }
}


async function getPopularRestaurant(req, res) {
    try {
        popularRestaurants = []
        popularRestaurants = await Restaurant.findAll({
            where: { verification: 'Verified', isAvailabe: true },
            order: [
                ['rating', 'DESC'] // Order by the 'rating' column in descending order
            ],
            limit: 30
        })

        if (popularRestaurants.length === 0) {
            popularRestaurants = await Restaurant.findAll({
                where: { isAvailabe: true }, // Note the typo 'isAvailabe' from your model
                order: sequelize.random(),
                limit: 5
            })
        }

        res.status(200).json(popularRestaurants);
    } catch (err) {
        console.error('Error fetching popular restaurants:', err);
        res.status(500).json({ status: false, message: 'Failed to fetch popular restaurants.', error: err.message });
    }
};


async function addTimeToRestaurant(req, res) {
    try {
        const { id } = req.params; // The restaurant's primary key
        const { orderType, day, open, close, orderCutOffTime, menuReadyTime } = req.body;

        if (!orderType || !day || !open || !close) {
            return res.status(400).json({
                status: false, // Changed success to status for consistency
                message: 'Missing required fields: orderType, day, open, close.',
            });
        }

        const restaurant = await Restaurant.findByPk(id);

        if (!restaurant) {
            return res.status(404).json({
                status: false,
                message: 'Restaurant not found.',
            });
        }

        // Prepare the new time entry
        const newTimeEntry = {
            orderType,
            day,
            open,
            close,
            orderCutOffTime: orderCutOffTime || null,
            menuReadyTime: menuReadyTime || null,
        };

        // Sequelize: To replace the array, we simply update the JSON column
        // with a new array containing only the new entry.
        await restaurant.update({
            time: [newTimeEntry] // Overwrite the existing 'time' array
        });

        return res.status(200).json({
            status: true,
            message: 'All existing time entries deleted and new time added successfully.',
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: 'Server error.',
            error: error.message
        });
    }
}

async function updatedRestaurant(req, res) {
    const { restaurantId } = req.params;
    const updateData = req.body;

    // --- Data Preprocessing for Flattened Coords ---
    // If the incoming data includes a 'coords' object, we must flatten it
    // to match our database table structure.
    if (updateData.coords) {
        updateData.latitude = updateData.coords.latitude;
        updateData.longitude = updateData.coords.longitude;
        updateData.latitudeDelta = updateData.coords.latitudeDelta;
        updateData.longitudeDelta = updateData.coords.longitudeDelta;
        updateData.address = updateData.coords.address;
        updateData.addressTitle = updateData.coords.title; // Map to the renamed field
        delete updateData.coords; // Remove the original object
    }

    try {
        // Sequelize: Use Model.update() to apply the changes
        const [updatedRows] = await Restaurant.update(updateData, {
            where: { id: restaurantId }
        });

        if (updatedRows === 0) {
            return res.status(404).json({ status: false, message: "Restaurant not found or no new data to update." });
        }

        // Fetch the fully updated restaurant to send back in the response
        const updatedRestaurant = await Restaurant.findByPk(restaurantId);

        res.status(200).json({ // Changed to 200 OK
            status: true,
            message: "Restaurant updated successfully",
            restaurant: updatedRestaurant // Renamed for clarity
        });

    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to update restaurant.", error: error.message });
    }
}

async function addRestuarantAccountDetails(req, res) {
    // The restaurantId should be a URL parameter for a specific resource
    const { restaurantId } = req.params;
    const { accountName, accountNumber, bank } = req.body;

    try {
        if (!accountName || !accountNumber || !bank) {
            return res.status(400).json({ status: false, message: "Account Name, Number, and Bank are required." });
        }

        const [updatedRows] = await Restaurant.update({
            accountName,
            accountNumber,
            bank
        }, {
            where: { id: restaurantId }
        });

        if (updatedRows === 0) {
            return res.status(404).json({ status: false, message: "Restaurant not found." });
        }

        const updatedRestaurant = await Restaurant.findByPk(restaurantId);
        return res.status(200).json(updatedRestaurant);

    } catch (error) {
        return res.status(500).json({ status: false, message: "Failed to add account details.", error: error.message });
    }
}


async function verifyPickupPin(req, res) {
    // The ID of the order being picked up
    const { orderId } = req.params;
    const { pin, restaurantId } = req.body; // Add restaurantId to the body
    const controllerName = 'verifyPickupPin';

    try {
        logger.info(`Restaurant attempting to verify pickup PIN for order.`, { controller: controllerName, orderId, restaurantId });

        if (!pin || pin.length !== 4 || !restaurantId) {
            return res.status(400).json({ status: false, message: "A 4-digit PIN and restaurantId are required." });
        }

        // --- NEW LOGIC: FIND THEN CHECK ---
        
        // Step 1: Find the order by its primary key
        const order = await Order.findByPk(orderId);

        if (!order || !order.pickupPin) {
            return res.status(404).json({ status: false, message: "Order not found or no pickup PIN is set." });  
            
        }

        if (order.orderStatus === 'Out_For_Delivery' || order.orderStatus === 'Delivered') {
            logger.warn(`Attempt to verify PIN for an order that has already been picked up.`, { controller: controllerName, orderId });
            return res.status(400).json({ status: false, message: "This order has already been confirmed for pickup." });
        }

        // Step 2: Manually check if the order belongs to the restaurant making the request.
        // This is the application-level authorization check.
        if (order.restaurantId !== restaurantId) {
            logger.warn(`Authorization failed: Restaurant tried to verify PIN for an order not belonging to them.`, { controller: controllerName, orderId, requestRestaurantId: restaurantId, actualRestaurantId: order.restaurantId });
            return res.status(403).json({ status: false, message: "Forbidden: This order does not belong to your restaurant." });
        }
        
        // --- END NEW LOGIC ---

        // --- PIN VERIFICATION (remains the same) ---
        const isPinValid = await bcrypt.compare(pin, order.pickupPin);

        if (!isPinValid) {
            logger.warn(`Incorrect pickup PIN attempt for order.`, { controller: controllerName, orderId });
            return res.status(400).json({ status: false, message: "Incorrect PIN." });
        }

        // --- PIN IS CORRECT, UPDATE STATUS ---
        logger.info(`Pickup PIN verified. Updating order status.`, { controller: controllerName, orderId });
        
        await order.update({
            orderStatus: 'Out_For_Delivery',
            riderStatus: 'TDP' // Towards Delivery Point
        });
        
        // Optional: Send notifications to customer
        // await pushNotificationController.sendPushNotification(order.customerFcm, "On The Way!", "Your order has been picked up...", order);

        res.status(200).json({ status: true, message: "Pickup confirmed. Order is now out for delivery." });

    } catch (error) {
        logger.error(`Failed to verify pickup PIN: ${error.message}`, { controller: controllerName, orderId, error: error.stack });
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
}



module.exports = { addRestaurant, getRestaurantById, addTimeToRestaurant, getRestaurantByUser, getRestaurantbyUserId, getRandomRestaurant, getAllNearbyRestaurant, restaurantAvailability, getPopularRestaurant, updatedRestaurant, addRestuarantAccountDetails, verifyPickupPin }

