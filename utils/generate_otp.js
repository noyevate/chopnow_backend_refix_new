// helpers/otp.js
const crypto = require('crypto');
const bcrypt = require('bcryptjs')

// Function to generate a random OTP
function generateOTP() {
    return crypto.randomInt(1000, 9999).toString();
}

async function hashPIN(pin) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(pin, salt);
}

module.exports = { generateOTP, hashPIN };
