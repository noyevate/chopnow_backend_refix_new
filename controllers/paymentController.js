const { Order } = require('../models');
const { api, generateTxRef } = require('../services/paystackService');
const logger = require("../utils/logger")
const crypto = require('crypto');


async function initializePayment(req, res) {
  const controllerName = 'initializePayment';
  try {
    const { orderId, amount, email } = req.body;
    logger.info(`Initializing payment for order.`, { controller: controllerName, orderId });

    if (!orderId || !amount || !email) {
      return res.status(400).json({ status: false, message: "OrderId, amount, and email are required." });
    }

    // --- THIS IS THE FIX ---
    // Use Sequelize's .findByPk() to find the order by its primary key.
    const order = await Order.unscoped().findByPk(orderId);
    // --- END FIX ---

    if (!order) {
      logger.error(`Order not found for payment initialization.`, { controller: controllerName, orderId });
      return res.status(404).json({ status: false, message: "Order not found" });
    }

    if (order.paymentStatus === "Completed") {
      return res.status(400).json({ status: false, message: "Order has already been paid for." });
    }

    const reference = generateTxRef("customer");

    const response = await api.post('/transaction/initialize', {
      email,
      amount: Math.round(amount * 100), // Convert to kobo, ensure it's an integer
      reference,
      callback_url: process.env.PAYMENT_CALLBACK_URL,
      metadata: { orderId: order.id },
    });

    // Update the order with the Paystack reference for tracking
    await order.update({ paymentReference: reference });

    logger.info(`Paystack payment initialized successfully.`, { controller: controllerName, orderId, reference });
    return res.status(200).json(response.data.data); // Return only the 'data' object from Paystack

  } catch (error) {
    logger.error(`Payment initialization failed: ${error.message}`, { controller: controllerName, error: error.stack });
    return res.status(500).json({ status: false, message: "Payment initialization failed.", error: error.message });
  }
}
async function paystackWebhook(req, res) {
    try {
        const hash = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(JSON.stringify(req.body)).digest("hex");
        if (hash !== req.headers["x-paystack-signature"]) {
            return res.status(401).send("Invalid signature");
        }
        code
        Code
        const event = req.body;
        if (event.event === "charge.success") {
            const reference = event.data.reference;
            const order = await Order.findOne({ where: { paymentReference: reference } });

            if (order && order.paymentStatus !== "Completed") {
                await order.update({ paymentStatus: "Completed" });
                logger.info("Payment confirmed via webhook.", { orderId: order.id, reference });
            }
        }
        res.sendStatus(200);
    } catch (error) {
        logger.error("Webhook processing error", error);
        res.sendStatus(500);
    }
}

async function verifyPaymentAndUpdateOrder(req, res) {
    const { reference, orderId } = req.body;
    const controllerName = 'verifyPaymentAndUpdateOrder';

    try {
        logger.info(`Verifying payment for order.`, { controller: controllerName, reference, orderId });

        if (!reference || !orderId) {
            return res.status(400).json({ status: false, message: "Reference and Order ID are required." });
        }
        
        const response = await api.get(`/transaction/verify/${reference}`);
        
        const paystackData = response.data.data;
        if (paystackData.status !== 'success') {
            logger.error(`Paystack verification failed.`, { controller: controllerName, reference, status: paystackData.status });
            return res.status(400).json({ status: false, message: "Payment verification failed with Paystack." });
        }

        // Step 2: Find the corresponding order in your database
        const order = await Order.findByPk(orderId);
        if (!order) {
            return res.status(404).json({ status: false, message: "Order not found." });
        }

        // Step 3: Security check - Verify the amount paid matches the order total
        // Paystack amount is in kobo, order total is in Naira
        const amountPaidInNaira = paystackData.amount / 100;
        if (amountPaidInNaira < parseFloat(order.grandTotal)) {
            logger.error(`Payment amount mismatch.`, { controller: controllerName, orderId, expected: order.grandTotal, actual: amountPaidInNaira });
            // You might want to flag this order for manual review
            return res.status(400).json({ status: false, message: "Payment amount mismatch." });
        }

        // Step 4: If everything is valid, update the order status
        await order.update({ paymentStatus: 'Completed' });
        
        logger.info(`Payment verified and order updated successfully.`, { controller: controllerName, orderId, reference });
        
        // --- Trigger post-payment notifications ---
        // await pushNotificationController.sendPushNotification(order.customerFcm, "Payment Success!", "Your order payment was successful.", order);
        // await pushNotificationController.sendPushNotification(order.restaurantFcm, "New Order!", "You have a new paid order.", order);
        // ...

        res.status(200).json({ status: true, message: "Payment verified and order updated." });

    } catch (error) {
        logger.error(`Failed to verify payment: ${error.message}`, { controller: controllerName, error: error.stack });
        res.status(500).json({ status: false, message: "Server error during payment verification.", error: error.message });
    }
}
module.exports = { initializePayment, paystackWebhook, verifyPaymentAndUpdateOrder };