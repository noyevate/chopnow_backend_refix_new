// const redis = require("redis");

// // Create a Redis client
// const client = redis.createClient({
//   url: "redis://localhost:6379" // default local Redis
// });

// client.on("error", (err) => console.error("Redis Client Error", err));
// client.connect();

// module.exports = client;


const redis = require("redis");

const client = redis.createClient({
  url: "redis://127.0.0.1:6379"
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