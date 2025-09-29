'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: { type: Sequelize.STRING, primaryKey: true, allowNull: false },
      orderTotal: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      orderSubId: { type: Sequelize.INTEGER, allowNull: false },
      deliveryFee: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      customerFcm: { type: Sequelize.STRING, allowNull: true },
      restaurantFcm: { type: Sequelize.STRING, allowNull: true },
      riderFcm: { type: Sequelize.STRING, allowNull: true },
      grandTotal: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      restaurantAddress: { type: Sequelize.TEXT, allowNull: false },
      paymentMethod: { type: Sequelize.STRING, allowNull: false },
      paymentStatus: { type: Sequelize.STRING, defaultValue: 'Pending' },
      orderStatus: { type: Sequelize.STRING, defaultValue: 'Pending' },
      riderStatus: { type: Sequelize.STRING, defaultValue: 'NRA' },
      riderId: { type: Sequelize.STRING, allowNull: true },
      rating: { type: Sequelize.INTEGER, defaultValue: 3 },
      restaurantRating: { type: Sequelize.BOOLEAN, defaultValue: false },
      feedback: { type: Sequelize.TEXT, allowNull: true },
      PromoCode: { type: Sequelize.STRING, allowNull: true },
      customerName: { type: Sequelize.STRING, allowNull: true },
      customerPhone: { type: Sequelize.STRING, allowNull: true },
      discountAmount: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      riderAssigned: { type: Sequelize.BOOLEAN, defaultValue: false },
      restaurantCoords: { type: Sequelize.JSON, allowNull: true },
      recipientCoords: { type: Sequelize.JSON, allowNull: true },
      rejectedBy: { type: Sequelize.JSON, allowNull: true },
      
      // --- Foreign Keys ---
      userId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // If user is deleted, their orders are deleted
      },
      deliveryAddressId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'addresses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT' // Prevent deleting an address if it's used in an order
      },
      restaurantId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'restaurants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT' // Prevent deleting a restaurant if it has orders
      },
      
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('orders');
  }
};