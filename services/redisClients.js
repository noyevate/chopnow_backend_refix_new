// const redis = require("redis");

// // Create a Redis client
// const client = redis.createClient({
//   url: "redis://localhost:6379" // default local Redis
// });

// client.on("error", (err) => console.error("Redis Client Error", err));
// client.connect();

// module.exports = client;


// services/redisClients.js
const redis = require("redis");

// Load environment variables to get the password
require('dotenv').config();

// Build the connection URL dynamically
const redisURL = `redis://:${process.env.REDIS_PASSWORD}@127.0.0.1:6379`;

const client = redis.createClient({
  url: redisURL
});

client.on("error", (err) => console.error("Redis Client Error", err));

async function connectRedis() {
  try {
    await client.connect();
    console.log("✅ Successfully connected to Redis.");
  } catch (err) {
    console.error("❌ Failed to connect to Redis:", err);
  }
}

connectRedis();

module.exports = client;