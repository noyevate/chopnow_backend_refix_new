'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('additives', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      additiveTitle: {
        type: Sequelize.STRING,
        allowNull: false
      },
      max: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      min: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      isAvailable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      options: {
        type: Sequelize.JSON,
        allowNull: true
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
        onDelete: 'CASCADE' // If the restaurant is deleted, its additives are also deleted.
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
    await queryInterface.dropTable('additives');
  }
};