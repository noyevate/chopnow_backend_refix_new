// config/database.js
require('dotenv').config(); // Load environment variables
const { Sequelize } = require('sequelize');

// Create a new Sequelize instance to connect to the database
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: (msg) => console.log(`[SEQUELIZE] ${msg}`),
    timezone: '+00:00', // For writing to the database, always use UTC
    dialectOptions: {
    }
  }

  
);

// Test the connection (optional but good practice)
sequelize.authenticate()
  .then(() => console.log('✅ Connection to MySQL has been established successfully.'))
  .catch(err => console.error('❌ Unable to connect to the database:', err));

// Export the single, configured sequelize instance
module.exports = sequelize;