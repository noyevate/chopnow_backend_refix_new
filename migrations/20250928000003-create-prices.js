'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('prices', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      basePrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      serviceFee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      time: {
        type: Sequelize.DATE,
        allowNull: false, // Timestamps are generally not null
        defaultValue: Sequelize.NOW
      },
      oldPrices: {
        type: Sequelize.JSON,
        allowNull: true
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

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('prices');
  }
};