const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  clientName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please add a client name' }
    }
  },
  industryType: {
    type: DataTypes.STRING
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please add a contact email' },
      isEmail: true
    }
  },
  accessToken: {
    type: DataTypes.STRING,
    unique: true
  }
}, {
  timestamps: true
});

module.exports = Client;
