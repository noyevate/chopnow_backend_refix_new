'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('others', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      minLat: {
        type: Sequelize.DOUBLE,
        allowNull: true,
        defaultValue: 0.05
      },
      maxLat: {
        type: Sequelize.DOUBLE,
        allowNull: true,
        defaultValue: 0.05
      },
      minLng: {
        type: Sequelize.DOUBLE,
        allowNull: true,
        defaultValue: 0.05
      },
      maxLng: {
        type: Sequelize.DOUBLE,
        allowNull: true,
        defaultValue: 0.05
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
    await queryInterface.dropTable('others');
  }
};