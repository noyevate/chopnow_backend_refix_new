// config/twilio.js
const twilio = require('twilio');
const dotenv = require('dotenv')

dotenv.config()

// Use environment variables or replace with actual credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID     //"ACfa812682c36d18e43bf7d1c17a4f17d6";
const authToken =   process.env.TWILIO_AUTH_TOKEN                                   //"a953dabfe235bcb2cb252483ae1d8a76";
const client = twilio(accountSid, authToken);

function sendOTP(phoneNumber, otp) {
    return client.messages.create({
        body: `Your Login OTP is: ${otp}. dont`,
        from: "+1 978 742 3773",
        to: phoneNumber
    });
}

module.exports = { sendOTP };
