'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * This 'up' function adds the 'riderRating' column to the 'orders' table.
     */
    await queryInterface.addColumn('orders', 'riderRating', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * This 'down' function removes the 'riderRating' column from the 'orders' table.
     * It allows you to reverse the migration.
     */
    await queryInterface.removeColumn('orders', 'riderRating');
  }
};