
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('carts', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      totalPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      additives: {
        type: Sequelize.JSON,
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
        onDelete: 'CASCADE' // If a user is deleted, their cart items are also deleted
      },
      
      // --- Foreign Key for Food ---
      // This 'foodId' field was missing from your model definition,
      // but it's required for the association. I've added it here.
      foodId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'foods',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // If a food is deleted, remove it from all carts
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
    await queryInterface.dropTable('carts');
  }
};