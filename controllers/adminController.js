// controllers/adminController.js
const { Restaurant, User, Food, Pack, Additive, Rating, Order, Rider } = require('../models');
const sequelize = require('../config/database');
const logger = require('../utils/logger');

// ===================================================================
//         GET ALL RESTAURANTS (FOR ADMIN DASHBOARD)
// ===================================================================
async function getAllRestaurantsForAdmin(req, res) {
    const controllerName = 'getAllRestaurantsForAdmin';
    try {
        logger.info(`Admin fetching all restaurants.`, { controller: controllerName });

        const restaurants = await Restaurant.findAll({
            // Include the owner's details so the admin can see their email/phone
            include: [{
                model: User,
                as: 'owner',
                attributes: ['id', 'email', 'phone']
            }],
            order: [['createdAt', 'DESC']] // Show newest restaurants first
        });

        res.status(200).json(restaurants);

    } catch (error) {
        logger.error(`Failed to fetch all restaurants: ${error.message}`, { controller: controllerName, error: error.stack });
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
}


// ===================================================================
//         UPDATE RESTAURANT VERIFICATION STATUS
// ===================================================================
async function updateRestaurantVerificationStatus(req, res) {
    const { restaurantId } = req.params;
    const { status } = req.body;
    const controllerName = 'updateRestaurantVerificationStatus';

    try {
        logger.info(`Admin updating restaurant verification status.`, { controller: controllerName, restaurantId, newStatus: status });

        const validStatuses = ["Pending", "Verified", "Rejected"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ status: false, message: "Invalid verification status provided." });
        }

        const [updatedRows] = await Restaurant.update(
            { verification: status },
            { where: { id: restaurantId } }
        );

        if (updatedRows === 0) {
            return res.status(404).json({ status: false, message: "Restaurant not found." });
        }
        
        // Optional: Send push notification to the vendor about the status change
        // ...

        res.status(200).json({ status: true, message: `Restaurant status successfully updated to '${status}'.` });

    } catch (error) {
        logger.error(`Failed to update restaurant status: ${error.message}`, { controller: controllerName, error: error.stack });
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
}


