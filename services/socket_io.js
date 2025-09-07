// services/socket_io.js
const { Server } = require("socket.io");
const redisClient = require("./redisClients"); // make sure you import redis

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected: ", socket.id);

    // rider joins an order
    socket.on("rider:join", ({ orderId, riderId }) => {
      socket.join(`order_${orderId}`);
      io.to(socket.id).emit("rider:join", { orderId });
      console.log(`Rider ${riderId} joined order ${orderId}`);
    });

    // Rider sends live location
    socket.on("rider:location", async ({ orderId, riderId, lat, lng }) => {
      const locationData = { riderId, orderId, lat, lng, timestamp: Date.now() };
      console.log("Saving location for order:", orderId, "data:", locationData);

      try {
        await redisClient.set(
        `order:${orderId}:location`,
        JSON.stringify(locationData)
      );
      await redisClient.rPush(
        `order:${orderId}:locationHistory`,
        JSON.stringify(locationData)
      );

      const history = await redisClient.lRange(
        `order:${orderId}:locationHistory`,
        -20,
        -1
      );
      const locationHistory = history.map((h) => JSON.parse(h));

      console.log(`📢 BROADCASTING 'rider:locationUpdate' to room: order_${orderId}`);
      io.to(`order_${orderId}`).emit("rider:locationUpdate", locationData);
      io.to(`order_${orderId}`).emit("rider:locationHistory", locationHistory);
      } catch (error) {
        console.error("Redis Error: Failed to save or retrieve location.", error);
    // You could also emit an error event back to the rider if needed
    io.to(socket.id).emit("rider:error", { message: "Location storage failed." });
      }
    });

    // Customer/Restaurant subscribes
socket.on("order:subscribe", async ({ orderId }) => { // 1. Make it async
  try {
    socket.join(`order_${orderId}`);
    console.log(`Client ${socket.id} subscribed to order ${orderId}`);

    // 2. Fetch the existing history from Redis
    const history = await redisClient.lRange(
      `order:${orderId}:locationHistory`,
      0, // Get all points from the beginning
      -1
    );

    // If there is a history, parse it and send it
    if (history && history.length > 0) {
      const locationHistory = history.map((h) => JSON.parse(h));
      
      // 3. Send the history ONLY to the client that just subscribed
      socket.emit("rider:locationHistory", locationHistory); 
      console.log(`Sent location history for order ${orderId} to client ${socket.id}`);
    }
  } catch (error) {
    console.error(`Error during order subscription for order ${orderId}:`, error);
  }
});

    // Rider leaves after delivery
    socket.on("rider:leave", ({ orderId, riderId }) => {
      io.to(`order_${orderId}`).emit("order:delivered", { orderId, riderId });
      console.log(`Rider ${riderId} left order ${orderId}`);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected: ", socket.id);
    });
  });
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}

module.exports = { initSocket, getIO };
