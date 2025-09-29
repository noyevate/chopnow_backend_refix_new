'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('restaurants', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      title: { type: Sequelize.STRING, allowNull: false },
      imageUrl: { type: Sequelize.STRING, allowNull: false },
      pickup: { type: Sequelize.BOOLEAN, defaultValue: false },
      restaurantFcm: { type: Sequelize.STRING, allowNull: true },
      restaurantMail: { type: Sequelize.STRING, allowNull: false, unique: true },
      delivery: { type: Sequelize.BOOLEAN, defaultValue: true },
      isAvailabe: { type: Sequelize.BOOLEAN, defaultValue: true },
      phone: { type: Sequelize.STRING, allowNull: false },
      code: { type: Sequelize.STRING, allowNull: true },
      accountName: { type: Sequelize.STRING, allowNull: true },
      accountNumber: { type: Sequelize.STRING, allowNull: true },
      bank: { type: Sequelize.STRING, allowNull: true },
      logoUrl: { type: Sequelize.STRING, allowNull: false },
      rating: { type: Sequelize.DECIMAL(3, 1), defaultValue: 1.0 },
      ratingCount: { type: Sequelize.STRING, defaultValue: '267' },
      verification: { type: Sequelize.STRING, defaultValue: "Pending" },
      verificationMessage: { type: Sequelize.TEXT },
      latitude: { type: Sequelize.DOUBLE, allowNull: false },
      longitude: { type: Sequelize.DOUBLE, allowNull: false },
      latitudeDelta: { type: Sequelize.DOUBLE, defaultValue: 0.0122 },
      longitudeDelta: { type: Sequelize.DOUBLE, defaultValue: 0.0122 },
      address: { type: Sequelize.TEXT, allowNull: false },
      addressTitle: { type: Sequelize.STRING, allowNull: false },
      time: { type: Sequelize.JSON, allowNull: true },
      restaurant_categories: { type: Sequelize.JSON, allowNull: true },
      
      // --- Foreign Key for User ---
      userId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // If the user account is deleted, their restaurant is also deleted.
      },
      
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('restaurants');
  }
};``