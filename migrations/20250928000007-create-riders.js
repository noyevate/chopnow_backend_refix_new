'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('riders', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      vehicleImgUrl: { type: Sequelize.STRING, allowNull: false },
      vehicleType: { type: Sequelize.STRING, allowNull: false },
      fcm: { type: Sequelize.STRING, allowNull: true },
      vehicleBrand: { type: Sequelize.STRING, allowNull: false },
      plateNumber: { type: Sequelize.STRING, allowNull: false, unique: true },
      bankName: { type: Sequelize.STRING, allowNull: false },
      bankAccount: { type: Sequelize.STRING, allowNull: false },
      bankAccountName: { type: Sequelize.STRING, allowNull: false },
      userImageUrl: { type: Sequelize.STRING, allowNull: false },
      particularsImageUrl: { type: Sequelize.STRING, allowNull: true },
      driverLicenseImageUrl: { type: Sequelize.STRING, allowNull: true },
      rating: { type: Sequelize.DECIMAL(3, 1), defaultValue: 3.0 },
      ratingCount: { type: Sequelize.INTEGER, defaultValue: 267 },
      verification: { type: Sequelize.STRING, defaultValue: "Pending" },
      verificationMessage: { type: Sequelize.TEXT },
      latitude: { type: Sequelize.DOUBLE, allowNull: false },
      longitude: { type: Sequelize.DOUBLE, allowNull: false },
      latitudeDelta: { type: Sequelize.DOUBLE, defaultValue: 0.0122 },
      longitudeDelta: { type: Sequelize.DOUBLE, defaultValue: 0.0122 },
      postalCode: { type: Sequelize.STRING, allowNull: false },
      title: { type: Sequelize.STRING, allowNull: false },
      guarantors: { type: Sequelize.JSON, allowNull: true },
      workDays: { type: Sequelize.JSON, allowNull: true },
      
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
        onDelete: 'CASCADE' // If the user account is deleted, their rider profile is also deleted.
      },
      
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('riders');
  }
};