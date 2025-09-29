'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('packs', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      packName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      packDescription: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      isAvailable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      
      // --- Foreign Key for Restaurant ---
      restaurantId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'restaurants', // The name of the table it points to
          key: 'id'           // The column in that table it points to
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // If the restaurant is deleted, its packs are also deleted.
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
    await queryInterface.dropTable('packs');
  }
};