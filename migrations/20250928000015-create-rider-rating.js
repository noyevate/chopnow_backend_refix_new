'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rider_ratings', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      rating: {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      
      // --- Foreign Key for User (who gave the rating) ---
      userId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // If the user is deleted, their rating is also deleted.
      },
      
      // --- Foreign Key for Rider (who received the rating) ---
      riderId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'users', // Assuming a rider is also a user
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      // --- Foreign Key for Order ---
      orderId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // If the order is deleted, the associated rating is also deleted.
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
    await queryInterface.dropTable('rider_ratings');
  }
};