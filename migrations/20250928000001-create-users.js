'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // This is where you define the table structure
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      first_name: {
        type: Sequelize.STRING
      },
      last_name: {
        type: Sequelize.STRING
      },
      username: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      otp: {
        type: Sequelize.STRING
      },
      fcm: {
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING
      },
      pin: {
        type: Sequelize.STRING
      },
      otpExpires: {
        type: Sequelize.DATE
      },
      verification: {
        type: Sequelize.BOOLEAN
      },
      phone: {
        type: Sequelize.STRING
      },
      phoneVerification: {
        type: Sequelize.BOOLEAN
      },
      userType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      profile: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // This is what happens if you ever need to undo the migration
    await queryInterface.dropTable('users');
  }
};

