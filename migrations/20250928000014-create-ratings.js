'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ratings', {
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
      
      // --- Foreign Key for User ---
      userId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'users', // The name of the table it points to
          key: 'id'       // The column in that table it points to
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // If a user is deleted, their ratings are also deleted.
      },
      
      // --- Foreign Key for Restaurant ---
      restaurantId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'restaurants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // If a restaurant is deleted, its ratings are also deleted.
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
    await queryInterface.dropTable('ratings');
  }
};