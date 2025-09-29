'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('foods', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      title: { type: Sequelize.STRING, allowNull: false },
      time: { type: Sequelize.STRING, allowNull: false },
      code: { type: Sequelize.STRING, allowNull: false },
      isAvailable: { type: Sequelize.BOOLEAN, defaultValue: true },
      rating: { type: Sequelize.DECIMAL(3, 1), defaultValue: 3.0 },
      ratingCount: { type: Sequelize.STRING, defaultValue: '267' },
      description: { type: Sequelize.TEXT, allowNull: false },
      price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      priceDescription: { type: Sequelize.STRING, allowNull: true },
      restaurant_category: { type: Sequelize.STRING, allowNull: false },
      restaurantCategoryAvailable: { type: Sequelize.BOOLEAN, defaultValue: true },
      foodTags: { type: Sequelize.JSON, allowNull: false },
      foodType: { type: Sequelize.JSON, allowNull: false },
      additive: { type: Sequelize.JSON, allowNull: true },
      pack: { type: Sequelize.JSON, allowNull: true },
      imageUrl: { type: Sequelize.JSON, allowNull: false },
      
      // --- Foreign Key for Restaurant ---
      restaurantId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'restaurants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // If a restaurant is deleted, all its food items are also deleted.
      },
      
      // --- Foreign Key for Category ---
      categoryId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT' // Prevent a category from being deleted if food is still assigned to it.
      },
      
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('foods');
  }
};