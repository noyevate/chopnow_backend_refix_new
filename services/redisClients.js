const redis = require("redis");

// Create a Redis client
const client = redis.createClient({
  url: "redis://localhost:6379" // default local Redis
});

client.on("error", (err) => console.error("Redis Client Error", err));
client.connect();

module.exports = client;
