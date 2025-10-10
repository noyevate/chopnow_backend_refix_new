'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('orders', 'deliveryPin', {
      type: Sequelize.STRING,
      allowNull: true // Can be null until it's generated
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('orders', 'deliveryPin');
  }
};