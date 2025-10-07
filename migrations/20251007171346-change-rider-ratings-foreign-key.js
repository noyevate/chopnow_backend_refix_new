'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // The table we are changing
    const tableName = 'rider_ratings';
    // The column we are changing
    const columnName = 'riderId';
    // The name of the old constraint (Sequelize generates this, we can find it or guess it)
    const oldConstraintName = 'rider_ratings_ibfk_2'; // This might differ, see note below

    console.log(`Altering table '${tableName}': changing foreign key for '${columnName}'`);

    // Step 1: Remove the old foreign key constraint that points to the 'users' table.
    await queryInterface.removeConstraint(tableName, oldConstraintName);

    // Step 2: Add the new foreign key constraint that points to the 'riders' table.
    await queryInterface.addConstraint(tableName, {
      fields: [columnName],
      type: 'foreign key',
      name: 'fk_rider_ratings_rider_id', // A new, clear name for the constraint
      references: {
        table: 'riders', // The table to point to
        field: 'id',     // The column in that table
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    // This function reverses the changes made in 'up'
    const tableName = 'rider_ratings';
    const columnName = 'riderId';
    const newConstraintName = 'fk_rider_ratings_rider_id';
    
    // Step 1: Remove the new constraint that points to 'riders'
    await queryInterface.removeConstraint(tableName, newConstraintName);

    // Step 2: Add the old constraint back that points to 'users'
    await queryInterface.addConstraint(tableName, {
      fields: [columnName],
      type: 'foreign key',
      name: 'rider_ratings_ibfk_2', // Restore the old name
      references: {
        table: 'users',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  }
};
