// models/orderItem.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  // id, createdAt, updatedAt are automatic
  id: {
  type: DataTypes.STRING,
  defaultValue: DataTypes.UUIDV4,
  primaryKey: true,
  allowNull: false
},
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  additives: {
    type: DataTypes.JSON,
    allowNull: true
  },
  instruction: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  orderId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  foodId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'foods',
      key: 'id'
    }
  }
  // foodId and orderId foreign keys are added via associations
}, {
  tableName: 'order_items',
  timestamps: true,
});

module.exports = OrderItem;