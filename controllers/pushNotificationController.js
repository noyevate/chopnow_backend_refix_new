const admin = require('firebase-admin');
const User = require("../models/User")

async function sendPushNotificationToRider(fcmTokens, title, body, order) {
    try {
        const message = {
            token: fcmTokens,
            notification: { title, body },
            data: { order: JSON.stringify(order) }
        };

        await admin.messaging().send(message);
        console.log("Notification sent:", title);
    } catch (error) {
        console.error("Error sending notification:", error);
    }
}

async function sendPushNotificationToRestaurant(fcmTokens, title, body, order) {
    try {
        const message = {
            token: fcmTokens,
            notification: { title, body },
            data: { order: JSON.stringify(order) }
        };

        await admin.messaging().send(message);
        console.log("Notification sent:", title);
    } catch (error) {
        console.error("Error sending notification:", error);
    }
}

async function sendPushNotification(fcmToken, title, body, order) {
    try {
        const message = {
            token: fcmToken,
            notification: { title, body },
            data: { order: JSON.stringify(order) }
        };

        await admin.messaging().send(message);
        console.log("✅ Notification sent:", title);
    } catch (error) {
        console.error("❌ Error sending notification:", error);
    }
}




module.exports = { sendPushNotificationToRider, sendPushNotificationToRestaurant, sendPushNotification }