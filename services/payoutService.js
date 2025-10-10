// services/payoutService.js
const axios = require('axios');
const logger = require('../utils/logger');
// Import the models we need to fetch data
const { Restaurant, Rider } = require('../models'); 

const PAYMENT_SERVER_URL = process.env.PAYMENT_SERVER_URL || 'http://localhost:7000/delivery-payout';

/**
 * A function to trigger a payout for a restaurant.
 * @param {object} order - A Sequelize order object.
 * @returns {Promise<{success: boolean, message: string, data?: any}>}
 */
async function triggerRestaurantPayout(order) {
    try {
        logger.info(`Triggering restaurant payout for order.`, { orderId: order.id });

        // --- THIS IS YOUR SUGGESTED FIX ---
        // 1. Fetch the restaurant details directly using the ID from the order.
        const restaurant = await Restaurant.findByPk(order.restaurantId);
        // --- END FIX ---

        if (!restaurant || !restaurant.bank || !restaurant.accountNumber || !restaurant.accountName) {
            // Log the specific reason for failure
            logger.error("Restaurant payout failed: Bank details are incomplete.", { orderId: order.id, restaurantId: order.restaurantId });
            throw new Error("Restaurant bank details are incomplete.");
        }

        const payload = {
            amount: parseFloat(order.orderTotal),
            account_bank: restaurant.bank,
            account_number: restaurant.accountNumber,
            fullName: restaurant.accountName,
            narration: `Payment for order #${order.orderSubId}`,
            reference: `CHOPNOW-REST-${order.id}-${Date.now()}`
        };

        console.log(`payload: ${payload}`)

        const response = await axios.post(`${PAYMENT_SERVER_URL}`, payload);

         if (response.data && response.data.status === 'success') {
            return { success: true, message: "Restaurant payout initiated.", data: response.data };
        } else {
            return { success: false, message: response.data.message || "Unknown payout error." };
        }
    } catch (error) {
        logger.error(`Restaurant payout API call failed: ${error.message}`, { orderId: order.id });
        return { success: false, message: error.message };
    }
}

/**
 * A function to trigger a payout for a rider.
 * @param {object} order - A Sequelize order object.
 * @returns {Promise<{success: boolean, message: string, data?: any}>}
 */
async function triggerRiderPayout(order) {
    try {
        logger.info(`Triggering rider payout for order.`, { orderId: order.id, riderId: order.riderId });
        
        // --- APPLY THE SAME FIX HERE ---
        const rider = await Rider.findByPk(order.riderId);
        // --- END FIX ---

        if (!rider || !rider.bankName || !rider.bankAccount || !rider.bankAccountName) {
            logger.error("Rider payout failed: Bank details are incomplete.", { orderId: order.id, riderId: order.riderId });
            throw new Error("Rider bank details are incomplete.");
        }

        const payload = {
            amount: parseFloat(order.deliveryFee),
            account_bank: rider.bankName,
            account_number: rider.bankAccount,
            fullName: rider.bankAccountName,
            narration: `Payment for delivery of order #${order.orderSubId}`,
            reference: `CHOPNOW-RIDER-${order.id}-${Date.now()}`
        };
        console.log(`payload: ${payload}`)

        const response = await axios.post(`${PAYMENT_SERVER_URL}`, payload);

         if (response.data && response.data.status === 'success') {
            return { success: true, message: "Rider payout initiated.", data: response.data };
        } else {
            return { success: false, message: response.data.message || "Unknown payout error." };
        }
    } catch (error) {
        logger.error(`Rider payout API call failed: ${error.message}`, { orderId: order.id, riderId: order.riderId });
        return { success: false, message: error.message };
    }
}

module.exports = {
    triggerRestaurantPayout,
    triggerRiderPayout
};