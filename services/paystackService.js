// services/paystackService.js
const axios = require('axios');
const logger = require("../utils/logger")
const crypto = require('crypto');
require('dotenv').config();

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const api = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

const generateTxRef = (prefix = "chopnow") => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
};

/**
 * Creates a transfer recipient for a rider or restaurant.
 * @param {string} name - The account holder's name.
 * @param {string} accountNumber - The NUBAN account number.
 * @param {string} bankCode - The Paystack bank code.
 * @returns {Promise<string>} The recipient code (e.g., RCP_...).
 */
async function createRecipient(name, accountNumber, bankCode) {
  try {
    const response = await api.post('/transferrecipient', {
      type: "nuban",
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: "NGN",
    });
    logger.info("Paystack recipient created.", { recipientCode: response.data.data.recipient_code });
    return response.data.data.recipient_code;
  } catch (error) {
    logger.error("Paystack recipient creation failed.", { error: error.response?.data || error.message });
    throw new Error(error.response?.data?.message || "Recipient creation failed.");
  }
}

/**
 * Initiates a payout transfer.
 * @param {number} amount - The amount to transfer in Naira.
 * @param {string} recipientCode - The recipient code from Paystack.
 * @param {string} reason - The narration for the transfer.
 * @returns {Promise<object>} The transfer data from Paystack.
 */
async function initiateTransfer(amount, recipientCode, reason) {
  try {
    const response = await api.post('/transfer', {
      source: "balance",
      amount: amount * 100, // Convert to kobo
      recipient: recipientCode,
      reason,
      reference: generateTxRef("payout"),
    });
    logger.info("Paystack transfer initiated.", { reference: response.data.data.reference });
    return response.data.data;
  } catch (error) {
    logger.error("Paystack transfer failed.", { error: error.response?.data || error.message });
    throw new Error(error.response?.data?.message || "Transfer initiation failed.");
  }
}

module.exports = {
  api, // Export the axios instance for other direct calls
  generateTxRef,
  createRecipient,
  initiateTransfer,
};