
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('addresses', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      addressLine1: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      postalCode: {
        type: Sequelize.STRING,
        allowNull: false
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      deliveryInstructions: {
        type: Sequelize.STRING,
        allowNull: true
      },
      latitude: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      longitude: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      
      // --- Foreign Key for User ---
      userId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'users', // The name of the table it points to
          key: 'id'       // The column in that table it points to
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // If a user is deleted, all their addresses are also deleted.
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
    await queryInterface.dropTable('addresses');
  }
};