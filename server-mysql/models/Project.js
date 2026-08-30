const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please add a project title' }
    }
  },
  status: {
    type: DataTypes.ENUM('Pre-Production', 'Rough Cut', 'Client Review', 'Approved'),
    defaultValue: 'Pre-Production'
  },
  proxyMediaAsset: {
    type: DataTypes.STRING
  },
  masterMediaAsset: {
    type: DataTypes.STRING
  }
}, {
  timestamps: true
});

module.exports = Project;
