'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add payment reference to the orders table
    await queryInterface.addColumn('orders', 'paymentReference', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Add recipient code to the riders table
    await queryInterface.addColumn('riders', 'recipientCode', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    
    // Add recipient code to the restaurants table
    await queryInterface.addColumn('restaurants', 'recipientCode', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('orders', 'paymentReference');
    await queryInterface.removeColumn('riders', 'recipientCode');
    await queryInterface.removeColumn('restaurants', 'recipientCode');
  }
};