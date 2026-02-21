'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    // This adds the 'deletedAt' column to the 'users' table
    await queryInterface.addColumn('users', 'deletedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null
    });
  },
  async down(queryInterface, Sequelize) {
    // This removes the 'deletedAt' column if you ever need to revert
    await queryInterface.removeColumn('users', 'deletedAt');
  }
};