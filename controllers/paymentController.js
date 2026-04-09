const { Order } = require('../models');
const { api, generateTxRef } = require('../services/paystackService');
const logger = require("../utils/logger")
const crypto = require('crypto');
async function initializePayment(req, res) {
    try {
        const { orderId, amount, email } = req.body;
        code
        Code
        const order = await Order.findByPk(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.paymentStatus === "Completed") return res.status(400).json({ message: "Order already paid" });

        const reference = generateTxRef("customer");

        const response = await api.post('/transaction/initialize', {
            email,
            amount: amount * 100,
            reference,
            callback_url: process.env.PAYMENT_CALLBACK_URL,
            metadata: { orderId: order.id },
        });

        await order.update({ paymentReference: reference, paymentStatus: "Pending" });

        logger.info("Paystack payment initialized.", { reference });
        return res.status(200).json(response.data); // Send the full response from Paystack
    } catch (error) {
        logger.error("Payment initialization failed.", { error: error.response?.data || error.message });
        return res.status(500).json({ message: error.message });
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
module.exports = { initializePayment, paystackWebhook };