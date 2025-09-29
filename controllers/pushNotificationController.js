const admin = require('firebase-admin');
const { User, Order, Rider, Restaurant } = require('../models');

async function sendPushNotificationToRider(fcmTokens, title, body, order) { 
    try {
        if (!fcmTokens || fcmTokens.length === 0) {
            console.error("❌ No valid FCM tokens provided.");
            return;
        }

        const message = {
            notification: { title, body },
            data: { order: JSON.stringify(order) },
            tokens: fcmTokens // Use 'tokens' for multiple recipients
        };

        // Use sendEachForMulticast() for multiple tokens
        const response = await admin.messaging().sendEachForMulticast(message);

        console.log("✅ Notification sent successfully:", response);
    } catch (error) {
        console.error("❌ Error sending notification:", error);
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