// ===================================================================
//          PERMANENTLY DELETE A RESTAURANT AND OWNER
// ===================================================================
async function hardDeleteRestaurant(req, res) {
    const { restaurantId } = req.params;
    const controllerName = 'hardDeleteRestaurant';
    const t = await sequelize.transaction();

    try {
        logger.warn(`ADMIN ACTION: Initiating hard delete for restaurant.`, { controller: controllerName, restaurantId });

        // Step 1: Find the restaurant to get its owner's userId
        const restaurant = await Restaurant.findByPk(restaurantId, { transaction: t });
        
        if (!restaurant) {
            await t.rollback();
            return res.status(404).json({ status: false, message: "Restaurant not found." });
        }
        
        const vendorUserId = restaurant.userId;
        logger.info(`Found restaurant owner for deletion.`, { controller: controllerName, vendorUserId });

        // Step 2: Delete the Restaurant. 
        // ON DELETE CASCADE will handle deleting associated Foods, Packs, Additives, and Ratings.
        await Restaurant.destroy({
            where: { id: restaurantId },
            transaction: t
        });
        logger.info(`Restaurant record deleted.`, { controller: controllerName, restaurantId });

        // Step 3: Delete the Vendor's User account.
        // ON DELETE CASCADE will handle deleting associated Addresses, Orders, Carts, etc.
        await User.destroy({
            where: { id: vendorUserId },
            transaction: t
        });
        logger.info(`Vendor user account deleted.`, { controller: controllerName, vendorUserId });

        // If all operations were successful, commit the transaction
        await t.commit();
        
        logger.warn(`HARD DELETE successful for restaurant and owner.`, { controller: controllerName, restaurantId, vendorUserId });
        res.status(200).json({ status: true, message: "Restaurant and its owner have been permanently deleted." });

    } catch (error) {
        // If any step fails, roll back all changes
        await t.rollback();
        logger.error(`Failed to hard delete restaurant: ${error.message}`, { controller: controllerName, error: error.stack });
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
}




// ===================================================================
async function getAllRidersForAdmin(req, res) {
    const controllerName = 'getAllRidersForAdmin';
    try {
        logger.info(`Admin fetching all riders.`, { controller: controllerName });

        const riders = await Rider.findAll({
            // Include the main User details so the admin can see their name, email, etc.
            include: [{
                model: User,
                as: 'userProfile', // This MUST match the alias in models/index.js
                attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
            }],
            order: [['createdAt', 'DESC']] // Show newest riders first
        });

        res.status(200).json(riders);

    } catch (error) {
        logger.error(`Failed to fetch all riders: ${error.message}`, { controller: controllerName, error: error.stack });
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
}


// ===================================================================
//              UPDATE RIDER VERIFICATION STATUS
// ===================================================================
async function updateRiderVerificationStatus(req, res) {
    const { riderId } = req.params;
    const { status } = req.body;
    const controllerName = 'updateRiderVerificationStatus';

    try {
        logger.info(`Admin updating rider verification status.`, { controller: controllerName, riderId, newStatus: status });

        // Validate the incoming status
        const validStatuses = ["Pending", "Verified", "Rejected"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ status: false, message: "Invalid verification status provided." });
        }

        const [updatedRows] = await Rider.update(
            { verification: status },
            { where: { id: riderId } }
        );

        if (updatedRows === 0) {
            return res.status(404).json({ status: false, message: "Rider profile not found." });
        }
        
        // Optional: Send push notification to the rider about their status change
        // ...

        res.status(200).json({ status: true, message: `Rider status successfully updated to '${status}'.` });

    } catch (error) {
        logger.error(`Failed to update rider status: ${error.message}`, { controller: controllerName, error: error.stack });
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
}


// ===================================================================
//           PERMANENTLY DELETE A RIDER AND THEIR USER ACCOUNT
// ===================================================================
async function hardDeleteRider(req, res) {
    const { riderId } = req.params;
    const controllerName = 'hardDeleteRider';
    const t = await sequelize.transaction();

    try {
        logger.warn(`ADMIN ACTION: Initiating hard delete for rider profile.`, { controller: controllerName, riderId });

        // Step 1: Find the Rider profile to get its owner's userId
        const rider = await Rider.findByPk(riderId, { transaction: t });
        
        if (!rider) {
            await t.rollback();
            return res.status(404).json({ status: false, message: "Rider profile not found." });
        }
        
        const riderUserId = rider.userId;
        logger.info(`Found rider's user account for deletion.`, { controller: controllerName, riderUserId });

        // Step 2: Delete the Rider Profile.
        // This will also cascade delete any data that points ONLY to the rider profile.
        await Rider.destroy({
            where: { id: riderId },
            transaction: t
        });
        logger.info(`Rider profile record deleted.`, { controller: controllerName, riderId });

        // Step 3: Delete the Rider's main User account.
        // ON DELETE CASCADE will handle deleting all associated Orders, Carts, Addresses, etc.
        await User.destroy({
            where: { id: riderUserId },
            transaction: t
        });
        logger.info(`Rider user account deleted.`, { controller: controllerName, riderUserId });

        // If all operations were successful, commit the transaction
        await t.commit();
        
        logger.warn(`HARD DELETE successful for rider and their user account.`, { controller: controllerName, riderId, riderUserId });
        res.status(200).json({ status: true, message: "Rider and their user account have been permanently deleted." });

    } catch (error) {
        // If any step fails, roll back all changes
        await t.rollback();
        logger.error(`Failed to hard delete rider: ${error.message}`, { controller: controllerName, error: error.stack });
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
}




module.exports = {
    getAllRestaurantsForAdmin,
    updateRestaurantVerificationStatus,
    hardDeleteRestaurant,

     getAllRidersForAdmin, // <-- New
    updateRiderVerificationStatus, // <-- New
    hardDeleteRider, // <-- New
    
};