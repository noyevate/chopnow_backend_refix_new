// controllers/adminController.js
const { Restaurant, User, Food, Pack, Additive, Rating, Order } = require('../models');
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


module.exports = {
    getAllRestaurantsForAdmin,
    updateRestaurantVerificationStatus,
    hardDeleteRestaurant
};