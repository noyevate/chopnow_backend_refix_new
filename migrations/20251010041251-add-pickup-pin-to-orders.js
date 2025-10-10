'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * This 'up' function adds the 'pickupPin' column to the 'orders' table.
     * This PIN is for the rider to confirm pickup at the restaurant.
     */
    await queryInterface.addColumn('orders', 'pickupPin', {
      type: Sequelize.STRING,
      allowNull: true // Can be null until it's generated
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * This 'down' function removes the 'pickupPin' column from the 'orders' table.
     * It allows you to reverse the migration.
     */
    await queryInterface.removeColumn('orders', 'pickupPin');
  }
};