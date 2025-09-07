// controllers/simulatedRider.js
const redisClient = require("../services/redisClients"); // adjust path if needed

// 1. Import the getIO function to access the Socket.IO instance
const { getIO } = require("../services/socket_io"); // adjust path if needed

const airportToPolyRoute = [
  { lat: 8.4790, lng: 4.5426 }, // Challenge
  { lat: 8.4905, lng: 4.5560 }, 
  { lat: 8.4992, lng: 4.5685 }, 
  { lat: 8.5070, lng: 4.5802 }, 
  { lat: 8.5128, lng: 4.5901 }, // Near Post Office
  { lat: 8.5203, lng: 4.5967 }, // Kwara Polytechnic
  { lat: 8.4973, lng: 4.5521 }, // Post Office
  { lat: 8.5030, lng: 4.5628 }, 
  { lat: 8.5092, lng: 4.5725 }, 
  { lat: 8.5158, lng: 4.5800 }, 
  { lat: 8.5220, lng: 4.5879 }, // GRA
  { lat: 8.4631, lng: 4.6017 }, // Tanke Junction
  { lat: 8.4712, lng: 4.6091 },
  { lat: 8.4820, lng: 4.6175 },
  { lat: 8.4955, lng: 4.6259 }, 
  { lat: 8.5032, lng: 4.6338 }, // Unilorin Main Gate
  { lat: 8.4890, lng: 4.4932 }, // Mandate Market
  { lat: 8.4935, lng: 4.5111 }, 
  { lat: 8.4983, lng: 4.5288 }, // Sango
  { lat: 8.5025, lng: 4.5430 }, 
  { lat: 8.5078, lng: 4.5562 }, // Kwara Hotel


];

let intervalId = null;

async function startRiderSimulation(orderId, riderId) {
  console.log(`🚴 Starting rider simulation for order ${orderId}`);

  let index = 0;
  intervalId = setInterval(async () => {
    if (index >= airportToPolyRoute.length) {
      clearInterval(intervalId);
      console.log(`✅ Rider ${riderId} reached Kwara Poly`);
      return;
    }

    const coord = airportToPolyRoute[index];
    index++;

    const locationData = {
      riderId,
      orderId,
      lat: coord.lat,
      lng: coord.lng,
      timestamp: Date.now(),
    };

    try {
      // Save to Redis (your existing logic is perfect)
      await redisClient.set(
        `order:${orderId}:location`,
        JSON.stringify(locationData)
      );
      await redisClient.rPush(
        `order:${orderId}:locationHistory`,
        JSON.stringify(locationData)
      );

      console.log("📡 SIMULATION: Rider moving:", locationData);

      // --- THE FIX IS HERE ---
      // 2. Get the initialized Socket.IO instance
      const io = getIO();
      if (!io) {
        console.error("Socket.io not initialized, cannot broadcast update.");
        return;
      }

      // 3. Broadcast the update to the correct room, just like the real app would
      console.log(`📢 SIMULATION: Broadcasting 'rider:locationUpdate' to room: order_${orderId}`);
      io.to(`order_${orderId}`).emit("rider:locationUpdate", locationData);

      // Also broadcast the updated history
      const history = await redisClient.lRange( `order:${orderId}:locationHistory`, -20, -1 );
      const locationHistory = history.map((h) => JSON.parse(h));
      io.to(`order_${orderId}`).emit("rider:locationHistory", locationHistory);
      // --- END FIX ---

    } catch (error) {
      console.error("Error in rider simulation:", error);
      clearInterval(intervalId);
    }
  }, 10000); // update every 10 sec
}

module.exports = { startRiderSimulation };
